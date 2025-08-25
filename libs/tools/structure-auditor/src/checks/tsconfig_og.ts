import path from 'node:path'
import fs from 'node:fs'
import { fileURLToPath } from 'node:url'
import { addError } from '../util/errors.js'
import { readJson, findJsonLocation } from '../util/fs.js'
import { deepEqual, ROOT } from '../util/helpers.js'

// Load canonical tsconfig template from standalone file
function getCanonicalTsconfig(): Record<string, any> {
	const __filename = fileURLToPath(import.meta.url)
	const __dirname = path.dirname(__filename)
	const templatePath = path.join(__dirname, '..', '..', 'templates', 'tsconfig.ext.json')
	const template = readJson(templatePath)
	
	if (!template) {
		throw new Error(`Failed to load canonical tsconfig template from ${templatePath}`)
	}
	
	return template
}

export function checkTsconfigExt(pkg: string) { //>
	const tsconfigPath = path.join(ROOT, 'packages', pkg, 'ext', 'tsconfig.json')

	if (!fs.existsSync(tsconfigPath)) {
		addError('Missing tsconfig.json', `${pkg}/ext`)
		return false
	}

	const tsconfig = readJson(tsconfigPath)

	if (!tsconfig)
		return false

	// Only compare keys present in canonical config
	const canonicalConfig = getCanonicalTsconfig()

	for (const key of Object.keys(canonicalConfig)) {
		if (!deepEqual(tsconfig[key], canonicalConfig[key])) {
			const location = findJsonLocation(tsconfigPath, key)
			const locationStr = location ? `:${location.line}:${location.column}` : ''

			addError('Invalid tsconfig.json', `${pkg}/ext/tsconfig.json${locationStr}: Key '${key}' does not match canonical config.`)
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

export function checkTsconfigCore(pkg: string) { //>
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

export function checkTsconfigShared() { //>
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

		// Ensure tests directory is excluded so setup files (e.g., src/__tests__/setup.ts)
		// are not compiled during library builds.
		const exclude: string[] = tsconfigLib.exclude || []
		const hasTestsDirExclude = exclude.some((p: string) => p.replace(/\\/g, '/') === 'src/__tests__/**')

		if (!hasTestsDirExclude) {
			const location = findJsonLocation(tsconfigLibPath, 'exclude')
			const locationStr = location ? `:${location.line}:${location.column}` : ''

			addError('Missing tests directory exclude', `libs/shared/tsconfig.lib.json${locationStr}: exclude should include 'src/__tests__/**' to avoid compiling test setup files.`)
			return false
		}
	}

	return true
} //<

export function checkTsconfigLibPaths(pkg: string) { //>
	const tsconfigLibPath = path.join(ROOT, 'packages', pkg, 'core', 'tsconfig.lib.json')

	if (!fs.existsSync(tsconfigLibPath))
		return true // Not a core library, skip

	const tsconfigLib = readJson(tsconfigLibPath)

	if (!tsconfigLib)
		return false

	// Check if using project references (composite: true in base config indicates this)
	const tsconfigBasePath = path.join(ROOT, 'tsconfig.base.json')
	const tsconfigBase = readJson(tsconfigBasePath)
	const usingProjectReferences = tsconfigBase?.compilerOptions?.composite === true

	if (usingProjectReferences) {
		// When using project references, paths should NOT be set - references handle module resolution
		const actualPaths = tsconfigLib.compilerOptions?.paths || {}
		
		if (Object.keys(actualPaths).length > 0) {
			const location = findJsonLocation(tsconfigLibPath, 'paths')
			const locationStr = location ? `:${location.line}:${location.column}` : ''

			addError('Unexpected paths in project references setup', `${pkg}/core/tsconfig.lib.json${locationStr}: When using TypeScript project references, 'paths' should not be set. Module resolution is handled by project references. Remove the 'paths' property and run 'nx sync' to update references.`)
			return false
		}
	}
	else {
		// Legacy path-based setup - validate paths match dependencies
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
				const location = findJsonLocation(tsconfigLibPath, 'paths')
				const locationStr = location ? `:${location.line}:${location.column}` : ''
				const pkgJsonLocation = findJsonLocation(pkgJsonPath, 'dependencies')
				const pkgJsonLocationStr = pkgJsonLocation ? `:${pkgJsonLocation.line}:${pkgJsonLocation.column}` : ''

				addError('Incorrect tsconfig.lib.json paths', `${pkg}/core/tsconfig.lib.json${locationStr}: The 'paths' configuration does not match the package's dependencies in ${pkg}/core/package.json${pkgJsonLocationStr}.`)
				return false
			}
		}
	}

	return true
} //<

/**
 * Check that core packages don't inherit shared path mappings.
 * Core packages must be completely self-contained without any knowledge of shared.
 */
export function checkCorePackageTsconfigIsolation(pkg: string): boolean {
	const tsconfigPath = path.join(ROOT, 'packages', pkg, 'core', 'tsconfig.json')
	const tsconfigLibPath = path.join(ROOT, 'packages', pkg, 'core', 'tsconfig.lib.json')
	
	if (!fs.existsSync(tsconfigPath)) {
		addError('Missing tsconfig.json', `packages/${pkg}/core`)
		return false
	}

	if (!fs.existsSync(tsconfigLibPath)) {
		addError('Missing tsconfig.lib.json', `packages/${pkg}/core`)
		return false
	}

	const tsconfig = readJson(tsconfigPath)
	const tsconfigLib = readJson(tsconfigLibPath)
	
	let found = false

	// Check if the tsconfig files have explicit path overrides to prevent shared inheritance
	const hasPathOverride = tsconfig?.compilerOptions?.paths && Object.keys(tsconfig.compilerOptions.paths).length > 0
	const hasLibPathOverride = tsconfigLib?.compilerOptions?.paths && Object.keys(tsconfigLib.compilerOptions.paths).length > 0

	if (!hasPathOverride && !hasLibPathOverride) {
		addError('CRITICAL: Core package may inherit shared path mappings', 
			`packages/${pkg}/core/tsconfig.json: Core packages must explicitly override inherited path mappings to maintain Guinea Pig Package principles. Add "paths": {} to compilerOptions.`)
		found = true
	}

	return !found
}

/**
 * Check that extension packages follow the thin wrapper principle.
 */
