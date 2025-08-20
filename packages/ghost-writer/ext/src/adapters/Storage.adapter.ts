import type { ExtensionContext } from 'vscode'
import type { IStorageService } from '@fux/ghost-writer-core'

export class StorageAdapter implements IStorageService {
  constructor(private readonly context: ExtensionContext) {}

  async update(key: string, value: any): Promise<void> {
    await this.context.globalState.update(key, value)
  }

  async get<T>(key: string): Promise<T | undefined> {
    return this.context.globalState.get<T>(key)
  }
} 