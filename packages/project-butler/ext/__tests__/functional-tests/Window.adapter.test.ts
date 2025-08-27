import { describe, it, expect, beforeEach, vi } from 'vitest'
import { WindowAdapter } from '../../src/adapters/Window.adapter'
import * as vscode from 'vscode'

describe('WindowAdapter', () => {
	let adapter: WindowAdapter

	beforeEach(() => {
		vi.clearAllMocks()
		adapter = new WindowAdapter()
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

	describe('showWarningMessage', () => {
		it('should show warning message', async () => {
			// Arrange
			const message = 'Test warning message'

			vi.mocked(vscode.window.showWarningMessage).mockResolvedValue(undefined)

			// Act
			await adapter.showWarningMessage(message)

			// Assert
			expect(vscode.window.showWarningMessage).toHaveBeenCalledWith(message)
		})
	})

	describe('showErrorMessage', () => {
		it('should show error message', async () => {
			// Arrange
			const message = 'Test error message'

			vi.mocked(vscode.window.showErrorMessage).mockResolvedValue(undefined)

			// Act
			await adapter.showErrorMessage(message)

			// Assert
			expect(vscode.window.showErrorMessage).toHaveBeenCalledWith(message)
		})
	})

	describe('getActiveTextEditor', () => {
		it('should return active text editor', () => {
			// Act
			const result = adapter.getActiveTextEditor()

			// Assert
			expect(result).toBe(vscode.window.activeTextEditor)
		})
	})

	describe('createTerminal', () => {
		it('should create terminal with name', () => {
			// Arrange
			const name = 'Test Terminal'
			const mockTerminal = { sendText: vi.fn(), show: vi.fn() }

			vi.mocked(vscode.window.createTerminal).mockReturnValue(mockTerminal)

			// Act
			const result = adapter.createTerminal(name)

			// Assert
			expect(vscode.window.createTerminal).toHaveBeenCalledWith(name)
			expect(result).toBe(mockTerminal)
		})

		it('should create terminal without name', () => {
			// Arrange
			const mockTerminal = { sendText: vi.fn(), show: vi.fn() }

			vi.mocked(vscode.window.createTerminal).mockReturnValue(mockTerminal)

			// Act
			const result = adapter.createTerminal()

			// Assert
			expect(vscode.window.createTerminal).toHaveBeenCalledWith(undefined)
			expect(result).toBe(mockTerminal)
		})
	})

	describe('getActiveTerminal', () => {
		it('should return active terminal', () => {
			// Act
			const result = adapter.getActiveTerminal()

			// Assert
			expect(result).toBe(vscode.window.activeTerminal)
		})
	})
})
