import { vi } from 'vitest'
import * as vscode from 'vscode'
import { ExtensionTestMocks } from './helpers'

// ┌────────────────────────────────────────────────────────────────────────────┐
// │                 VSCode Mock Scenarios for Extension Tests                  │
// └────────────────────────────────────────────────────────────────────────────┘

// ┌────────────────────────────────────────────────────────────────────────────┐
// │                           File System Scenarios                            │
// └────────────────────────────────────────────────────────────────────────────┘
export interface VSCodeFileScenarioOptions { //>
    filePath: string
    content?: string
    fileType?: 'file' | 'directory'
} //<

export function setupVSCodeFileReadScenario( //>
    mocks: ExtensionTestMocks,
    options: VSCodeFileScenarioOptions
): void {
    const { filePath, content = 'file content' } = options
    const buffer = Buffer.from(content)
	
    // Use global mocks instead of local mocks
    const mockUri = { fsPath: filePath } as vscode.Uri
    vi.mocked(vscode.Uri.file).mockReturnValue(mockUri)
    vi.mocked(vscode.workspace.fs.readFile).mockResolvedValue(buffer)
} //<

export function setupVSCodeFileWriteScenario( //>
    mocks: ExtensionTestMocks,
    options: VSCodeFileScenarioOptions
): void {
    const { filePath, content: _content = 'file content' } = options
	
    // Use global mocks instead of local mocks
    const mockUri = { fsPath: filePath } as vscode.Uri
    vi.mocked(vscode.Uri.file).mockReturnValue(mockUri)
    vi.mocked(vscode.workspace.fs.writeFile).mockResolvedValue(undefined)
} //<

export function setupVSCodeFileStatScenario( //>
    mocks: ExtensionTestMocks,
    options: VSCodeFileScenarioOptions
): void {
    const { filePath, fileType = 'file' } = options
    const fileTypeValue = fileType === 'file' ? vscode.FileType.File : vscode.FileType.Directory
	
    // Use global mocks instead of local mocks
    const mockUri = { fsPath: filePath } as vscode.Uri
    vi.mocked(vscode.Uri.file).mockReturnValue(mockUri)
    vi.mocked(vscode.workspace.fs.stat).mockResolvedValue({ type: fileTypeValue, ctime: 0, mtime: 0, size: 0 })
} //<

export function setupVSCodeFileCopyScenario( //>
    mocks: ExtensionTestMocks,
    sourcePath: string,
    destinationPath: string
): void {
    // Use global mocks instead of local mocks
    const mockSourceUri = { fsPath: sourcePath } as vscode.Uri
    const mockDestUri = { fsPath: destinationPath } as vscode.Uri
    vi.mocked(vscode.Uri.file)
        .mockReturnValueOnce(mockSourceUri)
        .mockReturnValueOnce(mockDestUri)
    vi.mocked(vscode.workspace.fs.copy).mockResolvedValue(undefined)
} //<

// ┌────────────────────────────────────────────────────────────────────────────┐
// │                      Command Registration Scenarios                        │
// └────────────────────────────────────────────────────────────────────────────┘
export interface VSCodeCommandScenarioOptions { //>
    commandName: string
    shouldSucceed?: boolean
    errorMessage?: string
} //<

export function setupVSCodeCommandRegistrationScenario( //>
    mocks: ExtensionTestMocks,
    options: VSCodeCommandScenarioOptions
): void {
    const { commandName: _commandName, shouldSucceed = true, errorMessage = 'Command failed' } = options
    const mockDisposable = { dispose: vi.fn() }
	
    if (shouldSucceed) {
        // Use global mocks instead of local mocks
        vi.mocked(vscode.commands.registerCommand).mockReturnValue(mockDisposable)
    } else {
        vi.mocked(vscode.commands.registerCommand).mockImplementation(() => {
            throw new Error(errorMessage)
        })
    }
} //<

// ┌────────────────────────────────────────────────────────────────────────────┐
// │                            Window/UI Scenarios                             │
// └────────────────────────────────────────────────────────────────────────────┘
export function setupVSCodeWindowMessageScenario( //>
    mocks: ExtensionTestMocks,
    messageType: 'info' | 'warning' | 'error',
    _message: string
): void {
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
} //<

// ┌────────────────────────────────────────────────────────────────────────────┐
// │                            Workspace Scenarios                             │
// └────────────────────────────────────────────────────────────────────────────┘

export interface VSCodeWorkspaceScenarioOptions { //>
    workspacePath: string
    filePaths?: string[]
} //<

