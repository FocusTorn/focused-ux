#!/usr/bin/env node

import fs from 'node:fs'
import path from 'node:path'
import process from 'node:process'
import { spawnSync } from 'node:child_process'
import { fileURLToPath } from 'node:url'
import stripJsonComments from 'strip-json-comments'
import { PerformanceMonitor } from './performance-monitor'

const __filename = fileURLToPath(import.meta.url)
const ROOT = path.resolve(path.dirname(__filename), '../../../..')

type TargetsMap = Record<string, string>

type AliasValue = string | { name: string, suffix?: 'core' | 'ext', full?: boolean }

interface AliasConfig {
	'targets'?: TargetsMap
	'not-nx-targets'?: Record<string, string>
	'expandables'?: Record<string, string>
	'packages': Record<string, AliasValue>
}

function loadAliasConfig(): AliasConfig {
	const p = path.join(ROOT, '.vscode', 'shell', 'pnpm_aliases.json')
	const raw = fs.readFileSync(p, 'utf-8')

	return JSON.parse(stripJsonComments(raw))
}

function resolveProjectForAlias(value: AliasValue): { project: string, full: boolean } {
	if (typeof value === 'string') {
		const proj = value.startsWith('@fux/') ? value : `@fux/${value}`

		return { project: proj, full: false }
	}

	const pkg = value.name
	const project = value.suffix ? `@fux/${pkg}-${value.suffix}` : `@fux/${pkg}`

	return { project, full: value.full === true }
}

function resolveProjectForAliasWithTarget(value: AliasValue, target: string): { project: string, full: boolean } {
	// Special handling for integration tests: automatically target ext packages
	if (target === 'test:integration' && typeof value === 'object' && value.name) {
		// For integration tests, always target the ext package
		const project = `@fux/${value.name}-ext`
		return { project, full: value.full === true }
	}

	// Normal resolution for other targets
	return resolveProjectForAlias(value)
}

function expandTargetShortcuts(args: string[], targets: TargetsMap): string[] {
	if (args.length === 0)
		return args

	const t0 = args[0].toLowerCase()

	if (targets[t0]) {
		// Support multi-word target expansions (e.g., "tc" -> "test --coverage")
		const expandedTokens = targets[t0]
			.split(' ')
			.map(t => t.trim())
			.filter(t => t.length > 0)

		return [...expandedTokens, ...args.slice(1)]
	}
	return args
}

function expandFlags(args: string[], expandables: Record<string, string> = {}): string[] {
	const expanded: string[] = []

	for (const a of args) {
		if (a.startsWith('--')) {
			expanded.push(a)
			continue
		}
		if (a.startsWith('-') && a.length > 1) {
			const token = a.slice(1)

			// exact multi-key mapping: e.g., -stream
			if (expandables[token]) {
				expanded.push(`--${expandables[token]}`)
				continue
			}

			// split short bundle like -fs or -sf
			const shorts = token.split('')

			for (const s of shorts) {
				const mapped = expandables[s]

				if (mapped)
					expanded.push(`--${mapped}`)
				else expanded.push(`-${s}`)
			}
			continue
		}
		expanded.push(a)
	}
	return expanded
}

function normalizeFullSemantics(isFull: boolean, target: string): string {
	if (!isFull)
		return target

	const map: Record<string, string> = {
		l: 'lint:full',
		lint: 'lint:full',
		test: 'test:full',
		validate: 'validate:full',
	}

	return map[target] ?? target
}

function injectVitestConfig(project: string, target: string, args: string[]): string[] {
	// Check if this is a coverage test command
	const hasCoverageFlag = args.some(arg =>
		arg === '--coverage'
		|| arg.startsWith('--coverage=')
		|| arg === '-c'
		|| arg === '--cov',
	)

	// Only inject config for coverage test commands
	if (!target.startsWith('test') || !hasCoverageFlag) {
		return args
	}

	// Determine which config file to use for coverage
	const configFile = 'vitest.coverage.config.ts'
	
	// Dynamically determine project path based on project name pattern
	let projectPath: string | null = null
	
	if (project.startsWith('@fux/')) {
		const projectName = project.replace('@fux/', '')
		
		// Handle libs
		if (projectName === 'shared' || projectName === 'mockly') {
			projectPath = `libs/${projectName}`
		}
		// Handle packages with core/ext pattern
		else if (projectName.endsWith('-core') || projectName.endsWith('-ext')) {
			const baseName = projectName.replace(/-core$/, '').replace(/-ext$/, '')
			const suffix = projectName.endsWith('-core') ? 'core' : 'ext'

			projectPath = `packages/${baseName}/${suffix}`
		}
		// Handle other packages (like project-butler-all)
		else {
			projectPath = `packages/${projectName}`
		}
	}

	if (!projectPath) {
		return args
	}

	const configPath = path.join(ROOT, projectPath, configFile)

	// Verify the config file exists
	if (!fs.existsSync(configPath)) {
		console.warn(`Warning: Vitest config file not found: ${configPath}`)
		return args
	}

	// Use relative path from workspace root for config injection
	const relativeConfigPath = path.relative(ROOT, configPath)
	
	// Inject the config file argument
	return ['--config', relativeConfigPath, ...args]
}

