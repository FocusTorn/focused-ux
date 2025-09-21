import { describe, it, expect, vi, beforeEach } from 'vitest'

describe('Common Utils Coverage Tests', () => {
	beforeEach(() => {
		vi.resetModules()
	})

	it('should handle common utils adapter', async () => {
		const { CommonUtilsAdapter } = await import('../../src/vscode/adapters/CommonUtils.adapter.js')

		const mockWindow = { showErrorMessage: vi.fn() }
		const adapter = new CommonUtilsAdapter(mockWindow)
		// Test common utils
		expect(adapter).toBeDefined()
	})
}) 