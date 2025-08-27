import type { ExtensionContext } from 'vscode'
import type { IExtensionContext } from '@fux/note-hub-core'

export class ExtensionContextAdapter implements IExtensionContext {

	constructor(private context: ExtensionContext) {}

	get subscriptions() {
		return this.context.subscriptions
	}

	get globalState() {
		return {
			get: <T>(key: string, defaultValue?: T): T => {
				const value = this.context.globalState.get(key, defaultValue)

				return value as T
			},
			update: async (key: string, value: any): Promise<void> => {
				await this.context.globalState.update(key, value)
			},
		}
	}

	get workspaceState() {
		return {
			get: <T>(key: string, defaultValue?: T): T => {
				const value = this.context.workspaceState.get(key, defaultValue)

				return value as T
			},
			update: async (key: string, value: any): Promise<void> => {
				await this.context.workspaceState.update(key, value)
			},
		}
	}

}
