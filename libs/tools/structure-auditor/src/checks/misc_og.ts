import path from 'node:path'
import fs from 'node:fs'
import { addError } from '../util/errors.js'
import { ROOT } from '../util/helpers.js'

/**
 * Verify required, static files exist in an extension package folder.
 */
export function checkRequiredExtFiles(pkg: string) { //>
	const extDir = path.join(ROOT, 'packages', pkg, 'ext')
	const requiredFiles = ['LICENSE.txt', 'README.md', '.vscodeignore']
	const missingFiles: string[] = []

	for (const fileName of requiredFiles) {
		const filePath = path.join(extDir, fileName)

		if (!fs.existsSync(filePath))
			missingFiles.push(fileName)
	}

	if (missingFiles.length > 0) {
		addError('Missing required file', `(${missingFiles.join(', ')}) in ${pkg}/ext`)
		return false
	}

	return true
} //<

/**
 * Disallow dynamic imports across ext/core/shared source trees of a package.
 */
export function checkNoDynamicImports(pkg: string) { //>
	const dirsToScan = [
		path.join(ROOT, 'packages', pkg, 'ext', 'src'),
		path.join(ROOT, 'packages', pkg, 'core', 'src'),
		path.join(ROOT, 'libs', 'shared', 'src'),
	]

	let found = false

	function scanDir(dir: string) {
		if (!fs.existsSync(dir))
			return

		for (const entry of fs.readdirSync(dir)) {
			const full = path.join(dir, entry)
			const stat = fs.statSync(full)

			if (stat.isDirectory()) {
				scanDir(full)
				continue
			}

			if (!entry.endsWith('.ts'))
				continue

			const content = fs.readFileSync(full, 'utf-8')
			const lines = content.split('\n')
			const dynamicImportRegex = /await\s+import\(/

			for (let i = 0; i < lines.length; i++) {
				if (dynamicImportRegex.test(lines[i])) {
					const rel = path.relative(ROOT, full)

					addError('Disallowed dynamic import', `${rel}:${i + 1}`)
					found = true
				}
			}
		}
	}

	for (const dir of dirsToScan) scanDir(dir)
	return !found
} //<

/**
 * Forbid VS Code value imports outside shared (allow adapters in shared only).
 */
export function checkNoVSCodeValueImports(pkg: string) { //>
	// Shared is the single home for VS Code value imports via adapters, so we scan
	// only ext and core here.
	const dirsToScan = [
		path.join(ROOT, 'packages', pkg, 'ext', 'src'),
		path.join(ROOT, 'packages', pkg, 'core', 'src'),
	]

	let found = false

	function scanDir(dir: string) {
		if (!fs.existsSync(dir))
			return

		for (const entry of fs.readdirSync(dir)) {
			const full = path.join(dir, entry)
			const stat = fs.statSync(full)

			if (stat.isDirectory()) {
				scanDir(full)
				continue
			}

			if (!entry.endsWith('.ts'))
				continue

			// Skip adapter files, they are supposed to import vscode to implement the adapter pattern
			if (entry.endsWith('.adapter.ts'))
				continue

			const content = fs.readFileSync(full, 'utf-8')
			const lines = content.split('\n')
			const vscodeValueImportRegex = /import\s+(?!type\s+).*from\s+['"]vscode['"]/g

			for (let i = 0; i < lines.length; i++) {
				const line = lines[i]
				const matches = line.match(vscodeValueImportRegex)

				if (!matches)
					continue

				const rel = path.relative(ROOT, full)

				addError('VS Code value import detected', `${rel}:${i + 1}:1 - Use type imports/adapters to decouple`)
				found = true
			}
		}
	}

	for (const dir of dirsToScan) scanDir(dir)
	return !found
} //<

/**
 * Enforce that VS Code adapter usage exists only in shared and not in core/ext.
 */
export function checkVSCodeAdaptersInSharedOnly(pkg: string) { //>
	const coreDir = path.join(ROOT, 'packages', pkg, 'core', 'src')
	const extDir = path.join(ROOT, 'packages', pkg, 'ext', 'src')
	let found = false

	function walkCode(dir: string, packageType: 'core' | 'ext') {
		if (!fs.existsSync(dir))
			return

		function walk(currentDir: string) {
			for (const entry of fs.readdirSync(currentDir)) {
				const full = path.join(currentDir, entry)
				const stat = fs.statSync(full)

				if (stat.isDirectory()) {
					walk(full)
					continue
				}

				if (!entry.endsWith('.ts'))
					continue

				const content = fs.readFileSync(full, 'utf-8')
				const lines = content.split('\n')

				// Detect VS Code adapter patterns
				const vscodeAdapterPatterns = [
					/import.*vscode.*from.*['"]vscode['"]/g,
					/import.*from.*['"]vscode['"]/g,
					/vscode\./g,
				]

				for (let i = 0; i < lines.length; i++) {
					const line = lines[i]

					// Shared may contain adapters; skip here by package type only
					if (packageType === 'core' || packageType === 'ext') {
						// Skip tests/setup and type-only imports
						if (entry.includes('.test.') || entry.includes('.spec.') || entry.includes('setup.'))
							continue
						if (line.includes('import type') && line.includes('vscode'))
							continue
						if (line.trim().startsWith('//') || line.trim().startsWith('/*') || line.trim().startsWith('*'))
							continue

						for (const pattern of vscodeAdapterPatterns) {
							if (pattern.test(line)) {
								// Ignore string literals that merely contain "vscode."
								if (line.includes('\'vscode.') || line.includes('"vscode.'))
									continue

								const rel = path.relative(ROOT, full)

								addError('VSCode adapter/type found in non-shared package', `${rel}:${i + 1}:1 - VSCode adapters and types must be in shared package only`)
								found = true
								break
							}
						}
					}
				}
			}
		}

		walk(dir)
	}

	walkCode(coreDir, 'core')
	walkCode(extDir, 'ext')

	return !found
} //<

/**
 * Scan only the shared library for dynamic imports.
 */
export function checkNoDynamicImportsInShared(): boolean { //>
	const sharedSrc = path.join(ROOT, 'libs', 'shared', 'src')
	let found = false

	function scanDir(dir: string) {
		if (!fs.existsSync(dir))
			return

		for (const entry of fs.readdirSync(dir)) {
			const full = path.join(dir, entry)
			const stat = fs.statSync(full)

			if (stat.isDirectory()) {
				scanDir(full)
				continue
			}

			if (!entry.endsWith('.ts'))
				continue

			const content = fs.readFileSync(full, 'utf-8')
			const lines = content.split('\n')
			const dynamicImportRegex = /await\s+import\(/

			for (let i = 0; i < lines.length; i++) {
				if (dynamicImportRegex.test(lines[i])) {
					const rel = path.relative(ROOT, full)

					addError('Disallowed dynamic import', `${rel}:${i + 1}`)
					found = true
				}
			}
		}
	}

	scanDir(sharedSrc)
	return !found
} //<