function injectPerformanceMonitoring(project: string, target: string, args: string[]): string[] {
	const hasPerformanceFlag = args.some(arg => 
		arg === '--performance-baseline' ||
		arg === '--performance-check' ||
		arg === '--performance-validate'
	)
	
	if (!hasPerformanceFlag) {
		return args
	}

	// Add performance reporter for test targets
	if (target.startsWith('test')) {
		return [
			'--reporter=verbose',
			'--reporter=json',
			'--outputFile=./__tests__/_reports/performance.json',
			...args
		]
	}
	
	return args
}

function runNx(argv: string[]): number {
	if (process.env.AKA_ECHO === '1') {
		console.log(`NX_CALL -> ${argv.join(' ')}`)
		return 0
	}

	// Use platform shell for Windows to preserve expected alias/ENV behavior
	const res = spawnSync('nx', argv, { stdio: 'inherit', shell: process.platform === 'win32' })

	return res.status ?? 1
}

function runCommand(command: string, args: string[]): number {
	if (process.env.AKA_ECHO === '1') {
		console.log(`COMMAND_CALL -> ${command} ${args.join(' ')}`)
		return 0
	}

	// Use platform shell for Windows to preserve expected alias/ENV behavior
	const res = spawnSync(command, args, { stdio: 'inherit', shell: process.platform === 'win32' })

	return res.status ?? 1
}

// Stream handling is opt-in; do not mutate output style or env here

function runMany(runType: 'ext' | 'core' | 'all', targets: string[], flags: string[], config: AliasConfig): number {
	const projects: string[] = []
	const suffix = runType === 'all' ? null : `-${runType}`

	for (const key of Object.keys(config.packages)) {
		const v = config.packages[key]
		const { project } = resolveProjectForAlias(v)

		if (runType === 'all') {
			projects.push(project)
		}
		else if (project.endsWith(suffix!)) {
			projects.push(project)
		}
	}
	if (projects.length === 0) {
		console.error(`No projects found for '${runType}'.`)
		return 1
	}

	const par = String(projects.length)

	const target = targets[0]

	// Auto-inject --output-style=stream and --parallel=false for test:full, validate:full, and lint:full targets in run-many operations
	let enhancedFlags = [...flags]

	if ((target === 'test:full' || target === 'validate:full' || target === 'lint:full') && !enhancedFlags.some(flag => flag === '--stream' || flag === '--output-style=stream' || flag.startsWith('--output='))) {
		enhancedFlags = ['--output-style=stream', ...enhancedFlags]
	}

	// Auto-inject --parallel=false for validate:full to get cleaner sequential output
	if (target === 'validate:full' && !enhancedFlags.some(flag => flag === '--parallel=false' || flag === '--parallel=true')) {
		enhancedFlags = ['--parallel=false', ...enhancedFlags]
	}

	return runNx(['run-many', `--target=${target}`, `--projects=${projects.join(',')}`, `--parallel=${par}`, ...enhancedFlags, ...targets.slice(1)])
}

