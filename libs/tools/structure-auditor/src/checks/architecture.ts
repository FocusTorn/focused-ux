import path from 'node:path'
import fs from 'node:fs'
import { addError } from '../util/errors.js'
import { ROOT } from '../util/helpers.js'

/**
 * CRITICAL: Check that NO package has any knowledge of @fux/shared.
 * In the refactored end state, all packages must be completely self-contained.
 */
export function checkNoSharedReferencesAnywhere(pkg: string): boolean {
	const pkgDir = path.join(ROOT, 'packages', pkg)
	let found = false

	if (!fs.existsSync(pkgDir)) {
		return true
	}

	function scanDir(dir: string) {
		if (!fs.existsSync(dir)) {
			return
		}

		for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
			const full = path.join(dir, entry.name)

			// Skip node_modules directories
			if (entry.isDirectory() && entry.name === 'node_modules') {
				continue
			}

			if (entry.isDirectory()) {
				scanDir(full)
				continue
			}

			if ((!entry.name.endsWith('.ts') && !entry.name.endsWith('.json')) || entry.name.endsWith('.d.ts')) {
				continue
			}

			const content = fs.readFileSync(full, 'utf-8')
			const lines = content.split('\n')

			// Check for any references to @fux/shared
			const sharedPatterns = [
				/@fux\/shared/,
				/from\s+['"]@fux\/shared['"]/,
				/import.*@fux\/shared/,
				/require.*@fux\/shared/,
			]

			for (let i = 0; i < lines.length; i++) {
				const line = lines[i]
				
				// Skip comment lines
				const trimmedLine = line.trim()
				if (trimmedLine.startsWith('//') || trimmedLine.startsWith('/*') || trimmedLine.startsWith('*')) {
					continue
				}
				
				for (const pattern of sharedPatterns) {
					if (pattern.test(line)) {
						const rel = path.relative(ROOT, full)
						addError('CRITICAL: Package references @fux/shared', 
							`${rel}:${i + 1}:1 - Invalid use of @fux/shared`)
						found = true
					}
				}
			}
		}
	}

	// Scan both core and ext directories
	const coreDir = path.join(pkgDir, 'core')
	const extDir = path.join(pkgDir, 'ext')

	if (fs.existsSync(coreDir)) {
		scanDir(coreDir)
	}
	if (fs.existsSync(extDir)) {
		scanDir(extDir)
	}

	return !found
}

/**
 * CRITICAL: Check that NO package has any knowledge of @fux/mockly.
 * In the refactored end state, all packages must use direct instantiation.
 */
export function checkNoMocklyReferencesAnywhere(pkg: string): boolean {
	const pkgDir = path.join(ROOT, 'packages', pkg)
	let found = false

	if (!fs.existsSync(pkgDir)) {
		return true
	}

	function scanDir(dir: string) {
		if (!fs.existsSync(dir)) {
			return
		}

		for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
			const full = path.join(dir, entry.name)

			// Skip node_modules directories
			if (entry.isDirectory() && entry.name === 'node_modules') {
				continue
			}

			if (entry.isDirectory()) {
				scanDir(full)
				continue
			}

			if ((!entry.name.endsWith('.ts') && !entry.name.endsWith('.json')) || entry.name.endsWith('.d.ts')) {
				continue
			}

			const content = fs.readFileSync(full, 'utf-8')
			const lines = content.split('\n')

			// Check for any references to @fux/mockly
			const mocklyPatterns = [
				/@fux\/mockly/,
				/from\s+['"]@fux\/mockly['"]/,
				/import.*@fux\/mockly/,
				/require.*@fux\/mockly/,
			]

			for (let i = 0; i < lines.length; i++) {
				const line = lines[i]
				
				// Skip comment lines
				const trimmedLine = line.trim()
				if (trimmedLine.startsWith('//') || trimmedLine.startsWith('/*') || trimmedLine.startsWith('*')) {
					continue
				}
				
				for (const pattern of mocklyPatterns) {
					if (pattern.test(line)) {
						const rel = path.relative(ROOT, full)
						addError('CRITICAL: Package references @fux/mockly', 
							`${rel}:${i + 1}:1 - In refactored end state, NO package should have any knowledge of @fux/mockly. All packages must use direct instantiation.`)
						found = true
					}
				}
			}
		}
	}

	// Scan both core and ext directories
	const coreDir = path.join(pkgDir, 'core')
	const extDir = path.join(pkgDir, 'ext')

	if (fs.existsSync(coreDir)) {
		scanDir(coreDir)
	}
	if (fs.existsSync(extDir)) {
		scanDir(extDir)
	}

	return !found
}

