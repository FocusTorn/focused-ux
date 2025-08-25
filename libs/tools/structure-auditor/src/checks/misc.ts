import path from 'node:path'
import fs from 'node:fs'
import { addError } from '../util/errors.js'
import { ROOT } from '../util/helpers.js'

/**
 * Check that no files use dynamic imports (require() statements).
 * EXCEPTIONS: TypeScript imports for AST manipulation are allowed.
 */
export function checkNoDynamicImports(pkg: string): boolean {
	const pkgDir = path.join(ROOT, 'packages', pkg)
	let found = false

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

			if (!entry.name.endsWith('.ts') || entry.name.endsWith('.d.ts')) {
				continue
			}

			const content = fs.readFileSync(full, 'utf-8')
			const lines = content.split('\n')

			// Check for dynamic imports
			const dynamicImportPatterns = [
				/import\s*\(/,
				/require\s*\(/,
			]

			for (let i = 0; i < lines.length; i++) {
				const line = lines[i]
				
				for (const pattern of dynamicImportPatterns) {
					if (pattern.test(line)) {
						const rel = path.relative(ROOT, full)

						addError('Dynamic import found', `${rel}:${i + 1}:1 - Dynamic imports not allowed, refactor to static imports`)
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
 * Check that no files import VSCode values directly (only types allowed).
 * EXCEPTIONS: Adapter files and extension entry points are allowed to import VSCode values.
 */
export function checkNoVSCodeValueImports(pkg: string): boolean {
	const pkgDir = path.join(ROOT, 'packages', pkg)
	let found = false

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

			if (!entry.name.endsWith('.ts') || entry.name.endsWith('.d.ts')) {
				continue
			}

			// Skip adapter files, extension entry points, and test files - they are allowed VSCode imports
			if (entry.name.endsWith('.adapter.ts')
			  || entry.name === 'index.ts'
			  || entry.name === 'extension.ts'
			  || entry.name.endsWith('.test.ts')
			  || entry.name.endsWith('.spec.ts')
			  || entry.name === 'helpers.ts'
			  || entry.name === '_setup.ts') {
				continue
			}

			const content = fs.readFileSync(full, 'utf-8')
			const lines = content.split('\n')

			// Check for VSCode value imports (not type imports)
			const vscodeValuePatterns = [
				/import\s+.*\s+from\s+['"]vscode['"]/,
				/import\s+.*\s+from\s+['"]@types\/vscode['"]/,
			]

			for (let i = 0; i < lines.length; i++) {
				const line = lines[i]
				
				// Skip type-only imports
				if (line.includes('import type')) {
					continue
				}
				
				for (const pattern of vscodeValuePatterns) {
					if (pattern.test(line)) {
						const rel = path.relative(ROOT, full)
						const isCorePackage = full.includes('/core/')
						const isExtPackage = full.includes('/ext/')
						
						if (isCorePackage) {
							addError('Core package VSCode value import found: \x1B[2mCore packages must use type imports only. Use "import type { Uri } from vscode" instead of value imports.\x1B[0m', `${rel}:${i + 1}:1 - Core packages must use 'import type { Api } from vscode', not value imports`)
						}
						else if (isExtPackage) {
							addError('Extension package VSCode value import found: \x1B[2mExtension packages should create local adapters with VSCode value imports. Ensure this is in an adapter file with .adapter.ts suffix.\x1B[0m', `${rel}:${i + 1}:1 - Extension packages should create local adapters with VSCode value imports`)
						}
						else {
							addError('VSCode value import found: \x1B[2mVSCode value imports are not allowed. Use type imports only.\x1B[0m', `${rel}:${i + 1}:1 - VSCode value imports are not allowed. Use type imports only.`)
						}
						
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
 * Check that required files exist.
 */
export function checkRequiredFiles(pkg: string): boolean {
	const pkgDir = path.join(ROOT, 'packages', pkg)
	let found = false

	// Check core package required files
	const coreDir = path.join(pkgDir, 'core')

	if (fs.existsSync(coreDir)) {
		const requiredCoreFiles = [
			'src/index.ts',
			'package.json',
			'project.json',
			'tsconfig.json',
			'tsconfig.lib.json',
			'vitest.config.ts',
			'vitest.coverage.config.ts',
		]

		for (const file of requiredCoreFiles) {
			const filePath = path.join(coreDir, file)

			if (!fs.existsSync(filePath)) {
				addError('Missing required file', `packages/${pkg}/core/${file}`)
				found = true
			}
		}
	}

	// Check extension package required files
	const extDir = path.join(pkgDir, 'ext')

	if (fs.existsSync(extDir)) {
		const requiredExtFiles = [
			'src/extension.ts',
			'package.json',
			'project.json',
			'tsconfig.json',
		]

		for (const file of requiredExtFiles) {
			const filePath = path.join(extDir, file)

			if (!fs.existsSync(filePath)) {
				addError('Missing required file', `packages/${pkg}/ext/${file}`)
				found = true
			}
		}
	}

	return !found
}
