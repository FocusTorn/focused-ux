import { describe, it, expect, beforeEach, vi } from 'vitest'
import { WindowAdapter } from '../../src/adapters/Window.adapter'
import * as vscode from 'vscode'

describe('WindowAdapter Edge Cases', () => {
    let adapter: WindowAdapter

    beforeEach(() => {
        vi.clearAllMocks()
        adapter = new WindowAdapter()
    })

    describe('Error Message Handling', () => {
        it('should handle empty error message', () => {
            // Arrange
            const message = ''
            vi.mocked(vscode.window.showErrorMessage).mockImplementation(() => Promise.resolve(undefined))

            // Act
            adapter.errMsg(message)

            // Assert
            expect(vscode.window.showErrorMessage).toHaveBeenCalledWith(message)
        })

        it('should handle null error message', () => {
            // Arrange
            const message = null as any
            vi.mocked(vscode.window.showErrorMessage).mockImplementation(() => Promise.resolve(undefined))

            // Act
            adapter.errMsg(message)

            // Assert
            expect(vscode.window.showErrorMessage).toHaveBeenCalledWith(message)
        })

        it('should handle undefined error message', () => {
            // Arrange
            const message = undefined as any
            vi.mocked(vscode.window.showErrorMessage).mockImplementation(() => Promise.resolve(undefined))

            // Act
            adapter.errMsg(message)

            // Assert
            expect(vscode.window.showErrorMessage).toHaveBeenCalledWith(message)
        })

        it('should handle very long error message', () => {
            // Arrange
            const message = 'x'.repeat(10000) // 10KB message
            vi.mocked(vscode.window.showErrorMessage).mockImplementation(() => Promise.resolve(undefined))

            // Act
            adapter.errMsg(message)

            // Assert
            expect(vscode.window.showErrorMessage).toHaveBeenCalledWith(message)
        })

        it('should handle error message with special characters', () => {
            // Arrange
            const message = 'Error with special chars: !@#$%^&*()_+-=[]{}|;:,.<>?'
            vi.mocked(vscode.window.showErrorMessage).mockImplementation(() => Promise.resolve(undefined))

            // Act
            adapter.errMsg(message)

            // Assert
            expect(vscode.window.showErrorMessage).toHaveBeenCalledWith(message)
        })

        it('should handle error message with Unicode characters', () => {
            // Arrange
            const message = 'Error with Unicode: 中文 🚀 émojis'
            vi.mocked(vscode.window.showErrorMessage).mockImplementation(() => Promise.resolve(undefined))

            // Act
            adapter.errMsg(message)

            // Assert
            expect(vscode.window.showErrorMessage).toHaveBeenCalledWith(message)
        })

        it('should handle error message with newlines', () => {
            // Arrange
            const message = 'Error with\nmultiple\nlines'
            vi.mocked(vscode.window.showErrorMessage).mockImplementation(() => Promise.resolve(undefined))

            // Act
            adapter.errMsg(message)

            // Assert
            expect(vscode.window.showErrorMessage).toHaveBeenCalledWith(message)
        })
    })

    describe('Information Message Handling', () => {
        it('should handle empty information message', async () => {
            // Arrange
            const message = ''
            vi.mocked(vscode.window.showInformationMessage).mockResolvedValue(undefined)

            // Act
            await adapter.showInformationMessage(message)

            // Assert
            expect(vscode.window.showInformationMessage).toHaveBeenCalledWith(message)
        })

        it('should handle null information message', async () => {
            // Arrange
            const message = null as any
            vi.mocked(vscode.window.showInformationMessage).mockResolvedValue(undefined)

            // Act
            await adapter.showInformationMessage(message)

            // Assert
            expect(vscode.window.showInformationMessage).toHaveBeenCalledWith(message)
        })

        it('should handle undefined information message', async () => {
            // Arrange
            const message = undefined as any
            vi.mocked(vscode.window.showInformationMessage).mockResolvedValue(undefined)

            // Act
            await adapter.showInformationMessage(message)

            // Assert
            expect(vscode.window.showInformationMessage).toHaveBeenCalledWith(message)
        })

        it('should handle very long information message', async () => {
            // Arrange
            const message = 'x'.repeat(10000) // 10KB message
            vi.mocked(vscode.window.showInformationMessage).mockResolvedValue(undefined)

            // Act
            await adapter.showInformationMessage(message)

            // Assert
            expect(vscode.window.showInformationMessage).toHaveBeenCalledWith(message)
        })

        it('should handle information message with special characters', async () => {
            // Arrange
            const message = 'Info with special chars: !@#$%^&*()_+-=[]{}|;:,.<>?'
            vi.mocked(vscode.window.showInformationMessage).mockResolvedValue(undefined)

            // Act
            await adapter.showInformationMessage(message)

            // Assert
            expect(vscode.window.showInformationMessage).toHaveBeenCalledWith(message)
        })

        it('should handle information message with Unicode characters', async () => {
            // Arrange
            const message = 'Info with Unicode: 中文 🚀 émojis'
            vi.mocked(vscode.window.showInformationMessage).mockResolvedValue(undefined)

            // Act
            await adapter.showInformationMessage(message)

            // Assert
            expect(vscode.window.showInformationMessage).toHaveBeenCalledWith(message)
        })
    })

    describe('Timed Information Message Handling', () => {
        it('should handle empty timed information message', async () => {
            // Arrange
            const message = ''
            vi.mocked(vscode.window.showInformationMessage).mockResolvedValue(undefined)

            // Act
            await adapter.showTimedInformationMessage(message)

            // Assert
            expect(vscode.window.showInformationMessage).toHaveBeenCalledWith(message)
        })

        it('should handle null timed information message', async () => {
            // Arrange
            const message = null as any
            vi.mocked(vscode.window.showInformationMessage).mockResolvedValue(undefined)

            // Act
            await adapter.showTimedInformationMessage(message)

            // Assert
            expect(vscode.window.showInformationMessage).toHaveBeenCalledWith(message)
        })

        it('should handle undefined timed information message', async () => {
            // Arrange
            const message = undefined as any
            vi.mocked(vscode.window.showInformationMessage).mockResolvedValue(undefined)

            // Act
            await adapter.showTimedInformationMessage(message)

            // Assert
            expect(vscode.window.showInformationMessage).toHaveBeenCalledWith(message)
        })

        it('should handle very long timed information message', async () => {
            // Arrange
            const message = 'x'.repeat(10000) // 10KB message
            vi.mocked(vscode.window.showInformationMessage).mockResolvedValue(undefined)

            // Act
            await adapter.showTimedInformationMessage(message)

            // Assert
            expect(vscode.window.showInformationMessage).toHaveBeenCalledWith(message)
        })
    })

    describe('Active Text Editor Edge Cases', () => {
        it('should handle undefined active text editor', () => {
            // Arrange
            vi.mocked(vscode.window).activeTextEditor = undefined

            // Act
            const result = adapter.activeTextEditor

            // Assert
            expect(result).toBeUndefined()
        })

        it('should handle null active text editor', () => {
            // Arrange
            vi.mocked(vscode.window).activeTextEditor = null as any

            // Act
            const result = adapter.activeTextEditor

            // Assert
            expect(result).toBeNull()
        })

        it('should handle mock active text editor', () => {
            // Arrange
            const mockEditor = {
                document: { fileName: 'test.ts' },
                selection: { active: { line: 0, character: 0 } }
            } as any
            vi.mocked(vscode.window).activeTextEditor = mockEditor

            // Act
            const result = adapter.activeTextEditor

            // Assert
            expect(result).toBe(mockEditor)
        })
    })

    describe('Concurrent Operations', () => {
        it('should handle concurrent error messages', () => {
            // Arrange
            const messages = Array.from({ length: 10 }, (_, i) => `Error message ${i}`)
            vi.mocked(vscode.window.showErrorMessage).mockImplementation(() => Promise.resolve(undefined))

            // Act
            messages.forEach(message => adapter.errMsg(message))

            // Assert
            expect(vscode.window.showErrorMessage).toHaveBeenCalledTimes(10)
            messages.forEach(message => {
                expect(vscode.window.showErrorMessage).toHaveBeenCalledWith(message)
            })
        })

        it('should handle concurrent information messages', async () => {
            // Arrange
            const messages = Array.from({ length: 10 }, (_, i) => `Info message ${i}`)
            vi.mocked(vscode.window.showInformationMessage).mockResolvedValue(undefined)

            // Act
            const promises = messages.map(message => adapter.showInformationMessage(message))
            await Promise.all(promises)

            // Assert
            expect(vscode.window.showInformationMessage).toHaveBeenCalledTimes(10)
            messages.forEach(message => {
                expect(vscode.window.showInformationMessage).toHaveBeenCalledWith(message)
            })
        })

        it('should handle concurrent timed information messages', async () => {
            // Arrange
            const messages = Array.from({ length: 10 }, (_, i) => `Timed info message ${i}`)
            vi.mocked(vscode.window.showInformationMessage).mockResolvedValue(undefined)

            // Act
            const promises = messages.map(message => adapter.showTimedInformationMessage(message))
            await Promise.all(promises)

            // Assert
            expect(vscode.window.showInformationMessage).toHaveBeenCalledTimes(10)
            messages.forEach(message => {
                expect(vscode.window.showInformationMessage).toHaveBeenCalledWith(message)
            })
        })
    })

    describe('Performance Scenarios', () => {
        it('should handle rapid sequential error messages', () => {
            // Arrange
            const messageCount = 100
            vi.mocked(vscode.window.showErrorMessage).mockImplementation(() => Promise.resolve(undefined))

            // Act
            for (let i = 0; i < messageCount; i++) {
                adapter.errMsg(`Error message ${i}`)
            }

            // Assert
            expect(vscode.window.showErrorMessage).toHaveBeenCalledTimes(messageCount)
        })

        it('should handle rapid sequential information messages', async () => {
            // Arrange
            const messageCount = 100
            vi.mocked(vscode.window.showInformationMessage).mockResolvedValue(undefined)

            // Act
            for (let i = 0; i < messageCount; i++) {
                await adapter.showInformationMessage(`Info message ${i}`)
            }

            // Assert
            expect(vscode.window.showInformationMessage).toHaveBeenCalledTimes(messageCount)
        })
    })

    describe('Integration Scenarios', () => {
        it('should handle mixed message types', async () => {
            // Arrange
            vi.mocked(vscode.window.showErrorMessage).mockImplementation(() => Promise.resolve(undefined))
            vi.mocked(vscode.window.showInformationMessage).mockResolvedValue(undefined)

            // Act
            adapter.errMsg('Error occurred')
            await adapter.showInformationMessage('Info message')
            await adapter.showTimedInformationMessage('Timed info message')

            // Assert
            expect(vscode.window.showErrorMessage).toHaveBeenCalledWith('Error occurred')
            expect(vscode.window.showInformationMessage).toHaveBeenCalledWith('Info message')
            expect(vscode.window.showInformationMessage).toHaveBeenCalledWith('Timed info message')
        })

        it('should handle message with different return values', async () => {
            // Arrange
            vi.mocked(vscode.window.showInformationMessage).mockResolvedValue('User clicked OK')

            // Act
            const infoResult = await adapter.showInformationMessage('Info message')
            const timedResult = await adapter.showTimedInformationMessage('Timed info message')

            // Assert
            expect(infoResult).toBe('User clicked OK')
            expect(timedResult).toBe('User clicked OK') // Both methods use the same underlying API
        })
    })
})
