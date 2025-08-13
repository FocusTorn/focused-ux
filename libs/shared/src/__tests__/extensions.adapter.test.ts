import { describe, it, expect, vi } from 'vitest'

describe('ExtensionsAdapter', () => {
	it('returns vscode.extensions.all', async () => {
		vi.resetModules()

		const fake = [{ id: 'a' }, { id: 'b' }]

		vi.mock('vscode', () => ({ extensions: { all: fake } }))

		const { ExtensionsAdapter } = await import('../vscode/adapters/Extensions.adapter.js')
		const a = new ExtensionsAdapter()

		expect(a.all).toBe(fake)
	})
})
