import * as vscode from 'vscode'

export interface IWorkspaceAdapter {
	getWorkspaceRoot(): string | undefined
}

export class WorkspaceAdapter implements IWorkspaceAdapter {
	getWorkspaceRoot(): string | undefined {
		return vscode.workspace.workspaceFolders?.[0]?.uri.fsPath
	}
} 