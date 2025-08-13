import { describe, it, expect, vi } from 'vitest'

describe('WindowAdapter timers', () => {
	it('showDropdownMessage and showDescriptionMessage clear after duration', async () => {
		vi.resetModules()
		vi.useFakeTimers()
		vi.mock('vscode', () => ({ window: {}, env: { clipboard: { writeText: vi.fn() } }, ProgressLocation: { Notification: 15 } }))

		const cfg = { get: vi.fn().mockResolvedValue(0.001) }
		const { WindowAdapter } = await import('../src/vscode/adapters/Window.adapter.js')
		const a = new WindowAdapter(cfg as any)
		const view: any = { message: undefined, description: '' }

		a.setExplorerView(view)
		await a.showDropdownMessage('m')
		await a.showDescriptionMessage('d')
		vi.runAllTimers()
		expect(view.message).toBeUndefined()
		expect(view.description).toBe('')
	})
})
