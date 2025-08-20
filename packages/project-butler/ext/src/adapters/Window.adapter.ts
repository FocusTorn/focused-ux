import * as vscode from 'vscode'

export interface IWindowAdapter {
	showInformationMessage(message: string): Promise<void>
	showWarningMessage(message: string): Promise<void>
	showErrorMessage(message: string): Promise<void>
	getActiveTextEditor(): vscode.TextEditor | undefined
	createTerminal(name?: string): vscode.Terminal
	getActiveTerminal(): vscode.Terminal | undefined
}

export class WindowAdapter implements IWindowAdapter {
	async showInformationMessage(message: string): Promise<void> {
		await vscode.window.showInformationMessage(message)
	}

	async showWarningMessage(message: string): Promise<void> {
		await vscode.window.showWarningMessage(message)
	}

	async showErrorMessage(message: string): Promise<void> {
		await vscode.window.showErrorMessage(message)
	}

	getActiveTextEditor(): vscode.TextEditor | undefined {
		return vscode.window.activeTextEditor
	}

	createTerminal(name?: string): vscode.Terminal {
		return vscode.window.createTerminal(name)
	}

	getActiveTerminal(): vscode.Terminal | undefined {
		return vscode.window.activeTerminal
	}
} 