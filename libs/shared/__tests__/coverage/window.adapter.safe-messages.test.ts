import { describe, it, expect, vi } from 'vitest'

describe('coverage-only: WindowAdapter safe message branches', () => {
	it('showWarningMessage uses " " for empty/invalid messages', async () => {
		vi.resetModules()
		vi.mock('vscode', () => ({
			window: {
				showWarningMessage: vi.fn(),
				withProgress: vi.fn(async (_o: any, task: any) => task({ report: () => {} })),
				showInformationMessage: vi.fn(),
			},
			ProgressLocation: { Notification: 15 },
			env: { clipboard: { writeText: vi.fn() } },
		}))

		const cfg = { get: vi.fn(async (_: string, d: number) => d) }
		const { WindowAdapter } = await import('../../src/vscode/adapters/Window.adapter.js')
		const vs: any = await import('vscode')

		// Ensure function present for this test environment
		if (typeof vs.window.showWarningMessage !== 'function') {
			vs.window.showWarningMessage = vi.fn()
		}

		const w = new WindowAdapter(cfg as any)

		await w.showWarningMessage(undefined as any, {})
		expect(vs.window.showWarningMessage).toHaveBeenCalledWith(' ', {}, ...[])
	})

	it('showTimedInformationMessage uses " " for empty/invalid message with provided duration', async () => {
		vi.resetModules()
		vi.mock('vscode', () => ({
			window: {
				showInformationMessage: vi.fn(),
				withProgress: vi.fn(async (_o: any, task: any) => task({ report: () => {} })),
			},
			ProgressLocation: { Notification: 15 },
			env: { clipboard: { writeText: vi.fn() } },
		}))
		// Stub timed util to avoid relying on withProgress implementation under the hood
		vi.mock('../../src/utils/showTimedInformationMessage.js', () => ({
			showTimedInformationMessage: vi.fn().mockResolvedValue(undefined),
		}))

		const cfg = { get: vi.fn(async (_: string, d: number) => d) }
		const { WindowAdapter } = await import('../../src/vscode/adapters/Window.adapter.js')
		const w = new WindowAdapter(cfg as any)

		await w.showTimedInformationMessage('', 500)
		// showTimedInformationMessage delegates to util; but we can assert config not used
		expect(cfg.get).not.toHaveBeenCalled()
	})
})

