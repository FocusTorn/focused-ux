import type { IFileSystem, FileStats, DirectoryEntry } from '../../_interfaces/IFileSystem.js'
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
		console.warn(`[FileSystemAdapter] createDirectory called with path: ${path}`)
		try {
			await fs.mkdir(path, { recursive: true })
			console.warn(`[FileSystemAdapter] Successfully created directory: ${path}`)
		}
		catch (error) {
			console.warn(`[FileSystemAdapter] Failed to create directory: ${path}`, error)
			throw error
		}
	}

}
