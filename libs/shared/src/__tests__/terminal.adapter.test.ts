import { describe, it, expect, vi } from 'vitest'

describe('TerminalAdapter', () => {
	it('exposes activeTerminal and createTerminal', async () => {
		vi.resetModules()
		vi.mock('vscode', () => ({ window: { activeTerminal: { name: 't' }, createTerminal: vi.fn().mockReturnValue({ name: 'n' }) } }))

		const { TerminalAdapter } = await import('../vscode/adapters/Terminal.adapter.js')
		const a = new TerminalAdapter()

		expect(a.activeTerminal).toEqual({ name: 't' })
		expect(a.createTerminal('x')).toEqual({ name: 'n' })
	})
})
