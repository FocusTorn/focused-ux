import { vi, beforeAll, afterAll, afterEach } from 'vitest'
import process from 'node:process'
import { Buffer } from 'node:buffer'
import * as vscode from 'vscode'

// 1) Mock js-yaml globally 
vi.mock('js-yaml', () => ({
	load: vi.fn((content: string) => {
		// Simple mock implementation for testing
		if (!content || content.trim() === '')
			return undefined
		if (content.trim() === 'key: value')
			return { key: 'value' }
		if (content.includes('ProjectButler')) {
			return {
				ProjectButler: {
					'packageJson-order': ['name', 'version', 'scripts'],
				},
			}
		}
		return {}
	}),
}))

// 2) Mock vscode globally (no real VSCode API calls)
vi.mock('vscode', () => ({
	commands: {
		registerCommand: vi.fn(),
	},
	window: {
		showInformationMessage: vi.fn(),
		showWarningMessage: vi.fn(),
		showErrorMessage: vi.fn(),
		createTerminal: vi.fn(),
		activeTextEditor: null,
		activeTerminal: null,
	},
	workspace: {
		workspaceFolders: [
			{ uri: { fsPath: '/test/workspace' } },
		],
		fs: {
			readFile: vi.fn(),
			writeFile: vi.fn(),
			stat: vi.fn(),
			copy: vi.fn(),
		},
	},
	Uri: {
		file: vi.fn((path: string) => ({ fsPath: path })),
	},
	FileType: {
		Directory: 1,
		File: 2,
	},
	Terminal: class MockTerminal {

		constructor(public name?: string) {}
		sendText = vi.fn()
		show = vi.fn()
	
	},
	TextEditor: class MockTextEditor {

		document = {
			uri: { fsPath: '/test/file.txt' },
		}
	
	},
}))

// 3) Use fake timers globally (no real waits)
beforeAll(() => {
	vi.useFakeTimers()
})

afterAll(() => {
	vi.useRealTimers()
})

// 4) Keep mocks clean between tests
afterEach(() => {
	vi.clearAllMocks()
})

// Console output configuration for tests
// Set this to true to enable console output for debugging
const ENABLE_CONSOLE_OUTPUT = process.env.ENABLE_TEST_CONSOLE === 'true'

if (ENABLE_CONSOLE_OUTPUT) {
	// Enable console output for debugging
	console.log('🔍 Test console output enabled - use ENABLE_TEST_CONSOLE=true to enable')
}
else {
	// Silence console by default to reduce noise and make assertions stable.
	// Use ENABLE_TEST_CONSOLE=true to opt-in when debugging.
	console.log = vi.fn()
	console.info = vi.fn()
	console.warn = vi.fn()
	console.error = vi.fn()
}

// Export a function to enable console output programmatically
export function enableTestConsoleOutput() {
	if (!ENABLE_CONSOLE_OUTPUT) {
		// Restore original console methods
		console.log = console.log || (() => {})
		console.info = console.info || (() => {})
		console.warn = console.warn || (() => {})
		console.error = console.error || (() => {})
		console.log('🔍 Test console output enabled programmatically')
	}
}

// ============================================================================
// TEST HELPERS
// ============================================================================

export interface ExtensionTestMocks {
	vscode: {
		commands: {
			registerCommand: ReturnType<typeof vi.fn>
		}
		window: {
			showInformationMessage: ReturnType<typeof vi.fn>
			showWarningMessage: ReturnType<typeof vi.fn>
			showErrorMessage: ReturnType<typeof vi.fn>
			activeTextEditor: vscode.TextEditor | undefined
			createTerminal: ReturnType<typeof vi.fn>
			activeTerminal: vscode.Terminal | undefined
		}
		workspace: {
			fs: {
				readFile: ReturnType<typeof vi.fn>
				writeFile: ReturnType<typeof vi.fn>
				stat: ReturnType<typeof vi.fn>
				copy: ReturnType<typeof vi.fn>
			}
			workspaceFolders: vscode.WorkspaceFolder[] | undefined
		}
		Uri: {
			file: ReturnType<typeof vi.fn>
		}
		FileType: {
			Directory: vscode.FileType.Directory
			File: vscode.FileType.File
		}
	}
	context: {
		subscriptions: vscode.Disposable[]
	}
}

