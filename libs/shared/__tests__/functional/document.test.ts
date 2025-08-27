import { describe, it, expect, vi } from 'vitest'

// Mock vscode module to avoid slow real API calls
vi.mock('vscode', () => ({
	DocumentSymbol: vi.fn().mockImplementation((name, detail, kind, range, selectionRange, children) => ({
		name,
		detail,
		kind,
		range,
		selectionRange,
		children
	})),
	RelativePattern: vi.fn().mockImplementation((base, pattern) => ({
		base,
		pattern
	})),
	Position: vi.fn().mockImplementation((line, character) => ({
		line,
		character
	})),
	SymbolKind: {
		Function: 12
	}
}))

describe('Document Tests', () => {
	describe('DocumentSymbolAdapter', () => {
		it('wraps name, range and children; static map works', async () => {
			const { DocumentSymbolAdapter } = await import('../../src/vscode/adapters/DocumentSymbol.adapter.js')
			const vs: any = await import('vscode')

			const range = { start: { line: 1, character: 2 }, end: { line: 3, character: 4 } }
			const symbol = new vs.DocumentSymbol('test', 'detail', vs.SymbolKind.Function, range, range, [])

			const adapter = new DocumentSymbolAdapter(symbol)

			expect(adapter.name).toBe('test')
			expect(adapter.range).toBeDefined()
			expect(adapter.children).toEqual([])

			const mapped = DocumentSymbolAdapter.fromVSCodeSymbols([symbol])

			expect(mapped).toHaveLength(1)
			expect(mapped![0]).toBeInstanceOf(DocumentSymbolAdapter)
		})
	})

	describe('PositionAdapter', () => {
		it('should handle position operations', async () => {
			const { PositionAdapter } = await import('../../src/vscode/adapters/Position.adapter.js')

			const adapter = new PositionAdapter()

			expect(adapter.create).toBeDefined()
			expect(typeof adapter.create).toBe('function')
			
			const position = adapter.create(1, 2)

			expect(position).toBeDefined()
		})
	})

	describe('RelativePatternAdapter', () => {
		it('should handle relative pattern operations', async () => {
			const { RelativePatternAdapter } = await import('../../src/vscode/adapters/RelativePattern.adapter.js')
			const vs: any = await import('vscode')

			const pattern = new vs.RelativePattern('/base', '*.ts')
			const adapter = new RelativePatternAdapter(pattern)

			expect(adapter.base).toBe('/base')
			expect(adapter.pattern).toBe('*.ts')
		})
	})
})
