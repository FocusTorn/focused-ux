import { vi, beforeAll, afterAll, afterEach } from 'vitest'
import process from 'node:process'
import * as vscode from 'vscode'

// Mock vscode globally (no real VSCode API calls)
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
	Position: vi.fn().mockImplementation((line: number, character: number) => ({ line, character })),
	Range: vi.fn().mockImplementation((start: any, end: any) => ({ start, end })),
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

// Use fake timers globally (no real waits)
beforeAll(() => {
	vi.useFakeTimers()
})

afterAll(() => {
	vi.useRealTimers()
})

// Keep mocks clean between tests
afterEach(() => {
	vi.clearAllMocks()
})

// Console output configuration for tests
const ENABLE_CONSOLE_OUTPUT = process.env.ENABLE_TEST_CONSOLE === 'true'

if (!ENABLE_CONSOLE_OUTPUT) {
	// Silence console by default to reduce noise and make assertions stable
	console.log = vi.fn()
	console.info = vi.fn()
	console.warn = vi.fn()
	console.error = vi.fn()
}

// ============================================================================
// Ghost Writer Extension Mock Scenarios
// ============================================================================

/**
 * Enhanced mock strategy for Ghost Writer Extension package
 * Provides reusable mock scenarios for VSCode API testing
 */

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
		Position: ReturnType<typeof vi.fn>
		Range: ReturnType<typeof vi.fn>
		FileType: {
			Directory: vscode.FileType.Directory
			File: vscode.FileType.File
		}
	}
	context: {
		subscriptions: vscode.Disposable[]
		globalState: {
			get: ReturnType<typeof vi.fn>
			update: ReturnType<typeof vi.fn>
		}
		workspaceState: {
			get: ReturnType<typeof vi.fn>
			update: ReturnType<typeof vi.fn>
		}
	}
}

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

export interface VSCodePositionScenarioOptions {
	line: number
	character: number
}

export interface VSCodeRangeScenarioOptions {
	startLine: number
	startCharacter: number
	endLine: number
	endCharacter: number
}

// File System Scenarios
export function setupVSCodeFileReadScenario(mocks: ExtensionTestMocks, options: VSCodeFileScenarioOptions): void {
	const { filePath, content = 'file content' } = options
	const buffer = Buffer.from(content)
	
	vi.mocked(vscode.Uri.file).mockReturnValue({ fsPath: filePath })
	vi.mocked(vscode.workspace.fs.readFile).mockResolvedValue(buffer)
}

export function setupVSCodeFileWriteScenario(mocks: ExtensionTestMocks, options: VSCodeFileScenarioOptions): void {
	const { filePath, content = 'file content' } = options
	
	vi.mocked(vscode.Uri.file).mockReturnValue({ fsPath: filePath })
	vi.mocked(vscode.workspace.fs.writeFile).mockResolvedValue(undefined)
}

export function setupVSCodeFileStatScenario(mocks: ExtensionTestMocks, options: VSCodeFileScenarioOptions): void {
	const { filePath, fileType = 'file' } = options
	const fileTypeValue = fileType === 'file' ? vscode.FileType.File : vscode.FileType.Directory
	
	vi.mocked(vscode.Uri.file).mockReturnValue({ fsPath: filePath })
	vi.mocked(vscode.workspace.fs.stat).mockResolvedValue({ type: fileTypeValue })
}

export function setupVSCodeFileCopyScenario(mocks: ExtensionTestMocks, sourcePath: string, destinationPath: string): void {
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
	
	Object.defineProperty(vscode.workspace, 'workspaceFolders', { 
		get: () => [mockWorkspaceFolder], 
		configurable: true 
	})
	
	// Setup file system mocks for each file
	filePaths.forEach(filePath => {
		setupVSCodeFileStatScenario(mocks, { filePath, fileType: 'file' })
	})
}

// Position/Range Scenarios
export function setupVSCodePositionScenario(mocks: ExtensionTestMocks, options: VSCodePositionScenarioOptions): void {
	const { line, character } = options
	
	vi.mocked(vscode.Position).mockImplementation((l: number, c: number) => ({ line: l, character: c }))
}

export function setupVSCodeRangeScenario(mocks: ExtensionTestMocks, options: VSCodeRangeScenarioOptions): void {
	const { startLine, startCharacter, endLine, endCharacter } = options
	
	vi.mocked(vscode.Range).mockImplementation((start: any, end: any) => ({ start, end }))
}

// Terminal Scenarios
export function setupVSCodeTerminalScenario(mocks: ExtensionTestMocks, terminalName?: string): void {
	const mockTerminal = {
		sendText: vi.fn(),
		show: vi.fn(),
		name: terminalName,
	}
	
	vi.mocked(vscode.window.createTerminal).mockReturnValue(mockTerminal)
	Object.defineProperty(vscode.window, 'activeTerminal', { 
		get: () => mockTerminal, 
		configurable: true 
	})
}

