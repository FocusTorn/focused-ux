import { vi } from 'vitest'
import { mockly, mocklyService } from '@fux/mockly'

/**
 * Common test utilities for @fux/@fux/shared tests
 *
 * This file provides helper functions for setting up mocks and creating test instances.
 * Customize these helpers based on your specific service requirements.
 */

/**
 * Setup window mocks for testing
 * Call this in beforeEach blocks when testing services that use window functionality
 */
export function setupWindowMocks() {
    // Use Mockly window as base and override specific methods as needed
    const mockWindow = {
        ...mockly.window,
        showErrorMessage: vi.fn(),
        showInformationMessage: vi.fn(),
        showWarningMessage: vi.fn(),
        showInputBox: vi.fn(),
        showQuickPick: vi.fn(),
        showTextDocument: vi.fn(),
        activeTextEditor: undefined,
    }

    // Set up a mock text editor to provide activeTextEditorUri
    const mockUri = { fsPath: '/test/path' }
    const mockDocument = { uri: mockUri }
    const mockEditor = { document: mockDocument }
    mockWindow.activeTextEditor = mockEditor

    return mockWindow
}

/**
 * Setup workspace mocks for testing
 * Call this in beforeEach blocks when testing services that use workspace functionality
 */
export function setupWorkspaceMocks() {
    const mockWorkspace = {
        ...mockly.workspace,
        fs: {
            ...mockly.workspace.fs,
            stat: vi.fn(),
            readFile: vi.fn(),
            writeFile: vi.fn(),
            createDirectory: vi.fn().mockResolvedValue(undefined),
            readDirectory: vi.fn(),
            delete: vi.fn(),
            copy: vi.fn(),
            rename: vi.fn(),
        },
        getConfiguration: vi.fn(),
        workspaceFolders: [],
    }

    return mockWorkspace
}

/**
 * Setup terminal mocks for testing
 * Call this in beforeEach blocks when testing services that use terminal functionality
 */
export function setupTerminalMocks() {
    const mockTerminal = {
        ...mockly.terminal,
        sendText: vi.fn(),
        show: vi.fn(),
        hide: vi.fn(),
        dispose: vi.fn(),
    }

    return mockTerminal
}

/**
 * Setup file system mocks for testing
 * Call this in beforeEach blocks when testing services that use file system functionality
 */
export function setupFileSystemMocks() {
    const mockFs = {
        ...mockly.node.fs,
        access: vi.fn(),
        readFile: vi.fn(),
        writeFile: vi.fn(),
        mkdir: vi.fn(),
        readdir: vi.fn(),
        unlink: vi.fn(),
        copyFile: vi.fn(),
        rename: vi.fn(),
    }

    return mockFs
}

/**
 * Setup path utility mocks for testing
 * Call this in beforeEach blocks when testing services that use path functionality
 */
export function setupPathMocks() {
    const mockPath = {
        ...mockly.node.path,
        join: vi.fn(),
        normalize: vi.fn(),
        dirname: vi.fn(),
        basename: vi.fn(),
        extname: vi.fn(),
        parse: vi.fn(),
        resolve: vi.fn(),
    }

    return mockPath
}

/**
 * Reset all mocks to their initial state
 * Call this in beforeEach blocks to ensure clean test state
 */
export function resetAllMocks() {
    vi.clearAllMocks()
    mocklyService.reset()
}

/**
 * Create a complete test environment with all mocks
 * Call this in beforeEach blocks to set up a complete test environment
 */
export function setupTestEnvironment() {
    resetAllMocks()

    const mocks = {
        window: setupWindowMocks(),
        workspace: setupWorkspaceMocks(),
        terminal: setupTerminalMocks(),
        fs: setupFileSystemMocks(),
        path: setupPathMocks(),
    }

    return mocks
}

/**
 * Create a basic test service instance
 * Replace this with actual service creation logic for your package
 */
export function createTestService(mocks?: ReturnType<typeof setupTestEnvironment>) {
    if (!mocks) {
        mocks = setupTestEnvironment()
    }

    // This is a placeholder - customize based on your actual service requirements
    // Example:
    // return new YourService(
    //     mocks.workspace.fs,
    //     mocks.window,
    //     mocks.terminal,
    //     // ... other dependencies
    // )
    throw new Error('createTestService() must be customized for your specific service')
}

/**
 * Create a mock URI for testing
 */
export function createMockUri(fsPath: string = '/test/path') {
    return { fsPath }
}

/**
 * Create a mock text document for testing
 */
export function createMockTextDocument(uri?: { fsPath: string }) {
    return {
        uri: uri || createMockUri(),
        fileName: uri?.fsPath || '/test/path',
        languageId: 'typescript',
        version: 1,
        isDirty: false,
        isUntitled: false,
    }
}

/**
 * Create a mock text editor for testing
 */
export function createMockTextEditor(document?: ReturnType<typeof createMockTextDocument>) {
    return {
        document: document || createMockTextDocument(),
        selection: { start: { line: 0, character: 0 }, end: { line: 0, character: 0 } },
        visibleRanges: [],
        options: {},
        viewColumn: 1,
    }
}
