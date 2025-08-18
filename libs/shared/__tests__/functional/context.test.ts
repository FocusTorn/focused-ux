import { describe, it, expect, vi } from 'vitest'

describe('Context Tests', () => {
	describe('ContextAdapter', () => {
		it('should handle context operations', async () => {
			const { ContextAdapter } = await import('../../src/vscode/adapters/Context.adapter.js')
			const vs: any = await import('vscode')

			const context = new vs.ExtensionContext()
			const adapter = new ContextAdapter(context)

			expect(adapter).toBeDefined()
		})
	})

	describe('TerminalAdapter', () => {
		it('should handle terminal operations', async () => {
			const { TerminalAdapter } = await import('../../src/vscode/adapters/Terminal.adapter.js')
			const vs: any = await import('vscode')

			const terminal = vs.window.createTerminal()
			const adapter = new TerminalAdapter(terminal)

			expect(adapter).toBeDefined()
		})
	})
})
