import type { PathLike, Stats, Dirent, MakeDirectoryOptions, WriteFileOptions } from 'node:fs'
import { Buffer } from 'node:buffer'

export interface IFileSystem {
	stat: (path: PathLike) => Promise<Stats>
	readdir: (path: PathLike, options?: { withFileTypes?: boolean }) => Promise<string[] | Dirent[]>
	readFile: (path: PathLike, options?: { encoding: BufferEncoding, flag?: string } | BufferEncoding) => Promise<string | Buffer>
	writeFile: (path: PathLike | import('node:fs/promises').FileHandle, data: string | Uint8Array, options?: WriteFileOptions) => Promise<void>
	access: (path: PathLike, mode?: number) => Promise<void>
	mkdir: (path: PathLike, options?: MakeDirectoryOptions) => Promise<string | undefined>
	copyFile: (src: PathLike, dest: PathLike) => Promise<void>
	readFileSync: (path: PathLike, options?: { encoding: BufferEncoding, flag?: string } | BufferEncoding) => string | Buffer
}