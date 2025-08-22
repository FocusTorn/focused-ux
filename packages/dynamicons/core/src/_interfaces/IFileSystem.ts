import type { Stats, Dirent, MakeDirectoryOptions, WriteFileOptions } from 'node:fs'
import type { Buffer } from 'node:buffer'
import type { Uri } from 'vscode'

export interface IFileSystem {
	stat: (path: string | Uri) => Promise<Stats>
	readdir: (path: string | Uri, options?: { withFileTypes?: boolean }) => Promise<string[] | Dirent[]>
	readFile: (path: string | Uri, options?: { encoding: BufferEncoding, flag?: string } | BufferEncoding) => Promise<string | Buffer>
	writeFile: (path: string | Uri, data: string | Uint8Array, options?: WriteFileOptions) => Promise<void>
	access: (path: string | Uri, mode?: number) => Promise<void>
	mkdir: (path: string | Uri, options?: MakeDirectoryOptions) => Promise<string | undefined>
	copyFile: (src: string | Uri, dest: string | Uri) => Promise<void>
	readFileSync: (path: string | Uri, options?: { encoding: BufferEncoding, flag?: string } | BufferEncoding) => string | Buffer
}