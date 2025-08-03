import type { IWindow } from '@fux/context-cherry-picker-core'
import * as vscode from 'vscode'
import type { IConfigurationService } from '@fux/shared'


export class WindowAdapter implements IWindow {

	private _explorerView: vscode.TreeView<any> | undefined

	constructor(private readonly configurationService: IConfigurationService) {}

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

	public async showTimedInformationMessage(message: string, duration?: number): Promise<void> {
		let finalDurationMs = duration

		if (finalDurationMs === undefined) {
			const durationSeconds = await this.configurationService.get<number>('ContextCherryPicker.settings.message_show_seconds', 1.5)
			finalDurationMs = durationSeconds * 1000
		}

		await vscode.window.withProgress(
			{
				location: vscode.ProgressLocation.Notification,
				title: message,
				cancellable: false,
			},
			async () => {
				await new Promise(resolve => setTimeout(resolve, finalDurationMs))
			},
		)
	}

	async setStatusBarMessage(message: string, durationInMs?: number): Promise<void> {
		const finalDurationMs = await this._getDuration(durationInMs)

		vscode.window.setStatusBarMessage(message, finalDurationMs)
	}

	async showDropdownMessage(message: string, durationInMs?: number): Promise<void> {
		if (!this._explorerView)
			return

		const finalDurationMs = await this._getDuration(durationInMs)

		this._explorerView.message = message
		setTimeout(() => {
			if (this._explorerView && this._explorerView.message === message) {
				this._explorerView.message = undefined
			}
		}, finalDurationMs)
	}

	async showDescriptionMessage(message: string, durationInMs?: number): Promise<void> {
		if (!this._explorerView)
			return

		const finalDurationMs = await this._getDuration(durationInMs)

		this._explorerView.description = message
		setTimeout(() => {
			if (this._explorerView && this._explorerView.description === message) {
				this._explorerView.description = ''
			}
		}, finalDurationMs)
	}

	private async _getDuration(duration?: number): Promise<number> {
		if (duration !== undefined) {
			return duration
		}

		const durationSeconds = await this.configurationService.get<number>('ContextCherryPicker.settings.message_show_seconds', 1.5)

		return durationSeconds * 1000
	}

}
