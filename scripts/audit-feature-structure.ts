#!/usr/bin/env tsx
import { fileURLToPath } from 'node:url'
import path from 'node:path'
import fs from 'node:fs'
import process from 'node:process'

// Color mapping function for easier color management
function color(code: number): string { //>
	return `\x1B[38;5;${code}m`
} //<

// Color constants for better readability
const sectionTitle = 179
const filePath = 38
const parentheses = 37

const __filename = fileURLToPath(import.meta.url)
const ROOT = path.resolve(path.dirname(__filename), '..')

const CANONICAL_TSCONFIG = { //>
	extends: '../../../tsconfig.base.json',
	compilerOptions: {
		outDir: './dist',
		rootDir: 'src',
		composite: false,
		declaration: false,
		declarationMap: false,
	},
	include: ['src/**/*.ts'],
	references: [
		{ path: '../core/tsconfig.lib.json' },
		{ path: '../../../libs/shared/tsconfig.lib.json' },
	],
} //<

// Error collection for grouping -------------------------->>
interface ErrorGroup { //>
	[key: string]: string[]
} //<

const errors: ErrorGroup = {}

function addError(category: string, message: string) { //>
	if (!errors[category]) {
		errors[category] = []
	}
	errors[category].push(message)
} //<

//----------------------------------------------------------------------------<<


function deepEqual(a: any, b: any): boolean { //>
	return JSON.stringify(a, null, 2) === JSON.stringify(b, null, 2)
} //<


function checkRequiredExtFiles(pkg: string) { //>
	const extDir = path.join(ROOT, 'packages', pkg, 'ext')
	const requiredFiles = ['LICENSE.txt', 'README.md', '.vscodeignore']
	const missingFiles: string[] = []

	for (const file of requiredFiles) {
		const filePath = path.join(extDir, file)

		if (!fs.existsSync(filePath)) {
			missingFiles.push(file)
		}
	}

	if (missingFiles.length > 0) {
		addError('Missing required file', `(${missingFiles.join(', ')}) in ${pkg}/ext`)
		return false
	}

	return true
} //<




function checkTsconfigExt(pkg: string) { //>
	const tsconfigPath = path.join(ROOT, 'packages', pkg, 'ext', 'tsconfig.json')

	if (!fs.existsSync(tsconfigPath)) {
		addError('Missing tsconfig.json', `${pkg}/ext`)
		return false
	}

	const tsconfig = readJson(tsconfigPath)

	if (!tsconfig)
		return false

	// Only compare keys present in canonical config
	for (const key of Object.keys(CANONICAL_TSCONFIG)) {
		if (!deepEqual(tsconfig[key], CANONICAL_TSCONFIG[key])) {
			addError('Invalid tsconfig.json', `${pkg}/ext/tsconfig.json: Key '${key}' does not match canonical config.`)
			return false
		}
	}
	if (fs.existsSync(path.join(ROOT, 'packages', pkg, 'ext', 'tsconfig.lib.json'))) {
		addError('Invalid tsconfig structure', `${pkg}/ext/tsconfig.lib.json should not exist.`)
		return false
	}

	// Check that references point to tsconfig.lib.json files, not main tsconfig.json
	if (tsconfig.references) {
		for (const ref of tsconfig.references) {
			const refPath = ref.path

			if (refPath.endsWith('/core') || refPath.endsWith('/shared')) {
				const location = findJsonLocation(tsconfigPath, 'references')
				const locationStr = location ? `:${location.line}:${location.column}` : ''

				addError('Invalid tsconfig references', `${pkg}/ext/tsconfig.json${locationStr}: Reference '${refPath}' should point to tsconfig.lib.json, not main tsconfig.json`)
				return false
			}
		}
	}

	return true
} //<




function readJson(file: string) { //>
	try {
		return JSON.parse(fs.readFileSync(file, 'utf-8'))
	}
	catch (_e) {
		addError('JSON Read Error', `Could not read or parse ${file}`)
		return null
	}
} //<

