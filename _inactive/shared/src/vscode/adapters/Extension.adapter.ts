import * as vscode from 'vscode'
import type { IExtensionContext, IExtensionAPI } from '../../_interfaces/IVSCode.js'

export class ExtensionContextAdapter implements IExtensionContext {

	constructor(private context: vscode.ExtensionContext) {}

	get subscriptions() {
		return this.context.subscriptions
	}

}

export class ExtensionAPIAdapter implements IExtensionAPI {

	registerTreeDataProvider(provider: any): any {
		return vscode.window.registerTreeDataProvider('contextCherryPicker', provider)
	}

	registerWebviewViewProvider(id: string, provider: any): any {
		return vscode.window.registerWebviewViewProvider(id, provider)
	}

	registerCommand(command: string, callback: (...args: any[]) => any): any {
		return vscode.commands.registerCommand(command, callback)
	}

	createTreeView(id: string, options: any): any {
		return vscode.window.createTreeView(id, options)
	}

	async executeCommand(command: string, ...args: any[]): Promise<any> {
		return await vscode.commands.executeCommand(command, ...args)
	}

}
