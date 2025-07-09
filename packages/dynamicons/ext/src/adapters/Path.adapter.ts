import * as path from 'node:path'
import type { ParsedPath } from 'node:path'
import type { IPath } from '@fux/dynamicons-core'

export class PathAdapter implements IPath {

	public basename(p: string, ext?: string): string {
		return path.basename(p, ext)
	}

	public parse(p: string): ParsedPath {
		return path.parse(p)
	}

	public join(...paths: string[]): string {
		return path.join(...paths)
	}

	public dirname(p: string): string {
		return path.dirname(p)
	}

	public relative(from: string, to: string): string {
		return path.relative(from, to)
	}

}
