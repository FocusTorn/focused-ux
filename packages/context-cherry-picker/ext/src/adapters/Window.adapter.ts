import type { IWindow } from '@fux/context-cherry-picker-core'
import * as vscode from 'vscode'

export class WindowAdapter implements IWindow {

	private _explorerView: vscode.TreeView<any> | undefined

	public setExplorerView(view: vscode.TreeView<any>): void {
		this._explorerView = view
	}

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

	setStatusBarMessage(message: string, durationInMs: number): void {
		vscode.window.setStatusBarMessage(message, durationInMs)
	}

	showDropdownMessage(message: string, durationInMs: number): void {
		if (!this._explorerView)
			return
		this._explorerView.message = message
		setTimeout(() => {
			if (this._explorerView && this._explorerView.message === message) {
				this._explorerView.message = undefined
			}
		}, durationInMs)
	}

	showDescriptionMessage(message: string, durationInMs: number): void {
		if (!this._explorerView)
			return
		this._explorerView.description = message
		setTimeout(() => {
			if (this._explorerView && this._explorerView.description === message) {
				this._explorerView.description = ''
			}
		}, durationInMs)
	}

}
