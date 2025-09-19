import { vi } from 'vitest'
import * as vscode from 'vscode'
import { ExtensionTestMocks } from './helpers'

// ┌────────────────────────────────────────────────────────────────────────────┐
// │                 VSCode Mock Scenarios for Ghost Writer Tests              │
// └────────────────────────────────────────────────────────────────────────────┘

// ┌────────────────────────────────────────────────────────────────────────────┐
// │                           Text Editor Scenarios                            │
// └────────────────────────────────────────────────────────────────────────────┘
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
        selections = [{ start: { line: 0, character: 0 }, end: { line: 0, character: 5 } }]
    } = options

    const mockDocument = {
        fileName,
        getText: vi.fn().mockReturnValue(content),
        uri: { fsPath: fileName } as vscode.Uri,
    }

    const mockTextEditor = {
        document: mockDocument,
        selection,
        selections,
        edit: vi.fn().mockImplementation((callback) => {
            const mockEditBuilder = {
                insert: vi.fn(),
                replace: vi.fn(),
                delete: vi.fn(),
            }
            callback(mockEditBuilder)
            return Promise.resolve(true)
        }),
    }

    mocks.vscode.window.activeTextEditor = mockTextEditor as any
}

export function setupVSCodeNoActiveEditorScenario(
    mocks: ExtensionTestMocks
): void {
    mocks.vscode.window.activeTextEditor = undefined
}

// ┌────────────────────────────────────────────────────────────────────────────┐
// │                      Command Registration Scenarios                        │
// └────────────────────────────────────────────────────────────────────────────┘
export interface VSCodeCommandScenarioOptions {
    commandName: string
    shouldSucceed?: boolean
    errorMessage?: string
}

export function setupVSCodeCommandRegistrationScenario(
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
}

// ┌────────────────────────────────────────────────────────────────────────────┐
// │                            Window/UI Scenarios                             │
// └────────────────────────────────────────────────────────────────────────────┘
export function setupVSCodeWindowMessageScenario(
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
}

// ┌────────────────────────────────────────────────────────────────────────────┐
// │                          Workspace Configuration Scenarios                 │
// └────────────────────────────────────────────────────────────────────────────┘
export interface VSCodeWorkspaceConfigScenarioOptions {
    configKey: string
    configValue: any
}

export function setupVSCodeWorkspaceConfigScenario(
    mocks: ExtensionTestMocks,
    options: VSCodeWorkspaceConfigScenarioOptions
): void {
    const { configKey, configValue } = options
    
    const mockConfiguration = {
        get: vi.fn().mockReturnValue(configValue),
        update: vi.fn().mockResolvedValue(undefined),
        has: vi.fn().mockReturnValue(true),
        inspect: vi.fn().mockReturnValue({ globalValue: configValue }),
    }
    
    // Mock workspace.getConfiguration
    vi.mocked(vscode.workspace.getConfiguration).mockReturnValue(mockConfiguration as any)
}

// ┌──────────────────────────────────────────────────────────────────────────┐
// │                       Extension Context Scenarios                        │
// └──────────────────────────────────────────────────────────────────────────┘
export function setupVSCodeExtensionContextScenario(
    mocks: ExtensionTestMocks
): void {
    const mockDisposable = { dispose: vi.fn() }
    mocks.context.subscriptions.push(mockDisposable)
}

// ┌──────────────────────────────────────────────────────────────────────────┐
// │                             Error Scenarios                              │
// └──────────────────────────────────────────────────────────────────────────┘
export function setupVSCodeErrorScenario(
    mocks: ExtensionTestMocks,
    errorType: 'command' | 'workspace',
    errorMessage: string
): void {
    switch (errorType) {
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

// ┌──────────────────────────────────────────────────────────────────────────┐
// │                          Ghost Writer Mock Builder                       │
// └──────────────────────────────────────────────────────────────────────────┘

export class GhostWriterMockBuilder {

    constructor(private mocks: ExtensionTestMocks) {}

    textEditor(
        options: VSCodeTextEditorScenarioOptions = {}
    ): GhostWriterMockBuilder {
        setupVSCodeTextEditorScenario(this.mocks, options)
        return this
    }

    noActiveEditor(): GhostWriterMockBuilder {
        setupVSCodeNoActiveEditorScenario(this.mocks)
        return this
    }

    commandRegistration(
        options: VSCodeCommandScenarioOptions
    ): GhostWriterMockBuilder {
        setupVSCodeCommandRegistrationScenario(this.mocks, options)
        return this
    }

    windowMessage(
        messageType: 'info' | 'warning' | 'error',
        message: string
    ): GhostWriterMockBuilder {
        setupVSCodeWindowMessageScenario(this.mocks, messageType, message)
        return this
    }

    workspaceConfig(
        options: VSCodeWorkspaceConfigScenarioOptions
    ): GhostWriterMockBuilder {
        setupVSCodeWorkspaceConfigScenario(this.mocks, options)
        return this
    }

    error(
        errorType: 'command' | 'workspace',
        errorMessage: string
    ): GhostWriterMockBuilder {
        setupVSCodeErrorScenario(this.mocks, errorType, errorMessage)
        return this
    }

    build(): ExtensionTestMocks { return this.mocks }
}

export function createGhostWriterMockBuilder(
    mocks: ExtensionTestMocks
): GhostWriterMockBuilder {
    return new GhostWriterMockBuilder(mocks)
}
