import { describe, it, expect, vi } from 'vitest'

describe('WindowAdapter extra branches', () => {
	it('covers status bar timeout path and timed info default config', async () => {
		vi.resetModules()
		vi.mock('vscode', () => ({
			window: {
				setStatusBarMessage: vi.fn(),
				showInformationMessage: vi.fn(),
				withProgress: vi.fn(async (_opts: any, task: any) => { await task({ report: vi.fn() }) }),
			},
			ProgressLocation: { Notification: 15 },
			env: { clipboard: { writeText: vi.fn() } },
		}))
		vi.mock('../src/utils/showTimedInformationMessage.js', () => ({
			showTimedInformationMessage: vi.fn().mockResolvedValue(undefined),
		}))

		const cfg = { get: vi.fn().mockResolvedValue(0) }
		const { WindowAdapter } = await import('../src/vscode/adapters/Window.adapter.js')
		const a = new WindowAdapter(cfg as any)
		const vs: any = await import('vscode')

		a.setStatusBarMessage('m', 5)
		expect(vs.window.setStatusBarMessage).toHaveBeenCalledWith('m', 5)
		await a.showTimedInformationMessage('hi')
		expect(cfg.get).toHaveBeenCalled()
	})
})
