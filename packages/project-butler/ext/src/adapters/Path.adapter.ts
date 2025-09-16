import * as path from 'node:path'

interface IPathAdapter {
	dirname: (filePath: string) => string
	basename: (filePath: string) => string
	join: (...paths: string[]) => string
}

export class PathAdapter implements IPathAdapter {

	dirname(filePath: string): string {
		return path.dirname(filePath)
	}

	basename(filePath: string): string {
		return path.basename(filePath)
	}

	join(...paths: string[]): string {
		return path.join(...paths)
	}

}
