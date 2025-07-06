import type { IFileSystem, FileStats } from '@fux/project-butler-dc-core'
import * as fs from 'node:fs/promises'

export class FileSystemAdapter implements IFileSystem {
	public stat(path: string): Promise<FileStats> {
		return fs.stat(path)
	}

	public access(path: string): Promise<void> {
		return fs.access(path)
	}

	public copyFile(src: string, dest: string): Promise<void> {
		return fs.copyFile(src, dest)
	}
}