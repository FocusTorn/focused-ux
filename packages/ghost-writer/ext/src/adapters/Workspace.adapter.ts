import * as vscode from 'vscode'
import type { IWorkspaceAdapter } from '@fux/ghost-writer-core'

export class WorkspaceAdapter implements IWorkspaceAdapter {

	getConfiguration(section: string): vscode.WorkspaceConfiguration {
		return vscode.workspace.getConfiguration(section)
	}

}