/**
 * Check that extension packages follow the thin wrapper principle.
 * Extension packages should not contain business logic - only VSCode integration.
 */
export function checkExtensionThinWrapperPrinciple(pkg: string): boolean {
	const extSrcDir = path.join(ROOT, 'packages', pkg, 'ext', 'src')
	let found = false

	if (!fs.existsSync(extSrcDir)) {
		return true
	}

	function scanDir(dir: string) {
		if (!fs.existsSync(dir)) {
			return
		}

		for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
			const full = path.join(dir, entry.name)

			// Skip node_modules directories
			if (entry.isDirectory() && entry.name === 'node_modules') {
				continue
			}

			if (entry.isDirectory()) {
				scanDir(full)
				continue
			}

			if (!entry.name.endsWith('.ts')) {
				continue
			}

			// Skip extension.ts as it is allowed to have some logic
			if (entry.name === 'extension.ts') {
				continue
			}

			const content = fs.readFileSync(full, 'utf-8')
			const lines = content.split('\n')

			// Check for business logic patterns that should be in core
			const businessLogicPatterns = [
				/async\s+function\s+processData/,
				/async\s+function\s+validateInput/,
				/async\s+function\s+transformData/,
				/class\s+\w+Service/,
				/export\s+class\s+\w+Processor/,
				/export\s+class\s+\w+Validator/,
			]

			for (let i = 0; i < lines.length; i++) {
				const line = lines[i]
				
				for (const pattern of businessLogicPatterns) {
					if (pattern.test(line)) {
						const rel = path.relative(ROOT, full)
						addError('Business logic in extension package', 
							`${rel}:${i + 1}:1 - Extension packages should be thin wrappers. Business logic belongs in core package.`)
						found = true
					}
				}
			}
		}
	}

	scanDir(extSrcDir)
	return !found
}

/**
 * Check that core packages use direct instantiation (no DI containers).
 * Core packages should be self-contained with direct service instantiation.
 */
export function checkCoreDirectInstantiation(pkg: string): boolean {
	const coreSrcDir = path.join(ROOT, 'packages', pkg, 'core', 'src')
	let found = false

	if (!fs.existsSync(coreSrcDir)) {
		return true
	}

	// Look for injection.ts file - should not exist in refactored end state
	const injectionFile = path.join(coreSrcDir, 'injection.ts')
	
	if (fs.existsSync(injectionFile)) {
		addError('CRITICAL: Core package has injection.ts file', 
			`packages/${pkg}/core/src/injection.ts: Core packages should use direct instantiation, not DI containers. Remove injection.ts file.`)
		found = true
	}

	// Look for DI container patterns in any file
	function scanDir(dir: string) {
		if (!fs.existsSync(dir)) {
			return
		}

		for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
			const full = path.join(dir, entry.name)

			// Skip node_modules directories
			if (entry.isDirectory() && entry.name === 'node_modules') {
				continue
			}

			if (entry.isDirectory()) {
				scanDir(full)
				continue
			}

			if (!entry.name.endsWith('.ts')) {
				continue
			}

			const content = fs.readFileSync(full, 'utf-8')
			const lines = content.split('\n')

			// Check for DI container patterns
			const diPatterns = [
				/createContainer/,
				/asFunction/,
				/asClass/,
				/asValue/,
				/awilix/,
				/InjectionMode/,
			]

			for (let i = 0; i < lines.length; i++) {
				const line = lines[i]
				
				for (const pattern of diPatterns) {
					if (pattern.test(line)) {
						const rel = path.relative(ROOT, full)
						addError('CRITICAL: Core package uses DI container patterns', 
							`${rel}:${i + 1}:1 - Core packages should use direct instantiation, not DI containers.`)
						found = true
					}
				}
			}
		}
	}

	scanDir(coreSrcDir)
	return !found
}
