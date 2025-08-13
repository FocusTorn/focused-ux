import { describe, it, expect } from 'vitest'

describe('ContextAdapter', () => {
	it('exposes extensionPath from provided context', async () => {
		const ctx = { extensionUri: { fsPath: 'D:/ext/path' } } as any
		const { ContextAdapter } = await import('../vscode/adapters/Context.adapter.js')
		const a = new ContextAdapter(ctx)

		expect(a.extensionPath).toBe('D:/ext/path')
	})
})
