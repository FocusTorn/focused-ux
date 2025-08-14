import { describe, it, expect, vi } from 'vitest'

describe('coverage-only: WindowAdapter showInformationMessage empty-message branches', () => {
	it('uses safeMessage for empty string across boolean and string branches', async () => {
		vi.resetModules()
		vi.mock('vscode', () => ({
			window: {
				showInformationMessage: vi.fn(),
				withProgress: vi.fn(async (_o: any, task: any) => task({ report: () => {} })),
			},
			ProgressLocation: { Notification: 15 },
			env: { clipboard: { writeText: vi.fn() } },
		}))

		const { WindowAdapter } = await import('../../src/vscode/adapters/Window.adapter.js')
		const w = new WindowAdapter({ get: vi.fn() } as any)
		const vs: any = await import('vscode')

		await w.showInformationMessage('', true, 'a')
		expect(vs.window.showInformationMessage).toHaveBeenCalledWith(' ', { modal: true }, 'a')

		await w.showInformationMessage('', 'x')
		expect(vs.window.showInformationMessage).toHaveBeenCalledWith(' ', 'x')

		await w.showInformationMessage('')
		expect(vs.window.showInformationMessage).toHaveBeenCalledWith(' ')
	})
})

