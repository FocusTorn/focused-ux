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