import type { TextEditor, WorkspaceConfiguration, Disposable } from 'vscode'

export interface IWindow {
	activeTextEditor: TextEditor | undefined
	showErrorMessage: (message: string) => void
	showTimedInformationMessage: (message: string, duration?: number) => Promise<void>
	showInformationMessage: (message: string, ...items: string[]) => Thenable<string | undefined>;
	showWarningMessage: (message: string, options?: { modal?: boolean }, ...items: any[]) => Thenable<any>;
	showInputBox: (options: any) => Thenable<string | undefined>;
	showTextDocument: (doc: any) => Thenable<any>;
	createTreeView: (viewId: string, options: any) => any;
	registerTreeDataProvider: (viewId: string, provider: any) => any;
	withProgress: (options: any, task: () => Promise<any>) => Thenable<any>;
}

export interface IWorkspace {
	getConfiguration: (section?: string) => WorkspaceConfiguration
	fs: {
		stat: (uri: any) => Thenable<any>;
		readFile: (uri: any) => Thenable<Uint8Array>;
		writeFile: (uri: any, content: Uint8Array) => Thenable<void>;
		createDirectory: (uri: any) => Thenable<void>;
		readDirectory: (uri: any) => Thenable<[string, number][]>;
		delete: (uri: any, options?: { recursive?: boolean; useTrash?: boolean }) => Thenable<void>;
		copy: (source: any, target: any, options?: { overwrite?: boolean }) => Thenable<void>;
		rename: (source: any, target: any, options?: { overwrite?: boolean }) => Thenable<void>;
	};
	workspaceFolders?: ReadonlyArray<{ uri: any }>;
	onDidChangeConfiguration: (listener: (e: any) => void) => { dispose(): void };
	createFileSystemWatcher: (pattern: any) => any;
	openTextDocument: (uri: any) => Thenable<any>;
}

export interface ICommands {
	registerCommand(command: string, callback: (...args: any[]) => any): Disposable
}

export interface IPosition {
	create(line: number, character: number): any
}
