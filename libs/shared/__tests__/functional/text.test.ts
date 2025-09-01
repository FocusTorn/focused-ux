import { describe, it, expect, vi } from 'vitest'

describe('Text Comprehensive Tests', () => {
	describe('TextEditorAdapter', () => {
		it('edit uses EditBuilderAdapter and replaces text with converted range', async () => {
			vi.resetModules()
			vi.mock('vscode', () => ({
				Range: class Range { constructor(public start: any, public end: any) {} },
			}))

			const replaceSpy = vi.fn()
			const editor = { edit: (fn: any) => { fn({ replace: replaceSpy }); return Promise.resolve(true) } }
            
			// const { TextEditorAdapter, EditBuilderAdapter } = await import('../../src/vscode/adapters/TextEditor.adapter.js')
			const { TextEditorAdapter } = await import('../../src/vscode/adapters/TextEditor.adapter.js')
            
			// const { RangeAdapter } = await import('../../src/vscode/adapters/Range.adapter.js')
            
			const vs: any = await import('vscode')

			const start = { create: () => ({ line: 1, character: 2 }) }
			const end = { create: () => ({ line: 3, character: 4 }) }
			const range = { start, end } as any

			const a = new TextEditorAdapter(editor as any)

			await a.edit((eb) => {
				(eb as any).replace(range, 'x')
			})

			expect(replaceSpy).toHaveBeenCalled()

			const [r, text] = replaceSpy.mock.calls[0]

			expect(r).toBeInstanceOf(vs.Range)
			expect(text).toBe('x')
		})
	})

	describe('TextDocumentAdapter', () => {
		it('wraps uri, getText, positionAt, save', async () => {
			const doc = {
				uri: { fsPath: '/x', toString: () => 'file:///x', path: '/x', query: '', fragment: '' },
				getText: () => 'hello',
				positionAt: (_o: number) => ({ line: 1, character: 2 }),
				save: async () => undefined,
			}
			const { TextDocumentAdapter } = await import('../../src/vscode/adapters/TextDocument.adapter.js')
			const a = new TextDocumentAdapter(doc as any)

			expect(a.uri.toString()).toContain('file:///')
			expect(a.getText()).toBe('hello')
			expect(a.positionAt(0).create(0, 0)).toEqual({ line: 1, character: 2 })
			await a.save()
		})
	})
})
