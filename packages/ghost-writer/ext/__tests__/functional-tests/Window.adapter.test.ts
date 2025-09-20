import { describe, it, expect, beforeEach, vi } from 'vitest'
import { WindowAdapter } from '../../src/adapters/Window.adapter'
import * as vscode from 'vscode'

describe('WindowAdapter', () => {
    let adapter: WindowAdapter

    beforeEach(() => {
        vi.clearAllMocks()
        adapter = new WindowAdapter()
    })

    describe('errMsg', () => {
        it('should show error message', () => {
            // Arrange
            const message = 'Test error message'

            vi.mocked(vscode.window.showErrorMessage).mockImplementation(() => Promise.resolve(undefined))

            // Act
            adapter.errMsg(message)

            // Assert
            expect(vscode.window.showErrorMessage).toHaveBeenCalledWith(message)
        })
    })

    describe('showInformationMessage', () => {
        it('should show information message', async () => {
            // Arrange
            const message = 'Test info message'

            vi.mocked(vscode.window.showInformationMessage).mockResolvedValue(undefined)

            // Act
            await adapter.showInformationMessage(message)

            // Assert
            expect(vscode.window.showInformationMessage).toHaveBeenCalledWith(message)
        })
    })

    describe('showTimedInformationMessage', () => {
        it('should show timed information message', async () => {
            // Arrange
            const message = 'Test timed info message'

            vi.mocked(vscode.window.showInformationMessage).mockResolvedValue(undefined)

            // Act
            await adapter.showTimedInformationMessage(message)

            // Assert
            expect(vscode.window.showInformationMessage).toHaveBeenCalledWith(message)
        })
    })

    describe('activeTextEditor', () => {
        it('should return active text editor', () => {
            // Act
            const result = adapter.activeTextEditor

            // Assert
            expect(result).toBe(vscode.window.activeTextEditor)
        })
    })
})
