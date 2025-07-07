import type { IWorkspace } from '@fux/context-cherry-picker-core'
import * as vscode from 'vscode'
import { Uri } from 'vscode'

export class WorkspaceAdapter implements IWorkspace {

	get workspaceFolders(): { uri: string, name: string }[] | undefined {
		return vscode.workspace.workspaceFolders?.map(f => ({ uri: f.uri.fsPath, name: f.name }))
	}

	asRelativePath(pathOrUri: string, includeWorkspaceFolder?: boolean): string {
		return vscode.workspace.asRelativePath(Uri.file(pathOrUri), includeWorkspaceFolder)
	}

	get(section: string, key: string): any {
		return vscode.workspace.getConfiguration(section).get(key)
	}

	public readonly onDidChangeConfiguration = (listener: () => void): { dispose: () => void } => {
		return vscode.workspace.onDidChangeConfiguration((e) => {
			if (e.affectsConfiguration('ccp')) {
				listener()
			}
		})
	}

	createFileSystemWatcher(globPattern: string): {
		onDidChange: (listener: () => void) => { dispose: () => void }
		onDidCreate: (listener: () => void) => { dispose: () => void }
		onDidDelete: (listener: () => void) => { dispose: () => void }
		dispose: () => void
	} {
		const watcher = vscode.workspace.createFileSystemWatcher(globPattern)

		return {
			onDidChange: listener => watcher.onDidChange(listener),
			onDidCreate: listener => watcher.onDidCreate(listener),
			onDidDelete: listener => watcher.onDidDelete(listener),
			dispose: () => watcher.dispose(),
		}
	}

}