function main() {
	const [, , ...args] = process.argv
	
	// Handle both direct execution (pbc b) and aka-prefixed execution (aka pbc b)
	let alias: string
	let rest: string[]
	
	// Check if this is being called as 'aka' command (bin execution)
	const isAkaCommand = process.argv[1]?.endsWith('aka') || process.argv[1]?.includes('aka')
	
	if (isAkaCommand && args.length > 0) {
		// Called as: aka pbc b
		alias = args[0]
		rest = args.slice(1)
	} else {
		// Called as: pbc b (direct execution)
		alias = args[0]
		rest = args.slice(1)
	}

	if (!alias || alias === '-h' || alias === '--help' || alias === 'help') {
		const config = loadAliasConfig()
		const targets = config.targets ?? { b: 'build', l: 'lint', t: 'test' }
		const notNxTargets = (config as any)['not-nx-targets'] ?? {}
		const expandMap = config.expandables ?? { f: 'fix', s: 'skip-nx-cache' }
		
		console.log('aka <alias> <target> [flags]')
		console.log('')
		console.log('USAGE:')
		console.log('  <alias> <target> [flags]              # Direct execution (e.g., pbc b)')
		console.log('  aka <alias> <target> [flags]          # Aka-prefixed execution')
		console.log('  aka <package-alias> <target> [flags]  # Run target for specific package')
		console.log('  aka <ext|core|all> <target> [flags]   # Run target for all packages of type')
		console.log('')
		console.log('PACKAGE ALIASES:')

		const packages = config.packages ?? {}

		for (const [alias, value] of Object.entries(packages)) {
			const resolved = resolveProjectForAlias(value as AliasValue)

			console.log(`  ${alias.padEnd(8)} -> ${resolved.project}`)
		}
		console.log('')
		console.log('TARGETS:')
		for (const [short, target] of Object.entries(targets)) {
			console.log(`  ${short.padEnd(8)} -> ${target}`)
		}
		console.log('')
		console.log('NOT-NX TARGETS:')
		for (const [short, command] of Object.entries(notNxTargets)) {
			console.log(`  ${short.padEnd(8)} -> ${command}`)
		}
		console.log('')
		console.log('FLAG EXPANSIONS:')
		for (const [short, flag] of Object.entries(expandMap)) {
			console.log(`  -${short.padEnd(7)} -> --${flag}`)
		}
		console.log('')
		console.log('EXAMPLES:')
		console.log('  aka pm test --coverage')
		console.log('  aka ext build')
		console.log('  aka pm esv')
		console.log('  aka pm -f -s')
		console.log('  aka shared test --performance-baseline')
		console.log('  aka shared test --performance-check')
		process.exit(0)
	}

	const config = loadAliasConfig()
	const targets = config.targets ?? { b: 'build', l: 'lint', t: 'test' }
	const notNxTargets = (config as any)['not-nx-targets'] ?? {}
	const expandMap = config.expandables ?? { f: 'fix', s: 'skip-nx-cache' }
	let processedArgs = expandTargetShortcuts(rest, targets)

	processedArgs = expandFlags(processedArgs, expandMap)

	// Handle ephemeral echo flag: "-echo" -> "--aka-echo"
	const akaEchoEnabled = processedArgs.includes('--aka-echo')

	// Remove control flag from downstream Nx args
	if (akaEchoEnabled) {
		processedArgs = processedArgs.filter(a => a !== '--aka-echo')
	}

	if (alias === 'ext' || alias === 'core' || alias === 'all') {
		const target = processedArgs[0]
		const flags = processedArgs.filter(a => a.startsWith('--'))

		const previousEcho = process.env.AKA_ECHO

		if (akaEchoEnabled) {
			process.env.AKA_ECHO = '1'
		}

		const code = runMany(alias as any, [target], flags, config)

		// Restore echo environment
		if (akaEchoEnabled) {
			if (previousEcho === undefined) {
				delete process.env.AKA_ECHO
			}
			else {
				process.env.AKA_ECHO = previousEcho
			}
		}

		process.exit(code)
	}

	const aliasVal = config.packages?.[alias]

	if (!aliasVal) {
		console.error(`Alias '${alias}' is not defined.`)
		process.exit(1)
	}

	// Check processedArgs length before removing --aka-echo flag
	if (processedArgs.length === 0) {
		console.error(`Please provide a command for '${alias}'.`)
		process.exit(1)
	}

	const target = processedArgs[0]
	
	// Use target-aware resolution for integration tests
	const { project, full } = resolveProjectForAliasWithTarget(aliasVal, target)

	// Now check if the target is a not-nx-target (workspace-level command)
	const notNxTarget = notNxTargets[target]
	
	if (notNxTarget) {
		// For not-nx-targets, we run the workspace-level command with the project name
		const additionalArgs = processedArgs.slice(1)
		
		// Run the workspace-level command with the project name
		const previousEcho = process.env.AKA_ECHO

		if (akaEchoEnabled) {
			process.env.AKA_ECHO = '1'
		}
		
		// Parse the command (e.g., "npx esbuild-visualizer --metadata")
		const commandParts = notNxTarget.split(' ')
		const command = commandParts[0]
		let commandArgs = [...commandParts.slice(1)]
		
		// Special handling for esbuild-visualizer
		if (notNxTarget.includes('esbuild-visualizer')) {
			// Convert project name to metadata file path
			// project format: @fux/project-butler-all -> packages/project-butler/all/dist/meta.json
			const projectParts = project.replace('@fux/', '').split('-')
			const packageName = projectParts.slice(0, -1).join('-')
			const suffix = projectParts[projectParts.length - 1]
			const metadataPath = `packages/${packageName}/${suffix}/dist/meta.json`
			
			commandArgs = [...commandArgs, metadataPath, ...additionalArgs]
		}
		else {
			commandArgs = [...commandArgs, project, ...additionalArgs]
		}
		
		// Run the command directly
		const rc = runCommand(command, commandArgs)
		
		// Restore echo environment
		if (akaEchoEnabled) {
			if (previousEcho === undefined) {
				delete process.env.AKA_ECHO
			}
			else {
				process.env.AKA_ECHO = previousEcho
			}
		}
		
		if (rc !== 0)
			process.exit(rc)
		return
	}

	// For regular Nx targets, continue with normal processing
	processedArgs[0] = normalizeFullSemantics(full, processedArgs[0])

	const normalizedTarget = processedArgs[0]

	// Ensure visible logs by default
	const _hasFix = processedArgs.includes('--fix')
	const flagArgs = processedArgs.filter(a => a.startsWith('--'))
	const restArgs = processedArgs.slice(1).filter(a => !a.startsWith('--'))

	// Inject Vitest config if needed
	let injectedArgs = injectVitestConfig(project, normalizedTarget, flagArgs)

	// Inject performance monitoring if needed
	injectedArgs = injectPerformanceMonitoring(project, normalizedTarget, injectedArgs)

	// Auto-inject --output-style=stream for test:full, validate:full, and lint:full targets
	if ((normalizedTarget === 'test:full' || normalizedTarget === 'validate:full' || normalizedTarget === 'lint:full') && !injectedArgs.some(arg => arg === '--stream' || arg === '--output-style=stream' || arg.startsWith('--output='))) {
		injectedArgs = ['--output-style=stream', ...injectedArgs]
	}

	// Auto-inject --parallel=false for validate:full to get cleaner sequential output
	if (normalizedTarget === 'validate:full' && !injectedArgs.some(arg => arg === '--parallel=false' || arg === '--parallel=true')) {
		injectedArgs = ['--parallel=false', ...injectedArgs]
	}

	// Check for performance monitoring flags
	const hasPerformanceFlag = injectedArgs.some(arg => 
		arg === '--performance-baseline' ||
		arg === '--performance-check' ||
		arg === '--performance-validate'
	)

	// Initialize performance monitoring if needed
	const performanceMonitor = hasPerformanceFlag ? new PerformanceMonitor() : null
	
	if (performanceMonitor) {
		performanceMonitor.startMonitoring(project, normalizedTarget)
	}

	// Default single invocation
	const previousEcho = process.env.AKA_ECHO

	if (akaEchoEnabled) {
		process.env.AKA_ECHO = '1'
	}

	const rc = runNx([normalizedTarget, project, ...injectedArgs, ...restArgs])

	// Restore echo environment
	if (akaEchoEnabled) {
		if (previousEcho === undefined) {
			delete process.env.AKA_ECHO
		}
		else {
			process.env.AKA_ECHO = previousEcho
		}
	}

	// Handle performance monitoring results
	if (performanceMonitor) {
		const status = rc === 0 ? 'success' : 'failure'
		const metrics = performanceMonitor.endMonitoring(status)
		
		if (metrics) {
			const report = performanceMonitor.analyzePerformance(metrics)
			
			// Save report
			performanceMonitor.saveReport(report)
			
			// Print report
			performanceMonitor.printReport(report)
			
			// Handle baseline creation
			if (injectedArgs.includes('--performance-baseline')) {
				const baseline = performanceMonitor.createBaselineFromMetrics(metrics)
				performanceMonitor.saveBaseline(baseline)
				console.log(`\n✅ Baseline created for ${project}-${normalizedTarget}`)
			}
		}
	}

	if (rc !== 0)
		process.exit(rc)
	// Do not run twice; user requested single run per invocation
}

main()
