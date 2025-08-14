import { describe, it, expect, vi } from 'vitest'

describe('coverage-only: Extension adapters extra', () => {
	it('covers ExtensionContextAdapter and ExtensionAPIAdapter', async () => {
		vi.resetModules()
		vi.mock('vscode', () => ({
			window: {
				registerTreeDataProvider: vi.fn().mockReturnValue('rtp'),
				registerWebviewViewProvider: vi.fn().mockReturnValue('rwvp'),
				createTreeView: vi.fn().mockReturnValue('tv'),
			},
			commands: {
				registerCommand: vi.fn().mockReturnValue('rc'),
				executeCommand: vi.fn().mockResolvedValue('exec-res'),
			},
		}))

		const { ExtensionContextAdapter, ExtensionAPIAdapter } = await import('../../src/vscode/adapters/Extension.adapter.js')
		const ctx = { subscriptions: ['a'] } as any
		const ectx = new ExtensionContextAdapter(ctx as any)

		expect(ectx.subscriptions).toEqual(['a'])

		const api = new ExtensionAPIAdapter()
		const vs: any = await import('vscode')

		api.registerTreeDataProvider({})
		expect(vs.window.registerTreeDataProvider).toHaveBeenCalled()
		api.registerWebviewViewProvider('id', {})
		expect(vs.window.registerWebviewViewProvider).toHaveBeenCalledWith('id', {})
		api.createTreeView('x', {})
		expect(vs.window.createTreeView).toHaveBeenCalledWith('x', {})
		api.registerCommand('c', () => {})
		expect(vs.commands.registerCommand).toHaveBeenCalledWith('c', expect.any(Function))
		expect(await api.executeCommand('c', 1, 2)).toBe('exec-res')
	})
})

