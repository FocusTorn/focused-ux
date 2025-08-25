import type { IPathUtilsService } from '@fux/note-hub-core'
import * as path from 'node:path'

export class PathUtilsAdapter implements IPathUtilsService {

	sanitizePath(inputPath: string): string {
		return path.normalize(inputPath)
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

	parse(pathStr: string): { root: string, dir: string, base: string, ext: string, name: string } {
		return path.parse(pathStr)
	}

	extname(pathStr: string): string {
		return path.extname(pathStr)
	}

}
