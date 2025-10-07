import { describe, it, expect, beforeEach, vi } from 'vitest'
import { CommandsAdapter } from '../../src/adapters/Commands.adapter.js'
import type { ICommands } from '../../src/_interfaces/ICommands.js'
import * as vscode from 'vscode'

describe('CommandsAdapter', () => {
	let adapter: ICommands

	beforeEach(() => {
		vi.clearAllMocks()
		adapter = new CommandsAdapter()
	})

	describe('registerCommand', () => {
		it('should register a command and return a disposable', () => {
			const commandId = 'test.command'
			const callback = vi.fn()

			const disposable = adapter.registerCommand(commandId, callback)

			expect(vscode.commands.registerCommand).toHaveBeenCalledWith(commandId, callback)
			expect(disposable).toBeDefined()
			expect(disposable.dispose).toBeDefined()
		})

		it('should handle multiple command registrations', () => {
			const command1 = 'test.command1'
			const command2 = 'test.command2'
			const callback1 = vi.fn()
			const callback2 = vi.fn()

			const disposable1 = adapter.registerCommand(command1, callback1)
			const disposable2 = adapter.registerCommand(command2, callback2)

			expect(vscode.commands.registerCommand).toHaveBeenCalledTimes(2)
			expect(vscode.commands.registerCommand).toHaveBeenCalledWith(command1, callback1)
			expect(vscode.commands.registerCommand).toHaveBeenCalledWith(command2, callback2)
			expect(disposable1).toBeDefined()
			expect(disposable2).toBeDefined()
		})
	})

	describe('executeCommand', () => {
		it('should execute a command with no arguments', async () => {
			const commandId = 'test.command'

			await adapter.executeCommand(commandId)

			expect(vscode.commands.executeCommand).toHaveBeenCalledWith(commandId)
		})

		it('should execute a command with arguments', async () => {
			const commandId = 'test.command'
			const args = ['arg1', 'arg2', { key: 'value' }]

			await adapter.executeCommand(commandId, ...args)

			expect(vscode.commands.executeCommand).toHaveBeenCalledWith(commandId, ...args)
		})

		it('should handle command execution errors gracefully', async () => {
			const commandId = 'test.command'
			const error = new Error('Command failed')
            
			vi.mocked(vscode.commands.executeCommand).mockRejectedValueOnce(error)

			await expect(adapter.executeCommand(commandId)).rejects.toThrow('Command failed')
			expect(vscode.commands.executeCommand).toHaveBeenCalledWith(commandId)
		})

		it('should handle multiple command executions', async () => {
			const command1 = 'test.command1'
			const command2 = 'test.command2'

			await adapter.executeCommand(command1)
			await adapter.executeCommand(command2)

			expect(vscode.commands.executeCommand).toHaveBeenCalledTimes(2)
			expect(vscode.commands.executeCommand).toHaveBeenCalledWith(command1)
			expect(vscode.commands.executeCommand).toHaveBeenCalledWith(command2)
		})
	})

	describe('disposable management', () => {
		it('should properly dispose registered commands', () => {
			const commandId = 'test.command'
			const callback = vi.fn()
			const mockDispose = vi.fn()

			vi.mocked(vscode.commands.registerCommand).mockReturnValueOnce({ dispose: mockDispose })

			const disposable = adapter.registerCommand(commandId, callback)

			disposable.dispose()

			expect(mockDispose).toHaveBeenCalled()
		})

		it('should handle multiple disposals safely', () => {
			const commandId = 'test.command'
			const callback = vi.fn()
			const mockDispose = vi.fn()

			vi.mocked(vscode.commands.registerCommand).mockReturnValueOnce({ dispose: mockDispose })

			const disposable = adapter.registerCommand(commandId, callback)

			disposable.dispose()
			disposable.dispose() // Should not throw

			expect(mockDispose).toHaveBeenCalledTimes(2) // Called twice since we called dispose twice
		})
	})

	describe('integration scenarios', () => {
		it('should handle complex command registration and execution workflow', async () => {
			const commandId = 'notesHub.openNote'
			const callback = vi.fn().mockResolvedValue('success')
			const args = ['file:///test/note.md']

			// Register command
			const disposable = adapter.registerCommand(commandId, callback)

			// Execute command
			await adapter.executeCommand(commandId, ...args)

			// Verify registration
			expect(vscode.commands.registerCommand).toHaveBeenCalledWith(commandId, callback)

			// Verify execution
			expect(vscode.commands.executeCommand).toHaveBeenCalledWith(commandId, ...args)

			// Cleanup
			disposable.dispose()
			expect(disposable.dispose).toHaveBeenCalled()
		})

		it('should handle command execution with different argument types', async () => {
			const commandId = 'test.command'
			const stringArg = 'string argument'
			const numberArg = 42
			const objectArg = { key: 'value', nested: { data: 'test' } }
			const arrayArg = [1, 2, 3]

			await adapter.executeCommand(commandId, stringArg, numberArg, objectArg, arrayArg)

			expect(vscode.commands.executeCommand).toHaveBeenCalledWith(
				commandId,
				stringArg,
				numberArg,
				objectArg,
				arrayArg,
			)
		})
	})
})
