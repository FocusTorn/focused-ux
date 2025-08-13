import { describe, it, expect, vi } from 'vitest'

describe('ExtensionsAdapter', () => {
	it('returns vscode.extensions.all', async () => {
		vi.resetModules()
        vi.mock('vscode', () => ({ extensions: { all: [{ id: 'a' }, { id: 'b' }] } }))

		const { ExtensionsAdapter } = await import('../vscode/adapters/Extensions.adapter.js')
		const a = new ExtensionsAdapter()
        const vs: any = await import('vscode')
        expect(a.all).toBe(vs.extensions.all)
	})
})
