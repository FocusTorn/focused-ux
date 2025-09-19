import { vi } from 'vitest'
import * as vscode from 'vscode'

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
        }
        workspace: {
            getConfiguration: ReturnType<typeof vi.fn>
            workspaceFolders: vscode.WorkspaceFolder[] | undefined
        }
        Position: ReturnType<typeof vi.fn>
    }
    context: {
        subscriptions: vscode.Disposable[]
    }
}

export function setupTestEnvironment(): ExtensionTestMocks {
    const mockTextEditor = {
        document: {
            uri: {
                fsPath: '/test/file.txt',
            },
            fileName: '/test/file.txt',
            getText: vi.fn().mockReturnValue('const test = "hello world";'),
        },
        selection: {
            start: { line: 0, character: 0 },
            end: { line: 0, character: 5 },
            active: { line: 0, character: 0 },
        },
        selections: [{
            start: { line: 0, character: 0 },
            end: { line: 0, character: 5 },
            active: { line: 0, character: 0 },
        }],
        edit: vi.fn().mockImplementation((callback) => {
            const mockEditBuilder = {
                insert: vi.fn(),
                replace: vi.fn(),
                delete: vi.fn(),
            }
            callback(mockEditBuilder)
            return Promise.resolve(true)
        }),
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
        },
        workspace: {
            getConfiguration: vi.fn(),
            workspaceFolders: [mockWorkspaceFolder],
        },
        Position: vi.fn().mockImplementation((line: number, character: number) => ({ line, character })),
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
    Object.values(mocks.vscode.workspace).forEach((mock) => {
        if (typeof mock === 'function') {
            mock.mockReset()
        }
    })
    mocks.vscode.Position.mockReset()
}

export function setupVSCodeMocks(mocks: ExtensionTestMocks): void {
    // Default implementations for Ghost Writer
    mocks.vscode.window.showInformationMessage.mockResolvedValue(undefined)
    mocks.vscode.window.showWarningMessage.mockResolvedValue(undefined)
    mocks.vscode.window.showErrorMessage.mockResolvedValue(undefined)
    
    // Mock workspace configuration
    const mockConfiguration = {
        get: vi.fn().mockReturnValue(true),
        update: vi.fn().mockResolvedValue(undefined),
        has: vi.fn().mockReturnValue(true),
        inspect: vi.fn().mockReturnValue({ globalValue: true }),
    }
    mocks.vscode.workspace.getConfiguration.mockReturnValue(mockConfiguration as any)
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

// ============================================================================
// GHOST WRITER SPECIFIC MOCK CREATORS
// ============================================================================

export function createMockConfiguration(): any {
    return {
        get: vi.fn(),
        update: vi.fn(),
        has: vi.fn(),
        inspect: vi.fn(),
    }
}

export function createMockStorageContext(): any {
    return {
        globalState: {
            update: vi.fn().mockResolvedValue(undefined),
            get: vi.fn().mockResolvedValue(undefined),
        },
        workspaceState: {
            update: vi.fn().mockResolvedValue(undefined),
            get: vi.fn().mockResolvedValue(undefined),
        },
    }
}

export function createMockTextEditor(options: {
    fileName?: string
    content?: string
    selection?: { start: { line: number; character: number }; end: { line: number; character: number }; active: { line: number; character: number } }
} = {}): any {
    const {
        fileName = '/test/file.ts',
        content = 'const test = "hello world";',
        selection = { start: { line: 0, character: 0 }, end: { line: 0, character: 5 }, active: { line: 0, character: 0 } }
    } = options

    const mockDocument = {
        fileName,
        getText: vi.fn().mockReturnValue(content),
        uri: { fsPath: fileName } as vscode.Uri,
    }

    const mockSelection = selection

    return {
        document: mockDocument,
        selection: mockSelection,
        selections: [mockSelection],
        edit: vi.fn().mockImplementation((callback) => {
            const mockEditBuilder = createMockEditBuilder()
            callback(mockEditBuilder)
            return Promise.resolve(true)
        }),
    }
}

export function createMockEditBuilder(): any {
    return {
        insert: vi.fn(),
        replace: vi.fn(),
        delete: vi.fn(),
    }
}

export function createMockSelection(options: {
    start?: { line: number; character: number }
    end?: { line: number; character: number }
    active?: { line: number; character: number }
} = {}): any {
    const {
        start = { line: 0, character: 0 },
        end = { line: 0, character: 5 },
        active = { line: 0, character: 0 }
    } = options

    return { start, end, active }
}
