import { describe, it, expect, vi } from 'vitest'

describe('coverage-only: WindowAdapter showInformationMessage branches', () => {
	it('boolean modal branch and string items branch are both exercised', async () => {
		vi.resetModules()
		vi.mock('vscode', () => ({
			window: {
				showInformationMessage: vi.fn(),
				withProgress: vi.fn(async (_o: any, task: any) => task({ report: () => {} })),
			},
			ProgressLocation: { Notification: 15 },
			env: { clipboard: { writeText: vi.fn() } },
		}))

		const cfg = { get: vi.fn(async (_: string, d: number) => d) }
		const { WindowAdapter } = await import('../../src/vscode/adapters/Window.adapter.js')
		const w = new WindowAdapter(cfg as any)
		const vs: any = await import('vscode')

		await w.showInformationMessage('M', true, 'a', 'b')
		expect(vs.window.showInformationMessage).toHaveBeenCalledWith('M', { modal: true }, 'a', 'b')

		await w.showInformationMessage('M', 'x', 'y')
		expect(vs.window.showInformationMessage).toHaveBeenCalledWith('M', 'x', 'y')
	})
})

