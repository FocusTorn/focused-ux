// ESLint & Imports -->>

//--------------------------------------------------------------------------------------------------------------<<

export interface FileStat {
	type: 'file' | 'directory' | 'unknown'
	size: number
}

export interface DirectoryEntry {
	name: string
	type: 'file' | 'directory' // | 'unknown'
}

export interface IFileSystem {
	stat(uri: string): Promise<FileStat>
	readDirectory(uri: string): Promise<DirectoryEntry[]>
	readFile(uri: string): Promise<Uint8Array>
	writeFile(uri: string, content: Uint8Array): Promise<void>
	createDirectory(uri: string): Promise<void>
}