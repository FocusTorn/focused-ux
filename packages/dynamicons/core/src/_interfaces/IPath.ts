import type { ParsedPath } from 'node:path'

export interface IPath {
	basename: (p: string, ext?: string) => string
	parse: (p: string) => ParsedPath
	join: (...paths: string[]) => string
	dirname: (p: string) => string
	relative: (from: string, to: string) => string
}