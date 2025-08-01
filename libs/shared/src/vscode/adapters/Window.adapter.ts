import type { TextEditor } from 'vscode'
import * as vscode from 'vscode'
import type { IWindow } from '../../_interfaces/IVSCode.js'
import type { IConfigurationService } from '../../_interfaces/IConfigurationService.js'
import { showTimedInformationMessage as showTimedInformationMessageUtil } from '../window.js'

export class WindowAdapter implements IWindow {

	constructor(private readonly configurationService: IConfigurationService) {}

	public get activeTextEditor(): TextEditor | undefined {
		return vscode.window.activeTextEditor
	}

	public showErrorMessage(message: string): void {
		vscode.window.showErrorMessage(message)
	}

	public async showTimedInformationMessage(message: string, duration?: number): Promise<void> {
		let finalDurationMs = duration

		if (finalDurationMs === undefined) {
			const durationSeconds = await this.configurationService.get<number>('FocusedUX.info_message_show_seconds', 1.5)

			finalDurationMs = durationSeconds * 1000
		}

		await showTimedInformationMessageUtil(message, finalDurationMs)
	}

	public showInformationMessage(message: string, ...items: string[]): Thenable<string | undefined> {
		return vscode.window.showInformationMessage(message, ...items)
	}

	public showWarningMessage(message: string, options?: { modal?: boolean }, ...items: any[]): Thenable<any> {
		return vscode.window.showWarningMessage(message, options, ...items)
	}

	public showInputBox(options: any): Thenable<string | undefined> {
		return vscode.window.showInputBox(options)
	}

	public showTextDocument(doc: any): Thenable<any> {
		return vscode.window.showTextDocument(doc)
	}

	public createTreeView(viewId: string, options: any): any {
		return vscode.window.createTreeView(viewId, options)
	}

	public registerTreeDataProvider(viewId: string, provider: any): any {
		return vscode.window.registerTreeDataProvider(viewId, provider)
	}

	public withProgress(options: any, task: () => Promise<any>): Thenable<any> {
		return vscode.window.withProgress(options, task)
	}

}