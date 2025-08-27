import type { IWorkspace, IConfiguration, IFileSystemWatcher } from '@fux/note-hub-core'
import type * as vscode from 'vscode'

export class WorkspaceAdapter implements IWorkspace {

	constructor(private vscodeWorkspace: typeof vscode.workspace) {}

	onDidChangeConfiguration(listener: (e: any) => void): { dispose: () => void } {
		return this.vscodeWorkspace.onDidChangeConfiguration(listener)
	}

	getConfiguration(section?: string): IConfiguration {
		const config = this.vscodeWorkspace.getConfiguration(section)

		return {
			get: <T>(key: string, defaultValue?: T): T => config.get(key, defaultValue) as T,
			update: (key: string, value: any, target?: any): Promise<void> => Promise.resolve(config.update(key, value, target)),
		}
	}

	async openTextDocument(uri: any): Promise<any> {
		return this.vscodeWorkspace.openTextDocument(uri)
	}

	get workspaceFolders(): readonly any[] | undefined {
		return this.vscodeWorkspace.workspaceFolders
	}

	createFileSystemWatcher(pattern: any): IFileSystemWatcher {
		const watcher = this.vscodeWorkspace.createFileSystemWatcher(pattern)

		return {
			onDidChange: listener => watcher.onDidChange(listener),
			onDidCreate: listener => watcher.onDidCreate(listener),
			onDidDelete: listener => watcher.onDidDelete(listener),
			dispose: () => watcher.dispose(),
		}
	}

	get fs() {
		return {
			readFile: (uri: any): Promise<Uint8Array> => Promise.resolve(this.vscodeWorkspace.fs.readFile(uri)),
			writeFile: (uri: any, content: Uint8Array): Promise<void> => Promise.resolve(this.vscodeWorkspace.fs.writeFile(uri, content)),
			stat: (uri: any): Promise<any> => Promise.resolve(this.vscodeWorkspace.fs.stat(uri)),
			readDirectory: (uri: any): Promise<[string, any][]> => Promise.resolve(this.vscodeWorkspace.fs.readDirectory(uri)),
			createDirectory: (uri: any): Promise<void> => Promise.resolve(this.vscodeWorkspace.fs.createDirectory(uri)),
			delete: (uri: any, options?: { recursive?: boolean, useTrash?: boolean }): Promise<void> => Promise.resolve(this.vscodeWorkspace.fs.delete(uri, options)),
			copy: (source: any, destination: any, options?: { overwrite?: boolean }): Promise<void> => Promise.resolve(this.vscodeWorkspace.fs.copy(source, destination, options)),
			rename: (source: any, destination: any, options?: { overwrite?: boolean }): Promise<void> => Promise.resolve(this.vscodeWorkspace.fs.rename(source, destination, options)),
		}
	}

}
