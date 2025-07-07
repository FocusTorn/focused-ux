import type { IContext } from '@fux/context-cherry-picker-core'
import type { ExtensionContext } from 'vscode'

export class ContextAdapter implements IContext {

	constructor(private readonly context: ExtensionContext) {}

	get globalStorageUri(): string {
		return this.context.globalStorageUri.fsPath
	}

	get extensionUri(): string {
		return this.context.extensionUri.fsPath
	}

	get subscriptions(): { dispose: () => any }[] {
		return this.context.subscriptions
	}

}