export function setupTestEnvironment(): ExtensionTestMocks {
	const mockTerminal = {
		sendText: vi.fn(),
		show: vi.fn(),
	} as any

	const mockTextEditor = {
		document: {
			uri: {
				fsPath: '/test/file.txt',
			},
		},
	} as any

	const mockWorkspaceFolder = {
		uri: {
			fsPath: '/test',
		},
	} as any

	const vscode = {
		commands: {
			registerCommand: vi.fn(),
		},
		window: {
			showInformationMessage: vi.fn(),
			showWarningMessage: vi.fn(),
			showErrorMessage: vi.fn(),
			activeTextEditor: mockTextEditor,
			createTerminal: vi.fn().mockReturnValue(mockTerminal),
			activeTerminal: mockTerminal,
		},
		workspace: {
			fs: {
				readFile: vi.fn(),
				writeFile: vi.fn(),
				stat: vi.fn(),
				copy: vi.fn(),
			},
			workspaceFolders: [mockWorkspaceFolder],
		},
		Uri: {
			file: vi.fn().mockImplementation((path: string) => ({ fsPath: path })),
		},
		FileType: {
			Directory: 1,
			File: 2,
		},
	}

	const context = {
		subscriptions: [],
	}

	return {
		vscode,
		context,
	}
}

export function resetAllMocks(mocks: ExtensionTestMocks): void {
	Object.values(mocks.vscode.commands).forEach(mock => mock.mockReset())
	Object.values(mocks.vscode.window).forEach((mock) => {
		if (typeof mock === 'function') {
			mock.mockReset()
		}
	})
	Object.values(mocks.vscode.workspace.fs).forEach(mock => mock.mockReset())
	mocks.vscode.Uri.file.mockReset()
}

export function setupVSCodeMocks(mocks: ExtensionTestMocks): void {
	// Default implementations
	mocks.vscode.window.showInformationMessage.mockResolvedValue(undefined)
	mocks.vscode.window.showWarningMessage.mockResolvedValue(undefined)
	mocks.vscode.window.showErrorMessage.mockResolvedValue(undefined)
	mocks.vscode.workspace.fs.readFile.mockResolvedValue(Buffer.from('file content'))
	mocks.vscode.workspace.fs.writeFile.mockResolvedValue(undefined)
	mocks.vscode.workspace.fs.stat.mockResolvedValue({ type: mocks.vscode.FileType.File })
	mocks.vscode.workspace.fs.copy.mockResolvedValue(undefined)
}

export function createMockExtensionContext(): vscode.ExtensionContext {
	return {
		subscriptions: [],
		workspaceState: {} as any,
		globalState: {} as any,
		extensionPath: '/test/extension',
		globalStoragePath: '/test/global',
		logPath: '/test/log',
		extensionUri: { fsPath: '/test/extension' } as any,
		storageUri: { fsPath: '/test/storage' } as any,
		globalStorageUri: { fsPath: '/test/global' } as any,
		logUri: { fsPath: '/test/log' } as any,
		extensionMode: 1,
		environmentVariableCollection: {} as any,
		secrets: {} as any,
		asAbsolutePath: vi.fn(),
		storagePath: '/test/storage',
		extension: {} as any,
		languageModelAccessInformation: {} as any,
	}
}

export function createMockUri(path: string): vscode.Uri {
	return {
		fsPath: path,
		scheme: 'file',
		authority: '',
		path,
		query: '',
		fragment: '',
		with: vi.fn(),
		toJSON: vi.fn(),
	} as any
}

// ============================================================================
// VSCode Mock Scenarios for Extension Tests
// ============================================================================

