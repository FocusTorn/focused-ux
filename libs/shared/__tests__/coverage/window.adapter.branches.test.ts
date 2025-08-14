import { describe, it, expect, vi } from 'vitest'

describe('coverage-only: WindowAdapter remaining branches', () => {
	it('showErrorMessage guards; showTextDocument unwraps and raw; _getDuration both paths', async () => {
		vi.resetModules()
		vi.mock('vscode', () => {
			const showErrorMessage = vi.fn()
			const showTextDocument = vi.fn()

			return {
				window: {
					showErrorMessage,
					showTextDocument,
					showInformationMessage: vi.fn(),
					setStatusBarMessage: vi.fn(),
					withProgress: vi.fn((_opts, task) => task({ report: () => {} })),
					createTreeView: vi.fn(),
					registerTreeDataProvider: vi.fn(),
				},
				ProgressLocation: { Notification: 15 },
				env: { clipboard: { writeText: vi.fn() } },
			}
		})

		const configurationService = { get: vi.fn(async (_k: string, d: number) => d) } as any
		const { WindowAdapter } = await import('../../src/vscode/adapters/Window.adapter.js')
		const w = new WindowAdapter(configurationService)
		const vs: any = await import('vscode')

		// showErrorMessage guard
		w.showErrorMessage(undefined as any)
		expect(vs.window.showErrorMessage).toHaveBeenCalledWith('An unknown error occurred.')

		// showTextDocument unwrap
		await w.showTextDocument({ document: { id: 1 } } as any)
		expect(vs.window.showTextDocument).toHaveBeenCalledWith({ id: 1 })

		// showTextDocument raw path (no unwrap)
		await w.showTextDocument({ id: 2 } as any)
		expect(vs.window.showTextDocument).toHaveBeenCalledWith({ id: 2 })

		// _getDuration path via showTimedInformationMessage
		const util = await import('../../src/utils/showTimedInformationMessage.js')
		const utilSpy = vi.spyOn(util, 'showTimedInformationMessage').mockResolvedValue()

		await w.showTimedInformationMessage('msg')
		expect(configurationService.get).toHaveBeenCalled()
		utilSpy.mockRestore()

		// _getDuration early-return when duration provided; config should not be called again
		configurationService.get.mockClear()

		const utilSpy2 = vi.spyOn(util, 'showTimedInformationMessage').mockResolvedValue()

		await w.showTimedInformationMessage('msg2', 2000)
		expect(configurationService.get).not.toHaveBeenCalled()
		utilSpy2.mockRestore()
	})
})

