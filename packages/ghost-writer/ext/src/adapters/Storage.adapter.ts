import * as vscode from 'vscode'
import type { IStorageAdapter } from '@fux/ghost-writer-core'

export class StorageAdapter implements IStorageAdapter {
	private context: vscode.ExtensionContext | undefined

	setContext(context: vscode.ExtensionContext): void {
		this.context = context
	}

	async update(key: string, value: any): Promise<void> {
		if (!this.context) {
			throw new Error('StorageAdapter context not set')
		}
		await this.context.globalState.update(key, value)
	}

	async get<T>(key: string): Promise<T | undefined> {
		if (!this.context) {
			throw new Error('StorageAdapter context not set')
		}
		return this.context.globalState.get<T>(key)
	}

}
