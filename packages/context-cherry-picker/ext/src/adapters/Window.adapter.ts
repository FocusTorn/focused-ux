import type { IWindow } from '@fux/context-cherry-picker-core'
import * as vscode from 'vscode'

export class WindowAdapter implements IWindow {

	showInformationMessage(message: string): void {
		vscode.window.showInformationMessage(message)
	}

	showWarningMessage(message: string, modal: boolean, ...items: string[]): Promise<string | undefined> {
		return Promise.resolve(vscode.window.showWarningMessage(message, { modal }, ...items))
	}

	showErrorMessage(message: string): void {
		vscode.window.showErrorMessage(message)
	}

	showInputBox(options: { prompt: string }): Promise<string | undefined> {
		return Promise.resolve(vscode.window.showInputBox(options))
	}

	setClipboard(text: string): Promise<void> {
		return Promise.resolve(vscode.env.clipboard.writeText(text))
	}

}
