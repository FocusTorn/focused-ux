import { window as VsCodeWindow } from 'vscode'
import type { IWindow } from '@fux/dynamicons-core'
import { showTimedInformationMessage as showTimedInformationMessageUtil } from '@fux/shared'

export class WindowAdapter implements IWindow {

	showInformationMessage(message: string, ...args: any[]): Thenable<any> {
		return VsCodeWindow.showInformationMessage(message, ...args)
	}

	showWarningMessage(message: string, ...args: any[]): Thenable<any> {
		return VsCodeWindow.showWarningMessage(message, ...args)
	}

	showErrorMessage(message: string, ...args: any[]): Thenable<any> {
		return VsCodeWindow.showErrorMessage(message, ...args)
	}

	async showTimedInformationMessage(message: string, duration?: number): Promise<void> {
		const finalDuration = duration ?? 1500 // Default to 1.5 seconds
		await showTimedInformationMessageUtil(message, finalDuration)
	}

}
