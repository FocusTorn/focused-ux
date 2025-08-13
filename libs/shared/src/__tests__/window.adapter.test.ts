import { describe, it, expect, vi } from 'vitest'

describe('WindowAdapter', () => {
	it('showInformationMessage handles modal flag and item lists', async () => {
		vi.resetModules()
		vi.mock('vscode', () => {
			const window = {
				showInformationMessage: vi.fn().mockResolvedValue('a'),
				showWarningMessage: vi.fn().mockResolvedValue('b'),
				setStatusBarMessage: vi.fn(),
				createTreeView: vi.fn().mockReturnValue({}),
				registerTreeDataProvider: vi.fn().mockReturnValue({}),
				withProgress: vi.fn((_opts: any, task: any) => task({ report: vi.fn() })),
				showInputBox: vi.fn().mockResolvedValue('inp'),
				showTextDocument: vi.fn().mockResolvedValue({}),
				activeTextEditor: { document: { uri: { fsPath: '/f' } } },
				registerUriHandler: vi.fn().mockReturnValue({}),
			}
			const ProgressLocation = { Notification: 15 }
			const env = { clipboard: { writeText: vi.fn().mockResolvedValue(undefined) } }

			return { window, ProgressLocation, env }
		})

		const configurationService = { get: vi.fn().mockResolvedValue(1.5) }
		const { WindowAdapter } = await import('../vscode/adapters/Window.adapter.js')
		const a = new WindowAdapter(configurationService as any)

		expect(a.activeTextEditorUri).toBe('/f')
		await a.showInformationMessage('x', true, 'a', 'b')

		const vs: any = await import('vscode')

		expect(vs.window.showInformationMessage).toHaveBeenCalledWith('x', { modal: true }, 'a', 'b')
		await a.showInformationMessage('x', 'i1', 'i2')
		expect(vs.window.showInformationMessage).toHaveBeenCalledWith('x', 'i1', 'i2')

		await a.showWarningMessage('w')
		expect(vs.window.showWarningMessage).toHaveBeenCalled()

		await a.showInputBox({})
		expect(vs.window.showInputBox).toHaveBeenCalled()

		await a.showTextDocument({ document: { uri: { fsPath: '/f' } } })
		expect(vs.window.showTextDocument).toHaveBeenCalled()

		a.createTreeView('id', {})
		expect(vs.window.createTreeView).toHaveBeenCalled()
		a.registerTreeDataProvider('id', {})
		expect(vs.window.registerTreeDataProvider).toHaveBeenCalled()

		await a.withProgress({ title: 't', cancellable: false }, async () => undefined)
		expect(vs.window.withProgress).toHaveBeenCalled()

		a.setStatusBarMessage('msg')
		expect(vs.window.setStatusBarMessage).toHaveBeenCalledWith('msg')
		a.setStatusBarMessage('msg', 100)
		expect(vs.window.setStatusBarMessage).toHaveBeenCalledWith('msg', 100)

		a.registerUriHandler({})
		expect(vs.window.registerUriHandler).toHaveBeenCalled()

		await a.setClipboard('c')
		expect(vs.env.clipboard.writeText).toHaveBeenCalledWith('c')

		await a.showTimedInformationMessage('m')
		expect(configurationService.get).toHaveBeenCalled()
	})
})
