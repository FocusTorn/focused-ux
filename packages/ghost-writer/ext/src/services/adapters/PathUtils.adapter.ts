import type { IPathUtilsService } from '@fux/ghost-writer-core'
import * as path from 'node:path'

export class PathUtilsAdapter implements IPathUtilsService {

	public getDottedPath(from: string, to: string): string | undefined {
		const fromDir = path.dirname(from)
		const relativePath = path.relative(fromDir, to)

		return relativePath.startsWith('.') ? relativePath : `./${relativePath}`
	}

}
