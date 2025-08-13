import { describe, it, expect } from 'vitest'

describe('TextDocumentAdapter', () => {
	it('wraps uri, getText, positionAt, save', async () => {
		const doc = {
			uri: { fsPath: '/x', toString: () => 'file:///x', path: '/x', query: '', fragment: '' },
			getText: () => 'hello',
			positionAt: (_o: number) => ({ line: 1, character: 2 }),
			save: async () => undefined,
		}
		const { TextDocumentAdapter } = await import('../src/vscode/adapters/TextDocument.adapter.js')
		const a = new TextDocumentAdapter(doc as any)

		expect(a.uri.toString()).toContain('file:///')
		expect(a.getText()).toBe('hello')
		expect(a.positionAt(0).create(0, 0)).toEqual({ line: 1, character: 2 })
		await a.save()
	})
})
