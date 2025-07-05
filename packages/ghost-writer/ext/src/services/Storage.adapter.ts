import type { ExtensionContext } from 'vscode'
import type { IStorageService } from '@fux/ghost-writer-core'

export class StorageAdapter implements IStorageService {

	private readonly context: ExtensionContext

	constructor(deps: { extensionContext: ExtensionContext }) {
		this.context = deps.extensionContext
	}

	async update(key: string, value: any): Promise<void> {
		await this.context.globalState.update(key, value)
	}

	async get<T>(key: string): Promise<T | undefined> {
		return this.context.globalState.get<T>(key)
	}

}
