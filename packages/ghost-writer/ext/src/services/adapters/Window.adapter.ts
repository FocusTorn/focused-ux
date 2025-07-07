import type { TextEditor } from 'vscode'
import * as vscode from 'vscode'
import type { IWindow } from '../../_interfaces/IVSCode.js'

export class WindowAdapter implements IWindow {
	public get activeTextEditor(): TextEditor | undefined {
		return vscode.window.activeTextEditor
	}

	public showErrorMessage(message: string): void {
		vscode.window.showErrorMessage(message)
	}

	public showInformationMessage(message: string): void {
		vscode.window.showInformationMessage(message)
	}
}