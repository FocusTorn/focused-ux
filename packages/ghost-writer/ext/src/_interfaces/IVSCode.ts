import type { TextEditor, WorkspaceConfiguration } from 'vscode'

export interface IWindow {
	activeTextEditor: TextEditor | undefined
	showErrorMessage(message: string): void
	showInformationMessage(message:string): void
}

export interface IWorkspace {
	getConfiguration(section?: string): WorkspaceConfiguration
}