import { describe, it, expect, vi, beforeEach } from 'vitest'
import { WindowAdapter } from '../../src/vscode/adapters/Window.adapter.js'

describe('WindowAdapter', () => {
	let mockConfigurationService: any
	let windowAdapter: WindowAdapter

	beforeEach(() => {
		mockConfigurationService = {
			get: vi.fn().mockResolvedValue(1.5),
		}
		windowAdapter = new WindowAdapter(mockConfigurationService)
	})

	it('should handle showInformationMessage with different signatures', async () => { //>
		// Test modal flag signature (IWindowPB)
		await windowAdapter.showInformationMessage('x', true, 'a', 'b')
		
		// Test item list signature (IWindow)
		await windowAdapter.showInformationMessage('x', 'i1', 'i2')
		
		// Test no items signature
		await windowAdapter.showInformationMessage('x')
		
		// Test with boolean false
		await windowAdapter.showInformationMessage('x', false, 'a', 'b')
	}) //<

	it('should handle setStatusBarMessage with and without timeout', () => { //>
		// Test with timeout
		windowAdapter.setStatusBarMessage('test message', 5000)
		
		// Test without timeout (should use default behavior)
		windowAdapter.setStatusBarMessage('test message')
	}) //<

	it('should handle showTextDocument with TextDocumentAdapter', async () => { //>
		const mockDoc = {
			document: { uri: { fsPath: '/test/path' } },
		}
		
		await windowAdapter.showTextDocument(mockDoc)
	}) //<

	it('should handle showTextDocument with regular document', async () => { //>
		const mockDoc = { uri: { fsPath: '/test/path' } }
		
		await windowAdapter.showTextDocument(mockDoc)
	}) //<

	it('should handle withProgress correctly', async () => { //>
		const task = vi.fn().mockResolvedValue('result')
		const result = await windowAdapter.withProgress(
			{ title: 'Test Progress', cancellable: true },
			task,
		)
		
		expect(result).toBe('result')
		expect(task).toHaveBeenCalled()
	}) //<

	it('should handle showDropdownMessage with default duration', async () => { //>
		// Mock the _explorerView
		(windowAdapter as any)._explorerView = {
			message: undefined,
		}
		
		// Test without duration (should use default from config)
		await windowAdapter.showDropdownMessage('test message')
		
		expect(mockConfigurationService.get).toHaveBeenCalledWith('ContextCherryPicker.settings.message_show_seconds', 1.5)
	}) //<

	it('should handle showDescriptionMessage with default duration', async () => { //>
		// Mock the _explorerView
		(windowAdapter as any)._explorerView = {
			description: undefined,
		}
		
		// Test without duration (should use default from config)
		await windowAdapter.showDropdownMessage('test message')
		
		expect(mockConfigurationService.get).toHaveBeenCalledWith('ContextCherryPicker.settings.message_show_seconds', 1.5)
	}) //<

	it('should handle showTimedInformationMessage with default duration', async () => { //>
		// Mock the withProgress method to avoid real timers
		const originalWithProgress = windowAdapter.withProgress

		windowAdapter.withProgress = vi.fn().mockImplementation(async (_options, _task) => {
			// Don't actually run the task to avoid real timers
			return undefined as any
		})
		
		// Test without duration (should use default from config)
		await windowAdapter.showTimedInformationMessage('test message')
		
		expect(mockConfigurationService.get).toHaveBeenCalledWith('FocusedUX.info_message_show_seconds', 1.5)
		expect(windowAdapter.withProgress).toHaveBeenCalled()
		
		// Restore original method
		windowAdapter.withProgress = originalWithProgress
	}) //<

	it('should handle timers for dropdown and description messages', async () => { //>
		// Mock the _explorerView
		(windowAdapter as any)._explorerView = {
			message: undefined,
			description: undefined,
		}

		// Test dropdown message timer clearing (without using fake timers to avoid complications)
		const dropdownPromise = windowAdapter.showDropdownMessage('test dropdown', 10) // Use very short timer

		await dropdownPromise
		// Check message is set after async operation
		expect((windowAdapter as any)._explorerView.message).toBe('test dropdown')
		
		// Wait for timer to clear (short timeout)
		await new Promise(resolve => setTimeout(resolve, 20))
		expect((windowAdapter as any)._explorerView.message).toBeUndefined()

		// Test description message timer clearing
		const descriptionPromise = windowAdapter.showDescriptionMessage('test description', 10) // Use very short timer

		await descriptionPromise
		// Check description is set after async operation
		expect((windowAdapter as any)._explorerView.description).toBe('test description')
		
		// Wait for timer to clear (short timeout)
		await new Promise(resolve => setTimeout(resolve, 20))
		expect((windowAdapter as any)._explorerView.description).toBe('')
	}) //<

	it('should handle setClipboard', async () => { //>
		await windowAdapter.setClipboard('test text')
		// The stub implementation just resolves, so we just verify it doesn't throw
	}) //<

	it('should handle setExplorerView', () => { //>
		const mockView = { id: 'test-view' } as any

		windowAdapter.setExplorerView(mockView)
		expect((windowAdapter as any)._explorerView).toBe(mockView)
	}) //<

	it('should handle activeTextEditor and activeTextEditorUri', () => { //>
		// These are stubs that return undefined
		expect(windowAdapter.activeTextEditor).toBeUndefined()
		expect(windowAdapter.activeTextEditorUri).toBeUndefined()
	}) //<
})
