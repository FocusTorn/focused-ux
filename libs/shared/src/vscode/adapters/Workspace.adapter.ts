import type { WorkspaceConfiguration } from 'vscode'
import * as vscode from 'vscode'
import type { IWorkspace } from '../../_interfaces/IVSCode.js'

export class WorkspaceAdapter implements IWorkspace {
	public getConfiguration(section?: string): WorkspaceConfiguration {
		return vscode.workspace.getConfiguration(section)
	}
}