import { vi } from 'vitest'
import type { IWorkspace, IConfiguration } from '../../src/_interfaces/IWorkspace.js'
import type { IFileSystem } from '../../src/_interfaces/IFileSystem.js'
import type { ICommonUtils } from '../../src/_interfaces/ICommonUtils.js'
import type { IWindow } from '../../src/_interfaces/IWindow.js'
import type { ICommands } from '../../src/_interfaces/ICommands.js'
import type { IPath } from '../../src/_interfaces/IPath.js'
import type { IContext } from '../../src/_interfaces/IContext.js'
import type { IQuickPick } from '../../src/_interfaces/IQuickPick.js'
import type { IUriFactory } from '../../src/_interfaces/IUri.js'

// ============================================================================
// TEST HELPERS
// ============================================================================

export interface DynamiconsTestMocks {
    workspace: IWorkspace
    fileSystem: IFileSystem
    commonUtils: ICommonUtils
    window: IWindow
    commands: ICommands
    path: IPath
    context: IContext
    quickPick: IQuickPick
    uriFactory: IUriFactory
}

export function setupTestEnvironment(): DynamiconsTestMocks {
    return {
        workspace: createMockWorkspace(),
        fileSystem: createMockFileSystem(),
        commonUtils: createMockCommonUtils(),
        window: createMockWindow(),
        commands: createMockCommands(),
        path: createMockPath(),
        context: createMockContext(),
        quickPick: createMockQuickPick(),
        uriFactory: createMockUriFactory(),
    }
}

export function resetAllMocks(mocks: DynamiconsTestMocks): void {
    vi.clearAllMocks()
    // Reset individual mocks if needed
    Object.values(mocks.workspace).forEach((mock) => {
        if (typeof mock === 'function') mock.mockReset()
    })
    Object.values(mocks.fileSystem).forEach((mock) => {
        if (typeof mock === 'function') mock.mockReset()
    })
    Object.values(mocks.commonUtils).forEach((mock) => {
        if (typeof mock === 'function') mock.mockReset()
    })
    Object.values(mocks.window).forEach((mock) => {
        if (typeof mock === 'function') mock.mockReset()
    })
    Object.values(mocks.commands).forEach((mock) => {
        if (typeof mock === 'function') mock.mockReset()
    })
    Object.values(mocks.path).forEach((mock) => {
        if (typeof mock === 'function') mock.mockReset()
    })
}

// ============================================================================
// DYNAMICONS CORE SPECIFIC MOCK CREATORS
// ============================================================================

export function createMockWorkspace(): IWorkspace {
    const mockConfiguration: IConfiguration = {
        get: vi.fn(),
        update: vi.fn().mockResolvedValue(undefined),
    }

    return {
        getConfiguration: vi.fn().mockReturnValue(mockConfiguration),
        onDidChangeConfiguration: vi.fn().mockReturnValue({ dispose: vi.fn() }),
    }
}

export function createMockFileSystem(): IFileSystem {
    return {
        stat: vi.fn().mockResolvedValue({} as any),
        readdir: vi.fn().mockResolvedValue([]),
        readFile: vi.fn().mockResolvedValue('file content'),
        writeFile: vi.fn().mockResolvedValue(undefined),
        access: vi.fn().mockResolvedValue(undefined),
        mkdir: vi.fn().mockResolvedValue(undefined),
        copyFile: vi.fn().mockResolvedValue(undefined),
        readFileSync: vi.fn().mockReturnValue('file content'),
    }
}

export function createMockCommonUtils(): ICommonUtils {
    return {
        delay: vi.fn().mockResolvedValue(undefined),
        errMsg: vi.fn(),
    }
}

export function createMockWindow(): IWindow {
    return {
        showInformationMessage: vi.fn().mockResolvedValue(undefined),
        showErrorMessage: vi.fn().mockResolvedValue(undefined),
        showWarningMessage: vi.fn().mockResolvedValue(undefined),
        showTimedInformationMessage: vi.fn().mockResolvedValue(undefined),
    }
}

