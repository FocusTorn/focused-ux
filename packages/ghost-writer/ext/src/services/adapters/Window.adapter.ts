import type { TextEditor } from 'vscode'
import * as vscode from 'vscode'
import type { IWindow } from '../../_interfaces/IVSCode.js'
import type { IConfigurationService } from '@fux/services'
import { showTimedInformationMessage as showTimedInformationMessageUtil } from '@fux/tools'

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

}
