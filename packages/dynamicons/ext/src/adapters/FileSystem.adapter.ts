import type { PathLike, Stats, Dirent, MakeDirectoryOptions, WriteFileOptions } from 'node:fs'
import * as fs from 'node:fs/promises'
import * as fsSync from 'node:fs'
import type { Buffer } from 'node:buffer'
import type { IFileSystem } from '@fux/dynamicons-core'

export class FileSystemAdapter implements IFileSystem {

	public stat(path: PathLike): Promise<Stats> {
		return fs.stat(path)
	}

	public readdir(path: PathLike, options?: { withFileTypes?: boolean }): Promise<string[] | Dirent[]> {
		if (options?.withFileTypes) {
			return fs.readdir(path, { withFileTypes: true })
		}
		return fs.readdir(path)
	}

	public writeFile(path: PathLike | fs.FileHandle, data: string | Uint8Array, options?: WriteFileOptions): Promise<void> {
		return fs.writeFile(path, data, options)
	}

	public access(path: PathLike, mode?: number): Promise<void> {
		return fs.access(path, mode)
	}

	public mkdir(path: PathLike, options?: MakeDirectoryOptions): Promise<string | undefined> {
		return fs.mkdir(path, options)
	}

	public copyFile(src: PathLike, dest: PathLike): Promise<void> {
		return fs.copyFile(src, dest)
	}

	public readFileSync(path: PathLike, options?: { encoding: BufferEncoding, flag?: string } | BufferEncoding): string | Buffer {
		return fsSync.readFileSync(path, options)
	}

}
