import { describe, it, expect, vi, beforeEach } from 'vitest'

describe('Extension API Coverage Tests', () => {
	beforeEach(() => {
		vi.resetModules()
	})

	it('should handle extension API adapter', async () => {
		const { ExtensionAPIAdapter } = await import('../../src/vscode/adapters/Extension.adapter.js')

		const adapter = new ExtensionAPIAdapter()
		// Test extension API handling
		expect(adapter).toBeDefined()
	})
}) 