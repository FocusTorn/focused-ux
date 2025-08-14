import { describe, it, expect, vi } from 'vitest'

describe('coverage-only: WindowAdapter dropdown/description duration branches', () => {
	it('uses configKey path when explorerView is set', async () => {
		vi.useFakeTimers()
		vi.resetModules()
		vi.mock('vscode', () => ({
			window: {
				withProgress: vi.fn(async (_o: any, task: any) => task({ report: () => {} })),
			},
			ProgressLocation: { Notification: 15 },
			env: { clipboard: { writeText: vi.fn() } },
		}))

		const cfg = { get: vi.fn(async (_: string, d: number) => d) }
		const { WindowAdapter } = await import('../../src/vscode/adapters/Window.adapter.js')
		const w = new WindowAdapter(cfg as any)
		const view: any = { message: undefined, description: '' }

		w.setExplorerView(view)

		cfg.get.mockClear()
		await w.showDropdownMessage('m')
		expect(cfg.get).toHaveBeenCalled()
		vi.runAllTimers()

		cfg.get.mockClear()
		await w.showDescriptionMessage('d')
		expect(cfg.get).toHaveBeenCalled()
		vi.runAllTimers()
	})
})

