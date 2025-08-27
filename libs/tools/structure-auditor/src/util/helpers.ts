import { fileURLToPath } from 'node:url'
import path from 'node:path'

// Color mapping function for easier color management
export function color(code: number): string { //>
	return `\x1B[38;5;${code}m`
} //<

const __filename = fileURLToPath(import.meta.url)
export const ROOT = path.resolve(path.dirname(__filename), '../../../../..')

export function deepEqual(a: any, b: any): boolean { //>
	return JSON.stringify(a, null, 2) === JSON.stringify(b, null, 2)
} //<