import { describe, it, expect, vi } from 'vitest'

describe('coverage-only: WindowAdapter uncovered branches', () => {
	it('showDropdownMessage early return when no explorerView', async () => {
		vi.resetModules()
		vi.mock('vscode', () => ({ window: {}, ProgressLocation: { Notification: 15 }, env: { clipboard: { writeText: vi.fn() } } }))

		const cfg = { get: vi.fn(async (_: string, d: number) => d) }
		const { WindowAdapter } = await import('../../src/vscode/adapters/Window.adapter.js')
		const w = new WindowAdapter(cfg as any)

		await w.showDropdownMessage('m') // should early return
		expect(cfg.get).not.toHaveBeenCalled()
	})

	it('showDescriptionMessage early return when no explorerView', async () => {
		vi.resetModules()
		vi.mock('vscode', () => ({ window: {}, ProgressLocation: { Notification: 15 }, env: { clipboard: { writeText: vi.fn() } } }))

		const cfg = { get: vi.fn(async (_: string, d: number) => d) }
		const { WindowAdapter } = await import('../../src/vscode/adapters/Window.adapter.js')
		const w = new WindowAdapter(cfg as any)

		await w.showDescriptionMessage('m') // should early return
		expect(cfg.get).not.toHaveBeenCalled()
	})
})

