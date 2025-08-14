import { describe, it, expect, vi } from 'vitest'

describe('coverage-only: WindowAdapter additional branches', () => {
	it('activeTextEditor and activeTextEditorUri getters; setStatusBarMessage overloads', async () => {
		vi.resetModules()
		vi.mock('vscode', () => {
			const setStatusBarMessage = vi.fn()

			return {
				window: {
					activeTextEditor: { document: { uri: { fsPath: '/p.md' } } },
					showInformationMessage: vi.fn(),
					setStatusBarMessage,
					withProgress: vi.fn((_opts, task) => task({ report: () => {} })),
				},
				ProgressLocation: { Notification: 15 },
				env: { clipboard: { writeText: vi.fn() } },
			}
		})

		const configurationService = { get: vi.fn(async (_k: string, d: number) => d) } as any
		const { WindowAdapter } = await import('../../src/vscode/adapters/Window.adapter.js')
		const w = new WindowAdapter(configurationService)

		expect(w.activeTextEditor).toBeDefined()
		expect(w.activeTextEditorUri).toBe('/p.md')

		const vs: any = await import('vscode')

		w.setStatusBarMessage('m1')
		expect(vs.window.setStatusBarMessage).toHaveBeenCalledWith('m1')
		w.setStatusBarMessage('m2', 1000)
		expect(vs.window.setStatusBarMessage).toHaveBeenCalledWith('m2', 1000)
	})
})

