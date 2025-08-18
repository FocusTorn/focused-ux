import { describe, it, expect, vi, beforeEach } from 'vitest'

describe('VSCode URI Factory Coverage Tests', () => {
	beforeEach(() => {
		vi.resetModules()
	})

	it('should handle VSCode URI factory adapter', async () => {
		const { VSCodeUriFactory } = await import('../../src/vscode/adapters/VSCodeUriFactory.js')

		const factory = new VSCodeUriFactory()
		// Test URI factory
		expect(factory).toBeDefined()
	})
}) 