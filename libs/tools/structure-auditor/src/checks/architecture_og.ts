import path from 'node:path'
import fs from 'node:fs'
import { addError } from '../util/errors.js'
import { ROOT } from '../util/helpers.js'
import { readJson } from '../util/fs.js'

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

		for (const entry of fs.readdirSync(dir)) {
			const full = path.join(dir, entry)
			const stat = fs.statSync(full)

			if (stat.isDirectory()) {
				scanDir(full)
				continue
			}

			if (!entry.endsWith('.ts')) {
				continue
			}

			// Skip injection.ts and extension.ts as they are allowed to have some logic
			if (entry === 'injection.ts' || entry === 'extension.ts') {
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
 * Check that core packages follow Guinea Pig Package principles.
 * Core packages must be completely self-contained without any knowledge of shared.
 */
export function checkGuineaPigPackagePrinciples(pkg: string): boolean {
	const coreSrcDir = path.join(ROOT, 'packages', pkg, 'core', 'src')
	let found = false

	if (!fs.existsSync(coreSrcDir)) {
		return true
	}

	function scanDir(dir: string) {
		if (!fs.existsSync(dir)) {
			return
		}

		for (const entry of fs.readdirSync(dir)) {
			const full = path.join(dir, entry)
			const stat = fs.statSync(full)

			if (stat.isDirectory()) {
				scanDir(full)
				continue
			}

			if (!entry.endsWith('.ts')) {
				continue
			}

			const content = fs.readFileSync(full, 'utf-8')
			const lines = content.split('\n')

			// Check for any references to @fux/shared
			const sharedPatterns = [
				/@fux\/shared/,
				/from\s+['"]@fux\/shared['"]/,
				/import.*@fux\/shared/,
				/shared.*adapter/i,
				/shared.*service/i,
			]

			for (let i = 0; i < lines.length; i++) {
				const line = lines[i]
				
				for (const pattern of sharedPatterns) {
					if (pattern.test(line)) {
						const rel = path.relative(ROOT, full)
						addError('CRITICAL: Core package violates Guinea Pig Package principles', 
							`${rel}:${i + 1}:1 - Core packages must be completely self-contained. No knowledge of @fux/shared allowed.`)
						found = true
					}
				}
			}
		}
	}

	scanDir(coreSrcDir)
	return !found
}

/**
 * Check that core packages use proper DI container patterns.
 */
export function checkCoreDIContainerPatterns(pkg: string): boolean {
	const coreSrcDir = path.join(ROOT, 'packages', pkg, 'core', 'src')
	let found = false

	if (!fs.existsSync(coreSrcDir)) {
		return true
	}

	// Look for injection.ts file
	const injectionFile = path.join(coreSrcDir, 'injection.ts')
	
	if (fs.existsSync(injectionFile)) {
		const content = fs.readFileSync(injectionFile, 'utf-8')
		const lines = content.split('\n')

		// Check for proper DI container creation
		let hasCreateContainer = false
		let hasAsFunction = false
		let hasAsClass = false

		for (let i = 0; i < lines.length; i++) {
			const line = lines[i]
			
			if (line.includes('createContainer')) {
				hasCreateContainer = true
			}
			
			if (line.includes('asFunction')) {
				hasAsFunction = true
			}
			
			if (line.includes('asClass')) {
				hasAsClass = true
			}
		}

		if (!hasCreateContainer) {
			addError('Missing DI container creation', 
				`${pkg}/core/src/injection.ts: Core packages should use proper DI container patterns`)
			found = true
		}
	}

	return !found
}

/**
 * Check that packages follow the adapter architecture rule.
 * All adapters must be in the shared package.
 */
export function checkAdapterArchitecture(pkg: string): boolean {
	const extSrcDir = path.join(ROOT, 'packages', pkg, 'ext', 'src')
	const coreSrcDir = path.join(ROOT, 'packages', pkg, 'core', 'src')
	let found = false

	function scanDir(dir: string) {
		if (!fs.existsSync(dir)) {
			return
		}

		for (const entry of fs.readdirSync(dir)) {
			const full = path.join(dir, entry)
			const stat = fs.statSync(full)

			if (stat.isDirectory()) {
				scanDir(full)
				continue
			}

			if (!entry.endsWith('.ts')) {
				continue
			}

			// Check for adapter files outside shared package
			if (entry.endsWith('.adapter.ts')) {
				const rel = path.relative(ROOT, full)
				addError('Adapter file outside shared package', 
					`${rel}: All adapters must be in the shared package (@fux/shared)`)
				found = true
			}
		}
	}

	scanDir(extSrcDir)
	scanDir(coreSrcDir)
	return !found
}

/**
 * Check that packages don't have direct Node.js module imports.
 * VSCode extensions should not include Node.js built-in modules.
 */
export function checkNoNodeJsImports(pkg: string): boolean {
	const dirsToScan = [
		path.join(ROOT, 'packages', pkg, 'ext', 'src'),
		path.join(ROOT, 'packages', pkg, 'core', 'src'),
	]
	let found = false

	function scanDir(dir: string) {
		if (!fs.existsSync(dir)) {
			return
		}

		for (const entry of fs.readdirSync(dir)) {
			const full = path.join(dir, entry)
			const stat = fs.statSync(full)

			if (stat.isDirectory()) {
				scanDir(full)
				continue
			}

			if (!entry.endsWith('.ts')) {
				continue
			}

			const content = fs.readFileSync(full, 'utf-8')
			const lines = content.split('\n')

			// Check for Node.js module imports
			const nodeJsImportPatterns = [
				/import.*from\s+['"]node:fs['"]/,
				/import.*from\s+['"]node:path['"]/,
				/import.*from\s+['"]node:os['"]/,
				/import.*from\s+['"]node:crypto['"]/,
				/import.*from\s+['"]node:child_process['"]/,
				/import.*from\s+['"]fs['"]/,
				/import.*from\s+['"]path['"]/,
			]

			for (let i = 0; i < lines.length; i++) {
				const line = lines[i]
				
				for (const pattern of nodeJsImportPatterns) {
					if (pattern.test(line)) {
						const rel = path.relative(ROOT, full)
						addError('Direct Node.js module import', 
							`${rel}:${i + 1}:1 - VSCode extensions should not include Node.js built-in modules. Use VSCode APIs or shared adapters.`)
						found = true
					}
				}
			}
		}
	}

	for (const dir of dirsToScan) {
		scanDir(dir)
	}

	return !found
}

/**
 * Check that build-only dependencies are in devDependencies.
 */
export function checkBuildDependenciesInDevDeps(pkg: string): boolean {
	const packageJsonPaths = [
		path.join(ROOT, 'packages', pkg, 'ext', 'package.json'),
		path.join(ROOT, 'packages', pkg, 'core', 'package.json'),
	]
	let found = false

	const buildOnlyDeps = [
		'puppeteer',
		'sharp',
		'svgo',
		'tsx',
		'@types/node',
		'typescript',
		'eslint',
		'vitest',
	]

	for (const packageJsonPath of packageJsonPaths) {
		if (!fs.existsSync(packageJsonPath)) {
			continue
		}

		const pkgJson = readJson(packageJsonPath)
		
		if (pkgJson === null) {
			continue
		}

		const deps = pkgJson.dependencies || {}
		const devDeps = pkgJson.devDependencies || {}

		for (const dep of buildOnlyDeps) {
			if (deps[dep] && !devDeps[dep]) {
				addError('Build dependency in wrong section', 
					`${packageJsonPath}: '${dep}' should be in devDependencies, not dependencies`)
				found = true
			}
		}
	}

	return !found
} 