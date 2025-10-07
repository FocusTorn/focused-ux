import { describe, it, expect, beforeEach, vi } from 'vitest'
import { ExtensionContextAdapter } from '../../src/adapters/ExtensionContext.adapter.js'
import type { IExtensionContext } from '@fux/note-hub-core'

describe('ExtensionContextAdapter', () => {
	let mockVSCodeContext: any
	let adapter: IExtensionContext

	beforeEach(() => {
		vi.clearAllMocks()
        
		// Create a mock VSCode ExtensionContext
		mockVSCodeContext = {
			subscriptions: [
				{ dispose: vi.fn() },
				{ dispose: vi.fn() },
			],
			globalState: {
				get: vi.fn().mockReturnValue('global-value'),
				update: vi.fn().mockResolvedValue(undefined),
			},
			workspaceState: {
				get: vi.fn().mockReturnValue('workspace-value'),
				update: vi.fn().mockResolvedValue(undefined),
			},
		}

		adapter = new ExtensionContextAdapter(mockVSCodeContext)
	})

	describe('subscriptions', () => {
		it('should expose subscriptions from VSCode context', () => {
			expect(adapter.subscriptions).toBe(mockVSCodeContext.subscriptions)
			expect(adapter.subscriptions).toHaveLength(2)
		})

		it('should allow adding new subscriptions', () => {
			const newSubscription = { dispose: vi.fn() }
            
			adapter.subscriptions.push(newSubscription)
            
			expect(adapter.subscriptions).toHaveLength(3)
			expect(adapter.subscriptions[2]).toBe(newSubscription)
		})
	})

	describe('globalState', () => {
		it('should get value from global state', () => {
			const key = 'test-key'
			const defaultValue = 'default-value'

			const result = adapter.globalState.get(key, defaultValue)

			expect(mockVSCodeContext.globalState.get).toHaveBeenCalledWith(key, defaultValue)
			expect(result).toBe('global-value')
		})

		it('should get value without default', () => {
			const key = 'test-key'

			const result = adapter.globalState.get(key)

			expect(mockVSCodeContext.globalState.get).toHaveBeenCalledWith(key, undefined)
			expect(result).toBe('global-value')
		})

		it('should handle undefined values from global state', () => {
			const key = 'test-key'

			mockVSCodeContext.globalState.get.mockReturnValueOnce(undefined)

			const result = adapter.globalState.get(key)

			expect(result).toBeUndefined()
		})

		it('should update global state', async () => {
			const key = 'test-key'
			const value = { data: 'test-data' }

			await adapter.globalState.update(key, value)

			expect(mockVSCodeContext.globalState.update).toHaveBeenCalledWith(key, value)
		})

		it('should handle global state update errors', async () => {
			const key = 'test-key'
			const value = 'test-value'
			const error = new Error('Update failed')
            
			mockVSCodeContext.globalState.update.mockRejectedValueOnce(error)

			await expect(adapter.globalState.update(key, value)).rejects.toThrow('Update failed')
			expect(mockVSCodeContext.globalState.update).toHaveBeenCalledWith(key, value)
		})
	})

	describe('workspaceState', () => {
		it('should get value from workspace state', () => {
			const key = 'test-key'
			const defaultValue = 'default-value'

			const result = adapter.workspaceState.get(key, defaultValue)

			expect(mockVSCodeContext.workspaceState.get).toHaveBeenCalledWith(key, defaultValue)
			expect(result).toBe('workspace-value')
		})

		it('should get value without default', () => {
			const key = 'test-key'

			const result = adapter.workspaceState.get(key)

			expect(mockVSCodeContext.workspaceState.get).toHaveBeenCalledWith(key, undefined)
			expect(result).toBe('workspace-value')
		})

		it('should handle undefined values from workspace state', () => {
			const key = 'test-key'

			mockVSCodeContext.workspaceState.get.mockReturnValueOnce(undefined)

			const result = adapter.workspaceState.get(key)

			expect(result).toBeUndefined()
		})

		it('should update workspace state', async () => {
			const key = 'test-key'
			const value = { data: 'test-data' }

			await adapter.workspaceState.update(key, value)

			expect(mockVSCodeContext.workspaceState.update).toHaveBeenCalledWith(key, value)
		})

		it('should handle workspace state update errors', async () => {
			const key = 'test-key'
			const value = 'test-value'
			const error = new Error('Update failed')
            
			mockVSCodeContext.workspaceState.update.mockRejectedValueOnce(error)

			await expect(adapter.workspaceState.update(key, value)).rejects.toThrow('Update failed')
			expect(mockVSCodeContext.workspaceState.update).toHaveBeenCalledWith(key, value)
		})
	})

	describe('type safety', () => {
		it('should handle different value types in global state', () => {
			const stringKey = 'string-key'
			const numberKey = 'number-key'
			const objectKey = 'object-key'
			const arrayKey = 'array-key'

			mockVSCodeContext.globalState.get
				.mockReturnValueOnce('string-value')
				.mockReturnValueOnce(42)
				.mockReturnValueOnce({ key: 'value' })
				.mockReturnValueOnce([1, 2, 3])

			const stringResult = adapter.globalState.get(stringKey)
			const numberResult = adapter.globalState.get(numberKey)
			const objectResult = adapter.globalState.get(objectKey)
			const arrayResult = adapter.globalState.get(arrayKey)

			expect(stringResult).toBe('string-value')
			expect(numberResult).toBe(42)
			expect(objectResult).toEqual({ key: 'value' })
			expect(arrayResult).toEqual([1, 2, 3])
		})

		it('should handle different value types in workspace state', () => {
			const stringKey = 'string-key'
			const numberKey = 'number-key'
			const objectKey = 'object-key'
			const arrayKey = 'array-key'

			mockVSCodeContext.workspaceState.get
				.mockReturnValueOnce('string-value')
				.mockReturnValueOnce(42)
				.mockReturnValueOnce({ key: 'value' })
				.mockReturnValueOnce([1, 2, 3])

			const stringResult = adapter.workspaceState.get(stringKey)
			const numberResult = adapter.workspaceState.get(numberKey)
			const objectResult = adapter.workspaceState.get(objectKey)
			const arrayResult = adapter.workspaceState.get(arrayKey)

			expect(stringResult).toBe('string-value')
			expect(numberResult).toBe(42)
			expect(objectResult).toEqual({ key: 'value' })
			expect(arrayResult).toEqual([1, 2, 3])
		})
	})

	describe('integration scenarios', () => {
		it('should handle complete state management workflow', async () => {
			const globalKey = 'global-setting'
			const workspaceKey = 'workspace-setting'
			const globalValue = { theme: 'dark', autoSave: true }
			const workspaceValue = { projectPath: '/test/project' }

			// Get initial values
			mockVSCodeContext.globalState.get.mockReturnValueOnce(globalValue)
			mockVSCodeContext.workspaceState.get.mockReturnValueOnce(workspaceValue)

			const initialGlobal = adapter.globalState.get(globalKey)
			const initialWorkspace = adapter.workspaceState.get(workspaceKey)

			// Update values
			const newGlobalValue = { theme: 'light', autoSave: false }
			const newWorkspaceValue = { projectPath: '/new/project' }

			await adapter.globalState.update(globalKey, newGlobalValue)
			await adapter.workspaceState.update(workspaceKey, newWorkspaceValue)

			expect(initialGlobal).toEqual(globalValue)
			expect(initialWorkspace).toEqual(workspaceValue)
			expect(mockVSCodeContext.globalState.update).toHaveBeenCalledWith(globalKey, newGlobalValue)
			expect(mockVSCodeContext.workspaceState.update).toHaveBeenCalledWith(workspaceKey, newWorkspaceValue)
		})

		it('should handle subscription management workflow', () => {
			const subscription1 = { dispose: vi.fn() }
			const subscription2 = { dispose: vi.fn() }

			// Add subscriptions
			adapter.subscriptions.push(subscription1)
			adapter.subscriptions.push(subscription2)

			expect(adapter.subscriptions).toHaveLength(4) // 2 original + 2 new

			// Dispose subscriptions
			subscription1.dispose()
			subscription2.dispose()

			expect(subscription1.dispose).toHaveBeenCalled()
			expect(subscription2.dispose).toHaveBeenCalled()
		})

		it('should handle error recovery in state operations', async () => {
			const key = 'error-key'
			const value = 'error-value'
			const error = new Error('State operation failed')

			// Mock failed update
			mockVSCodeContext.globalState.update.mockRejectedValueOnce(error)

			// Attempt update and handle error
			try {
				await adapter.globalState.update(key, value)
			}
			catch (err) {
				expect(err).toBe(error)
			}

			expect(mockVSCodeContext.globalState.update).toHaveBeenCalledWith(key, value)
		})
	})
})
