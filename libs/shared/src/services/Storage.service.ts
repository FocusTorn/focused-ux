import type { IStorageService } from '../_interfaces/IStorageService.js'

export class StorageService implements IStorageService {

	private storage = new Map<string, any>()

	async update(key: string, value: any): Promise<void> {
		this.storage.set(key, value)
	}

	async get<T>(key: string): Promise<T | undefined> {
		return this.storage.get(key)
	}

}
