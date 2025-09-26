// Extension Package Mock Strategy Library
// Provides standardized mock interfaces and helpers for VSCode extension packages

import { vi } from 'vitest'

export interface ExtensionTestMocks {
    vscode: {
        commands: {
            registerCommand: ReturnType<typeof vi.fn>
            executeCommand: ReturnType<typeof vi.fn>
        }
        window: {
            showInformationMessage: ReturnType<typeof vi.fn>
            showWarningMessage: ReturnType<typeof vi.fn>
            showErrorMessage: ReturnType<typeof vi.fn>
            showInputBox: ReturnType<typeof vi.fn>
            showTextDocument: ReturnType<typeof vi.fn>
            withProgress: ReturnType<typeof vi.fn>
            registerTreeDataProvider: ReturnType<typeof vi.fn>
            activeTextEditor: any
        }
        workspace: {
            getConfiguration: ReturnType<typeof vi.fn>
            workspaceFolders: any[]
            fs: {
                readFile: ReturnType<typeof vi.fn>
                writeFile: ReturnType<typeof vi.fn>
                stat: ReturnType<typeof vi.fn>
                createDirectory: ReturnType<typeof vi.fn>
                delete: ReturnType<typeof vi.fn>
                copy: ReturnType<typeof vi.fn>
                rename: ReturnType<typeof vi.fn>
            }
            createFileSystemWatcher: ReturnType<typeof vi.fn>
            findFiles: ReturnType<typeof vi.fn>
            openTextDocument: ReturnType<typeof vi.fn>
        }
        Uri: {
            file: ReturnType<typeof vi.fn>
            parse: ReturnType<typeof vi.fn>
        }
        TreeItem: ReturnType<typeof vi.fn>
        TreeItemCollapsibleState: {
            None: number
            Collapsed: number
            Expanded: number
        }
        ThemeIcon: ReturnType<typeof vi.fn>
        ThemeColor: ReturnType<typeof vi.fn>
        RelativePattern: ReturnType<typeof vi.fn>
        EventEmitter: ReturnType<typeof vi.fn>
        Disposable: ReturnType<typeof vi.fn>
    }
    context: {
        subscriptions: any[]
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

export function setupExtensionTestEnvironment(): ExtensionTestMocks {
    const mockTextEditor = {
        document: {
            uri: { fsPath: '/test/file.txt' },
            fileName: '/test/file.txt',
            getText: vi.fn().mockReturnValue('const test = "hello world";'),
        },
        selection: {
            start: { line: 0, character: 0 },
            end: { line: 0, character: 5 },
            active: { line: 0, character: 0 },
        },
        selections: [
            {
                start: { line: 0, character: 0 },
                end: { line: 0, character: 5 },
                active: { line: 0, character: 0 },
            },
        ],
        edit: vi.fn().mockImplementation((callback) => {
            const mockEditBuilder = createMockEditBuilder()

            callback(mockEditBuilder)
            return Promise.resolve(true)
        }),
    } as any

    return {
        vscode: {
            commands: {
                registerCommand: vi.fn(),
                executeCommand: vi.fn(),
            },
            window: {
                showInformationMessage: vi.fn(),
                showWarningMessage: vi.fn(),
                showErrorMessage: vi.fn(),
                showInputBox: vi.fn(),
                showTextDocument: vi.fn(),
                withProgress: vi.fn(),
                registerTreeDataProvider: vi.fn(),
                activeTextEditor: mockTextEditor,
            },
            workspace: {
                getConfiguration: vi.fn(),
                workspaceFolders: [{ uri: { fsPath: '/test' } } as any],
                fs: {
                    readFile: vi.fn(),
                    writeFile: vi.fn(),
                    stat: vi.fn(),
                    createDirectory: vi.fn(),
                    delete: vi.fn(),
                    copy: vi.fn(),
                    rename: vi.fn(),
                },
                createFileSystemWatcher: vi.fn(),
                findFiles: vi.fn(),
                openTextDocument: vi.fn(),
            },
            Uri: {
                file: vi.fn(),
                parse: vi.fn(),
            },
            TreeItem: vi.fn(),
            TreeItemCollapsibleState: {
                None: 0,
                Collapsed: 1,
                Expanded: 2,
            },
            ThemeIcon: vi.fn(),
            ThemeColor: vi.fn(),
            RelativePattern: vi.fn(),
            EventEmitter: vi.fn(),
            Disposable: vi.fn(),
        },
        context: {
            subscriptions: [],
            globalState: {
                get: vi.fn(),
                update: vi.fn(),
            },
            workspaceState: {
                get: vi.fn(),
                update: vi.fn(),
            },
        },
    }
}

export function createMockEditBuilder(): any {
    return {
        insert: vi.fn(),
        replace: vi.fn(),
        delete: vi.fn(),
    }
}

export function setupVSCodeMocks(mocks: ExtensionTestMocks): void {
    // Default implementations
    mocks.vscode.window.showInformationMessage.mockResolvedValue(undefined)
    mocks.vscode.window.showWarningMessage.mockResolvedValue(undefined)
    mocks.vscode.window.showErrorMessage.mockResolvedValue(undefined)
    mocks.vscode.window.showInputBox.mockResolvedValue('test-input')
    mocks.vscode.window.showTextDocument.mockResolvedValue({})
    mocks.vscode.window.withProgress.mockImplementation((options, task) => task())
    mocks.vscode.window.registerTreeDataProvider.mockReturnValue({ dispose: vi.fn() })

    // Mock workspace configuration
    const mockConfiguration = {
        get: vi.fn().mockReturnValue(true),
        update: vi.fn().mockResolvedValue(undefined),
        has: vi.fn().mockReturnValue(true),
        inspect: vi.fn().mockReturnValue({ globalValue: true }),
    }

    mocks.vscode.workspace.getConfiguration.mockReturnValue(mockConfiguration as any)

    // Mock workspace file system
    mocks.vscode.workspace.fs.readFile.mockResolvedValue(new Uint8Array([116, 101, 115, 116])) // "test"
    mocks.vscode.workspace.fs.writeFile.mockResolvedValue(undefined)
    mocks.vscode.workspace.fs.stat.mockResolvedValue({ type: 1, size: 1024 })
    mocks.vscode.workspace.fs.createDirectory.mockResolvedValue(undefined)
    mocks.vscode.workspace.fs.delete.mockResolvedValue(undefined)
    mocks.vscode.workspace.fs.copy.mockResolvedValue(undefined)
    mocks.vscode.workspace.fs.rename.mockResolvedValue(undefined)

    // Mock Uri
    mocks.vscode.Uri.file.mockImplementation((path: string) => ({
        scheme: 'file',
        authority: '',
        path,
        query: '',
        fragment: '',
        fsPath: path,
        with: vi.fn().mockReturnThis(),
        toString: vi.fn().mockReturnValue(`file://${path}`),
    }))

    // Mock TreeItem
    mocks.vscode.TreeItem.mockImplementation((label: string, collapsibleState: number) => ({
        label,
        collapsibleState,
        resourceUri: undefined,
        description: undefined,
        tooltip: undefined,
        contextValue: undefined,
        iconPath: undefined,
    }))

    // Mock ThemeIcon
    mocks.vscode.ThemeIcon.mockImplementation((id: string, theme?: string) => ({
        id,
        theme,
        color: undefined,
    }))

    // Mock ThemeColor
    mocks.vscode.ThemeColor.mockImplementation((id: string) => ({
        id,
    }))

    // Mock RelativePattern
    mocks.vscode.RelativePattern.mockImplementation((base: any, pattern: string) => ({
        base,
        pattern,
        match: vi.fn().mockReturnValue(true),
    }))

    // Mock EventEmitter
    mocks.vscode.EventEmitter.mockImplementation(() => ({
        event: vi.fn().mockReturnValue({ dispose: vi.fn() }),
        fire: vi.fn(),
        dispose: vi.fn(),
    }))

    // Mock Disposable
    mocks.vscode.Disposable.mockImplementation((dispose: () => void) => ({
        dispose,
    }))
}

export function resetExtensionMocks(mocks: ExtensionTestMocks): void {
    Object.values(mocks.vscode.commands).forEach((mock) => mock.mockReset())
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
    Object.values(mocks.vscode.workspace.fs).forEach((mock) => mock.mockReset())
    Object.values(mocks.vscode.Uri).forEach((mock) => mock.mockReset())
    mocks.vscode.TreeItem.mockReset()
    mocks.vscode.ThemeIcon.mockReset()
    mocks.vscode.ThemeColor.mockReset()
    mocks.vscode.RelativePattern.mockReset()
    mocks.vscode.EventEmitter.mockReset()
    mocks.vscode.Disposable.mockReset()
}

// Text Editor Scenarios
export interface VSCodeTextEditorScenarioOptions {
    fileName?: string
    content?: string
    selection?: {
        start: { line: number; character: number }
        end: { line: number; character: number }
    }
    selections?: Array<{
        start: { line: number; character: number }
        end: { line: number; character: number }
    }>
}

export function setupVSCodeTextEditorScenario(
    mocks: ExtensionTestMocks,
    options: VSCodeTextEditorScenarioOptions = {}
): void {
    const {
        fileName = '/test/file.ts',
        content = 'const test = "hello world";\nconsole.log(test);',
        selection = { start: { line: 0, character: 0 }, end: { line: 0, character: 5 } },
        selections = [{ start: { line: 0, character: 0 }, end: { line: 0, character: 5 } }],
    } = options

    const mockDocument = {
        fileName,
        getText: vi.fn().mockReturnValue(content),
        uri: { fsPath: fileName },
    }

    const mockTextEditor = {
        document: mockDocument,
        selection,
        selections,
        edit: vi.fn().mockImplementation((callback) => {
            const mockEditBuilder = createMockEditBuilder()

            callback(mockEditBuilder)
            return Promise.resolve(true)
        }),
    }

    mocks.vscode.window.activeTextEditor = mockTextEditor as any
}

export function setupVSCodeNoActiveEditorScenario(mocks: ExtensionTestMocks): void {
    mocks.vscode.window.activeTextEditor = undefined
}

// Command Registration Scenarios
export interface VSCodeCommandScenarioOptions {
    commandName: string
    shouldSucceed?: boolean
    errorMessage?: string
}

export function setupVSCodeCommandRegistrationScenario(
    mocks: ExtensionTestMocks,
    options: VSCodeCommandScenarioOptions
): void {
    const {
        commandName: _commandName,
        shouldSucceed = true,
        errorMessage = 'Command failed',
    } = options
    const mockDisposable = { dispose: vi.fn() }

    if (shouldSucceed) {
        mocks.vscode.commands.registerCommand.mockReturnValue(mockDisposable)
    } else {
        mocks.vscode.commands.registerCommand.mockImplementation(() => {
            throw new Error(errorMessage)
        })
    }
}

// Window/UI Scenarios
export function setupVSCodeWindowMessageScenario(
    mocks: ExtensionTestMocks,
    messageType: 'info' | 'warning' | 'error',
    _message: string
): void {
    switch (messageType) {
        case 'info':
            mocks.vscode.window.showInformationMessage.mockResolvedValue(undefined)
            break
        case 'warning':
            mocks.vscode.window.showWarningMessage.mockResolvedValue(undefined)
            break
        case 'error':
            mocks.vscode.window.showErrorMessage.mockResolvedValue(undefined)
            break
    }
}

// Fluent Builder Pattern
export class ExtensionMockBuilder {

    constructor(private mocks: ExtensionTestMocks) {}

    textEditor(options: VSCodeTextEditorScenarioOptions = {}): ExtensionMockBuilder {
        setupVSCodeTextEditorScenario(this.mocks, options)
        return this
    }

    noActiveEditor(): ExtensionMockBuilder {
        setupVSCodeNoActiveEditorScenario(this.mocks)
        return this
    }

    commandRegistration(options: VSCodeCommandScenarioOptions): ExtensionMockBuilder {
        setupVSCodeCommandRegistrationScenario(this.mocks, options)
        return this
    }

    windowMessage(
        messageType: 'info' | 'warning' | 'error',
        message: string
    ): ExtensionMockBuilder {
        setupVSCodeWindowMessageScenario(this.mocks, messageType, message)
        return this
    }

    build(): ExtensionTestMocks {
        return this.mocks
    }

}

export function createExtensionMockBuilder(mocks: ExtensionTestMocks): ExtensionMockBuilder {
    return new ExtensionMockBuilder(mocks)
}