/**
 * Extension-specific mock scenarios for common VSCode operations
 */

export interface VSCodeFileScenarioOptions {
	filePath: string
	content?: string
	fileType?: 'file' | 'directory'
}

export interface VSCodeCommandScenarioOptions {
	commandName: string
	shouldSucceed?: boolean
	errorMessage?: string
}

export interface VSCodeWorkspaceScenarioOptions {
	workspacePath: string
	filePaths?: string[]
}

// File System Scenarios
export function setupVSCodeFileReadScenario(mocks: ExtensionTestMocks, options: VSCodeFileScenarioOptions): void {
	const { filePath, content = 'file content' } = options
	const buffer = Buffer.from(content)
	
	// Use global mocks instead of local mocks
	vi.mocked(vscode.Uri.file).mockReturnValue({ fsPath: filePath })
	vi.mocked(vscode.workspace.fs.readFile).mockResolvedValue(buffer)
}

export function setupVSCodeFileWriteScenario(mocks: ExtensionTestMocks, options: VSCodeFileScenarioOptions): void {
	const { filePath, content = 'file content' } = options
	
	// Use global mocks instead of local mocks
	vi.mocked(vscode.Uri.file).mockReturnValue({ fsPath: filePath })
	vi.mocked(vscode.workspace.fs.writeFile).mockResolvedValue(undefined)
}

export function setupVSCodeFileStatScenario(mocks: ExtensionTestMocks, options: VSCodeFileScenarioOptions): void {
	const { filePath, fileType = 'file' } = options
	const fileTypeValue = fileType === 'file' ? vscode.FileType.File : vscode.FileType.Directory
	
	// Use global mocks instead of local mocks
	vi.mocked(vscode.Uri.file).mockReturnValue({ fsPath: filePath })
	vi.mocked(vscode.workspace.fs.stat).mockResolvedValue({ type: fileTypeValue })
}

export function setupVSCodeFileCopyScenario(mocks: ExtensionTestMocks, sourcePath: string, destinationPath: string): void {
	// Use global mocks instead of local mocks
	vi.mocked(vscode.Uri.file)
		.mockReturnValueOnce({ fsPath: sourcePath })
		.mockReturnValueOnce({ fsPath: destinationPath })
	vi.mocked(vscode.workspace.fs.copy).mockResolvedValue(undefined)
}

// Command Registration Scenarios
export function setupVSCodeCommandRegistrationScenario(mocks: ExtensionTestMocks, options: VSCodeCommandScenarioOptions): void {
	const { commandName, shouldSucceed = true, errorMessage = 'Command failed' } = options
	const mockDisposable = { dispose: vi.fn() }
	
	if (shouldSucceed) {
		// Use global mocks instead of local mocks
		vi.mocked(vscode.commands.registerCommand).mockReturnValue(mockDisposable)
	} else {
		vi.mocked(vscode.commands.registerCommand).mockImplementation(() => {
			throw new Error(errorMessage)
		})
	}
}

// Window/UI Scenarios
export function setupVSCodeWindowMessageScenario(mocks: ExtensionTestMocks, messageType: 'info' | 'warning' | 'error', message: string): void {
	switch (messageType) {
		case 'info':
			// Use global mocks instead of local mocks
			vi.mocked(vscode.window.showInformationMessage).mockResolvedValue(undefined)
			break
		case 'warning':
			vi.mocked(vscode.window.showWarningMessage).mockResolvedValue(undefined)
			break
		case 'error':
			vi.mocked(vscode.window.showErrorMessage).mockResolvedValue(undefined)
			break
	}
}

// Workspace Scenarios
export function setupVSCodeWorkspaceScenario(mocks: ExtensionTestMocks, options: VSCodeWorkspaceScenarioOptions): void {
	const { workspacePath, filePaths = [] } = options
	
	const mockWorkspaceFolder = {
		uri: { fsPath: workspacePath },
	}
	
	mocks.vscode.workspace.workspaceFolders = [mockWorkspaceFolder]
	
	// Setup file system mocks for each file
	filePaths.forEach(filePath => {
		setupVSCodeFileStatScenario(mocks, { filePath, fileType: 'file' })
	})
}

