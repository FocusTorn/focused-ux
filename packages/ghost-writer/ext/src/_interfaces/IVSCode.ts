import type { TextEditor, WorkspaceConfiguration } from 'vscode'

export interface IWindow {
	activeTextEditor: TextEditor | undefined
	showErrorMessage: (message: string) => void
	showTimedInformationMessage: (message: string, duration?: number) => Promise<void>
}

export interface IWorkspace {
	getConfiguration: (section?: string) => WorkspaceConfiguration
}
