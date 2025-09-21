import type { IPath } from '@fux/context-cherry-picker-core'
import * as path from 'node:path'

export class PathAdapter implements IPath {

	basename(p: string): string {
		return path.basename(p)
	}

	relative(from: string, to: string): string {
		return path.relative(from, to)
	}

	join(...paths: string[]): string {
		return path.join(...paths)
	}

	dirname(p: string): string {
		return path.dirname(p)
	}

}