function findJsonLocation(file: string, key: string): { line: number, column: number } | null { //>
	try {
		const content = fs.readFileSync(file, 'utf-8')
		const lines = content.split('\n')

		for (let i = 0; i < lines.length; i++) {
			const line = lines[i]
			// Look for the key with quotes and colon
			const keyPattern = new RegExp(`"${key.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}"\\s*:`, 'g')
			const match = keyPattern.exec(line)

			if (match) {
				return { line: i + 1, column: match.index + 1 }
			}
		}
	}
	catch (_error) {
		// If we can't read the file or parse it, return null
	}
	return null
} //<

function checkProjectJsonExt(pkg: string) { //>
	const projectPath = path.join(ROOT, 'packages', pkg, 'ext', 'project.json')

	if (!fs.existsSync(projectPath)) {
		addError('Missing project.json', `${pkg}/ext`)
		return false
	}

	const project = readJson(projectPath)

	if (!project)
		return false

	if (!project.targets || !project.targets.build) {
		addError('Missing build target', `${pkg}/ext/project.json: Missing build target.`)
		return false
	}
	if (project.targets.build.extends) {
		addError('Target extends', `${pkg}/ext/project.json: build target should not use 'extends'. All build targets must be explicit and inlined for clarity and maintainability.`)
		return false
	}
	if (project.targets.build.executor !== '@nx/esbuild:esbuild') {
		addError('Invalid executor', `${pkg}/ext/project.json: build target executor should be '@nx/esbuild:esbuild'.`)
		return false
	}
	return true
} //<

function checkProjectJsonPackaging(pkg: string) { //>
	const projectJsonPath = path.join(ROOT, 'packages', pkg, 'ext', 'project.json')

	if (!fs.existsSync(projectJsonPath))
		return true

	const projectJson = readJson(projectJsonPath)

	if (!projectJson)
		return false

	const targets = projectJson.targets

	if (!targets) {
		addError('Missing targets', `${pkg}/ext/project.json: Missing 'targets' field.`)
		return false
	}

	// Check for obsolete copy-assets target
	if (targets['copy-assets']) {
		addError('Obsolete Target', `${pkg}/ext/project.json: 'copy-assets' target is obsolete and should be removed.`)
		return false
	}

	// Check package:dev target
	const packageDevTarget = targets['package:dev']

	if (!packageDevTarget) {
		addError('Missing Target', `${pkg}/ext/project.json: Missing 'package:dev' target.`)
		return false
	}

	const expectedDevCommand = `node scripts/create-vsix.js packages/${pkg}/ext vsix_packages --dev`

	if (packageDevTarget.options?.command !== expectedDevCommand) {
		addError('Incorrect Command', `${pkg}/ext/project.json: 'package:dev' command is incorrect.`)
		return false
	}

	// Check package target
	const packageTarget = targets.package

	if (!packageTarget) {
		addError('Missing Target', `${pkg}/ext/project.json: Missing 'package' target.`)
		return false
	}

	const expectedPackageCommand = `node scripts/create-vsix.js packages/${pkg}/ext`

	if (packageTarget.options?.command !== expectedPackageCommand) {
		addError('Incorrect Command', `${pkg}/ext/project.json: 'package' command is incorrect.`)
		return false
	}

	return true
} //<

function checkProjectJsonExternalsConsistency(pkg: string) { //>
	const coreProjectPath = path.join(ROOT, 'packages', pkg, 'core', 'project.json')
	const extProjectPath = path.join(ROOT, 'packages', pkg, 'ext', 'project.json')

	if (!fs.existsSync(coreProjectPath) || !fs.existsSync(extProjectPath))
		return true // One of the files doesn't exist, so we can't compare them.

	const coreProject = readJson(coreProjectPath)
	const extProject = readJson(extProjectPath)

	if (!coreProject || !extProject)
		return false

	const coreExternals = coreProject.targets?.build?.options?.external || []
	const extExternals = extProject.targets?.build?.options?.external || []

	// We only care about non-vscode externals from core
	const coreThirdPartyExternals = coreExternals.filter(dep => dep !== 'vscode')

	for (const dep of coreThirdPartyExternals) {
		if (!extExternals.includes(dep)) {
			addError(
				'Inconsistent Externals',
				`${pkg}: The external dependency '${dep}' is defined in 'core/project.json' but is missing from 'ext/project.json'.`,
			)
			return false
		}
	}

	return true
} //<

