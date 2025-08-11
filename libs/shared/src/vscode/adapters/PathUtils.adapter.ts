import type { IPathUtilsService } from '../../_interfaces/IUtilServices.js'
import * as path from 'node:path'

export class PathUtilsAdapter implements IPathUtilsService {

	public getDottedPath(from: string, to: string): string | undefined {
		if (!from || !to || typeof from !== 'string' || typeof to !== 'string') {
			console.warn('[PathUtils] Invalid paths provided to getDottedPath():', { from, to })
			return undefined
		}
		
		if (from.trim() === '' || to.trim() === '') {
			console.warn('[PathUtils] Invalid paths provided to getDottedPath():', { from, to })
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
		catch (error) {
			console.warn('[PathUtils] Error calculating relative path:', { from, to, error })
			return undefined
		}
	}

	public sanitizePath(pathStr: string): string {
		// Replace invalid characters in filenames/foldernames
		// This is now only used for sanitizing individual names, not full paths
		if (!pathStr || typeof pathStr !== 'string') {
			console.warn('[PathUtils] Invalid path provided to sanitizePath():', pathStr)
			return ''
		}
		
		const sanitized = String(pathStr).replace(/[<>"|?*]/g, '_')
		
		// Ensure we return a valid string
		if (!sanitized || sanitized.trim() === '') {
			console.warn('[PathUtils] Sanitization resulted in empty string for:', pathStr)
			return '_'
		}
		
		return sanitized
	}

}
