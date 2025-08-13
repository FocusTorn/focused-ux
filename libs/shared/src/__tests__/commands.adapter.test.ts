import { describe, it, expect, vi } from 'vitest'

describe('CommandsAdapter', () => {
	it('delegates to vscode.commands register/execute', async () => {
		vi.resetModules()
		vi.mock('vscode', () => {
			const commands = {
				registerCommand: vi.fn(),
				executeCommand: vi.fn().mockResolvedValue('ok'),
			}

			return { commands }
		})

		const { CommandsAdapter } = await import('../vscode/adapters/Commands.adapter.js')
		const vs: any = await import('vscode')
		const adapter = new CommandsAdapter()
		const cb = vi.fn()

		adapter.registerCommand('x', cb)
		expect(vs.commands.registerCommand).toHaveBeenCalledWith('x', cb)

		const result = await adapter.executeCommand('y', 1, 2)

		expect(vs.commands.executeCommand).toHaveBeenCalledWith('y', 1, 2)
		expect(result).toBe('ok')
	})
})
