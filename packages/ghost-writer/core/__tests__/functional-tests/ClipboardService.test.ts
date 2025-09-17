import { describe, it, expect, beforeEach } from 'vitest'
import { ClipboardService } from '../../src/services/Clipboard.service.js'
import type { IStorageService, StoredFragment } from '../../src/_interfaces/IClipboardService.js'

// Mock storage service
class MockStorageService implements IStorageService {

	private storage: Map<string, any> = new Map()

	async update(key: string, value: any): Promise<void> {
		this.storage.set(key, value)
	}

	async get<T>(key: string): Promise<T | undefined> {
		return this.storage.get(key)
	}

}

describe('ClipboardService', () => {
	let clipboardService: ClipboardService
	let mockStorage: MockStorageService

	beforeEach(() => {
		mockStorage = new MockStorageService()
		clipboardService = new ClipboardService(mockStorage)
	})

	describe('store', () => {
		it('should store a code fragment', async () => {
			const fragment: StoredFragment = {
				text: 'MyComponent',
				sourceFilePath: '/path/to/component.ts',
			}

			await clipboardService.store(fragment)

			const stored = await mockStorage.get<StoredFragment>('fux-ghost-writer.clipboard')

			expect(stored).toEqual(fragment)
		})

		it('should overwrite existing fragment', async () => {
			const fragment1: StoredFragment = {
				text: 'OldComponent',
				sourceFilePath: '/path/to/old.ts',
			}
			const fragment2: StoredFragment = {
				text: 'NewComponent',
				sourceFilePath: '/path/to/new.ts',
			}

			await clipboardService.store(fragment1)
			await clipboardService.store(fragment2)

			const stored = await mockStorage.get<StoredFragment>('fux-ghost-writer.clipboard')

			expect(stored).toEqual(fragment2)
		})
	})

	describe('retrieve', () => {
		it('should retrieve stored fragment', async () => {
			const fragment: StoredFragment = {
				text: 'MyComponent',
				sourceFilePath: '/path/to/component.ts',
			}

			await mockStorage.update('fux-ghost-writer.clipboard', fragment)

			const retrieved = await clipboardService.retrieve()

			expect(retrieved).toEqual(fragment)
		})

		it('should return undefined when no fragment stored', async () => {
			const retrieved = await clipboardService.retrieve()

			expect(retrieved).toBeUndefined()
		})
	})

	describe('clear', () => {
		it('should clear stored fragment', async () => {
			const fragment: StoredFragment = {
				text: 'MyComponent',
				sourceFilePath: '/path/to/component.ts',
			}

			await clipboardService.store(fragment)
			await clipboardService.clear()

			const retrieved = await clipboardService.retrieve()

			expect(retrieved).toBeUndefined()
		})

		it('should handle clearing when no fragment exists', async () => {
			await expect(clipboardService.clear()).resolves.not.toThrow()
		})
	})

	describe('integration', () => {
		it('should handle complete store-retrieve-clear cycle', async () => {
			const fragment: StoredFragment = {
				text: 'TestComponent',
				sourceFilePath: '/test/path.ts',
			}

			// Store
			await clipboardService.store(fragment)

			let retrieved = await clipboardService.retrieve()

			expect(retrieved).toEqual(fragment)

			// Clear
			await clipboardService.clear()
			retrieved = await clipboardService.retrieve()
			expect(retrieved).toBeUndefined()

			// Store again
			await clipboardService.store(fragment)
			retrieved = await clipboardService.retrieve()
			expect(retrieved).toEqual(fragment)
		})
	})
})
