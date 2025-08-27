import type { Buffer } from 'node:buffer'

export interface IFileSystem {
	readFile: (path: string) => Promise<Buffer>
	writeFile: (path: string, data: string | Buffer) => Promise<void>
	mkdir: (path: string, options?: { recursive?: boolean }) => Promise<void>
	createDirectory: (path: string) => Promise<void>
	access: (path: string) => Promise<void>
	stat: (path: string) => Promise<any>
	readdir: (path: string) => Promise<string[]>
	unlink: (path: string) => Promise<void>
	rename: (oldPath: string, newPath: string) => Promise<void>
}
