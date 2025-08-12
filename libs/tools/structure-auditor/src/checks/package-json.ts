import path from 'node:path'
import fs from 'node:fs'
import { addError } from '../util/errors.js'
import { readJson, findJsonLocation } from '../util/fs.js'
import { ROOT } from '../util/helpers.js'

function checkDependencyImports(pkg: string, depName: string): boolean { //>
	const extSrcPath = path.join(ROOT, 'packages', pkg, 'ext', 'src')

	if (!fs.existsSync(extSrcPath)) {
		return false
	}

	// Recursively search for TypeScript files and check imports
	function searchForImports(dir: string): boolean {
		const entries = fs.readdirSync(dir, { withFileTypes: true })
		
		for (const entry of entries) {
			const fullPath = path.join(dir, entry.name)
			
			if (entry.isDirectory()) {
				if (searchForImports(fullPath)) {
					return true
				}
			}
			else if (entry.name.endsWith('.ts') || entry.name.endsWith('.js')) {
				try {
					const content = fs.readFileSync(fullPath, 'utf-8')
					// Check for import statements that reference the dependency
					const importPattern = new RegExp(`from\\s+['"]${depName.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}['"]`, 'g')

					if (importPattern.test(content)) {
						return true
					}
				}
				catch (_e) {
					// Skip files that can't be read
				}
			}
		}
		
		return false
	}
	
	return searchForImports(extSrcPath)
} //<

export function checkPackageJsonExtDependencies(pkg: string) { //>
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

	// Check core dependency
	const coreInDeps = !!deps[coreDepName]
	const coreInDevDeps = !!devDeps[coreDepName]
	const coreIsImported = checkDependencyImports(pkg, coreDepName)

	// First check if dependency is unused (takes precedence over placement)
	if ((coreInDeps || coreInDevDeps) && !coreIsImported) {
		// Dependency is not used but declared
		const location = coreInDeps ? 'dependencies' : 'devDependencies'
		const jsonLocation = findJsonLocation(pkgJsonPath, coreDepName)
		const locationStr = jsonLocation ? `:${jsonLocation.line}:${jsonLocation.column}` : ''

		addError('Unused Dependency', `${pkg}/ext/package.json${locationStr}: '${coreDepName}' in '${location}' is not imported in the code.`)
		ok = false
	}
	else if (coreIsImported) {
		// Dependency is used, check placement
		if (!coreInDeps && coreInDevDeps) {
			const location = findJsonLocation(pkgJsonPath, coreDepName)
			const locationStr = location ? `:${location.line}:${location.column}` : ''

			addError('Incorrect Dependency Placement', `${pkg}/ext/package.json${locationStr}: '${coreDepName}' should be in 'dependencies', not 'devDependencies'.`)
			ok = false
		}
		else if (!coreInDeps && !coreInDevDeps) {
			const location = findJsonLocation(pkgJsonPath, 'dependencies')
			const locationStr = location ? `:${location.line}:${location.column}` : ''

			addError('Missing Dependency', `${pkg}/ext/package.json${locationStr}: Missing '${coreDepName}' in 'dependencies'.`)
			ok = false
		}
	}

	// Check shared dependency
	const sharedInDeps = !!deps[sharedDepName]
	const sharedInDevDeps = !!devDeps[sharedDepName]
	const sharedIsImported = checkDependencyImports(pkg, sharedDepName)

	// First check if dependency is unused (takes precedence over placement)
	if ((sharedInDeps || sharedInDevDeps) && !sharedIsImported) {
		// Dependency is not used but declared
		const location = sharedInDeps ? 'dependencies' : 'devDependencies'
		const jsonLocation = findJsonLocation(pkgJsonPath, sharedDepName)
		const locationStr = jsonLocation ? `:${jsonLocation.line}:${jsonLocation.column}` : ''

		addError('Unused Dependency', `${pkg}/ext/package.json${locationStr}: '${sharedDepName}' in '${location}' is not imported in the code.`)
		ok = false
	}
	else if (sharedIsImported) {
		// Dependency is used, check placement
		if (!sharedInDeps && sharedInDevDeps) {
			const location = findJsonLocation(pkgJsonPath, sharedDepName)
			const locationStr = location ? `:${location.line}:${location.column}` : ''

			addError('Incorrect Dependency Placement', `${pkg}/ext/package.json${locationStr}: '${sharedDepName}' should be in 'dependencies', not 'devDependencies'.`)
			ok = false
		}
		else if (!sharedInDeps && !sharedInDevDeps) {
			const location = findJsonLocation(pkgJsonPath, 'dependencies')
			const locationStr = location ? `:${location.line}:${location.column}` : ''

			addError('Missing Dependency', `${pkg}/ext/package.json${locationStr}: Missing '${sharedDepName}' in 'dependencies'.`)
			ok = false
		}
	}

	return ok
} //<

