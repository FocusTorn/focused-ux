import { describe, it, expect, vi, beforeAll, afterAll } from 'vitest'

describe('Utilities Tests', () => {
	describe('showTimedInformationMessage', () => {
		// Use fake timers only for this specific test suite that uses timers
		beforeAll(() => {
			vi.useFakeTimers()
		})

		afterAll(() => {
			vi.useRealTimers()
		})

		it('should show timed information message', async () => {
			const { showTimedInformationMessage } = await import('../../src/utils/showTimedInformationMessage.js')
			
			const mockWindow = {
				withProgress: vi.fn().mockImplementation(async (options, task) => {
					return await task({ report: vi.fn() })
				}),
			}

			const promise = showTimedInformationMessage(mockWindow, 'test message', 1000)
			
			// Fast-forward timers to complete the async operation
			vi.runAllTimers()
			
			await promise

			expect(mockWindow.withProgress).toHaveBeenCalledWith(
				{ title: 'test message', cancellable: false },
				expect.any(Function),
			)
		})
	})

	describe('CommonUtilsAdapter', () => {
		it('should handle common utility functions', async () => {
			const { CommonUtilsAdapter } = await import('../../src/vscode/adapters/CommonUtils.adapter.js')
			const mockWindow = { showErrorMessage: vi.fn() }
			const adapter = new CommonUtilsAdapter(mockWindow)

			expect(adapter).toBeDefined()
		})

		it('should handle utility operations', async () => {
			const { CommonUtilsAdapter } = await import('../../src/vscode/adapters/CommonUtils.adapter.js')
			const mockWindow = { showErrorMessage: vi.fn() }
			const adapter = new CommonUtilsAdapter(mockWindow)

			// Test utility operations
			expect(adapter).toBeDefined()
		})
	})
})
