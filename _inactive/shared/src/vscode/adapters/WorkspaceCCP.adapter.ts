import type { IWorkspaceCCP, IWorkspace, IRelativePattern, ITextDocument } from '../../_interfaces/IVSCode.js'

export class WorkspaceCCPAdapter implements IWorkspaceCCP, IWorkspace {

	constructor(private workspaceAdapter: IWorkspace) {}

	get workspaceFolders(): { uri: string, name: string }[] | undefined {
		const folders = this.workspaceAdapter.workspaceFolders

		return folders?.map((f: any) => ({ uri: f.uri.fsPath, name: f.name }))
	}

	asRelativePath(pathOrUri: string, _includeWorkspaceFolder?: boolean): string {
		// This would need to be implemented using the workspace adapter
		// For now, we'll use a simple implementation
		return pathOrUri
	}

	get(section: string, key: string): any {
		return this.workspaceAdapter.getConfiguration(section).get(key)
	}

	onDidChangeConfiguration(listener: () => void): { dispose: () => void } {
		return this.workspaceAdapter.onDidChangeConfiguration((e: any) => {
			// Check if the configuration change affects 'ccp'
			if (e.affectsConfiguration && e.affectsConfiguration('ccp')) {
				listener()
			}
		})
	}

	createFileSystemWatcher(pattern: string | IRelativePattern): any {
		return this.workspaceAdapter.createFileSystemWatcher(pattern)
	}

	getConfiguration(section: string): any {
		return this.workspaceAdapter.getConfiguration(section)
	}

	get fs() {
		return this.workspaceAdapter.fs
	}

	async openTextDocument(uri: any): Promise<ITextDocument> {
		return this.workspaceAdapter.openTextDocument(uri)
	}

}
