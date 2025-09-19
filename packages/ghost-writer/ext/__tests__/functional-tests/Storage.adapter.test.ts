import { describe, it, expect, beforeEach, vi } from 'vitest'
import { StorageAdapter } from '../../src/adapters/Storage.adapter'
import { createMockStorageContext } from '../__mocks__/helpers'
import * as vscode from 'vscode'

describe('StorageAdapter', () => {
	let adapter: StorageAdapter
	let mockContext: any

	beforeEach(() => {
		vi.clearAllMocks()
		adapter = new StorageAdapter()
		mockContext = createMockStorageContext()
	})

	describe('setContext', () => {
		it('should set the context', () => {
			// Act
			adapter.setContext(mockContext)

			// Assert
			expect(adapter).toBeDefined()
		})
	})

	describe('update', () => {
		it('should update global state', async () => {
			// Arrange
			adapter.setContext(mockContext)
			const key = 'test-key'
			const value = 'test-value'

			// Act
			await adapter.update(key, value)

			// Assert
			expect(mockContext.globalState.update).toHaveBeenCalledWith(key, value)
		})

		it('should throw error when context not set', async () => {
			// Arrange
			const key = 'test-key'
			const value = 'test-value'

			// Act & Assert
			await expect(adapter.update(key, value)).rejects.toThrow('StorageAdapter context not set')
		})
	})

	describe('get', () => {
		it('should get value from global state', async () => {
			// Arrange
			adapter.setContext(mockContext)
			const key = 'test-key'
			const expectedValue = 'test-value'

			mockContext.globalState.get.mockResolvedValue(expectedValue)

			// Act
			const result = await adapter.get<string>(key)

			// Assert
			expect(mockContext.globalState.get).toHaveBeenCalledWith(key)
			expect(result).toBe(expectedValue)
		})

		it('should throw error when context not set', async () => {
			// Arrange
			const key = 'test-key'

			// Act & Assert
			await expect(adapter.get(key)).rejects.toThrow('StorageAdapter context not set')
		})
	})
})
