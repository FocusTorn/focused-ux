import type { IContext } from '@fux/dynamicons-core'
import type { ExtensionContext } from 'vscode'

export class ContextAdapter implements IContext {

	constructor(private readonly context: ExtensionContext) {}

	get extensionPath(): string {
		return this.context.extensionPath
	}

	get subscriptions(): { dispose: () => any }[] {
		return this.context.subscriptions
	}

}
