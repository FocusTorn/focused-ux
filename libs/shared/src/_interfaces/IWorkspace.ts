export interface IWorkspace {
	getConfiguration: (section?: string) => any
	fs: {
		stat: (uri: any) => Promise<any>
		readFile: (uri: any) => Promise<Uint8Array>
		writeFile: (uri: any, content: Uint8Array) => Promise<void>
		createDirectory: (uri: any) => Promise<void>
		readDirectory: (uri: any) => Promise<[string, number][]>
		delete: (uri: any, options?: { recursive?: boolean, useTrash?: boolean }) => Promise<void>
		copy: (source: any, target: any, options?: { overwrite?: boolean }) => Promise<void>
		rename: (source: any, target: any, options?: { overwrite?: boolean }) => Promise<void>
	}
	workspaceFolders?: Array<{ uri: any }>
	onDidChangeConfiguration: (listener: (e: any) => void) => { dispose: () => void }
	openTextDocument: (uri: any) => Promise<any>
}
