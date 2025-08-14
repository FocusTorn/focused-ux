import { describe, it, expect, vi } from 'vitest'

describe('coverage-only: WindowAdapter duration branches for dropdown/description', () => {
	it('uses provided duration (no config) and config fallback when undefined', async () => {
		vi.resetModules()
		vi.mock('vscode', () => ({
			window: {
				createTreeView: vi.fn(() => ({ message: undefined, description: '' })),
				registerTreeDataProvider: vi.fn(),
			},
			ProgressLocation: { Notification: 15 },
		}))

		const cfg = { get: vi.fn(async (_k: string, d: number) => d) }
		const { WindowAdapter } = await import('../../src/vscode/adapters/Window.adapter.js')
		const w = new WindowAdapter(cfg as any)
		const vs: any = await import('vscode')
		const v = vs.window.createTreeView('x', {})

		w.setExplorerView(v as any)

		// provided duration -> no config call
		cfg.get.mockClear()
		await w.showDropdownMessage('m', 1)
		expect(cfg.get).not.toHaveBeenCalled()

		cfg.get.mockClear()
		await w.showDescriptionMessage('md')
		expect(cfg.get).toHaveBeenCalled()
	})
})

