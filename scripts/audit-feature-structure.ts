#!/usr/bin/env tsx
import { fileURLToPath } from 'node:url'
import path from 'node:path'
import fs from 'node:fs'
import process from 'node:process'

const PACKAGES = ['ghost-writer', 'project-butler', 'dynamicons']

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
		console.error(`[ERROR] Missing tsconfig.json in ${pkg}/ext`)
		return false
	}

	const tsconfig = readJson(tsconfigPath)

	// Only compare keys present in canonical config
	for (const key of Object.keys(CANONICAL_TSCONFIG)) {
		if (!deepEqual(tsconfig[key], CANONICAL_TSCONFIG[key])) {
			console.error(`[ERROR] ${pkg}/ext/tsconfig.json: Key '${key}' does not match canonical config.`)
			return false
		}
	}
	if (fs.existsSync(path.join(ROOT, 'packages', pkg, 'ext', 'tsconfig.lib.json'))) {
		console.error(`[ERROR] ${pkg}/ext/tsconfig.lib.json should not exist.`)
		return false
	}

	// Check that references point to tsconfig.lib.json files, not main tsconfig.json
	if (tsconfig.references) {
		for (const ref of tsconfig.references) {
			const refPath = ref.path

			if (refPath.endsWith('/core') || refPath.endsWith('/shared')) {
				const location = findJsonLocation(tsconfigPath, 'references')
				const locationStr = location ? `:${location.line}:${location.column}` : ''

				console.error(`[ERROR] ${pkg}/ext/tsconfig.json${locationStr}: Reference '${refPath}' should point to tsconfig.lib.json, not main tsconfig.json`)
				return false
			}
		}
	}

	return true
}

function checkProjectJsonExt(pkg: string) {
	const projectPath = path.join(ROOT, 'packages', pkg, 'ext', 'project.json')

	if (!fs.existsSync(projectPath)) {
		console.error(`[ERROR] Missing project.json in ${pkg}/ext`)
		return false
	}

	const project = readJson(projectPath)

	if (!project.targets || !project.targets.build) {
		console.error(`[ERROR] ${pkg}/ext/project.json: Missing build target.`)
		return false
	}
	if (project.targets.build.extends) {
		console.error(`[ERROR] ${pkg}/ext/project.json: build target should not use 'extends'.`)
		return false
	}
	if (project.targets.build.executor !== '@nx/esbuild:esbuild') {
		console.error(`[ERROR] ${pkg}/ext/project.json: build target executor should be '@nx/esbuild:esbuild'.`)
		return false
	}
	return true
}

function checkTsconfigCore(pkg: string) {
	const tsconfigPath = path.join(ROOT, 'packages', pkg, 'core', 'tsconfig.json')
	const tsconfigLibPath = path.join(ROOT, 'packages', pkg, 'core', 'tsconfig.lib.json')

	if (!fs.existsSync(tsconfigPath)) {
		console.error(`[ERROR] Missing tsconfig.json in ${pkg}/core`)
		return false
	}

	const tsconfig = readJson(tsconfigPath)

	// Check that main tsconfig.json has composite: true
	if (!tsconfig.compilerOptions?.composite) {
		const location = findJsonLocation(tsconfigPath, 'compilerOptions')
		const locationStr = location ? `:${location.line}:${location.column}` : ''

		console.error(`[ERROR] ${pkg}/core/tsconfig.json${locationStr}: Missing 'composite: true' in compilerOptions`)
		return false
	}

	// Check tsconfig.lib.json if it exists
	if (fs.existsSync(tsconfigLibPath)) {
		const tsconfigLib = readJson(tsconfigLibPath)

		if (!tsconfigLib.compilerOptions?.composite) {
			const location = findJsonLocation(tsconfigLibPath, 'compilerOptions')
			const locationStr = location ? `:${location.line}:${location.column}` : ''

			console.error(`[ERROR] ${pkg}/core/tsconfig.lib.json${locationStr}: Missing 'composite: true' in compilerOptions`)
			return false
		}
	}

	return true
}

