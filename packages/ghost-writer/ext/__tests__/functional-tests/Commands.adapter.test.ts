import { describe, it, expect, beforeEach, vi } from 'vitest'
import { CommandsAdapter } from '../../src/adapters/Commands.adapter'
import * as vscode from 'vscode'

describe('CommandsAdapter', () => {
    let adapter: CommandsAdapter
    let mockDisposable: any

    beforeEach(() => {
        vi.clearAllMocks()
        adapter = new CommandsAdapter()
        mockDisposable = {
            dispose: vi.fn(),
        }
    })

    describe('registerCommand', () => {
        it('should register command with callback', () => {
            // Arrange
            const command = 'test.command'
            const callback = vi.fn()
            vi.mocked(vscode.commands.registerCommand).mockReturnValue(mockDisposable)

            // Act
            const result = adapter.registerCommand(command, callback)

            // Assert
            expect(vscode.commands.registerCommand).toHaveBeenCalledWith(command, callback, undefined)
            expect(result).toBe(mockDisposable)
        })

        it('should register command with thisArg', () => {
            // Arrange
            const command = 'test.command'
            const callback = vi.fn()
            const thisArg = { test: 'value' }
            vi.mocked(vscode.commands.registerCommand).mockReturnValue(mockDisposable)

            // Act
            const result = adapter.registerCommand(command, callback, thisArg)

            // Assert
            expect(vscode.commands.registerCommand).toHaveBeenCalledWith(command, callback, thisArg)
            expect(result).toBe(mockDisposable)
        })

        it('should register multiple commands', () => {
            // Arrange
            const command1 = 'test.command1'
            const command2 = 'test.command2'
            const callback1 = vi.fn()
            const callback2 = vi.fn()
            vi.mocked(vscode.commands.registerCommand).mockReturnValue(mockDisposable)

            // Act
            const result1 = adapter.registerCommand(command1, callback1)
            const result2 = adapter.registerCommand(command2, callback2)

            // Assert
            expect(vscode.commands.registerCommand).toHaveBeenCalledTimes(2)
            expect(result1).toBe(mockDisposable)
            expect(result2).toBe(mockDisposable)
        })
    })
})
