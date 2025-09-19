import { describe, it, expect, beforeEach, vi } from 'vitest'
import { StorageAdapter } from '../../src/adapters/Storage.adapter'
import { createMockStorageContext } from '../__mocks__/helpers'
import * as vscode from 'vscode'

describe('StorageAdapter Edge Cases', () => {
	let adapter: StorageAdapter
	let mockContext: any

	beforeEach(() => {
		vi.clearAllMocks()
		adapter = new StorageAdapter()
		mockContext = createMockStorageContext()
	})

	describe('Error Handling', () => {
		it('should handle null context gracefully', async () => {
			// Arrange
			const key = 'test-key'
			const value = 'test-value'

			// Act & Assert
			await expect(adapter.update(key, value)).rejects.toThrow('StorageAdapter context not set')
			await expect(adapter.get(key)).rejects.toThrow('StorageAdapter context not set')
		})

		it('should handle undefined context gracefully', async () => {
			// Arrange
			adapter.setContext(undefined as any)
			const key = 'test-key'
			const value = 'test-value'

			// Act & Assert
			await expect(adapter.update(key, value)).rejects.toThrow('StorageAdapter context not set')
			await expect(adapter.get(key)).rejects.toThrow('StorageAdapter context not set')
		})

		it('should handle context with null globalState', async () => {
			// Arrange
			adapter.setContext({ globalState: null } as any)
			const key = 'test-key'
			const value = 'test-value'

			// Act & Assert
			await expect(adapter.update(key, value)).rejects.toThrow()
			await expect(adapter.get(key)).rejects.toThrow()
		})

		it('should handle context with undefined globalState', async () => {
			// Arrange
			adapter.setContext({ globalState: undefined } as any)
			const key = 'test-key'
			const value = 'test-value'

			// Act & Assert
			await expect(adapter.update(key, value)).rejects.toThrow()
			await expect(adapter.get(key)).rejects.toThrow()
		})
	})

	describe('Storage Operations Edge Cases', () => {
		beforeEach(() => {
			adapter.setContext(mockContext)
		})

		it('should handle empty key', async () => {
			// Arrange
			const key = ''
			const value = 'test-value'

			// Act
			await adapter.update(key, value)

			// Assert
			expect(mockContext.globalState.update).toHaveBeenCalledWith(key, value)
		})

		it('should handle null value', async () => {
			// Arrange
			const key = 'test-key'
			const value = null

			// Act
			await adapter.update(key, value)

			// Assert
			expect(mockContext.globalState.update).toHaveBeenCalledWith(key, value)
		})

		it('should handle undefined value', async () => {
			// Arrange
			const key = 'test-key'
			const value = undefined

			// Act
			await adapter.update(key, value)

			// Assert
			expect(mockContext.globalState.update).toHaveBeenCalledWith(key, value)
		})

		it('should handle complex object values', async () => {
			// Arrange
			const key = 'test-key'
			const value = {
				nested: {
					array: [1, 2, 3],
					string: 'test',
					boolean: true,
					null: null,
					undefined: undefined
				}
			}

			// Act
			await adapter.update(key, value)

			// Assert
			expect(mockContext.globalState.update).toHaveBeenCalledWith(key, value)
		})

		it('should handle very large values', async () => {
			// Arrange
			const key = 'test-key'
			const value = 'x'.repeat(1000000) // 1MB string

			// Act
			await adapter.update(key, value)

			// Assert
			expect(mockContext.globalState.update).toHaveBeenCalledWith(key, value)
		})

		it('should handle special characters in key', async () => {
			// Arrange
			const key = 'test-key-with-special-chars!@#$%^&*()'
			const value = 'test-value'

			// Act
			await adapter.update(key, value)

			// Assert
			expect(mockContext.globalState.update).toHaveBeenCalledWith(key, value)
		})

		it('should handle Unicode characters in key and value', async () => {
			// Arrange
			const key = 'test-key-中文-🚀'
			const value = 'test-value-中文-🚀'

			// Act
			await adapter.update(key, value)

			// Assert
			expect(mockContext.globalState.update).toHaveBeenCalledWith(key, value)
		})
	})

	describe('Retrieval Edge Cases', () => {
		beforeEach(() => {
			adapter.setContext(mockContext)
		})

		it('should handle empty key retrieval', async () => {
			// Arrange
			const key = ''
			const expectedValue = 'test-value'
			mockContext.globalState.get.mockResolvedValue(expectedValue)

			// Act
			const result = await adapter.get<string>(key)

			// Assert
			expect(mockContext.globalState.get).toHaveBeenCalledWith(key)
			expect(result).toBe(expectedValue)
		})

		it('should handle null return value', async () => {
			// Arrange
			const key = 'test-key'
			mockContext.globalState.get.mockResolvedValue(null)

			// Act
			const result = await adapter.get<string>(key)

			// Assert
			expect(result).toBeNull()
		})

		it('should handle undefined return value', async () => {
			// Arrange
			const key = 'test-key'
			mockContext.globalState.get.mockResolvedValue(undefined)

			// Act
			const result = await adapter.get<string>(key)

			// Assert
			expect(result).toBeUndefined()
		})

		it('should handle complex object retrieval', async () => {
			// Arrange
			const key = 'test-key'
			const expectedValue = {
				nested: {
					array: [1, 2, 3],
					string: 'test',
					boolean: true
				}
			}
			mockContext.globalState.get.mockResolvedValue(expectedValue)

			// Act
			const result = await adapter.get<typeof expectedValue>(key)

			// Assert
			expect(result).toEqual(expectedValue)
		})
	})

	describe('Concurrent Operations', () => {
		beforeEach(() => {
			adapter.setContext(mockContext)
		})

		it('should handle concurrent updates', async () => {
			// Arrange
			const operations = Array.from({ length: 10 }, (_, i) => ({
				key: `key-${i}`,
				value: `value-${i}`
			}))

			// Act
			const promises = operations.map(op => adapter.update(op.key, op.value))
			await Promise.all(promises)

			// Assert
			expect(mockContext.globalState.update).toHaveBeenCalledTimes(10)
			operations.forEach(op => {
				expect(mockContext.globalState.update).toHaveBeenCalledWith(op.key, op.value)
			})
		})

		it('should handle concurrent retrievals', async () => {
			// Arrange
			const keys = Array.from({ length: 10 }, (_, i) => `key-${i}`)
			mockContext.globalState.get.mockResolvedValue('test-value')

			// Act
			const promises = keys.map(key => adapter.get<string>(key))
			const results = await Promise.all(promises)

			// Assert
			expect(mockContext.globalState.get).toHaveBeenCalledTimes(10)
			expect(results).toHaveLength(10)
			results.forEach(result => {
				expect(result).toBe('test-value')
			})
		})

		it('should handle mixed concurrent operations', async () => {
			// Arrange
			const updateOps = Array.from({ length: 5 }, (_, i) => ({
				key: `update-key-${i}`,
				value: `update-value-${i}`
			}))
			const getKeys = Array.from({ length: 5 }, (_, i) => `get-key-${i}`)
			mockContext.globalState.get.mockResolvedValue('test-value')

			// Act
			const updatePromises = updateOps.map(op => adapter.update(op.key, op.value))
			const getPromises = getKeys.map(key => adapter.get<string>(key))
			await Promise.all([...updatePromises, ...getPromises])

			// Assert
			expect(mockContext.globalState.update).toHaveBeenCalledTimes(5)
			expect(mockContext.globalState.get).toHaveBeenCalledTimes(5)
		})
	})

	describe('Performance Scenarios', () => {
		beforeEach(() => {
			adapter.setContext(mockContext)
		})

		it('should handle rapid sequential operations', async () => {
			// Arrange
			const operations = Array.from({ length: 100 }, (_, i) => ({
				key: `key-${i}`,
				value: `value-${i}`
			}))

			// Act
			for (const op of operations) {
				await adapter.update(op.key, op.value)
			}

			// Assert
			expect(mockContext.globalState.update).toHaveBeenCalledTimes(100)
		})

		it('should handle large number of keys', async () => {
			// Arrange
			const keyCount = 1000
			const keys = Array.from({ length: keyCount }, (_, i) => `key-${i}`)
			mockContext.globalState.get.mockResolvedValue('test-value')

			// Act
			const results = await Promise.all(keys.map(key => adapter.get<string>(key)))

			// Assert
			expect(results).toHaveLength(keyCount)
			expect(mockContext.globalState.get).toHaveBeenCalledTimes(keyCount)
		})
	})

	describe('Integration Scenarios', () => {
		beforeEach(() => {
			adapter.setContext(mockContext)
		})

		it('should handle complete storage lifecycle', async () => {
			// Arrange
			const key = 'lifecycle-key'
			const value = 'lifecycle-value'

			// Act - Store
			await adapter.update(key, value)

			// Act - Retrieve
			mockContext.globalState.get.mockResolvedValue(value)
			const retrieved = await adapter.get<string>(key)

			// Act - Update
			const newValue = 'updated-value'
			await adapter.update(key, newValue)

			// Act - Clear (set to undefined)
			await adapter.update(key, undefined)

			// Assert
			expect(mockContext.globalState.update).toHaveBeenCalledTimes(3)
			expect(mockContext.globalState.get).toHaveBeenCalledWith(key)
			expect(retrieved).toBe(value)
		})

		it('should handle storage with different value types', async () => {
			// Arrange
			const testCases = [
				{ key: 'string', value: 'test-string' },
				{ key: 'number', value: 42 },
				{ key: 'boolean', value: true },
				{ key: 'null', value: null },
				{ key: 'undefined', value: undefined },
				{ key: 'array', value: [1, 2, 3] },
				{ key: 'object', value: { nested: 'value' } }
			]

			// Act & Assert
			for (const testCase of testCases) {
				await adapter.update(testCase.key, testCase.value)
				expect(mockContext.globalState.update).toHaveBeenCalledWith(testCase.key, testCase.value)
			}
		})
	})
})

