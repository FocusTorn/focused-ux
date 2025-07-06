import type { IWindow } from '@fux/project-butler-dc-core'
import * as vscode from 'vscode'

export class VSCodeWindowAdapter implements IWindow {

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

}
