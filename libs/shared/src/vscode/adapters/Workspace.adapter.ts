import type { WorkspaceConfiguration } from 'vscode'
import * as vscode from 'vscode'
import type { IWorkspace } from '../../_interfaces/IVSCode.js'

export class WorkspaceAdapter implements IWorkspace {
	public getConfiguration(section?: string): WorkspaceConfiguration {
		return vscode.workspace.getConfiguration(section)
	}

	public get fs() {
		return vscode.workspace.fs
	}

	public get workspaceFolders() {
		return vscode.workspace.workspaceFolders
	}

	public onDidChangeConfiguration(listener: (e: any) => void) {
		return vscode.workspace.onDidChangeConfiguration(listener)
	}

	public createFileSystemWatcher(pattern: any): any {
		return vscode.workspace.createFileSystemWatcher(pattern)
	}

	public openTextDocument(uri: any): Thenable<any> {
		return vscode.workspace.openTextDocument(uri)
	}
}