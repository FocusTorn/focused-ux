#!/usr/bin/env tsx
import { fileURLToPath } from 'node:url'
import path from 'node:path'
import fs from 'node:fs'
import process from 'node:process'

const PACKAGES = ['ghost-writer', 'project-butler', 'dynamicons', 'context-cherry-picker', 'note-hub', 'ai-agent-interactor']

// Color mapping function for easier color management
function color(code: number): string {
	return `\x1B[38;5;${code}m`
}

// Color constants for better readability
const sectionTitle = 179
const filePath = 38
const parentheses = 37

const __filename = fileURLToPath(import.meta.url)
const ROOT = path.resolve(path.dirname(__filename), '..')
const CANONICAL_TSCONFIG = {
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
}

// Error collection for grouping
interface ErrorGroup {
	[key: string]: string[]
}

const errors: ErrorGroup = {}

function addError(category: string, message: string) {
	if (!errors[category]) {
		errors[category] = []
	}
	errors[category].push(message)
}

function readJson(file: string) {
	return JSON.parse(fs.readFileSync(file, 'utf-8'))
}

function findJsonLocation(file: string, key: string): { line: number, column: number } | null {
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
}

function deepEqual(a: any, b: any): boolean {
	return JSON.stringify(a, null, 2) === JSON.stringify(b, null, 2)
}

function checkTsconfigExt(pkg: string) {
	const tsconfigPath = path.join(ROOT, 'packages', pkg, 'ext', 'tsconfig.json')

	if (!fs.existsSync(tsconfigPath)) {
		addError('Missing tsconfig.json', `${pkg}/ext`)
		return false
	}

	const tsconfig = readJson(tsconfigPath)

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
}

function checkProjectJsonExt(pkg: string) {
	const projectPath = path.join(ROOT, 'packages', pkg, 'ext', 'project.json')

	if (!fs.existsSync(projectPath)) {
		addError('Missing project.json', `${pkg}/ext`)
		return false
	}

	const project = readJson(projectPath)

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
}

function checkTsconfigCore(pkg: string) {
	const tsconfigPath = path.join(ROOT, 'packages', pkg, 'core', 'tsconfig.json')
	const tsconfigLibPath = path.join(ROOT, 'packages', pkg, 'core', 'tsconfig.lib.json')

	if (!fs.existsSync(tsconfigPath)) {
		addError('Missing tsconfig.json', `${pkg}/core`)
		return false
	}

	const tsconfig = readJson(tsconfigPath)

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

		if (!tsconfigLib.compilerOptions?.composite) {
			const location = findJsonLocation(tsconfigLibPath, 'compilerOptions')
			const locationStr = location ? `:${location.line}:${location.column}` : ''

			addError('Missing \'composite: true\'', `${pkg}/core/tsconfig.lib.json${locationStr}`)
			return false
		}
	}

	return true
}

function checkTsconfigShared() {
	const tsconfigPath = path.join(ROOT, 'libs', 'shared', 'tsconfig.json')
	const tsconfigLibPath = path.join(ROOT, 'libs', 'shared', 'tsconfig.lib.json')

	if (!fs.existsSync(tsconfigPath)) {
		addError('Missing tsconfig.json', `libs/shared`)
		return false
	}

	const tsconfig = readJson(tsconfigPath)

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

		if (!tsconfigLib.compilerOptions?.composite) {
			const location = findJsonLocation(tsconfigLibPath, 'compilerOptions')
			const locationStr = location ? `:${location.line}:${location.column}` : ''

			addError('Missing \'composite: true\'', `libs/shared/tsconfig.lib.json${locationStr}`)
			return false
		}
	}

	return true
}

