import * as vscode from 'vscode'
import type { IWindow } from '../_interfaces/IWindow.js'

export class WindowAdapter implements IWindow {

	async showInformationMessage(message: string, ...args: (string | boolean)[]): Promise<string | undefined> {
		if (args.length === 0) {
			return vscode.window.showInformationMessage(message)
		}
		// Handle the case where first arg might be a boolean (modal)
		if (typeof args[0] === 'boolean') {
			const modal = args[0]
			const items = args.slice(1) as string[]

			return vscode.window.showInformationMessage(message, { modal }, ...items)
		}
		// All args are strings (actions)
		return vscode.window.showInformationMessage(message, ...(args as string[]))
	}

	async showWarningMessage(message: string, ...args: (string | boolean)[]): Promise<string | undefined> {
		if (args.length === 0) {
			return vscode.window.showWarningMessage(message)
		}
		// Handle the case where first arg might be a boolean (modal)
		if (typeof args[0] === 'boolean') {
			const modal = args[0]
			const items = args.slice(1) as string[]

			return vscode.window.showWarningMessage(message, { modal }, ...items)
		}
		// All args are strings (actions)
		return vscode.window.showWarningMessage(message, ...(args as string[]))
	}

	async showErrorMessage(message: string, ...args: (string | boolean)[]): Promise<string | undefined> {
		if (args.length === 0) {
			return vscode.window.showErrorMessage(message)
		}
		// Handle the case where first arg might be a boolean (modal)
		if (typeof args[0] === 'boolean') {
			const modal = args[0]
			const items = args.slice(1) as string[]

			return vscode.window.showErrorMessage(message, { modal }, ...items)
		}
		// All args are strings (actions)
		return vscode.window.showErrorMessage(message, ...(args as string[]))
	}

	async showInputBox(options?: {
		prompt?: string
		placeHolder?: string
		value?: string
		password?: boolean
	}): Promise<string | undefined> {
		return vscode.window.showInputBox(options)
	}

	async showTextDocument(document: any, options?: any): Promise<any> {
		if (options) {
			return vscode.window.showTextDocument(document, options)
		}
		return vscode.window.showTextDocument(document)
	}

	async withProgress<R>(options: any, task: (progress: any, token: any) => Promise<R>): Promise<R> {
		return vscode.window.withProgress(options, task)
	}

	registerTreeDataProvider(viewId: string, provider: any): { dispose: () => void } {
		return vscode.window.registerTreeDataProvider(viewId, provider)
	}

}
