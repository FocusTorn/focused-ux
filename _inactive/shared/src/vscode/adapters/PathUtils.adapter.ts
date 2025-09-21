import type { IPathUtilsService } from '../../_interfaces/IUtilServices.js'
import * as path from 'node:path'

export class PathUtilsAdapter implements IPathUtilsService {

	public getDottedPath(from: string, to: string): string | undefined {
		if (!from || !to || typeof from !== 'string' || typeof to !== 'string') {
			return undefined
		}
		
		if (from.trim() === '' || to.trim() === '') {
			return undefined
		}
		
		try {
			const toDir = path.dirname(to)
			// Calculate path from the destination's directory to the source file
			const relativePath = path.relative(toDir, from)

			if (!relativePath) {
				return undefined
			}

			// Normalize path separators for consistency
			const posixPath = String(relativePath).replace(/\\/g, '/')

			return posixPath.startsWith('.') ? posixPath : `./${posixPath}`
		}
		catch (_error) {
			return undefined
		}
	}

	public sanitizePath(pathStr: string): string {
		// Replace invalid characters in filenames/foldernames
		// This is now only used for sanitizing individual names, not full paths
		if (!pathStr || typeof pathStr !== 'string') {
			return ''
		}
		
		const sanitized = String(pathStr).replace(/[<>"|?*]/g, '_')
		
		// Ensure we return a valid string
		if (!sanitized || sanitized.trim() === '') {
			return '_'
		}
		
		return sanitized
	}

}
