import { describe, it, expect, beforeEach, vi } from 'vitest'
import { WindowAdapter } from '../../src/adapters/Window.adapter.js'
import type { IWindow } from '../../src/_interfaces/IWindow.js'
import * as vscode from 'vscode'

describe('WindowAdapter', () => {
	let adapter: IWindow

	beforeEach(() => {
		vi.clearAllMocks()
		adapter = new WindowAdapter()
	})

	describe('showInformationMessage', () => {
		it('should show information message with default options', async () => {
			const message = 'Test information message'

			await adapter.showInformationMessage(message)

			expect(vscode.window.showInformationMessage).toHaveBeenCalledWith(message)
		})

		it('should show information message with actions', async () => {
			const message = 'Test message with actions'
			const actions = ['Yes', 'No', 'Cancel']

			await adapter.showInformationMessage(message, ...actions)

			expect(vscode.window.showInformationMessage).toHaveBeenCalledWith(message, ...actions)
		})

		it('should handle information message with modal option', async () => {
			const message = 'Modal message'
			const actions = ['OK']
			const modal = true

			await adapter.showInformationMessage(message, modal, ...actions)

			expect(vscode.window.showInformationMessage).toHaveBeenCalledWith(message, { modal }, ...actions)
		})
	})

	describe('showWarningMessage', () => {
		it('should show warning message', async () => {
			const message = 'Test warning message'

			await adapter.showWarningMessage(message)

			expect(vscode.window.showWarningMessage).toHaveBeenCalledWith(message)
		})

		it('should show warning message with actions', async () => {
			const message = 'Warning with actions'
			const actions = ['Continue', 'Abort']

			await adapter.showWarningMessage(message, ...actions)

			expect(vscode.window.showWarningMessage).toHaveBeenCalledWith(message, ...actions)
		})
	})

	describe('showErrorMessage', () => {
		it('should show error message', async () => {
			const message = 'Test error message'

			await adapter.showErrorMessage(message)

			expect(vscode.window.showErrorMessage).toHaveBeenCalledWith(message)
		})

		it('should show error message with actions', async () => {
			const message = 'Error with actions'
			const actions = ['Retry', 'Cancel']

			await adapter.showErrorMessage(message, ...actions)

			expect(vscode.window.showErrorMessage).toHaveBeenCalledWith(message, ...actions)
		})
	})

	describe('showInputBox', () => {
		it('should show input box with default options', async () => {
			const prompt = 'Enter your name'
			const options = { prompt }

			await adapter.showInputBox(options)

			expect(vscode.window.showInputBox).toHaveBeenCalledWith(options)
		})

		it('should show input box with options', async () => {
			const options = {
				prompt: 'Enter your name',
				placeHolder: 'John Doe',
				value: 'Default Name',
				password: false,
			}

			await adapter.showInputBox(options)

			expect(vscode.window.showInputBox).toHaveBeenCalledWith(options)
		})

		it('should handle input box cancellation', async () => {
			const options = { prompt: 'Enter your name' }
            
			vi.mocked(vscode.window.showInputBox).mockResolvedValueOnce(undefined)

			const result = await adapter.showInputBox(options)

			expect(result).toBeUndefined()
			expect(vscode.window.showInputBox).toHaveBeenCalledWith(options)
		})
	})

	describe('showTextDocument', () => {
		it('should show text document', async () => {
			const document = { uri: { fsPath: '/test/file.md' } }

			await adapter.showTextDocument(document)

			expect(vscode.window.showTextDocument).toHaveBeenCalledWith(document)
		})

		it('should show text document with options', async () => {
			const document = { uri: { fsPath: '/test/file.md' } }
			const options = { preview: false, viewColumn: 1 }

			await adapter.showTextDocument(document, options)

			expect(vscode.window.showTextDocument).toHaveBeenCalledWith(document, options)
		})
	})

	describe('withProgress', () => {
		it('should execute task with progress', async () => {
			const options = {
				location: 1,
				title: 'Processing...',
				cancellable: false,
			}
			const task = vi.fn().mockResolvedValue('result')

			const result = await adapter.withProgress(options, task)

			expect(vscode.window.withProgress).toHaveBeenCalledWith(options, task)
			expect(result).toBe('result')
		})

		it('should handle progress task errors', async () => {
			const options = { location: 1, title: 'Processing...' }
			const error = new Error('Task failed')
			const task = vi.fn().mockRejectedValue(error)

			await expect(adapter.withProgress(options, task)).rejects.toThrow('Task failed')
			expect(vscode.window.withProgress).toHaveBeenCalledWith(options, task)
		})
	})

	describe('registerTreeDataProvider', () => {
		it('should register tree data provider', () => {
			const viewId = 'notesHubView'
			const treeDataProvider = {
				getTreeItem: vi.fn(),
				getChildren: vi.fn(),
			}

			const disposable = adapter.registerTreeDataProvider(viewId, treeDataProvider)

			expect(vscode.window.registerTreeDataProvider).toHaveBeenCalledWith(viewId, treeDataProvider)
			expect(disposable).toBeDefined()
			expect(disposable.dispose).toBeDefined()
		})

		it('should handle multiple tree data provider registrations', () => {
			const view1 = 'notesHubView1'
			const view2 = 'notesHubView2'
			const provider1 = { getTreeItem: vi.fn(), getChildren: vi.fn() }
			const provider2 = { getTreeItem: vi.fn(), getChildren: vi.fn() }

			const disposable1 = adapter.registerTreeDataProvider(view1, provider1)
			const disposable2 = adapter.registerTreeDataProvider(view2, provider2)

			expect(vscode.window.registerTreeDataProvider).toHaveBeenCalledTimes(2)
			expect(vscode.window.registerTreeDataProvider).toHaveBeenCalledWith(view1, provider1)
			expect(vscode.window.registerTreeDataProvider).toHaveBeenCalledWith(view2, provider2)
			expect(disposable1).toBeDefined()
			expect(disposable2).toBeDefined()
		})
	})

	describe('disposable management', () => {
		it('should properly dispose tree data providers', () => {
			const viewId = 'notesHubView'
			const treeDataProvider = { getTreeItem: vi.fn(), getChildren: vi.fn() }
			const mockDispose = vi.fn()

			vi.mocked(vscode.window.registerTreeDataProvider).mockReturnValueOnce({ dispose: mockDispose })

			const disposable = adapter.registerTreeDataProvider(viewId, treeDataProvider)

			disposable.dispose()

			expect(mockDispose).toHaveBeenCalled()
		})
	})

	describe('integration scenarios', () => {
		it('should handle complete user interaction workflow', async () => {
			const message = 'Do you want to create a new note?'
			const actions = ['Yes', 'No']
			const inputPrompt = 'Enter note name:'
			const noteName = 'My Note'

			// Show confirmation dialog
			vi.mocked(vscode.window.showInformationMessage).mockResolvedValueOnce('Yes')

			const action = await adapter.showInformationMessage(message, ...actions)

			// Show input box for note name
			vi.mocked(vscode.window.showInputBox).mockResolvedValueOnce(noteName)

			const result = await adapter.showInputBox({ prompt: inputPrompt })

			expect(action).toBe('Yes')
			expect(result).toBe(noteName)
			expect(vscode.window.showInformationMessage).toHaveBeenCalledWith(message, ...actions)
			expect(vscode.window.showInputBox).toHaveBeenCalledWith({ prompt: inputPrompt })
		})

		it('should handle error recovery workflow', async () => {
			const errorMessage = 'Failed to save file'
			const retryActions = ['Retry', 'Cancel']

			// Show error message
			vi.mocked(vscode.window.showErrorMessage).mockResolvedValueOnce('Retry')

			const action = await adapter.showErrorMessage(errorMessage, ...retryActions)

			expect(action).toBe('Retry')
			expect(vscode.window.showErrorMessage).toHaveBeenCalledWith(errorMessage, ...retryActions)
		})
	})
})