function checkNoStaticImports(pkg: string, dep: string) {
	const extDir = path.join(ROOT, 'packages', pkg, 'ext', 'src')
	let found = false

	function walk(dir: string) {
		for (const file of fs.readdirSync(dir)) {
			const full = path.join(dir, file)

			if (fs.statSync(full).isDirectory())
				walk(full)
			else if (file.endsWith('.ts')) {
				const content = fs.readFileSync(full, 'utf-8')
				const lines = content.split('\n')

				// Match static imports that are NOT type-only
				// Look for import statements that don't start with "import type"
				const staticImportRegex = new RegExp(`import\\s+(?!type\\s).*?from\\s+['"]${dep}['"]`, 'gm')

				// Find all matches with line numbers
				for (let i = 0; i < lines.length; i++) {
					const line = lines[i]
					const match = staticImportRegex.exec(line)
					
					if (match) {
						const relativePath = path.relative(ROOT, full)
						const column = match.index + 1
						
						addError('Static runtime import', `(${dep}) ${relativePath}:${i + 1}:${column}`)
						found = true
						
						// Reset regex for next iteration
						staticImportRegex.lastIndex = 0
					}
				}
			}
		}
	}
	if (fs.existsSync(extDir))
		walk(extDir)
	return !found
}

function checkNoUnusedDeps(pkg: string) {
	const pkgJsonPath = path.join(ROOT, 'packages', pkg, 'ext', 'package.json')

	if (!fs.existsSync(pkgJsonPath))
		return true

	const pkgJson = readJson(pkgJsonPath)
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
}

function checkDynamicImportPattern(pkg: string, dep: string, requiredProps: string[]) {
	const extDir = path.join(ROOT, 'packages', pkg, 'ext', 'src')
	let ok = true

	function walk(dir: string) {
		for (const file of fs.readdirSync(dir)) {
			const full = path.join(dir, file)

			if (fs.statSync(full).isDirectory()) {
				walk(full)
			}
			else if (file.endsWith('.ts')) {
				const content = fs.readFileSync(full, 'utf-8')

				// Look for dynamic import assignment
				const dynamicImportRegex = new RegExp(`const\\s+\\w+\\s*=\\s*await\\s*import\\(['"]${dep}['"]\\)\\s*as\\s*typeof\\s*import\\(['"]${dep}['"]\\)`, 'm')

				if (dynamicImportRegex.test(content)) {
					// Ensure all required properties are assigned to local variables
					for (const prop of requiredProps) {
						const propAssignRegex = new RegExp(`\\w+\\s*=\\s*\\w+Module\\.${prop}`)

						if (!propAssignRegex.test(content)) {
							const relativePath = path.relative(ROOT, full)

							addError('Dynamic import pattern', `${relativePath}: Missing property assignment for '${prop}'`)
							ok = false
						}
					}

					// Ensure no usages of the module object after import
					const moduleUsageRegex = /\bawilix\./g

					if (moduleUsageRegex.test(content)) {
						const relativePath = path.relative(ROOT, full)

						addError('Dynamic import pattern', `${relativePath}: Usage of module object 'awilix.' found after dynamic import. All properties must be assigned to local variables.`)
						ok = false
					}
				}
			}
		}
	}
	if (fs.existsSync(extDir))
		walk(extDir)
	return ok
}

function checkVSCodeEngineVersion(pkg: string) {
	const pkgJsonPath = path.join(ROOT, 'packages', pkg, 'ext', 'package.json')

	if (!fs.existsSync(pkgJsonPath))
		return true

	const pkgJson = readJson(pkgJsonPath)
	const engines = pkgJson.engines

	if (!engines || !engines.vscode) {
		const location = findJsonLocation(pkgJsonPath, 'engines')
		const locationStr = location ? `:${location.line}:${location.column}` : ''

		addError('Missing VSCode engine', `${pkg}/ext/package.json${locationStr}`)
		return false
	}

	// Check that the VSCode engine version is exactly 1.99.3
	const versionConstraint = engines.vscode
	
	if (versionConstraint !== '1.99.3') {
		const location = findJsonLocation(pkgJsonPath, 'vscode')
		const locationStr = location ? `:${location.line}:${location.column}` : ''

		addError('Invalid VSCode engine version', `${pkg}/ext/package.json${locationStr}: '${versionConstraint}' must be exactly '1.99.3'.`)
		return false
	}

	return true
}

function checkPackageVersionFormat(pkg: string) {
	const pkgJsonPath = path.join(ROOT, 'packages', pkg, 'ext', 'package.json')

	if (!fs.existsSync(pkgJsonPath))
		return true

	const pkgJson = readJson(pkgJsonPath)
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
}

