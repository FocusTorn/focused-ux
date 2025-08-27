import type { Stats, Dirent, MakeDirectoryOptions, WriteFileOptions } from 'node:fs'
import type { Buffer } from 'node:buffer'
import type { IUri } from './IUri.js'

export interface IFileSystem {
	stat: (path: string | IUri) => Promise<Stats>
	readdir: (path: string | IUri, options?: { withFileTypes?: boolean }) => Promise<string[] | Dirent[]>
	readFile: (path: string | IUri, options?: { encoding: BufferEncoding, flag?: string } | BufferEncoding) => Promise<string | Buffer>
	writeFile: (path: string | IUri, data: string | Uint8Array, options?: WriteFileOptions) => Promise<void>
	access: (path: string | IUri, mode?: number) => Promise<void>
	mkdir: (path: string | IUri, options?: MakeDirectoryOptions) => Promise<string | undefined>
	copyFile: (src: string | IUri, dest: string | IUri) => Promise<void>
	readFileSync: (path: string | IUri, options?: { encoding: BufferEncoding, flag?: string } | BufferEncoding) => string | Buffer
}