function checkProjectJsonExtExternals(pkg: string) { //>
	const extPackagePath = path.join(ROOT, 'packages', pkg, 'ext', 'package.json')
	const extProjectPath = path.join(ROOT, 'packages', pkg, 'ext', 'project.json')

	if (!fs.existsSync(extPackagePath) || !fs.existsSync(extProjectPath))
		return true

	const pkgJson = readJson(extPackagePath)
	const projectJson = readJson(extProjectPath)

	if (!pkgJson || !projectJson)
		return false

	const dependencies = Object.keys(pkgJson.dependencies || {})
	const thirdPartyDeps = dependencies.filter(dep => !dep.startsWith('@fux/'))

	const externals = projectJson.targets?.build?.options?.external
	if (!externals || !Array.isArray(externals)) {
		addError('Invalid Externals', `${pkg}/ext/project.json: 'external' array is missing or not an array in build target.`)
		return false
	}

	const externalsSet = new Set(externals)
	let ok = true

	if (!externalsSet.has('vscode')) {
		addError('Invalid Externals', `${pkg}/ext/project.json: 'external' array must include "vscode".`)
		ok = false
	}

	for (const dep of thirdPartyDeps) {
		if (!externalsSet.has(dep)) {
			addError('Invalid Externals', `${pkg}/ext/project.json: 'external' array is missing third-party dependency '${dep}' from package.json.`)
			ok = false
		}
	}

	return ok
} //<

function checkPackageJsonExtDependencies(pkg: string) { //>
	const pkgJsonPath = path.join(ROOT, 'packages', pkg, 'ext', 'package.json')
	if (!fs.existsSync(pkgJsonPath))
		return true

	const pkgJson = readJson(pkgJsonPath)
	if (!pkgJson)
		return false

	const deps = pkgJson.dependencies || {}
	const devDeps = pkgJson.devDependencies || {}
	const coreDepName = `@fux/${pkg}-core`
	const sharedDepName = '@fux/shared'
	let ok = true

	// Check for presence in dependencies
	if (!deps[coreDepName]) {
		addError('Incorrect Dependency Placement', `${pkg}/ext/package.json: Missing '${coreDepName}' in 'dependencies'.`)
		ok = false
	}
	if (!deps[sharedDepName]) {
		addError('Incorrect Dependency Placement', `${pkg}/ext/package.json: Missing '${sharedDepName}' in 'dependencies'.`)
		ok = false
	}

	// Check for absence in devDependencies
	if (devDeps[coreDepName]) {
		addError('Incorrect Dependency Placement', `${pkg}/ext/package.json: '${coreDepName}' should be in 'dependencies', not 'devDependencies'.`)
		ok = false
	}
	if (devDeps[sharedDepName]) {
		addError('Incorrect Dependency Placement', `${pkg}/ext/package.json: '${sharedDepName}' should be in 'dependencies', not 'devDependencies'.`)
		ok = false
	}

	return ok
} //<

function checkTsconfigCore(pkg: string) { //>
	const tsconfigPath = path.join(ROOT, 'packages', pkg, 'core', 'tsconfig.json')
	const tsconfigLibPath = path.join(ROOT, 'packages', pkg, 'core', 'tsconfig.lib.json')

	if (!fs.existsSync(tsconfigPath)) {
		addError('Missing tsconfig.json', `${pkg}/core`)
		return false
	}

	const tsconfig = readJson(tsconfigPath)

	if (!tsconfig)
		return false

	// Check that main tsconfig.json has composite: true
	if (!tsconfig.compilerOptions?.composite) {
		const location = findJsonLocation(tsconfigPath, 'compilerOptions')
		const locationStr = location ? `:${location.line}:${location.column}` : ''

		addError('Missing \'composite: true\'', `${pkg}/core/tsconfig.json${locationStr}`)
		return false
	}

	// Check tsconfig.lib.json if it exists
	if (fs.existsSync(tsconfigLibPath)) {
		const tsconfigLib = readJson(tsconfigLibPath)

		if (!tsconfigLib)
			return false

		if (!tsconfigLib.compilerOptions?.composite) {
			const location = findJsonLocation(tsconfigLibPath, 'compilerOptions')
			const locationStr = location ? `:${location.line}:${location.column}` : ''

			addError('Missing \'composite: true\'', `${pkg}/core/tsconfig.lib.json${locationStr}`)
			return false
		}
	}

	return true
} //<