function checkRequiredExtFiles(pkg: string) {
	const extDir = path.join(ROOT, 'packages', pkg, 'ext')
	const requiredFiles = ['license', 'readme', '.vscodeignore']
	const missingFiles: string[] = []

	for (const file of requiredFiles) {
		// Check for various case variations and extensions
		const possibleNames = [
			file,
			`${file}.txt`,
			`${file}.md`,
			`${file.toUpperCase()}`,
			`${file.toUpperCase()}.txt`,
			`${file.toUpperCase()}.md`,
			`${file.charAt(0).toUpperCase() + file.slice(1)}`,
			`${file.charAt(0).toUpperCase() + file.slice(1)}.txt`,
			`${file.charAt(0).toUpperCase() + file.slice(1)}.md`
		]

		const found = possibleNames.some(name => {
			const filePath = path.join(extDir, name)
			return fs.existsSync(filePath)
		})

		if (!found) {
			missingFiles.push(file)
		}
	}

	if (missingFiles.length > 0) {
		addError('Missing required file', `(${missingFiles.join(', ')}) ${pkg}/ext: Missing required files`)
		return false
	}

	return true
}

function checkProjectJsonTargets(pkg: string) {
	const projectJsonPath = path.join(ROOT, 'packages', pkg, 'ext', 'project.json')
	const assetsPath = path.join(ROOT, 'packages', pkg, 'ext', 'assets')

	if (!fs.existsSync(projectJsonPath))
		return true

	const projectJson = readJson(projectJsonPath)
	const targets = projectJson.targets

	if (!targets) {
		addError('Missing targets', `${pkg}/ext/project.json: Missing 'targets' field.`)
		return false
	}

	// Check if package has assets
	const hasAssets = fs.existsSync(assetsPath) && fs.readdirSync(assetsPath).length > 0

	if (hasAssets) {
		// Must have copy-assets target
		if (!targets['copy-assets']) {
			addError('Has assets but missing \'copy-assets\' target', `${pkg}/ext/project.json`)
			return false
		}

		// copy-assets must depend on build
		const copyAssetsTarget = targets['copy-assets']

		if (!copyAssetsTarget.dependsOn || !copyAssetsTarget.dependsOn.includes('build')) {
			addError('Invalid target dependencies', `${pkg}/ext/project.json: 'copy-assets' target must depend on 'build'.`)
			return false
		}

		// package:dev must depend on copy-assets
		if (targets['package:dev']) {
			const packageDevTarget = targets['package:dev']

			if (!packageDevTarget.dependsOn || !packageDevTarget.dependsOn.includes('copy-assets')) {
				addError('Invalid target dependencies', `${pkg}/ext/project.json: 'package:dev' target must depend on 'copy-assets' when assets exist.`)
				return false
			}
		}

		// package must depend on copy-assets
		if (targets.package) {
			const packageTarget = targets.package

			if (!packageTarget.dependsOn || !packageTarget.dependsOn.includes('copy-assets')) {
				addError('Invalid target dependencies', `${pkg}/ext/project.json: 'package' target must depend on 'copy-assets' when assets exist.`)
				return false
			}
		}
	}

	return true
}

function printGroupedErrors() {
	if (Object.keys(errors).length === 0) {
		console.log('Feature structure audit passed.')
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
}

function main() {
	let ok = true

	// Check shared library TypeScript configuration
	ok = checkTsconfigShared() && ok

	for (const pkg of PACKAGES) {
		ok = checkTsconfigExt(pkg) && ok
		ok = checkTsconfigCore(pkg) && ok
		ok = checkProjectJsonExt(pkg) && ok
		ok = checkProjectJsonTargets(pkg) && ok
		ok = checkNoStaticImports(pkg, 'awilix') && ok
		ok = checkNoUnusedDeps(pkg) && ok
		// Enforce dynamic import property assignment for awilix
		ok = checkDynamicImportPattern(pkg, 'awilix', ['createContainer', 'InjectionMode', 'asValue', 'asClass']) && ok
		// Check VSCode engine version compatibility
		ok = checkVSCodeEngineVersion(pkg) && ok
		// Check package version format
		ok = checkPackageVersionFormat(pkg) && ok
		// Check required files for ext packages
		ok = checkRequiredExtFiles(pkg) && ok
	}

	printGroupedErrors()
	
	if (!ok) {
		process.exit(1)
	}
}

main()

