export interface FileStats {
	isDirectory: () => boolean
}

export interface IFileSystem {
	stat: (path: string) => Promise<FileStats>
	access: (path: string) => Promise<void>
	copyFile: (src: string, dest: string) => Promise<void>
	readFile: (path: string) => Promise<string>
}
