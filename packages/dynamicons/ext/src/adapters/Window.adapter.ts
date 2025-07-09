import { window as VsCodeWindow } from 'vscode'
import type { IWindow } from '@fux/dynamicons-core'

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

}