export function createMockCommands(): ICommands {
    return {
        registerCommand: vi.fn().mockReturnValue({ dispose: vi.fn() }),
        executeCommand: vi.fn().mockResolvedValue(undefined),
    }
}

export function createMockPath(): IPath {
    return {
        basename: vi.fn().mockImplementation((path: string) => path.split('/').pop() || ''),
        parse: vi.fn().mockImplementation((path: string) => ({
            root: '',
            dir: path.split('/').slice(0, -1).join('/'),
            base: path.split('/').pop() || '',
            ext: '',
            name: path.split('/').pop()?.split('.')[0] || '',
        })),
        join: vi.fn().mockImplementation((...paths: string[]) => paths.join('/')),
        dirname: vi.fn().mockImplementation((path: string) => path.split('/').slice(0, -1).join('/') || '.'),
        relative: vi.fn().mockImplementation((from: string, to: string) => to),
    }
}

export function createMockContext(): IContext {
    return {
        subscriptions: [],
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

export function createMockQuickPick(): IQuickPick {
    return {
        show: vi.fn().mockResolvedValue(undefined),
        hide: vi.fn(),
        dispose: vi.fn(),
        onDidAccept: vi.fn().mockReturnValue({ dispose: vi.fn() }),
        onDidHide: vi.fn().mockReturnValue({ dispose: vi.fn() }),
        onDidChangeValue: vi.fn().mockReturnValue({ dispose: vi.fn() }),
        onDidChangeSelection: vi.fn().mockReturnValue({ dispose: vi.fn() }),
        items: [],
        selectedItems: [],
        activeItems: [],
        title: '',
        placeholder: '',
        value: '',
        canSelectMany: false,
        ignoreFocusOut: false,
        matchOnDescription: false,
        matchOnDetail: false,
        keepScrollPosition: false,
        busy: false,
    }
}

export function createMockUriFactory(): IUriFactory {
    return {
        file: vi.fn().mockImplementation((path: string) => ({
            fsPath: path,
            scheme: 'file',
            authority: '',
            path,
            query: '',
            fragment: '',
            toString: vi.fn(() => path),
        })),
    }
}

// ============================================================================
// SETUP FUNCTIONS FOR COMMON SCENARIOS
// ============================================================================

export function setupWorkspaceMocks(mocks: DynamiconsTestMocks): void {
    mocks.workspace.getConfiguration.mockReturnValue({
        get: vi.fn().mockReturnValue(true),
        update: vi.fn().mockResolvedValue(undefined),
    } as any)
}

export function setupFileSystemMocks(mocks: DynamiconsTestMocks): void {
    mocks.fileSystem.readFile.mockResolvedValue('file content')
    mocks.fileSystem.writeFile.mockResolvedValue(undefined)
    mocks.fileSystem.stat.mockResolvedValue({ type: 'file' } as any)
    mocks.fileSystem.readdir.mockResolvedValue([])
    mocks.fileSystem.access.mockResolvedValue(undefined)
    mocks.fileSystem.mkdir.mockResolvedValue(undefined)
    mocks.fileSystem.copyFile.mockResolvedValue(undefined)
}

export function setupPathMocks(mocks: DynamiconsTestMocks): void {
    mocks.path.basename.mockImplementation((path: string) => path.split('/').pop() || '')
    mocks.path.join.mockImplementation((...paths: string[]) => paths.join('/'))
    mocks.path.dirname.mockImplementation((path: string) => path.split('/').slice(0, -1).join('/') || '.')
    mocks.path.relative.mockImplementation((from: string, to: string) => to)
}

export function setupWindowMocks(mocks: DynamiconsTestMocks): void {
    mocks.window.showInformationMessage.mockResolvedValue(undefined)
    mocks.window.showErrorMessage.mockResolvedValue(undefined)
    mocks.window.showWarningMessage.mockResolvedValue(undefined)
    mocks.window.showTimedInformationMessage.mockResolvedValue(undefined)
}

export function setupCommandsMocks(mocks: DynamiconsTestMocks): void {
    mocks.commands.registerCommand.mockReturnValue({ dispose: vi.fn() })
    mocks.commands.executeCommand.mockResolvedValue(undefined)
}