// Extension Context Scenarios
export function setupVSCodeExtensionContextScenario(mocks: ExtensionTestMocks): void {
	const mockDisposable = { dispose: vi.fn() }
	mocks.context.subscriptions.push(mockDisposable)
}

// Storage Scenarios
export function setupVSCodeStorageScenario(mocks: ExtensionTestMocks, key: string, value: any): void {
	mocks.context.globalState.get.mockResolvedValue(value)
	mocks.context.globalState.update.mockResolvedValue(undefined)
	mocks.context.workspaceState.get.mockResolvedValue(value)
	mocks.context.workspaceState.update.mockResolvedValue(undefined)
}

// Error Scenarios
export function setupVSCodeErrorScenario(mocks: ExtensionTestMocks, errorType: 'fileSystem' | 'command' | 'workspace', errorMessage: string): void {
	switch (errorType) {
		case 'fileSystem':
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
			Object.defineProperty(vscode.workspace, 'workspaceFolders', { 
				get: () => undefined, 
				configurable: true 
			})
			break
	}
}

// ============================================================================
// Ghost Writer Extension Mock Builder Pattern
// ============================================================================

export class GhostWriterExtensionMockBuilder {
	constructor(private mocks: ExtensionTestMocks) {}

	fileRead(options: VSCodeFileScenarioOptions): GhostWriterExtensionMockBuilder {
		setupVSCodeFileReadScenario(this.mocks, options)
		return this
	}

	fileWrite(options: VSCodeFileScenarioOptions): GhostWriterExtensionMockBuilder {
		setupVSCodeFileWriteScenario(this.mocks, options)
		return this
	}

	fileStat(options: VSCodeFileScenarioOptions): GhostWriterExtensionMockBuilder {
		setupVSCodeFileStatScenario(this.mocks, options)
		return this
	}

	fileCopy(sourcePath: string, destinationPath: string): GhostWriterExtensionMockBuilder {
		setupVSCodeFileCopyScenario(this.mocks, sourcePath, destinationPath)
		return this
	}

	commandRegistration(options: VSCodeCommandScenarioOptions): GhostWriterExtensionMockBuilder {
		setupVSCodeCommandRegistrationScenario(this.mocks, options)
		return this
	}

	windowMessage(messageType: 'info' | 'warning' | 'error', message: string): GhostWriterExtensionMockBuilder {
		setupVSCodeWindowMessageScenario(this.mocks, messageType, message)
		return this
	}

	workspace(options: VSCodeWorkspaceScenarioOptions): GhostWriterExtensionMockBuilder {
		setupVSCodeWorkspaceScenario(this.mocks, options)
		return this
	}

	position(options: VSCodePositionScenarioOptions): GhostWriterExtensionMockBuilder {
		setupVSCodePositionScenario(this.mocks, options)
		return this
	}

	range(options: VSCodeRangeScenarioOptions): GhostWriterExtensionMockBuilder {
		setupVSCodeRangeScenario(this.mocks, options)
		return this
	}

	terminal(terminalName?: string): GhostWriterExtensionMockBuilder {
		setupVSCodeTerminalScenario(this.mocks, terminalName)
		return this
	}

	extensionContext(): GhostWriterExtensionMockBuilder {
		setupVSCodeExtensionContextScenario(this.mocks)
		return this
	}

	storage(key: string, value: any): GhostWriterExtensionMockBuilder {
		setupVSCodeStorageScenario(this.mocks, key, value)
		return this
	}

	error(errorType: 'fileSystem' | 'command' | 'workspace', errorMessage: string): GhostWriterExtensionMockBuilder {
		setupVSCodeErrorScenario(this.mocks, errorType, errorMessage)
		return this
	}

	build(): ExtensionTestMocks {
		return this.mocks
	}
}

export function createGhostWriterExtensionMockBuilder(mocks: ExtensionTestMocks): GhostWriterExtensionMockBuilder {
	return new GhostWriterExtensionMockBuilder(mocks)
}

// ============================================================================
// Mock Factory Functions
// ============================================================================

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
		Position: vi.fn().mockImplementation((line: number, character: number) => ({ line, character })),
		Range: vi.fn().mockImplementation((start: any, end: any) => ({ start, end })),
		FileType: {
			Directory: 1,
			File: 2,
		},
	}

	const context = {
		subscriptions: [],
		globalState: {
			get: vi.fn(),
			update: vi.fn(),
		},
		workspaceState: {
			get: vi.fn(),
			update: vi.fn(),
		},
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
	mocks.vscode.Position.mockReset()
	mocks.vscode.Range.mockReset()
	mocks.context.globalState.get.mockReset()
	mocks.context.globalState.update.mockReset()
	mocks.context.workspaceState.get.mockReset()
	mocks.context.workspaceState.update.mockReset()
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
	mocks.context.globalState.get.mockResolvedValue(undefined)
	mocks.context.globalState.update.mockResolvedValue(undefined)
	mocks.context.workspaceState.get.mockResolvedValue(undefined)
	mocks.context.workspaceState.update.mockResolvedValue(undefined)
}
