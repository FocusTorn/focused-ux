import type * as vscode from 'vscode'
import type { IContext } from '../../_interfaces/IVSCode.js'

export class ContextAdapter implements IContext {

	constructor(private context: vscode.ExtensionContext) {}

	get extensionPath(): string {
		return this.context.extensionUri.fsPath
	}

}
