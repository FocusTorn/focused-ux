import fs from 'node:fs'
import { addError } from './errors.js'

export function readJson(file: string) { //>
	try {
		return JSON.parse(fs.readFileSync(file, 'utf-8'))
	}
	catch (_e) {
		addError('JSON Read Error', `Could not read or parse ${file}`)
		return null
	}
} //<

export function findJsonLocation(file: string, key: string): { line: number, column: number } | null { //>
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
} //<