import type { WorkspaceConfiguration } from 'vscode'
import * as vscode from 'vscode'
import type { IWorkspace, ITextDocument, IRelativePattern } from '../../_interfaces/IVSCode.js'
import { TextDocumentAdapter } from './TextDocument.adapter.js'

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

	public createFileSystemWatcher(pattern: string | IRelativePattern): any {
		if (typeof pattern === 'string') {
			return vscode.workspace.createFileSystemWatcher(pattern)
		}
		else {
			// pattern is IRelativePattern, we need to create a VSCode RelativePattern
			const vscodePattern = new vscode.RelativePattern(pattern.base, pattern.pattern)

			return vscode.workspace.createFileSystemWatcher(vscodePattern)
		}
	}

	public async openTextDocument(uri: any): Promise<ITextDocument> {
		const document = await vscode.workspace.openTextDocument(uri)

		return new TextDocumentAdapter(document)
	}

}
