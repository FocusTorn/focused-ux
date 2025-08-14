import { describe, it, expect, vi } from 'vitest'

describe('coverage-only: WindowAdapter showErrorMessage valid branch', () => {
	it('passes through valid message without guard substitution', async () => {
		vi.resetModules()
		vi.mock('vscode', () => ({
			window: {
				showErrorMessage: vi.fn(),
				withProgress: vi.fn(async (_o: any, task: any) => task({ report: () => {} })),
			},
			ProgressLocation: { Notification: 15 },
			env: { clipboard: { writeText: vi.fn() } },
		}))

		const cfg = { get: vi.fn(async (_: string, d: number) => d) }
		const { WindowAdapter } = await import('../../src/vscode/adapters/Window.adapter.js')
		const w = new WindowAdapter(cfg as any)
		const vs: any = await import('vscode')

		w.showErrorMessage('OK')
		expect(vs.window.showErrorMessage).toHaveBeenCalledWith('OK')
	})
})

