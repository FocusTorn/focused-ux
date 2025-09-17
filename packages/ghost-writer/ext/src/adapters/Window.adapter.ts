import * as vscode from 'vscode'
import type { IWindowAdapter } from '@fux/ghost-writer-core'

export class WindowAdapter implements IWindowAdapter {

	errMsg(message: string): void {
		vscode.window.showErrorMessage(message)
	}

	showInformationMessage(message: string): Thenable<string | undefined> {
		return vscode.window.showInformationMessage(message)
	}

	showTimedInformationMessage(message: string): Thenable<string | undefined> {
		return vscode.window.showInformationMessage(message)
	}

	get activeTextEditor(): vscode.TextEditor | undefined {
		return vscode.window.activeTextEditor
	}

}
