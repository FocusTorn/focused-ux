import type { IPathUtilsService } from '../../_interfaces/IUtilServices.js'
import * as path from 'node:path'

export class PathUtilsAdapter implements IPathUtilsService {

	public getDottedPath(from: string, to: string): string | undefined {
		const toDir = path.dirname(to)
		// Calculate path from the destination's directory to the source file
		const relativePath = path.relative(toDir, from)

		// Normalize path separators for consistency
		const posixPath = relativePath.replace(/\\/g, '/')

		return posixPath.startsWith('.') ? posixPath : `./${posixPath}`
	}

	public santizePath(pathStr: string): string {
		return pathStr.replace(/[<>:"|?*]/g, '_')
	}

}
