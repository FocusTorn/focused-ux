import { join, basename, parse, dirname, relative } from 'node:path'
import type { IPath } from '../../_interfaces/IVSCode.js'

export class PathAdapter implements IPath {

	join(...paths: string[]): string {
		return join(...paths)
	}

	basename(path: string): string {
		return basename(path)
	}

	parse(path: string): { name: string, ext: string } {
		return parse(path)
	}

	dirname(path: string): string {
		return dirname(path)
	}

	relative(from: string, to: string): string {
		return relative(from, to)
	}

}