function checkTsconfigShared() { //>
	const tsconfigPath = path.join(ROOT, 'libs', 'shared', 'tsconfig.json')
	const tsconfigLibPath = path.join(ROOT, 'libs', 'shared', 'tsconfig.lib.json')

	if (!fs.existsSync(tsconfigPath)) {
		addError('Missing tsconfig.json', `libs/shared`)
		return false
	}

	const tsconfig = readJson(tsconfigPath)

	if (!tsconfig)
		return false

	// Check that main tsconfig.json has composite: true
	if (!tsconfig.compilerOptions?.composite) {
		const location = findJsonLocation(tsconfigPath, 'compilerOptions')
		const locationStr = location ? `:${location.line}:${location.column}` : ''

		addError('Missing \'composite: true\'', `libs/shared/tsconfig.json${locationStr}`)
		return false
	}

	// Check tsconfig.lib.json if it exists
	if (fs.existsSync(tsconfigLibPath)) {
		const tsconfigLib = readJson(tsconfigLibPath)

		if (!tsconfigLib)
			return false

		if (!tsconfigLib.compilerOptions?.composite) {
			const location = findJsonLocation(tsconfigLibPath, 'compilerOptions')
			const locationStr = location ? `:${location.line}:${location.column}` : ''

			addError('Missing \'composite: true\'', `libs/shared/tsconfig.lib.json${locationStr}`)
			return false
		}
	}

	return true
} //<

function checkTsconfigLibPaths(pkg: string) { //>
	const tsconfigLibPath = path.join(ROOT, 'packages', pkg, 'core', 'tsconfig.lib.json')
	if (!fs.existsSync(tsconfigLibPath))
		return true // Not a core library, skip

	const tsconfigLib = readJson(tsconfigLibPath)
	if (!tsconfigLib)
		return false

	const pkgJsonPath = path.join(ROOT, 'packages', pkg, 'core', 'package.json')
	const pkgJson = readJson(pkgJsonPath)
	if (!pkgJson)
		return false

	const dependencies = Object.keys(pkgJson.dependencies || {})
	const expectedPaths: Record<string, string[]> = {}

	for (const dep of dependencies) {
		if (dep.startsWith('@fux/')) {
			const depName = dep.replace('@fux/', '')
			const depPath = depName === 'shared' ? path.join(ROOT, 'libs', 'shared') : path.join(ROOT, 'packages', depName, 'core')
			const expectedRelativePath = path.relative(
				path.dirname(tsconfigLibPath),
				path.join(depPath, 'src'),
			).replace(/\\/g, '/')
			expectedPaths[dep] = [expectedRelativePath]
		}
	}

	const actualPaths = tsconfigLib.compilerOptions?.paths || {}

	if (Object.keys(expectedPaths).length > 0 || Object.keys(actualPaths).length > 0) {
		if (!deepEqual(actualPaths, expectedPaths)) {
			addError('Incorrect tsconfig.lib.json paths', `${pkg}/core/tsconfig.lib.json: The 'paths' configuration does not match the package's dependencies.`)
			return false
		}
	}

	return true
} //<



