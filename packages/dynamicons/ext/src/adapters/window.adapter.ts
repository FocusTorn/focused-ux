import type { IWindow } from '@fux/dynamicons-core'
import * as vscode from 'vscode'

export class WindowAdapter implements IWindow {

	async showInformationMessage(message: string): Promise<string | undefined> {
		return vscode.window.showInformationMessage(message)
	}

	async showErrorMessage(message: string): Promise<string | undefined> {
		return vscode.window.showErrorMessage(message)
	}

	async showWarningMessage(message: string): Promise<string | undefined> {
		return vscode.window.showWarningMessage(message)
	}

	async showTimedInformationMessage(message: string): Promise<void> {
		// Simple implementation - just show the message
		await vscode.window.showInformationMessage(message)
	}

}