// Terminal Scenarios
export function setupVSCodeTerminalScenario(mocks: ExtensionTestMocks, terminalName?: string): void {
	const mockTerminal = {
		sendText: vi.fn(),
		show: vi.fn(),
		name: terminalName,
	}
	
	mocks.vscode.window.createTerminal.mockReturnValue(mockTerminal)
	mocks.vscode.window.activeTerminal = mockTerminal
}

// Extension Context Scenarios
export function setupVSCodeExtensionContextScenario(mocks: ExtensionTestMocks): void {
	const mockDisposable = { dispose: vi.fn() }
	mocks.context.subscriptions.push(mockDisposable)
}

// Error Scenarios
export function setupVSCodeErrorScenario(mocks: ExtensionTestMocks, errorType: 'fileSystem' | 'command' | 'workspace', errorMessage: string): void {
	switch (errorType) {
		case 'fileSystem':
			// Use global mocks instead of local mocks
			vi.mocked(vscode.workspace.fs.readFile).mockRejectedValue(new Error(errorMessage))
			vi.mocked(vscode.workspace.fs.writeFile).mockRejectedValue(new Error(errorMessage))
			vi.mocked(vscode.workspace.fs.stat).mockRejectedValue(new Error(errorMessage))
			break
		case 'command':
			vi.mocked(vscode.commands.registerCommand).mockImplementation(() => {
				throw new Error(errorMessage)
			})
			break
		case 'workspace':
			// Can't directly assign to mocked property, need to mock the getter
			Object.defineProperty(vscode.workspace, 'workspaceFolders', {
				get: () => undefined,
				configurable: true
			})
			break
	}
}

// ============================================================================
// Extension Mock Builder Pattern
// ============================================================================

export class ExtensionMockBuilder {
	constructor(private mocks: ExtensionTestMocks) {}

	fileRead(options: VSCodeFileScenarioOptions): ExtensionMockBuilder {
		setupVSCodeFileReadScenario(this.mocks, options)
		return this
	}

	fileWrite(options: VSCodeFileScenarioOptions): ExtensionMockBuilder {
		setupVSCodeFileWriteScenario(this.mocks, options)
		return this
	}

	fileStat(options: VSCodeFileScenarioOptions): ExtensionMockBuilder {
		setupVSCodeFileStatScenario(this.mocks, options)
		return this
	}

	fileCopy(sourcePath: string, destinationPath: string): ExtensionMockBuilder {
		setupVSCodeFileCopyScenario(this.mocks, sourcePath, destinationPath)
		return this
	}

	commandRegistration(options: VSCodeCommandScenarioOptions): ExtensionMockBuilder {
		setupVSCodeCommandRegistrationScenario(this.mocks, options)
		return this
	}

	windowMessage(messageType: 'info' | 'warning' | 'error', message: string): ExtensionMockBuilder {
		setupVSCodeWindowMessageScenario(this.mocks, messageType, message)
		return this
	}

	workspace(options: VSCodeWorkspaceScenarioOptions): ExtensionMockBuilder {
		setupVSCodeWorkspaceScenario(this.mocks, options)
		return this
	}

	terminal(terminalName?: string): ExtensionMockBuilder {
		setupVSCodeTerminalScenario(this.mocks, terminalName)
		return this
	}

	error(errorType: 'fileSystem' | 'command' | 'workspace', errorMessage: string): ExtensionMockBuilder {
		setupVSCodeErrorScenario(this.mocks, errorType, errorMessage)
		return this
	}

	build(): ExtensionTestMocks {
		return this.mocks
	}
}

export function createExtensionMockBuilder(mocks: ExtensionTestMocks): ExtensionMockBuilder {
	return new ExtensionMockBuilder(mocks)
}