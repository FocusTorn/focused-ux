export interface FileStats {
	type: 'file' | 'directory'
	size: number
}

export interface DirectoryEntry {
	name: string
	type: 'file' | 'directory'
}

export interface IFileSystem {
	stat: (path: string) => Promise<FileStats>
	readFile: (path: string) => Promise<string>
	readDirectory: (path: string) => Promise<DirectoryEntry[]>
	writeFile: (path: string, content: Uint8Array) => Promise<void>
	createDirectory: (path: string) => Promise<void>
	access: (path: string) => Promise<void>
	copyFile: (src: string, dest: string) => Promise<void>
}