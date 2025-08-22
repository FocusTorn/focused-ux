import type { IContext } from '@fux/dynamicons-core'
import type { ExtensionContext } from 'vscode'

export class ContextAdapter implements IContext {
	constructor(private context: ExtensionContext) {}

	get extensionPath(): string {
		return this.context.extensionPath
	}

	get subscriptions(): any[] {
		return this.context.subscriptions
	}
} 