import type { IWorkspaceFolder } from './IWorkspaceFolder.js'

export interface IWorkspace {
	onDidChangeConfiguration: (listener: (e: any) => void) => { dispose: () => void }
	getConfiguration: (section?: string) => IConfiguration
	openTextDocument: (uri: any) => Promise<any>
	workspaceFolders?: readonly IWorkspaceFolder[]
	createFileSystemWatcher: (pattern: any) => IFileSystemWatcher
	fs: {
		readFile: (uri: any) => Promise<Uint8Array>
		writeFile: (uri: any, content: Uint8Array) => Promise<void>
		stat: (uri: any) => Promise<any>
		readDirectory: (uri: any) => Promise<[string, any][]>
		createDirectory: (uri: any) => Promise<void>
		delete: (uri: any, options?: { recursive?: boolean, useTrash?: boolean }) => Promise<void>
		copy: (source: any, destination: any, options?: { overwrite?: boolean }) => Promise<void>
		rename: (source: any, destination: any, options?: { overwrite?: boolean }) => Promise<void>
	}
}

export interface IConfiguration {
	get: <T>(section: string, defaultValue?: T) => T
	update: (section: string, value: any, target?: any) => Promise<void>
}

export interface IFileSystemWatcher {
	onDidChange: (listener: (e: any) => void) => { dispose: () => void }
	onDidCreate: (listener: (e: any) => void) => { dispose: () => void }
	onDidDelete: (listener: (e: any) => void) => { dispose: () => void }
	dispose: () => void
}
