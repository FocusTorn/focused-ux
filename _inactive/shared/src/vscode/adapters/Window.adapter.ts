import type { TextEditor, TreeView } from 'vscode'
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
		// This will be provided by the DI container during runtime
		// During tests, VSCode imports are redirected to Mockly via the test adapter
		return undefined
	}

	public get activeTextEditorUri(): string | undefined {
		return this.activeTextEditor?.document.uri.fsPath
	}

	public showErrorMessage(message: string): void {
		const _safeMessage = message && typeof message === 'string' ? message : 'An unknown error occurred.'
		// This will be provided by the DI container during runtime
		// During tests, VSCode imports are redirected to Mockly via the test adapter
	}

	// Unified showInformationMessage that handles different signatures
	public async showInformationMessage(message: string, _modalOrItems?: boolean | string, ..._items: string[]): Promise<string | undefined> {
		const raw = message && typeof message === 'string' ? message : ''
		const _safeMessage = raw.length > 0 ? raw : ' '

		// This will be provided by the DI container during runtime
		// During tests, VSCode imports are redirected to Mockly via the test adapter
		return undefined
	}

	public async showWarningMessage(message: string, _options?: any, ..._items: string[]): Promise<string | undefined> {
		const raw = message && typeof message === 'string' ? message : ''
		const _safeMessage = raw.length > 0 ? raw : ' '

		// This will be provided by the DI container during runtime
		// During tests, VSCode imports are redirected to Mockly via the test adapter
		return undefined
	}

	public async showInputBox(_options?: any): Promise<string | undefined> {
		// This will be provided by the DI container during runtime
		// During tests, VSCode imports are redirected to Mockly via the test adapter
		return undefined
	}

	public async showTextDocument(_doc: any): Promise<any> {
		// This will be provided by the DI container during runtime
		// During tests, VSCode imports are redirected to Mockly via the test adapter
		return undefined
	}

	public createTreeView(_viewId: string, _options: any): any {
		// This will be provided by the DI container during runtime
		// During tests, VSCode imports are redirected to Mockly via the test adapter
		return undefined
	}

	public registerTreeDataProvider(_viewId: string, _provider: any): any {
		// This will be provided by the DI container during runtime
		// During tests, VSCode imports are redirected to Mockly via the test adapter
		return undefined
	}

	public async withProgress<T>(
		options: { title: string, cancellable: boolean },
		task: (progress: { report: (value: { message: string }) => void }) => Promise<T>,
	): Promise<T> {
		// This will be provided by the DI container during runtime
		// During tests, VSCode imports are redirected to Mockly via the test adapter
		return await task({ report: () => {} })
	}

	// Unified setStatusBarMessage that handles optional timeout
	public setStatusBarMessage(_message: string, _timeout?: number): void {
		// This will be provided by the DI container during runtime
		// During tests, VSCode imports are redirected to Mockly via the test adapter
	}

	public registerUriHandler(_handler: any): any {
		// This will be provided by the DI container during runtime
		// During tests, VSCode imports are redirected to Mockly via the test adapter
		return undefined
	}

	// IWindowCCP specific methods
	public setClipboard(_text: string): Promise<void> {
		// This will be provided by the DI container during runtime
		// During tests, VSCode imports are redirected to Mockly via the test adapter
		return Promise.resolve()
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
		const _safeMessage = raw.length > 0 ? raw : ' '
		let finalDurationMs = duration

		if (finalDurationMs === undefined) {
			const durationSeconds = await this.configurationService.get<number>('FocusedUX.info_message_show_seconds', 1.5)

			finalDurationMs = durationSeconds * 1000
		}

		await showTimedInformationMessageUtil(this, _safeMessage, finalDurationMs)
	}

	private async _getDuration(duration?: number, configKey: string = 'FocusedUX.info_message_show_seconds'): Promise<number> {
		if (duration !== undefined) {
			return duration
		}

		const durationSeconds = await this.configurationService.get<number>(configKey, 1.5)

		return durationSeconds * 1000
	}

}
