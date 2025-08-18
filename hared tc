import fs from 'node:fs'
import path from 'node:path'
import process from 'node:process'
import { spawnSync } from 'node:child_process'
import { fileURLToPath } from 'node:url'

const __filename = fileURLToPath(import.meta.url)
const ROOT = path.resolve(path.dirname(__filename), '../../../..')

type TargetsMap = Record<string, string>

type AliasValue = string | { name: string, suffix?: 'core' | 'ext', full?: boolean }

interface AliasConfig {
	targets?: TargetsMap
	expandables?: Record<string, string>
	packages: Record<string, AliasValue>
}

function loadAliasConfig(): AliasConfig {
	const p = path.join(ROOT, '.vscode', 'shell', 'pnpm_aliases.json')
	const raw = fs.readFileSync(p, 'utf-8')

	return JSON.parse(raw)
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

function runNx(argv: string[]): number {
	if (process.env.AKA_ECHO === '1') {
		console.log(`NX_CALL -> ${argv.join(' ')}`)
		return 0
	}

	// Use platform shell for Windows to preserve expected alias/ENV behavior
	const res = spawnSync('nx', argv, { stdio: 'inherit', shell: process.platform === 'win32' })

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

	return runNx(['run-many', `--target=${target}`, `--projects=${projects.join(',')}`, `--parallel=${par}`, ...flags, ...targets.slice(1)])
}

function main() {
	const [, , alias, ...rest] = process.argv

	if (!alias || alias === '-h' || alias === '--help') {
		console.log('aka <alias> <target> [flags]')
		process.exit(0)
	}

	const config = loadAliasConfig()
	const targets = config.targets ?? { b: 'build', l: 'lint', t: 'test' }
	const expandMap = config.expandables ?? { f: 'fix', s: 'skip-nx-cache' }
	let args = expandTargetShortcuts(rest, targets)

	args = expandFlags(args, expandMap)

	// Handle ephemeral echo flag: "-echo" -> "--aka-echo"
	const akaEchoEnabled = args.includes('--aka-echo')

	// Remove control flag from downstream Nx args
	if (akaEchoEnabled) {
		args = args.filter(a => a !== '--aka-echo')
	}

	if (alias === 'ext' || alias === 'core' || alias === 'all') {
		const target = args[0]
		const flags = args.filter(a => a.startsWith('--'))

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

	const { project, full } = resolveProjectForAlias(aliasVal)

	if (args.length === 0) {
		console.error(`Please provide a command for '${alias}'.`)
		process.exit(1)
	}
	args[0] = normalizeFullSemantics(full, args[0])

	// Ensure visible logs by default
	const _hasFix = args.includes('--fix')
	const flagArgs = args.filter(a => a.startsWith('--'))
	const restArgs = args.slice(1).filter(a => !a.startsWith('--'))

	const target = args[0]

	// Default single invocation
	const previousEcho = process.env.AKA_ECHO

	if (akaEchoEnabled) {
		process.env.AKA_ECHO = '1'
	}

	const rc = runNx([target, project, ...flagArgs, ...restArgs])

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
	// Do not run twice; user requested single run per invocation
}

main()