export function checkCorePackageDependencies(pkg: string): boolean { //>
	const corePkgJsonPath = path.join(ROOT, 'packages', pkg, 'core', 'package.json')
	const extPkgJsonPath = path.join(ROOT, 'packages', pkg, 'ext', 'package.json')
	
	if (!fs.existsSync(corePkgJsonPath) || !fs.existsSync(extPkgJsonPath)) {
		return true
	}

	const corePkgJson = readJson(corePkgJsonPath)
	const extPkgJson = readJson(extPkgJsonPath)
	
	if (!corePkgJson || !extPkgJson) {
		return false
	}

	const extDeps = extPkgJson.dependencies || {}
	const extDevDeps = extPkgJson.devDependencies || {}
	
	let ok = true

	// Get all runtime dependencies from the core package (including transitive)
	const runtimeDeps = getAllRuntimeDependencies(pkg, new Set())
	
	// Check each runtime dependency
	for (const depName of runtimeDeps) {
		// Skip workspace dependencies and internal @fux packages
		if (depName.startsWith('@fux/')) {
			continue
		}

		const inExtDeps = !!extDeps[depName]
		const inExtDevDeps = !!extDevDeps[depName]
		
		if (!inExtDeps && !inExtDevDeps) {
			const location = findJsonLocation(extPkgJsonPath, 'dependencies')
			const locationStr = location ? `:${location.line}:${location.column}` : ''

			addError('Missing Runtime Dependency', `${pkg}/ext/package.json${locationStr}: Missing '${depName}' in 'dependencies' (used in dependency chain).`)
			ok = false
		}
		else if (!inExtDeps && inExtDevDeps) {
			const location = findJsonLocation(extPkgJsonPath, depName)
			const locationStr = location ? `:${location.line}:${location.column}` : ''

			addError('Incorrect Runtime Dependency Placement', `${pkg}/ext/package.json${locationStr}: '${depName}' should be in 'dependencies', not 'devDependencies' (used in dependency chain).`)
			ok = false
		}
	}

	return ok
} //<

function getAllRuntimeDependencies(pkg: string, visited: Set<string>): Set<string> { //>
	const corePkgJsonPath = path.join(ROOT, 'packages', pkg, 'core', 'package.json')

	if (!fs.existsSync(corePkgJsonPath)) {
		return new Set()
	}

	const corePkgJson = readJson(corePkgJsonPath)

	if (!corePkgJson) {
		return new Set()
	}

	const allDeps = new Set<string>()
	const coreDeps = corePkgJson.dependencies || {}
	const _coreDevDeps = corePkgJson.devDependencies || {}

	// Add direct dependencies that are used at runtime
	for (const [depName, depVersion] of Object.entries(coreDeps)) {
		if (depName.startsWith('@fux/') || depVersion === 'workspace:*') {
			continue
		}

		if (checkCoreRuntimeDependency(pkg, depName)) {
			allDeps.add(depName)
		}
	}

	// Recursively check dependencies of dependencies
	for (const depName of allDeps) {
		if (!visited.has(depName)) {
			visited.add(depName)

			const transitiveDeps = getTransitiveDependencies(depName)

			for (const transitiveDep of transitiveDeps) {
				allDeps.add(transitiveDep)
			}
		}
	}

	return allDeps
} //<

function getTransitiveDependencies(depName: string): Set<string> { //>
	const transitiveDeps = new Set<string>()
	
	try {
		// Try to read the package.json from node_modules
		const nodeModulesPath = path.join(ROOT, 'node_modules', depName, 'package.json')

		if (fs.existsSync(nodeModulesPath)) {
			const pkgJson = readJson(nodeModulesPath)

			if (pkgJson && pkgJson.dependencies) {
				for (const [dep, version] of Object.entries(pkgJson.dependencies)) {
					// Skip peer dependencies and optional dependencies
					if (typeof version === 'string' && !version.startsWith('peer') && !version.startsWith('optional')) {
						transitiveDeps.add(dep)
					}
				}
			}
		}
	}
	catch (_e) {
		// If we can't read the package.json, skip this dependency
	}

	return transitiveDeps
} //<

function checkCoreRuntimeDependency(pkg: string, depName: string): boolean { //>
	const coreSrcPath = path.join(ROOT, 'packages', pkg, 'core', 'src')

	if (!fs.existsSync(coreSrcPath)) {
		return false
	}

	// Check if the dependency is imported in non-script files
	function searchForRuntimeImports(dir: string): boolean {
		const entries = fs.readdirSync(dir, { withFileTypes: true })
		
		for (const entry of entries) {
			const fullPath = path.join(dir, entry.name)
			
			if (entry.isDirectory()) {
				// Skip scripts directory as those are build-time dependencies
				if (entry.name === 'scripts') {
					continue
				}
				if (searchForRuntimeImports(fullPath)) {
					return true
				}
			}
			else if (entry.name.endsWith('.ts') || entry.name.endsWith('.js')) {
				try {
					const content = fs.readFileSync(fullPath, 'utf-8')
					// Check for import statements that reference the dependency
					const importPattern = new RegExp(`from\\s+['"]${depName.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}['"]`, 'g')

					if (importPattern.test(content)) {
						return true
					}
				}
				catch (_e) {
					// Skip files that can't be read
				}
			}
		}
		
		return false
	}
	
	return searchForRuntimeImports(coreSrcPath)
} //<

export function checkNoUnusedDeps(pkg: string) { //>
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

export function checkVSCodeEngineVersion(pkg: string) { //>
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

export function checkPackageVersionFormat(pkg: string) { //>
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
