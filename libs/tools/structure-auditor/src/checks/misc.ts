import path from 'node:path'
import fs from 'node:fs'
import { addError } from '../util/errors.js'
import { ROOT } from '../util/helpers.js'

export function checkRequiredExtFiles(pkg: string) { //>
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

export function checkNoDynamicImports(pkg: string) { //>
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

export function checkNoVSCodeValueImports(pkg: string) { //>
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
				// Skip adapter files as they are supposed to have VS Code imports to implement the adapter pattern
				if (file.endsWith('.adapter.ts')) {
					continue
				}
				
				const content = fs.readFileSync(full, 'utf-8')
				const lines = content.split('\n')

				// Check for value imports from vscode (not type imports)
				const vscodeValueImportRegex = /import\s+(?!type\s+).*from\s+['"]vscode['"]/g

				for (let i = 0; i < lines.length; i++) {
					const line = lines[i]
					const matches = line.match(vscodeValueImportRegex)

					if (matches) {
						const relativePath = path.relative(ROOT, full)
						const locationStr = `:${i + 1}:1`

						addError('VS Code value import detected', `${relativePath}${locationStr} - Use type imports/adapters to decouple`)
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

export function checkVSCodeAdaptersInSharedOnly(pkg: string) { //>
	const coreDir = path.join(ROOT, 'packages', pkg, 'core', 'src')
	const extDir = path.join(ROOT, 'packages', pkg, 'ext', 'src')
	let found = false

	function scanForVSCodeAdapters(dir: string, packageType: string) {
		if (!fs.existsSync(dir))
			return
		
		function walk(currentDir: string) {
			for (const file of fs.readdirSync(currentDir)) {
				const full = path.join(currentDir, file)

				if (fs.statSync(full).isDirectory()) {
					walk(full)
				}
				else if (file.endsWith('.ts')) {
					const content = fs.readFileSync(full, 'utf-8')
					const lines = content.split('\n')

					// Check for VSCode adapter patterns
					const vscodeAdapterPatterns = [
						/import.*vscode.*from.*['"]vscode['"]/g, // VSCode imports
						/import.*from.*['"]vscode['"]/g, // Any imports from vscode
						/vscode\./g, // VSCode API usage
					]

					for (let i = 0; i < lines.length; i++) {
						const line = lines[i]
						
						// Skip if this is the shared package (allowed to have VSCode adapters)
						if (packageType === 'shared') {
							continue
						}

						// Skip test files and setup files
						if (file.includes('.test.') || file.includes('.spec.') || file.includes('setup.')) {
							continue
						}

						// Skip if it's just a type import
						if (line.includes('import type') && line.includes('vscode')) {
							continue
						}

						// No exceptions - all VSCode coupling must be in shared package only

						// Skip comments
						if (line.trim().startsWith('//') || line.trim().startsWith('/*') || line.trim().startsWith('*')) {
							continue
						}

						// Check for VSCode adapter patterns
						for (const pattern of vscodeAdapterPatterns) {
							if (pattern.test(line)) {
								// Skip if this is just a string literal containing "vscode."
								if (line.includes("'vscode.") || line.includes('"vscode.')) {
									continue
								}
								
								const relativePath = path.relative(ROOT, full)
								const locationStr = `:${i + 1}:1`

								addError('VSCode adapter/type found in non-shared package', `${relativePath}${locationStr} - VSCode adapters and types must be in shared package only`)
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

	// Scan core and ext packages (should not have VSCode adapters)
	scanForVSCodeAdapters(coreDir, 'core')
	scanForVSCodeAdapters(extDir, 'ext')

	return !found
} //<
