import type { IFileSystem, FileStats, DirectoryEntry } from '@fux/services'
import * as fs from 'node:fs/promises'

export class FileSystemAdapter implements IFileSystem {

	public async stat(path: string): Promise<FileStats> {
		const stats = await fs.stat(path)

		return {
			type: stats.isDirectory() ? 'directory' : 'file',
			size: stats.size,
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

	public readDirectory(_path: string): Promise<DirectoryEntry[]> {
		throw new Error('Method not implemented.')
	}

	public writeFile(path: string, content: Uint8Array): Promise<void> {
		return fs.writeFile(path, content)
	}

	public async createDirectory(path: string): Promise<void> {
		await fs.mkdir(path, { recursive: true })
	}

}
