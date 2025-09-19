import { vi, beforeAll, afterAll, afterEach } from 'vitest'
import process from 'node:process'
import { Buffer } from 'node:buffer'
import * as vscode from 'vscode'

// Mock vscode globally (no real VSCode API calls)
vi.mock('vscode', () =>
    ({
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
            file: vi.fn((path: string) =>
                ({ fsPath: path })),
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
            file: vi.fn().mockImplementation((path: string) =>
                ({ fsPath: path })),
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
    Object.values(mocks.vscode.commands).forEach(mock =>
        mock.mockReset())
    Object.values(mocks.vscode.window).forEach((mock) => {
        if (typeof mock === 'function') {
            mock.mockReset()
        }
    })
    Object.values(mocks.vscode.workspace.fs).forEach(mock =>
        mock.mockReset())
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
