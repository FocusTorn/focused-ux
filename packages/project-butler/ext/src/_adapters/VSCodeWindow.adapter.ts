import type { IWindow } from '@fux/project-butler-core'
import * as vscode from 'vscode'
import type { IConfigurationService } from '@fux/services'
import { showTimedInformationMessage as showTimedInformationMessageUtil } from '@fux/tools'

export class VSCodeWindowAdapter implements IWindow {

	constructor(private readonly configurationService: IConfigurationService) {}

	public get activeTextEditorUri(): string | undefined {
		return vscode.window.activeTextEditor?.document.uri.fsPath
	}

	public showErrorMessage(message: string): void {
		vscode.window.showErrorMessage(message)
	}

	public showInformationMessage(message: string, modal?: boolean, ...items: string[]): any {
		if (modal !== undefined) {
			// This covers the second overload: (message, modal, ...items)
			return vscode.window.showInformationMessage(message, { modal }, ...items)
		}
		// This covers the first overload: (message)
		return vscode.window.showInformationMessage(message)
	}

	public showWarningMessage(message: string): void {
		vscode.window.showWarningMessage(message)
	}

	public withProgress<T>(
		options: { title: string, cancellable: boolean },
		task: (progress: { report: (value: { message: string }) => void }) => Promise<T>,
	): PromiseLike<T> {
		return vscode.window.withProgress(
			{
				location: vscode.ProgressLocation.Notification,
				title: options.title,
				cancellable: options.cancellable,
			},
			task,
		)
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