function checkTsconfigShared() {
	const tsconfigPath = path.join(ROOT, 'libs', 'shared', 'tsconfig.json')
	const tsconfigLibPath = path.join(ROOT, 'libs', 'shared', 'tsconfig.lib.json')

	if (!fs.existsSync(tsconfigPath)) {
		console.error(`[ERROR] Missing tsconfig.json in libs/shared`)
		return false
	}

	const tsconfig = readJson(tsconfigPath)

	// Check that main tsconfig.json has composite: true
	if (!tsconfig.compilerOptions?.composite) {
		const location = findJsonLocation(tsconfigPath, 'compilerOptions')
		const locationStr = location ? `:${location.line}:${location.column}` : ''

		console.error(`[ERROR] libs/shared/tsconfig.json${locationStr}: Missing 'composite: true' in compilerOptions`)
		return false
	}

	// Check tsconfig.lib.json if it exists
	if (fs.existsSync(tsconfigLibPath)) {
		const tsconfigLib = readJson(tsconfigLibPath)

		if (!tsconfigLib.compilerOptions?.composite) {
			const location = findJsonLocation(tsconfigLibPath, 'compilerOptions')
			const locationStr = location ? `:${location.line}:${location.column}` : ''

			console.error(`[ERROR] libs/shared/tsconfig.lib.json${locationStr}: Missing 'composite: true' in compilerOptions`)
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

				// Match static imports that are NOT type-only
				// Look for import statements that don't start with "import type"
				const staticImportRegex = new RegExp(`import\\s+(?!type\\s).*?from\\s+['"]${dep}['"]`, 'gm')

				if (staticImportRegex.test(content)) {
					console.error(`[ERROR] Static runtime import of '${dep}' found in ${full}`)
					found = true
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

			console.error(`[ERROR] Forbidden dependency '${dep}' found in ${pkg}/ext/package.json${locationStr}`)
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
							console.error(`[ERROR] Dynamic import of '${dep}' in ${full} does not assign '${prop}' to a local variable.`)
							ok = false
						}
					}

					// Ensure no usages of the module object after import
					const moduleUsageRegex = /\bawilix\./g

					if (moduleUsageRegex.test(content)) {
						console.error(`[ERROR] Usage of module object 'awilix.' found after dynamic import in ${full}. All properties must be assigned to local variables.`)
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

		console.error(`[ERROR] ${pkg}/ext/package.json${locationStr} Missing 'engines.vscode' field.`)
		return false
	}

	// Parse the version constraint (e.g., "^1.99.3" or ">=1.99.0 <2.0.0")
	const versionConstraint = engines.vscode
	
	// Check if the version constraint allows versions higher than 1.99.3
	// This is a simplified check - in practice, you might want to use a proper semver parser
	if (versionConstraint.includes('2.') || versionConstraint.includes('^2') || versionConstraint.includes('>=2')) {
		const location = findJsonLocation(pkgJsonPath, 'vscode')
		const locationStr = location ? `:${location.line}:${location.column}` : ''

		console.error(`[ERROR] ${pkg}/ext/package.json${locationStr} VSCode engine version '${versionConstraint}' is incompatible with Cursor. Must be <=1.99.3.`)
		return false
	}

	// Check if the version constraint allows versions higher than 1.99.3
	// Look for patterns like ">1.99.3", ">=1.99.4", "^1.99.4", etc.
	const exceedsMaxRegex = /[>^]1\.99\.(?:[4-9]|\d{2,})/

	if (exceedsMaxRegex.test(versionConstraint)) {
		const location = findJsonLocation(pkgJsonPath, 'vscode')
		const locationStr = location ? `:${location.line}:${location.column}` : ''

		console.error(`[ERROR] ${pkg}/ext/package.json${locationStr} VSCode engine version '${versionConstraint}' exceeds maximum allowed version 1.99.3 for Cursor compatibility.`)
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

		console.error(`[ERROR] ${pkg}/ext/package.json${locationStr} Missing 'version' field.`)
		return false
	}

	// Check if version contains "dev." which is not allowed
	if (version.includes('dev.')) {
		const location = findJsonLocation(pkgJsonPath, 'version')
		const locationStr = location ? `:${location.line}:${location.column}` : ''

		console.error(`[ERROR] ${pkg}/ext/package.json${locationStr} Version '${version}' contains 'dev.' which is not allowed. Use proper semver format.`)
		return false
	}

	// Basic semver validation
	const semverRegex = /^\d+\.\d+\.\d+(-[a-zA-Z0-9.-]+)?(\+[a-zA-Z0-9.-]+)?$/

	if (!semverRegex.test(version)) {
		const location = findJsonLocation(pkgJsonPath, 'version')
		const locationStr = location ? `:${location.line}:${location.column}` : ''

		console.error(`[ERROR] ${pkg}/ext/package.json${locationStr} Version '${version}' is not in valid semver format.`)
		return false
	}

	return true
}

function main() {
	let ok = true

	// Check shared library TypeScript configuration
	ok = checkTsconfigShared() && ok

	for (const pkg of PACKAGES) {
		ok = checkTsconfigExt(pkg) && ok
		ok = checkTsconfigCore(pkg) && ok
		ok = checkProjectJsonExt(pkg) && ok
		ok = checkNoStaticImports(pkg, 'awilix') && ok
		ok = checkNoUnusedDeps(pkg) && ok
		// Enforce dynamic import property assignment for awilix
		ok = checkDynamicImportPattern(pkg, 'awilix', ['createContainer', 'InjectionMode', 'asValue', 'asClass']) && ok
		// Check VSCode engine version compatibility
		ok = checkVSCodeEngineVersion(pkg) && ok
		// Check package version format
		ok = checkPackageVersionFormat(pkg) && ok
	}
	if (!ok) {
		process.exit(1)
	}
	else {
		console.log('Feature structure audit passed.')
	}
}

main()
