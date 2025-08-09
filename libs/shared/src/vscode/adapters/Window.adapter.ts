import type { TextEditor, TreeView } from 'vscode'
import * as vscode from 'vscode'
import type { IWindow, IWindowCCP, IWindowPB } from '../../_interfaces/IVSCode.js'
import type { IConfigurationService } from '../../_interfaces/IConfigurationService.js'
import { showTimedInformationMessage as showTimedInformationMessageUtil } from '../../utils/showTimedInformationMessage.js'

export class WindowAdapter implements IWindow, IWindowCCP, IWindowPB {

	private _explorerView: TreeView<any> | undefined

	constructor(private readonly configurationService: IConfigurationService) {}

	public setExplorerView(view: TreeView<any>): void {
		this._explorerView = view
	}

	// IWindow interface
	public get activeTextEditor(): TextEditor | undefined {
		return vscode.window.activeTextEditor
	}

	public get activeTextEditorUri(): string | undefined {
		return vscode.window.activeTextEditor?.document.uri.fsPath
	}

	public showErrorMessage(message: string): void {
		const safeMessage = message && typeof message === 'string' ? message : 'An unknown error occurred.'

		vscode.window.showErrorMessage(safeMessage)
	}

	// Unified showInformationMessage that handles different signatures
	public async showInformationMessage(message: string, modalOrItems?: boolean | string, ...items: string[]): Promise<string | undefined> {
		const raw = message && typeof message === 'string' ? message : ''
		const safeMessage = raw.length > 0 ? raw : ' '

		if (typeof modalOrItems === 'boolean') {
			// IWindowPB signature: (message, modal, ...items)
			return await vscode.window.showInformationMessage(safeMessage, { modal: modalOrItems }, ...items)
		}
		else {
			// IWindow signature: (message, ...items)
			const allItems = modalOrItems ? [modalOrItems, ...items] : items

			return await vscode.window.showInformationMessage(safeMessage, ...allItems)
		}
	}

	public async showWarningMessage(message: string, options?: any, ...items: string[]): Promise<string | undefined> {
		const raw = message && typeof message === 'string' ? message : ''
		const safeMessage = raw.length > 0 ? raw : ' '

		return await vscode.window.showWarningMessage(safeMessage, options, ...items)
	}

	public async showInputBox(options?: any): Promise<string | undefined> {
		return await vscode.window.showInputBox(options)
	}

	public async showTextDocument(doc: any): Promise<any> {
		return await vscode.window.showTextDocument(doc)
	}

	public createTreeView(viewId: string, options: any): any {
		return vscode.window.createTreeView(viewId, options)
	}

	public registerTreeDataProvider(viewId: string, provider: any): any {
		return vscode.window.registerTreeDataProvider(viewId, provider)
	}

	public async withProgress<T>(
		options: { title: string, cancellable: boolean },
		task: (progress: { report: (value: { message: string }) => void }) => Promise<T>,
	): Promise<T> {
		return await vscode.window.withProgress({
			location: vscode.ProgressLocation.Notification,
			...options,
		}, task)
	}

	// Unified setStatusBarMessage that handles optional timeout
	public setStatusBarMessage(message: string, timeout?: number): void {
		if (timeout !== undefined) {
			vscode.window.setStatusBarMessage(message, timeout)
		}
		else {
			vscode.window.setStatusBarMessage(message)
		}
	}

	public registerUriHandler(handler: any): any {
		return vscode.window.registerUriHandler(handler)
	}

	// IWindowCCP specific methods
	public setClipboard(text: string): Promise<void> {
		return Promise.resolve(vscode.env.clipboard.writeText(text))
	}

	public async showDropdownMessage(message: string, durationInMs?: number): Promise<void> {
		if (!this._explorerView)
			return

		const finalDurationMs = await this._getDuration(durationInMs, 'ContextCherryPicker.settings.message_show_seconds')

		this._explorerView.message = message
		setTimeout(() => {
			if (this._explorerView && this._explorerView.message === message) {
				this._explorerView.message = undefined
			}
		}, finalDurationMs)
	}

	public async showDescriptionMessage(message: string, durationInMs?: number): Promise<void> {
		if (!this._explorerView)
			return

		const finalDurationMs = await this._getDuration(durationInMs, 'ContextCherryPicker.settings.message_show_seconds')

		this._explorerView.description = message
		setTimeout(() => {
			if (this._explorerView && this._explorerView.description === message) {
				this._explorerView.description = ''
			}
		}, finalDurationMs)
	}

	// Unified showTimedInformationMessage method
	public async showTimedInformationMessage(message: string, duration?: number): Promise<void> {
		const raw = message && typeof message === 'string' ? message : ''
		const safeMessage = raw.length > 0 ? raw : ' '
		let finalDurationMs = duration

		if (finalDurationMs === undefined) {
			const durationSeconds = await this.configurationService.get<number>('FocusedUX.info_message_show_seconds', 1.5)

			finalDurationMs = durationSeconds * 1000
		}

		await showTimedInformationMessageUtil(this, safeMessage, finalDurationMs)
	}

	private async _getDuration(duration?: number, configKey?: string): Promise<number> {
		if (duration !== undefined) {
			return duration
		}

		const configKeyToUse = configKey || 'FocusedUX.info_message_show_seconds'
		const durationSeconds = await this.configurationService.get<number>(configKeyToUse, 1.5)

		return durationSeconds * 1000
	}

}
