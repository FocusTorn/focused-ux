import { describe, it, expect, vi } from 'vitest'

describe('coverage-only: WindowAdapter _getDuration branches', () => {
	it('uses provided duration vs config fallback', async () => {
		vi.resetModules()
		vi.mock('vscode', () => ({
			window: { withProgress: vi.fn(async (_o: any, task: any) => task({ report: () => {} })) },
			ProgressLocation: { Notification: 15 },
			env: { clipboard: { writeText: vi.fn() } },
		}))

		const cfg = { get: vi.fn(async (_: string, d: number) => d) }
		const { WindowAdapter } = await import('../../src/vscode/adapters/Window.adapter.js')
		const w = new WindowAdapter(cfg as any)

		// Provided duration path
		await w.showTimedInformationMessage('m', 2000)
		expect(cfg.get).not.toHaveBeenCalled()

		// Fallback config path
		cfg.get.mockClear()
		await w.showTimedInformationMessage('m')
		expect(cfg.get).toHaveBeenCalled()
	})
})

