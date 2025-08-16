import { vi } from 'vitest'
import { mockly } from './_setup.js'
import { ProjectButlerService } from '../src/services/ProjectButler.service.js'
import type { IWindow } from '../src/_interfaces/IWindow.js'
import type { ITerminalProvider } from '../src/_interfaces/ITerminal.js'

/**
 * Creates a test instance of ProjectButlerService with Mockly dependencies
 * that implement the same interfaces as shared adapters
 */
export function createTestProjectButlerService(): ProjectButlerService {
	// Mockly services implement the same interfaces as shared adapters
	const mockFileSystem = {
		access: mockly.workspace.fs.access,
		copyFile: mockly.workspace.fs.copyFile,
		stat: mockly.workspace.fs.stat,
		readFile: mockly.workspace.fs.readFile,
		writeFile: mockly.workspace.fs.writeFile,
	}

	const mockWindow: IWindow = {
		activeTextEditorUri: mockly.window.activeTextEditorUri,
		showErrorMessage: mockly.window.showErrorMessage,
		showTimedInformationMessage: vi.fn(), // Mock the custom method
	}

	// Create a properly mocked terminal provider
	const mockTerminalProvider: ITerminalProvider = {
		activeTerminal: undefined, // Start with no active terminal
		createTerminal: vi.fn().mockImplementation((name: string) => ({
			name,
			sendText: vi.fn(),
			show: vi.fn(),
			hide: vi.fn(),
			dispose: vi.fn(),
			processId: Promise.resolve(1),
			creationOptions: {},
			exitStatus: undefined,
			state: 1,
			shellIntegration: undefined,
		})),
	}

	const mockProcess = {
		getWorkspaceRoot: mockly.workspace.getWorkspaceRoot,
	}

	return new ProjectButlerService(
		mockFileSystem,
		mockWindow,
		mockTerminalProvider,
		mockProcess,
	)
}

/**
 * Sets up common Mockly mocks for file system operations
 */
export function setupFileSystemMocks() {
	// Mock file system access
	mockly.workspace.fs.access = vi.fn().mockResolvedValue(undefined)
	mockly.workspace.fs.stat = vi.fn().mockResolvedValue({
		type: 'file',
		isDirectory: () => false,
	} as any)
	mockly.workspace.fs.readFile = vi.fn().mockResolvedValue('file content')
	mockly.workspace.fs.writeFile = vi.fn().mockResolvedValue(undefined)
	mockly.workspace.fs.copyFile = vi.fn().mockResolvedValue(undefined)
}

/**
 * Sets up common Mockly mocks for window operations
 */
export function setupWindowMocks() {
	mockly.window.showErrorMessage = vi.fn()
	mockly.window.showTimedInformationMessage = vi.fn()
	
	// Set up a mock text editor to provide activeTextEditorUri
	const mockUri = { fsPath: '/test/path' }
	const mockDocument = { uri: mockUri }
	const mockEditor = { document: mockDocument }
	
	// Access the private property to set the active text editor
	;(mockly.window as any)._activeTextEditor = mockEditor
}

/**
 * Sets up common Mockly mocks for workspace operations
 */
export function setupWorkspaceMocks() {
	mockly.workspace.getWorkspaceRoot = vi.fn().mockReturnValue('/workspace/root')
}
