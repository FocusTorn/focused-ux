import * as path from 'node:path'
import type { IPathUtilsService } from '../_interfaces/IPathUtils.js'

export class PathUtilsAdapter implements IPathUtilsService {

	sanitizePath(pathStr: string): string {
		return path.normalize(pathStr)
	}

	join(...paths: string[]): string {
		return path.join(...paths)
	}

	dirname(pathStr: string): string {
		return path.dirname(pathStr)
	}

	basename(pathStr: string, ext?: string): string {
		return path.basename(pathStr, ext)
	}

	parse(pathStr: string): {
		root: string
		dir: string
		base: string
		ext: string
		name: string
	} {
		return path.parse(pathStr)
	}

	extname(pathStr: string): string {
		return path.extname(pathStr)
	}

}
