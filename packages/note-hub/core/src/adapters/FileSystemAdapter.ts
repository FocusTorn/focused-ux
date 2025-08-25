import * as fs from 'node:fs/promises'
import type { Buffer } from 'node:buffer'
import type { IFileSystem } from '../_interfaces/IFileSystem.js'

export class FileSystemAdapter implements IFileSystem {

	async readFile(path: string): Promise<Buffer> {
		return fs.readFile(path)
	}

	async writeFile(path: string, data: string | Buffer): Promise<void> {
		return fs.writeFile(path, data)
	}

	async mkdir(path: string, options?: { recursive?: boolean }): Promise<void> {
		await fs.mkdir(path, options)
	}

	async createDirectory(path: string): Promise<void> {
		await fs.mkdir(path, { recursive: true })
	}

	async access(path: string): Promise<void> {
		return fs.access(path)
	}

	async stat(path: string): Promise<any> {
		return fs.stat(path)
	}

	async readdir(path: string): Promise<string[]> {
		return fs.readdir(path)
	}

	async unlink(path: string): Promise<void> {
		return fs.unlink(path)
	}

	async rename(oldPath: string, newPath: string): Promise<void> {
		return fs.rename(oldPath, newPath)
	}

}
