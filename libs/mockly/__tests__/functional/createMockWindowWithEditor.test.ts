import { describe, it, expect, vi } from 'vitest'
import { createMockWindowWithEditor } from '../../src/testing/createMockWindowWithEditor.js'

describe('createMockWindowWithEditor', () => {
	describe('basic functionality', () => {
		it('should create a mock window with editor', () => {
			const mockWindow = createMockWindowWithEditor()
			
			expect(mockWindow).toBeDefined()
			expect(mockWindow.activeTextEditor).toBeUndefined() // Initially undefined
		})

		it('should create window with default input', () => {
			const mockWindow = createMockWindowWithEditor()
			
			expect(mockWindow).toBeDefined()
			expect(typeof mockWindow.showInputBox).toBe('function')
		})

		it('should create window with custom input', () => {
			const mockWindow = createMockWindowWithEditor('CustomInput')
			
			expect(mockWindow).toBeDefined()
			expect(typeof mockWindow.showInputBox).toBe('function')
		})
	})

	describe('window properties', () => {
		it('should have all required window properties', () => {
			const mockWindow = createMockWindowWithEditor()
			
			// Check that all expected properties exist
			expect(mockWindow).toHaveProperty('activeTextEditor')
			expect(mockWindow).toHaveProperty('showErrorMessage')
			expect(mockWindow).toHaveProperty('showInformationMessage')
			expect(mockWindow).toHaveProperty('showWarningMessage')
			expect(mockWindow).toHaveProperty('showInputBox')
			expect(mockWindow).toHaveProperty('showTextDocument')
			expect(mockWindow).toHaveProperty('withProgress')
		})

		it('should have functional message methods', () => {
			const mockWindow = createMockWindowWithEditor()
			
			// These should be functions that can be called
			expect(typeof mockWindow.showErrorMessage).toBe('function')
			expect(typeof mockWindow.showInformationMessage).toBe('function')
			expect(typeof mockWindow.showWarningMessage).toBe('function')
			expect(typeof mockWindow.showInputBox).toBe('function')
			expect(typeof mockWindow.showTextDocument).toBe('function')
			expect(typeof mockWindow.withProgress).toBe('function')
		})
	})

	describe('showTextDocument functionality', () => {
		it('should create editor when showTextDocument is called', async () => {
			const mockWindow = createMockWindowWithEditor()
			const mockDocument = { uri: { fsPath: '/test/path' } }
			
			const editor = await mockWindow.showTextDocument(mockDocument)
			
			expect(editor).toBeDefined()
			expect(editor.document).toBe(mockDocument)
			expect(editor.selection).toBeDefined()
			expect(editor.selection.start).toEqual({ line: 0, character: 0 })
			expect(editor.selection.end).toEqual({ line: 0, character: 0 })
		})

		it('should set activeTextEditor after showTextDocument', async () => {
			const mockWindow = createMockWindowWithEditor()
			const mockDocument = { uri: { fsPath: '/test/path' } }
			
			await mockWindow.showTextDocument(mockDocument)
			
			expect(mockWindow.activeTextEditor).toBeDefined()
			expect(mockWindow.activeTextEditor?.document).toBe(mockDocument)
		})

		it('should have editor with selection methods', async () => {
			const mockWindow = createMockWindowWithEditor()
			const mockDocument = { uri: { fsPath: '/test/path' } }
			
			const editor = await mockWindow.showTextDocument(mockDocument)
			
			expect(typeof editor.moveCursor).toBe('function')
			expect(typeof editor.selectText).toBe('function')
			expect(typeof editor.modifyDocument).toBe('function')
		})
	})

	describe('editor interaction methods', () => {
		it('should move cursor when moveCursor is called', async () => {
			const mockWindow = createMockWindowWithEditor()
			const mockDocument = { uri: { fsPath: '/test/path' } }
			
			const editor = await mockWindow.showTextDocument(mockDocument)

			editor.moveCursor(5, 10)
			
			expect(editor.selection.start).toEqual({ line: 5, character: 10 })
			expect(editor.selection.end).toEqual({ line: 5, character: 10 })
		})

		it('should select text when selectText is called', async () => {
			const mockWindow = createMockWindowWithEditor()
			const mockDocument = { uri: { fsPath: '/test/path' } }
			
			const editor = await mockWindow.showTextDocument(mockDocument)

			editor.selectText(1, 5, 3, 15)
			
			expect(editor.selection.start).toEqual({ line: 1, character: 5 })
			expect(editor.selection.end).toEqual({ line: 3, character: 15 })
		})

		it('should modify document when modifyDocument is called', async () => {
			const mockWindow = createMockWindowWithEditor()
			const mockDocument = {
				uri: { fsPath: '/test/path' },
				setContent: vi.fn(),
			}
			
			const editor = await mockWindow.showTextDocument(mockDocument)

			editor.modifyDocument('new content')
			
			expect(mockDocument.setContent).toHaveBeenCalledWith('new content')
		})
	})

	describe('withProgress functionality', () => {
		it('should execute task with progress reporting', async () => {
			const mockWindow = createMockWindowWithEditor()
			let progressReported = false
			
			const result = await mockWindow.withProgress(
				{ title: 'Test Progress', cancellable: false },
				async (progress) => {
					progress.report({ message: 'Working...' })
					progressReported = true
					return 'completed'
				},
			)
			
			expect(result).toBe('completed')
			expect(progressReported).toBe(true)
		})
	})

	describe('input box functionality', () => {
		it('should return default input when showInputBox is called', async () => {
			const mockWindow = createMockWindowWithEditor('DefaultInput')
			
			const result = await mockWindow.showInputBox()
			
			expect(result).toBe('DefaultInput')
		})

		it('should return custom input when showInputBox is called', async () => {
			const mockWindow = createMockWindowWithEditor('CustomInput')
			
			const result = await mockWindow.showInputBox()
			
			expect(result).toBe('CustomInput')
		})
	})

	describe('message methods', () => {
		it('should have functional showErrorMessage', async () => {
			const mockWindow = createMockWindowWithEditor()
			
			const result = await mockWindow.showErrorMessage('test error')
			
			expect(result).toBeUndefined()
		})

		it('should have functional showInformationMessage', async () => {
			const mockWindow = createMockWindowWithEditor()
			
			const result = await mockWindow.showInformationMessage('test info')
			
			expect(result).toBeUndefined()
		})

		it('should have functional showWarningMessage', async () => {
			const mockWindow = createMockWindowWithEditor()
			
			const result = await mockWindow.showWarningMessage('test warning')
			
			expect(result).toBeUndefined()
		})
	})

	describe('integration with mockly service', () => {
		it('should create window compatible with mockly service', () => {
			const mockWindow = createMockWindowWithEditor()
			
			// The window should have all the properties that mockly expects
			expect(mockWindow).toHaveProperty('activeTextEditor')
			expect(typeof mockWindow.showTextDocument).toBe('function')
		})

		it('should provide consistent mock structure', () => {
			const mockWindow1 = createMockWindowWithEditor()
			const mockWindow2 = createMockWindowWithEditor()
			
			// Both windows should have the same structure
			expect(Object.keys(mockWindow1)).toEqual(Object.keys(mockWindow2))
		})
	})
})
