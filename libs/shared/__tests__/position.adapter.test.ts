import { describe, it, expect, vi } from 'vitest'

describe('PositionAdapter', () => {
	it('creates vscode.Position', async () => {
		vi.resetModules()
		vi.mock('vscode', () => ({ Position: class { constructor(public line: number, public character: number) {} } }))

		const { PositionAdapter } = await import('../src/vscode/adapters/Position.adapter.js')
		const a = new PositionAdapter()
		const p = a.create(5, 7) as any

		expect(p.line).toBe(5)
		expect(p.character).toBe(7)
	})
})
