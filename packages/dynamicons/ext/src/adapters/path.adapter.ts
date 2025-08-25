import type { IPath } from '@fux/dynamicons-core'
import * as path from 'node:path'

export class PathAdapter implements IPath {

	basename(p: string, ext?: string): string {
		return path.basename(p, ext)
	}

	parse(p: string): any {
		return path.parse(p)
	}

	join(...paths: string[]): string {
		return path.join(...paths)
	}

	dirname(p: string): string {
		return path.dirname(p)
	}

	relative(from: string, to: string): string {
		return path.relative(from, to)
	}

}