function checkNoDynamicImports(pkg: string) { //>
	const dirsToScan = [
		path.join(ROOT, 'packages', pkg, 'ext', 'src'),
		path.join(ROOT, 'packages', pkg, 'core', 'src'),
		path.join(ROOT, 'libs', 'shared', 'src'),
	]
	let found = false

	function walk(dir: string) {
		if (!fs.existsSync(dir))
			return
		for (const file of fs.readdirSync(dir)) {
			const full = path.join(dir, file)

			if (fs.statSync(full).isDirectory()) {
				walk(full)
			}
			else if (file.endsWith('.ts')) {
				const content = fs.readFileSync(full, 'utf-8')
				const lines = content.split('\n')

				const dynamicImportRegex = /await import\(/g

				for (let i = 0; i < lines.length; i++) {
					const line = lines[i]

					if (dynamicImportRegex.test(line)) {
						const relativePath = path.relative(ROOT, full)

						addError('Disallowed dynamic import', `${relativePath}:${i + 1}`)
						found = true
					}
				}
			}
		}
	}

	for (const dir of dirsToScan) {
		walk(dir)
	}

	return !found
} //<

function checkNoUnusedDeps(pkg: string) { //>
	const pkgJsonPath = path.join(ROOT, 'packages', pkg, 'ext', 'package.json')

	if (!fs.existsSync(pkgJsonPath))
		return true

	const pkgJson = readJson(pkgJsonPath)

	if (!pkgJson)
		return false

	const forbidden = ['picomatch', 'tslib']
	let ok = true

	for (const dep of forbidden) {
		if ((pkgJson.dependencies && pkgJson.dependencies[dep]) || (pkgJson.devDependencies && pkgJson.devDependencies[dep])) {
			const location = findJsonLocation(pkgJsonPath, dep)
			const locationStr = location ? `:${location.line}:${location.column}` : ''

			addError('Forbidden dependency', `${pkg}/ext/package.json${locationStr}: '${dep}'`)
			ok = false
		}
	}
	return ok
} //<

function checkVSCodeEngineVersion(pkg: string) { //>
	const pkgJsonPath = path.join(ROOT, 'packages', pkg, 'ext', 'package.json')

	if (!fs.existsSync(pkgJsonPath))
		return true

	const pkgJson = readJson(pkgJsonPath)

	if (!pkgJson)
		return false

	const engines = pkgJson.engines

	if (!engines || !engines.vscode) {
		const location = findJsonLocation(pkgJsonPath, 'engines')
		const locationStr = location ? `:${location.line}:${location.column}` : ''

		addError('Missing VSCode engine', `${pkg}/ext/package.json${locationStr}`)
		return false
	}

	const versionConstraint = engines.vscode
	const requiredMajor = 1
	const requiredMinor = 99
	const requiredPatch = 3

	if (!versionConstraint.startsWith('^')) {
		const location = findJsonLocation(pkgJsonPath, 'vscode')
		const locationStr = location ? `:${location.line}:${location.column}` : ''

		addError('Invalid VSCode engine version', `${pkg}/ext/package.json${locationStr}: '${versionConstraint}' must start with a caret (^) for compatibility range.`)
		return false
	}

	const versionPart = versionConstraint.substring(1)
	const parts = versionPart.split('.').map(Number)

	if (parts.length !== 3 || parts.some(Number.isNaN)) {
		const location = findJsonLocation(pkgJsonPath, 'vscode')
		const locationStr = location ? `:${location.line}:${location.column}` : ''

		addError('Invalid VSCode engine version', `${pkg}/ext/package.json${locationStr}: '${versionConstraint}' is not a valid semver string.`)
		return false
	}

	const [major, minor, patch] = parts

	let isValid = false

	if (major > requiredMajor) {
		isValid = true
	}
	else if (major === requiredMajor) {
		if (minor > requiredMinor) {
			isValid = true
		}
		else if (minor === requiredMinor) {
			if (patch >= requiredPatch) {
				isValid = true
			}
		}
	}

	if (!isValid) {
		const location = findJsonLocation(pkgJsonPath, 'vscode')
		const locationStr = location ? `:${location.line}:${location.column}` : ''

		addError('Outdated VSCode engine version', `${pkg}/ext/package.json${locationStr}: '${versionConstraint}' must be >= ^${requiredMajor}.${requiredMinor}.${requiredPatch}.`)
		return false
	}

	return true
} //<

function checkPackageVersionFormat(pkg: string) { //>
	const pkgJsonPath = path.join(ROOT, 'packages', pkg, 'ext', 'package.json')

	if (!fs.existsSync(pkgJsonPath))
		return true

	const pkgJson = readJson(pkgJsonPath)

	if (!pkgJson)
		return false

	const version = pkgJson.version

	if (!version) {
		const location = findJsonLocation(pkgJsonPath, 'version')
		const locationStr = location ? `:${location.line}:${location.column}` : ''

		addError('Missing version', `${pkg}/ext/package.json${locationStr}`)
		return false
	}

	// Check if version contains "dev." which is not allowed
	if (version.includes('dev.')) {
		const location = findJsonLocation(pkgJsonPath, 'version')
		const locationStr = location ? `:${location.line}:${location.column}` : ''

		addError('Improper semver format', `${pkg}/ext/package.json${locationStr}: '${version}' contains 'dev.' which is not allowed. Use proper semver format.`)
		return false
	}

	// Basic semver validation
	const semverRegex = /^\d+\.\d+\.\d+(-[a-zA-Z0-9.-]+)?(\+[a-zA-Z0-9.-]+)?$/

	if (!semverRegex.test(version)) {
		const location = findJsonLocation(pkgJsonPath, 'version')
		const locationStr = location ? `:${location.line}:${location.column}` : ''

		addError('Improper semver format', `${pkg}/ext/package.json${locationStr}: '${version}' is not in valid semver format.`)
		return false
	}

	return true
} //<


function printGroupedErrors() { //>
	if (Object.keys(errors).length === 0) {
		console.log(`${color(40)}Feature structure audit passed.\x1B[0m`)
		return
	}

	for (const [category, messages] of Object.entries(errors)) {
		console.log(`${color(sectionTitle)}${category}:\x1B[0m`)
		for (const message of messages) {
			// Colorize file paths in specific blue and make parentheses brighter
			let colorizedMessage = message.replace(/([a-zA-Z0-9\/\\\-_\.]+\.(json|ts|js|md))/g, `${color(filePath)}$1\x1B[0m`)

			// Make parentheses brighter (light gray)
			colorizedMessage = colorizedMessage.replace(/(\([^)]+\))/g, `\x1B[${parentheses}m$1\x1B[0m`)
			console.log(`    ${colorizedMessage}`)
		}
		console.log()
	}
} //<

