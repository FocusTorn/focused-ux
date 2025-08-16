import * as fs from 'node:fs/promises'
import type { FileStat } from 'vscode'

/**
 * FileSystem adapter that implements the interface expected by ProjectButlerService
 * This adapter wraps Node.js fs operations to match VSCode's FileStat interface
 */
export class FileSystemAdapter {

	public async stat(path: string): Promise<FileStat> {
		const stats = await fs.stat(path)

		return {
			type: stats.isDirectory() ? 2 : 1, // 2 = Directory, 1 = File
			size: stats.size,
			ctime: stats.birthtime.getTime(),
			mtime: stats.mtime.getTime(),
		}
	}

	public access(path: string): Promise<void> {
		return fs.access(path)
	}

	public copyFile(src: string, dest: string): Promise<void> {
		return fs.copyFile(src, dest)
	}

	public readFile(path: string): Promise<string> {
		return fs.readFile(path, 'utf-8')
	}

	public writeFile(path: string, content: Uint8Array): Promise<void> {
		return fs.writeFile(path, content)
	}

}