export function setupVSCodeWorkspaceScenario( //>
    mocks: ExtensionTestMocks,
    options: VSCodeWorkspaceScenarioOptions
): void {
    const { workspacePath, filePaths = [] } = options
	
    const mockWorkspaceFolder = {
        uri: { fsPath: workspacePath } as vscode.Uri,
        name: 'test-workspace',
        index: 0,
    } as vscode.WorkspaceFolder
	
    mocks.vscode.workspace.workspaceFolders = [mockWorkspaceFolder]
	
    // Setup file system mocks for each file
    filePaths.forEach(filePath => {
        setupVSCodeFileStatScenario(mocks, { filePath, fileType: 'file' })
    })
} //<

// ┌──────────────────────────────────────────────────────────────────────────┐
// │                            Terminal Scenarios                            │
// └──────────────────────────────────────────────────────────────────────────┘
export function setupVSCodeTerminalScenario( //>
    mocks: ExtensionTestMocks,
    terminalName?: string
    
): void {
    const mockTerminal = {
        sendText: vi.fn(),
        show: vi.fn(),
        name: terminalName,
        processId: Promise.resolve(12345),
        creationOptions: {},
        exitStatus: undefined,
        state: { isInteractedWith: false },
        shellIntegration: undefined,
        hide: vi.fn(),
        dispose: vi.fn(),
    } as unknown as vscode.Terminal
	
    mocks.vscode.window.createTerminal.mockReturnValue(mockTerminal)
    mocks.vscode.window.activeTerminal = mockTerminal
} //<

// ┌──────────────────────────────────────────────────────────────────────────┐
// │                       Extension Context Scenarios                        │
// └──────────────────────────────────────────────────────────────────────────┘
export function setupVSCodeExtensionContextScenario( //>
    mocks: ExtensionTestMocks
): void {
    const mockDisposable = { dispose: vi.fn() }
    mocks.context.subscriptions.push(mockDisposable)
} //<

// ┌──────────────────────────────────────────────────────────────────────────┐
// │                             Error Scenarios                              │
// └──────────────────────────────────────────────────────────────────────────┘
export function setupVSCodeErrorScenario( //>
    mocks: ExtensionTestMocks,
    errorType: 'fileSystem' | 'command' | 'workspace',
    errorMessage: string
): void {
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
                get: () =>
                    undefined,
                configurable: true
            })
            break
    }
} //<

// ┌──────────────────────────────────────────────────────────────────────────┐
// │                          Extension Mock Builder                          │
// └──────────────────────────────────────────────────────────────────────────┘

export class ExtensionMockBuilder { //>

    constructor(private mocks: ExtensionTestMocks) {}

    fileRead( //> setupVSCodeFileReadScenario
        options: VSCodeFileScenarioOptions
    ): ExtensionMockBuilder {
        setupVSCodeFileReadScenario(this.mocks, options)
        return this
    } //<
    fileWrite( //> setupVSCodeFileWriteScenario
        options: VSCodeFileScenarioOptions
    ): ExtensionMockBuilder {
        setupVSCodeFileWriteScenario(this.mocks, options)
        return this
    } //<
    fileStat( //> setupVSCodeFileStatScenario
        options: VSCodeFileScenarioOptions
    ): ExtensionMockBuilder {
        setupVSCodeFileStatScenario(this.mocks, options)
        return this
    } //<
    fileCopy( //> setupVSCodeFileCopyScenario
        sourcePath: string,
        destinationPath: string
    ): ExtensionMockBuilder {
        setupVSCodeFileCopyScenario(this.mocks, sourcePath, destinationPath)
        return this
    } //<
    commandRegistration( //> setupVSCodeCommandRegistrationScenario
        options: VSCodeCommandScenarioOptions
    ): ExtensionMockBuilder {
        setupVSCodeCommandRegistrationScenario(this.mocks, options)
        return this
    } //<
    windowMessage( //> setupVSCodeWindowMessageScenario
        messageType: 'info' | 'warning' | 'error',
        message: string
    ): ExtensionMockBuilder {
        setupVSCodeWindowMessageScenario(this.mocks, messageType, message)
        return this
    } //<
    workspace( //> setupVSCodeWorkspaceScenario
        options: VSCodeWorkspaceScenarioOptions
    ): ExtensionMockBuilder {
        setupVSCodeWorkspaceScenario(this.mocks, options)
        return this
    } //<
    terminal( //> setupVSCodeTerminalScenario
        terminalName?: string
    ): ExtensionMockBuilder {
        setupVSCodeTerminalScenario(this.mocks, terminalName)
        return this
    } //<
    error( //> setupVSCodeErrorScenario
        errorType: 'fileSystem' | 'command' | 'workspace',
        errorMessage: string
    ): ExtensionMockBuilder {
        setupVSCodeErrorScenario(this.mocks, errorType, errorMessage)
        return this
    } //<

    build(): ExtensionTestMocks { return this.mocks }

} //<

export function createExtensionMockBuilder( //>
    mocks: ExtensionTestMocks
): ExtensionMockBuilder {
    return new ExtensionMockBuilder(mocks)
} //<
