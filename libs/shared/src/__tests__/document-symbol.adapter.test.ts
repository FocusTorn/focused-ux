import { describe, it, expect } from 'vitest'

describe('DocumentSymbolAdapter', () => {
	it('wraps name, range and children; static map works', async () => {
		const start = { line: 1, character: 2 } as any
		const end = { line: 3, character: 4 } as any
		const range = { start, end } as any
		const child = { name: 'child', range, children: [] } as any
		const sym = { name: 'root', range, children: [child] } as any

		const { DocumentSymbolAdapter } = await import('../vscode/adapters/DocumentSymbol.adapter.js')
		const a = new DocumentSymbolAdapter(sym as any)

		expect(a.name).toBe('root')
		expect(a.range.start.create(0, 0)).toEqual(start)
		expect(a.range.end.create(0, 0)).toEqual(end)
		expect(a.children?.[0]?.name).toBe('child')

		const mapped = DocumentSymbolAdapter.fromVSCodeSymbols([sym])!

		expect(mapped[0].name).toBe('root')
	})
})
