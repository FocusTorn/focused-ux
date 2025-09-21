import { describe, it, expect, vi } from 'vitest'

// Mock vscode module to avoid slow real API calls
vi.mock('vscode', () => ({
	ExtensionContext: vi.fn().mockImplementation(() => ({
		extensionUri: { fsPath: '/test/extension/path' },
	})),
	window: {
		activeTerminal: undefined,
		createTerminal: vi.fn().mockReturnValue({ name: 'test-terminal' }),
	},
}))

describe('Context Tests', () => {
	describe('ContextAdapter', () => {
		it('should handle context operations', async () => {
			const { ContextAdapter } = await import('../../src/vscode/adapters/Context.adapter.js')
			const vscode = await import('vscode')
			
			const context = new (vscode as any).ExtensionContext()
			const adapter = new ContextAdapter(context)

			expect(adapter).toBeDefined()
			expect(adapter.extensionPath).toBe('/test/extension/path')
		})
	})

	describe('TerminalAdapter', () => {
		it('should handle terminal operations', async () => {
			const { TerminalAdapter } = await import('../../src/vscode/adapters/Terminal.adapter.js')
			
			const adapter = new TerminalAdapter()

			expect(adapter).toBeDefined()
			expect(adapter.createTerminal).toBeDefined()
			expect(typeof adapter.createTerminal).toBe('function')
			
			// Test that createTerminal returns the mock terminal
			const result = adapter.createTerminal('test')

			expect(result).toEqual({ name: 'test-terminal' })
		})
	})
})
