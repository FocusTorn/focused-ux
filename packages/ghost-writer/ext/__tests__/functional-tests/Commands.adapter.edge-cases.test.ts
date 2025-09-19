import { describe, it, expect, beforeEach, vi } from 'vitest'
import { CommandsAdapter } from '../../src/adapters/Commands.adapter'
import * as vscode from 'vscode'

describe('CommandsAdapter Edge Cases', () => {
	let adapter: CommandsAdapter
	let mockDisposable: any

	beforeEach(() => {
		vi.clearAllMocks()
		adapter = new CommandsAdapter()
		mockDisposable = {
			dispose: vi.fn(),
		}
	})

	describe('Command Registration Edge Cases', () => {
		it('should handle empty command name', () => {
			// Arrange
			const command = ''
			const callback = vi.fn()
			vi.mocked(vscode.commands.registerCommand).mockReturnValue(mockDisposable)

			// Act
			const result = adapter.registerCommand(command, callback)

			// Assert
			expect(vscode.commands.registerCommand).toHaveBeenCalledWith(command, callback, undefined)
			expect(result).toBe(mockDisposable)
		})

		it('should handle null command name', () => {
			// Arrange
			const command = null as any
			const callback = vi.fn()
			vi.mocked(vscode.commands.registerCommand).mockReturnValue(mockDisposable)

			// Act
			const result = adapter.registerCommand(command, callback)

			// Assert
			expect(vscode.commands.registerCommand).toHaveBeenCalledWith(command, callback, undefined)
			expect(result).toBe(mockDisposable)
		})

		it('should handle undefined command name', () => {
			// Arrange
			const command = undefined as any
			const callback = vi.fn()
			vi.mocked(vscode.commands.registerCommand).mockReturnValue(mockDisposable)

			// Act
			const result = adapter.registerCommand(command, callback)

			// Assert
			expect(vscode.commands.registerCommand).toHaveBeenCalledWith(command, callback, undefined)
			expect(result).toBe(mockDisposable)
		})

		it('should handle command name with special characters', () => {
			// Arrange
			const command = 'command-with-special-chars!@#$%^&*()'
			const callback = vi.fn()
			vi.mocked(vscode.commands.registerCommand).mockReturnValue(mockDisposable)

			// Act
			const result = adapter.registerCommand(command, callback)

			// Assert
			expect(vscode.commands.registerCommand).toHaveBeenCalledWith(command, callback, undefined)
			expect(result).toBe(mockDisposable)
		})

		it('should handle command name with Unicode characters', () => {
			// Arrange
			const command = '命令-中文-🚀'
			const callback = vi.fn()
			vi.mocked(vscode.commands.registerCommand).mockReturnValue(mockDisposable)

			// Act
			const result = adapter.registerCommand(command, callback)

			// Assert
			expect(vscode.commands.registerCommand).toHaveBeenCalledWith(command, callback, undefined)
			expect(result).toBe(mockDisposable)
		})

		it('should handle very long command name', () => {
			// Arrange
			const command = 'very-long-command-name-that-exceeds-normal-length-limits-and-tests-edge-cases'
			const callback = vi.fn()
			vi.mocked(vscode.commands.registerCommand).mockReturnValue(mockDisposable)

			// Act
			const result = adapter.registerCommand(command, callback)

			// Assert
			expect(vscode.commands.registerCommand).toHaveBeenCalledWith(command, callback, undefined)
			expect(result).toBe(mockDisposable)
		})
	})

	describe('Callback Handling Edge Cases', () => {
		it('should handle null callback', () => {
			// Arrange
			const command = 'test.command'
			const callback = null as any
			vi.mocked(vscode.commands.registerCommand).mockReturnValue(mockDisposable)

			// Act
			const result = adapter.registerCommand(command, callback)

			// Assert
			expect(vscode.commands.registerCommand).toHaveBeenCalledWith(command, callback, undefined)
			expect(result).toBe(mockDisposable)
		})

		it('should handle undefined callback', () => {
			// Arrange
			const command = 'test.command'
			const callback = undefined as any
			vi.mocked(vscode.commands.registerCommand).mockReturnValue(mockDisposable)

			// Act
			const result = adapter.registerCommand(command, callback)

			// Assert
			expect(vscode.commands.registerCommand).toHaveBeenCalledWith(command, callback, undefined)
			expect(result).toBe(mockDisposable)
		})

		it('should handle callback that throws error', () => {
			// Arrange
			const command = 'test.command'
			const callback = vi.fn().mockImplementation(() => {
				throw new Error('Callback error')
			})
			vi.mocked(vscode.commands.registerCommand).mockReturnValue(mockDisposable)

			// Act
			const result = adapter.registerCommand(command, callback)

			// Assert
			expect(vscode.commands.registerCommand).toHaveBeenCalledWith(command, callback, undefined)
			expect(result).toBe(mockDisposable)
		})

		it('should handle callback that returns promise', () => {
			// Arrange
			const command = 'test.command'
			const callback = vi.fn().mockResolvedValue('async result')
			vi.mocked(vscode.commands.registerCommand).mockReturnValue(mockDisposable)

			// Act
			const result = adapter.registerCommand(command, callback)

			// Assert
			expect(vscode.commands.registerCommand).toHaveBeenCalledWith(command, callback, undefined)
			expect(result).toBe(mockDisposable)
		})

		it('should handle callback that returns undefined', () => {
			// Arrange
			const command = 'test.command'
			const callback = vi.fn().mockReturnValue(undefined)
			vi.mocked(vscode.commands.registerCommand).mockReturnValue(mockDisposable)

			// Act
			const result = adapter.registerCommand(command, callback)

			// Assert
			expect(vscode.commands.registerCommand).toHaveBeenCalledWith(command, callback, undefined)
			expect(result).toBe(mockDisposable)
		})

		it('should handle callback that returns null', () => {
			// Arrange
			const command = 'test.command'
			const callback = vi.fn().mockReturnValue(null)
			vi.mocked(vscode.commands.registerCommand).mockReturnValue(mockDisposable)

			// Act
			const result = adapter.registerCommand(command, callback)

			// Assert
			expect(vscode.commands.registerCommand).toHaveBeenCalledWith(command, callback, undefined)
			expect(result).toBe(mockDisposable)
		})
	})

	describe('ThisArg Handling Edge Cases', () => {
		it('should handle null thisArg', () => {
			// Arrange
			const command = 'test.command'
			const callback = vi.fn()
			const thisArg = null
			vi.mocked(vscode.commands.registerCommand).mockReturnValue(mockDisposable)

			// Act
			const result = adapter.registerCommand(command, callback, thisArg)

			// Assert
			expect(vscode.commands.registerCommand).toHaveBeenCalledWith(command, callback, thisArg)
			expect(result).toBe(mockDisposable)
		})

		it('should handle undefined thisArg', () => {
			// Arrange
			const command = 'test.command'
			const callback = vi.fn()
			const thisArg = undefined
			vi.mocked(vscode.commands.registerCommand).mockReturnValue(mockDisposable)

			// Act
			const result = adapter.registerCommand(command, callback, thisArg)

			// Assert
			expect(vscode.commands.registerCommand).toHaveBeenCalledWith(command, callback, thisArg)
			expect(result).toBe(mockDisposable)
		})

		it('should handle object thisArg', () => {
			// Arrange
			const command = 'test.command'
			const callback = vi.fn()
			const thisArg = { test: 'value', method: vi.fn() }
			vi.mocked(vscode.commands.registerCommand).mockReturnValue(mockDisposable)

			// Act
			const result = adapter.registerCommand(command, callback, thisArg)

			// Assert
			expect(vscode.commands.registerCommand).toHaveBeenCalledWith(command, callback, thisArg)
			expect(result).toBe(mockDisposable)
		})

		it('should handle function thisArg', () => {
			// Arrange
			const command = 'test.command'
			const callback = vi.fn()
			const thisArg = vi.fn()
			vi.mocked(vscode.commands.registerCommand).mockReturnValue(mockDisposable)

			// Act
			const result = adapter.registerCommand(command, callback, thisArg)

			// Assert
			expect(vscode.commands.registerCommand).toHaveBeenCalledWith(command, callback, thisArg)
			expect(result).toBe(mockDisposable)
		})

		it('should handle array thisArg', () => {
			// Arrange
			const command = 'test.command'
			const callback = vi.fn()
			const thisArg = [1, 2, 3]
			vi.mocked(vscode.commands.registerCommand).mockReturnValue(mockDisposable)

			// Act
			const result = adapter.registerCommand(command, callback, thisArg)

			// Assert
			expect(vscode.commands.registerCommand).toHaveBeenCalledWith(command, callback, thisArg)
			expect(result).toBe(mockDisposable)
		})

		it('should handle primitive thisArg', () => {
			// Arrange
			const command = 'test.command'
			const callback = vi.fn()
			const thisArg = 'string-thisArg'
			vi.mocked(vscode.commands.registerCommand).mockReturnValue(mockDisposable)

			// Act
			const result = adapter.registerCommand(command, callback, thisArg)

			// Assert
			expect(vscode.commands.registerCommand).toHaveBeenCalledWith(command, callback, thisArg)
			expect(result).toBe(mockDisposable)
		})
	})

	describe('Disposable Handling Edge Cases', () => {
		it('should handle null disposable return', () => {
			// Arrange
			const command = 'test.command'
			const callback = vi.fn()
			vi.mocked(vscode.commands.registerCommand).mockReturnValue(null)

			// Act
			const result = adapter.registerCommand(command, callback)

			// Assert
			expect(vscode.commands.registerCommand).toHaveBeenCalledWith(command, callback, undefined)
			expect(result).toBeNull()
		})

		it('should handle undefined disposable return', () => {
			// Arrange
			const command = 'test.command'
			const callback = vi.fn()
			vi.mocked(vscode.commands.registerCommand).mockReturnValue(undefined)

			// Act
			const result = adapter.registerCommand(command, callback)

			// Assert
			expect(vscode.commands.registerCommand).toHaveBeenCalledWith(command, callback, undefined)
			expect(result).toBeUndefined()
		})

		it('should handle disposable without dispose method', () => {
			// Arrange
			const command = 'test.command'
			const callback = vi.fn()
			const incompleteDisposable = { /* missing dispose method */ }
			vi.mocked(vscode.commands.registerCommand).mockReturnValue(incompleteDisposable)

			// Act
			const result = adapter.registerCommand(command, callback)

			// Assert
			expect(vscode.commands.registerCommand).toHaveBeenCalledWith(command, callback, undefined)
			expect(result).toBe(incompleteDisposable)
		})

		it('should handle disposable with non-function dispose method', () => {
			// Arrange
			const command = 'test.command'
			const callback = vi.fn()
			const invalidDisposable = { dispose: 'not-a-function' }
			vi.mocked(vscode.commands.registerCommand).mockReturnValue(invalidDisposable)

			// Act
			const result = adapter.registerCommand(command, callback)

			// Assert
			expect(vscode.commands.registerCommand).toHaveBeenCalledWith(command, callback, undefined)
			expect(result).toBe(invalidDisposable)
		})
	})

	describe('Concurrent Operations', () => {
		it('should handle concurrent command registrations', () => {
			// Arrange
			const commands = Array.from({ length: 10 }, (_, i) => ({
				command: `test.command${i}`,
				callback: vi.fn()
			}))
			vi.mocked(vscode.commands.registerCommand).mockReturnValue(mockDisposable)

			// Act
			const results = commands.map(({ command, callback }) => 
				adapter.registerCommand(command, callback)
			)

			// Assert
			expect(results).toHaveLength(10)
			expect(vscode.commands.registerCommand).toHaveBeenCalledTimes(10)
			results.forEach(result => {
				expect(result).toBe(mockDisposable)
			})
		})

		it('should handle rapid sequential command registrations', () => {
			// Arrange
			const commandCount = 100
			vi.mocked(vscode.commands.registerCommand).mockReturnValue(mockDisposable)

			// Act
			const results = Array.from({ length: commandCount }, (_, i) => 
				adapter.registerCommand(`test.command${i}`, vi.fn())
			)

			// Assert
			expect(results).toHaveLength(commandCount)
			expect(vscode.commands.registerCommand).toHaveBeenCalledTimes(commandCount)
		})
	})

	describe('Performance Scenarios', () => {
		it('should handle large number of command registrations', () => {
			// Arrange
			const commandCount = 1000
			vi.mocked(vscode.commands.registerCommand).mockReturnValue(mockDisposable)

			// Act
			const results = Array.from({ length: commandCount }, (_, i) => 
				adapter.registerCommand(`test.command${i}`, vi.fn())
			)

			// Assert
			expect(results).toHaveLength(commandCount)
			expect(vscode.commands.registerCommand).toHaveBeenCalledTimes(commandCount)
		})

		it('should handle command registration with complex callbacks', () => {
			// Arrange
			const command = 'test.command'
			const complexCallback = vi.fn().mockImplementation(async (...args: any[]) => {
				// Simulate complex async operation
				await new Promise(resolve => setTimeout(resolve, 0))
				return args.reduce((sum, arg) => sum + (typeof arg === 'number' ? arg : 0), 0)
			})
			vi.mocked(vscode.commands.registerCommand).mockReturnValue(mockDisposable)

			// Act
			const result = adapter.registerCommand(command, complexCallback)

			// Assert
			expect(vscode.commands.registerCommand).toHaveBeenCalledWith(command, complexCallback, undefined)
			expect(result).toBe(mockDisposable)
		})
	})

	describe('Integration Scenarios', () => {
		it('should handle real-world command registration scenarios', () => {
			// Arrange
			const realWorldCommands = [
				{
					command: 'fux-ghost-writer.storeCodeFragment',
					callback: vi.fn().mockResolvedValue(undefined),
					thisArg: { service: 'clipboard' }
				},
				{
					command: 'fux-ghost-writer.insertImportStatement',
					callback: vi.fn().mockResolvedValue(undefined),
					thisArg: { service: 'importGenerator' }
				},
				{
					command: 'fux-ghost-writer.logSelectedVariable',
					callback: vi.fn().mockResolvedValue(undefined),
					thisArg: { service: 'consoleLogger' }
				}
			]
			vi.mocked(vscode.commands.registerCommand).mockReturnValue(mockDisposable)

			// Act
			const results = realWorldCommands.map(({ command, callback, thisArg }) => 
				adapter.registerCommand(command, callback, thisArg)
			)

			// Assert
			expect(results).toHaveLength(realWorldCommands.length)
			realWorldCommands.forEach(({ command, callback, thisArg }, index) => {
				expect(vscode.commands.registerCommand).toHaveBeenCalledWith(command, callback, thisArg)
				expect(results[index]).toBe(mockDisposable)
			})
		})

		it('should handle command registration with mixed parameter types', () => {
			// Arrange
			const mixedCommands = [
				{ command: 'cmd1', callback: vi.fn(), thisArg: undefined },
				{ command: 'cmd2', callback: vi.fn(), thisArg: null },
				{ command: 'cmd3', callback: vi.fn(), thisArg: { context: 'test' } },
				{ command: 'cmd4', callback: vi.fn(), thisArg: 'string-context' },
				{ command: 'cmd5', callback: vi.fn(), thisArg: 42 }
			]
			vi.mocked(vscode.commands.registerCommand).mockReturnValue(mockDisposable)

			// Act
			const results = mixedCommands.map(({ command, callback, thisArg }) => 
				adapter.registerCommand(command, callback, thisArg)
			)

			// Assert
			expect(results).toHaveLength(mixedCommands.length)
			mixedCommands.forEach(({ command, callback, thisArg }, index) => {
				expect(vscode.commands.registerCommand).toHaveBeenCalledWith(command, callback, thisArg)
				expect(results[index]).toBe(mockDisposable)
			})
		})
	})

	describe('Error Handling', () => {
		it('should handle command registration service errors', () => {
			// Arrange
			const command = 'test.command'
			const callback = vi.fn()
			const error = new Error('Command registration service unavailable')
			vi.mocked(vscode.commands.registerCommand).mockImplementation(() => {
				throw error
			})

			// Act & Assert
			expect(() => {
				adapter.registerCommand(command, callback)
			}).toThrow('Command registration service unavailable')
		})

		it('should handle command registration timeout', () => {
			// Arrange
			const command = 'test.command'
			const callback = vi.fn()
			vi.mocked(vscode.commands.registerCommand).mockImplementation(() => {
				throw new Error('Command registration timeout')
			})

			// Act & Assert
			expect(() => {
				adapter.registerCommand(command, callback)
			}).toThrow('Command registration timeout')
		})
	})
})