function main() { //>
	const packagesDir = path.join(ROOT, 'packages')
	const allPackages = fs.readdirSync(packagesDir, { withFileTypes: true })
		.filter(dirent => dirent.isDirectory() && !dirent.name.startsWith('template-'))
		.map(dirent => dirent.name)

	const singlePackageArg = process.argv[2] // Get the first argument after script name
	const packagesToAudit = singlePackageArg && typeof singlePackageArg === 'string' && singlePackageArg.trim() ? [singlePackageArg.trim()] : allPackages

	if (singlePackageArg && typeof singlePackageArg === 'string' && !allPackages.includes(singlePackageArg.trim())) {
		console.error(`${color(196)}Error: Package '${singlePackageArg}' not found in the 'packages' directory.\x1B[0m`)
		process.exit(1)
	}

	let ok = true

	ok = checkTsconfigShared() && ok

	for (const pkg of packagesToAudit) {
		if (packagesToAudit.length > 1) {
			console.log(`\nAuditing package: ${color(179)}${pkg}\x1B[0m...`)
		}
		ok = checkTsconfigExt(pkg) && ok
		ok = checkTsconfigCore(pkg) && ok
		ok = checkTsconfigLibPaths(pkg) && ok
		ok = checkProjectJsonExt(pkg) && ok
		ok = checkProjectJsonPackaging(pkg) && ok
		ok = checkProjectJsonExternalsConsistency(pkg) && ok
		ok = checkProjectJsonExtExternals(pkg) && ok
		ok = checkPackageJsonExtDependencies(pkg) && ok
		ok = checkNoDynamicImports(pkg) && ok
		ok = checkNoUnusedDeps(pkg) && ok
		ok = checkVSCodeEngineVersion(pkg) && ok
		ok = checkPackageVersionFormat(pkg) && ok
		ok = checkRequiredExtFiles(pkg) && ok
	}

	printGroupedErrors()

	if (Object.keys(errors).length > 0) {
		process.exit(1)
	}
} //<

main()