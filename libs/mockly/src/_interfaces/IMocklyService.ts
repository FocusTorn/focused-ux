import type { Uri, Position, Range, Disposable, EventEmitter } from 'vscode'
import type { Buffer } from 'node:buffer'

export interface IMocklyService {
	// Core VSCode API simulation
	workspace: {
		fs: {
			stat: (uri: Uri) => Promise<any>
			readFile: (uri: Uri) => Promise<Uint8Array>
			writeFile: (uri: Uri, content: Uint8Array) => Promise<void>
			createDirectory: (uri: Uri) => Promise<void>
			readDirectory: (uri: Uri) => Promise<[string, number][]>
			delete: (uri: Uri, options?: { recursive?: boolean, useTrash?: boolean }) => Promise<void>
			copy: (source: Uri, target: Uri, options?: { overwrite?: boolean }) => Promise<void>
			rename: (source: Uri, target: Uri, options?: { overwrite?: boolean }) => Promise<void>
		}
		workspaceFolders?: ReadonlyArray<{ uri: Uri }>
		onDidChangeConfiguration: (listener: (e: any) => void) => Disposable
		createFileSystemWatcher: (pattern: any) => any
		openTextDocument: (uri: Uri) => Promise<any>
		getConfiguration: (section?: string) => any
	}

	window: {
		activeTextEditor: any | undefined
		showErrorMessage: (message: string) => void
		showInformationMessage: (message: string, ...items: string[]) => Promise<string | undefined>
		showWarningMessage: (message: string, options?: { modal?: boolean }, ...items: any[]) => Promise<any>
		showInputBox: (options: any) => Promise<string | undefined>
		showTextDocument: (doc: any) => Promise<any>
		createTreeView: (viewId: string, options: any) => any
		registerTreeDataProvider: (viewId: string, provider: any) => any
		withProgress: (options: any, task: () => Promise<any>) => Promise<any>
	}

	commands: {
		registerCommand: (command: string, callback: (...args: any[]) => any) => Disposable
		executeCommand: <T = unknown>(command: string, ...rest: any[]) => Promise<T>
		getCommands: (filterInternal?: boolean) => Promise<string[]>
	}

	extensions: {
		getExtension: (extensionId: string) => any | undefined
		all: readonly any[]
	}

	env: {
		appName: string
		appRoot: string
		language: string
		machineId: string
		sessionId: string
		uiKind: number
		uriScheme: string
		version: string
		clipboard: {
			writeText: (text: string) => Promise<void>
			readText: () => Promise<string>
		}
	}

	// VSCode types and classes
	Uri: typeof Uri
	Position: typeof Position
	Range: typeof Range
	Disposable: typeof Disposable
	EventEmitter: typeof EventEmitter

	// Node.js utilities
	node: {
		path: {
			join: (...paths: string[]) => string
			normalize: (path: string) => string
			dirname: (path: string) => string
			basename: (path: string, ext?: string) => string
			extname: (path: string) => string
			parse: (path: string) => any
		}
		fs: {
			readFile: (path: string, encoding?: string) => Promise<string | Buffer>
			writeFile: (path: string, data: string | Buffer) => Promise<void>
			access: (path: string) => Promise<void>
			stat: (path: string) => Promise<any>
			readdir: (path: string) => Promise<string[]>
			mkdir: (path: string, options?: any) => Promise<void>
			rmdir: (path: string) => Promise<void>
			unlink: (path: string) => Promise<void>
			rename: (oldPath: string, newPath: string) => Promise<void>
		}
	}

	// Version info
	version: string

	// Reset functionality for testing
	reset: () => void
}
