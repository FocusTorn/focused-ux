// ESLint & Imports -->>

//--------------------------------------------------------------------------------------------------------------<<

export interface IFileSystemWatcher {
	onDidChange: (listener: () => void) => { dispose: () => void }
	onDidCreate: (listener: () => void) => { dispose: () => void }
	onDidDelete: (listener: () => void) => { dispose: () => void }
	dispose: () => void
}

export interface IWorkspace {
	workspaceFolders: { uri: string, name: string }[] | undefined
	asRelativePath: (pathOrUri: string, includeWorkspaceFolder?: boolean) => string
	get: (section: string, key: string) => any
	onDidChangeConfiguration: (listener: () => void) => { dispose: () => void }
	createFileSystemWatcher: (globPattern: string) => IFileSystemWatcher
}
