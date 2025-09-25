import { describe, it, expect, beforeEach, vi } from 'vitest'
import {
    ExtensionTestMocks,
    setupExtensionTestEnvironment,
    createMockEditBuilder,
    setupVSCodeMocks,
    resetExtensionMocks,
    setupVSCodeTextEditorScenario,
    setupVSCodeNoActiveEditorScenario,
    setupVSCodeCommandRegistrationScenario,
    setupVSCodeWindowMessageScenario,
    ExtensionMockBuilder,
    createExtensionMockBuilder,
} from '../../src/ext/index.js'

describe('Extension Package Mock Strategy', () => {
    let mocks: ExtensionTestMocks

    beforeEach(() => {
        mocks = setupExtensionTestEnvironment()
    })

    describe('setupExtensionTestEnvironment', () => {
        it('should create all required VSCode mock functions', () => {
            // Commands
            expect(mocks.vscode.commands.registerCommand).toBeDefined()
            expect(mocks.vscode.commands.executeCommand).toBeDefined()

            // Window
            expect(mocks.vscode.window.showInformationMessage).toBeDefined()
            expect(mocks.vscode.window.showWarningMessage).toBeDefined()
            expect(mocks.vscode.window.showErrorMessage).toBeDefined()
            expect(mocks.vscode.window.showInputBox).toBeDefined()
            expect(mocks.vscode.window.showTextDocument).toBeDefined()
            expect(mocks.vscode.window.withProgress).toBeDefined()
            expect(mocks.vscode.window.registerTreeDataProvider).toBeDefined()

            // Workspace
            expect(mocks.vscode.workspace.getConfiguration).toBeDefined()
            expect(mocks.vscode.workspace.fs.readFile).toBeDefined()
            expect(mocks.vscode.workspace.fs.writeFile).toBeDefined()
            expect(mocks.vscode.workspace.fs.stat).toBeDefined()
            expect(mocks.vscode.workspace.fs.createDirectory).toBeDefined()
            expect(mocks.vscode.workspace.fs.delete).toBeDefined()
            expect(mocks.vscode.workspace.fs.copy).toBeDefined()
            expect(mocks.vscode.workspace.fs.rename).toBeDefined()
            expect(mocks.vscode.workspace.createFileSystemWatcher).toBeDefined()
            expect(mocks.vscode.workspace.findFiles).toBeDefined()
            expect(mocks.vscode.workspace.openTextDocument).toBeDefined()

            // Uri
            expect(mocks.vscode.Uri.file).toBeDefined()
            expect(mocks.vscode.Uri.parse).toBeDefined()

            // Other VSCode APIs
            expect(mocks.vscode.TreeItem).toBeDefined()
            expect(mocks.vscode.ThemeIcon).toBeDefined()
            expect(mocks.vscode.ThemeColor).toBeDefined()
            expect(mocks.vscode.RelativePattern).toBeDefined()
            expect(mocks.vscode.EventEmitter).toBeDefined()
            expect(mocks.vscode.Disposable).toBeDefined()

            // Context
            expect(mocks.context.subscriptions).toBeDefined()
            expect(mocks.context.globalState.get).toBeDefined()
            expect(mocks.context.globalState.update).toBeDefined()
            expect(mocks.context.workspaceState.get).toBeDefined()
            expect(mocks.context.workspaceState.update).toBeDefined()
        })

        it('should create vi.fn() instances', () => {
            expect(vi.isMockFunction(mocks.vscode.commands.registerCommand)).toBe(true)
            expect(vi.isMockFunction(mocks.vscode.window.showInformationMessage)).toBe(true)
            expect(vi.isMockFunction(mocks.vscode.workspace.getConfiguration)).toBe(true)
            expect(vi.isMockFunction(mocks.vscode.Uri.file)).toBe(true)
        })

        it('should set up default active text editor', () => {
            expect(mocks.vscode.window.activeTextEditor).toBeDefined()
            expect(mocks.vscode.window.activeTextEditor.document).toBeDefined()
            expect(mocks.vscode.window.activeTextEditor.document.fileName).toBe('/test/file.txt')
            expect(mocks.vscode.window.activeTextEditor.selection).toBeDefined()
            expect(mocks.vscode.window.activeTextEditor.edit).toBeDefined()
        })

        it('should set up workspace folders', () => {
            expect(mocks.vscode.workspace.workspaceFolders).toBeDefined()
            expect(mocks.vscode.workspace.workspaceFolders).toHaveLength(1)
            expect(mocks.vscode.workspace.workspaceFolders[0].uri.fsPath).toBe('/test')
        })

        it('should set up context subscriptions', () => {
            expect(mocks.context.subscriptions).toBeDefined()
            expect(Array.isArray(mocks.context.subscriptions)).toBe(true)
        })

        it('should set up TreeItemCollapsibleState constants', () => {
            expect(mocks.vscode.TreeItemCollapsibleState.None).toBe(0)
            expect(mocks.vscode.TreeItemCollapsibleState.Collapsed).toBe(1)
            expect(mocks.vscode.TreeItemCollapsibleState.Expanded).toBe(2)
        })
    })

    describe('createMockEditBuilder', () => {
        it('should create mock edit builder with required methods', () => {
            const editBuilder = createMockEditBuilder()

            expect(editBuilder.insert).toBeDefined()
            expect(editBuilder.replace).toBeDefined()
            expect(editBuilder.delete).toBeDefined()

            expect(vi.isMockFunction(editBuilder.insert)).toBe(true)
            expect(vi.isMockFunction(editBuilder.replace)).toBe(true)
            expect(vi.isMockFunction(editBuilder.delete)).toBe(true)
        })
    })

    describe('setupVSCodeMocks', () => {
        beforeEach(() => {
            setupVSCodeMocks(mocks)
        })

        it('should set up window message mocks', async () => {
            await expect(mocks.vscode.window.showInformationMessage('test')).resolves.toBeUndefined()
            await expect(mocks.vscode.window.showWarningMessage('test')).resolves.toBeUndefined()
            await expect(mocks.vscode.window.showErrorMessage('test')).resolves.toBeUndefined()
            await expect(mocks.vscode.window.showInputBox()).resolves.toBe('test-input')
            await expect(mocks.vscode.window.showTextDocument({} as any)).resolves.toEqual({})
        })

        it('should set up withProgress mock', async () => {
            const task = vi.fn().mockResolvedValue('result')
            const result = await mocks.vscode.window.withProgress({}, task)
            expect(result).toBe('result')
            expect(task).toHaveBeenCalled()
        })

        it('should set up tree data provider mock', () => {
            const provider = mocks.vscode.window.registerTreeDataProvider('viewId', {} as any)
            expect(provider).toBeDefined()
            expect(provider.dispose).toBeDefined()
            expect(vi.isMockFunction(provider.dispose)).toBe(true)
        })

        it('should set up workspace configuration mock', () => {
            const config = mocks.vscode.workspace.getConfiguration('section')
            expect(config).toBeDefined()
            expect(config.get).toBeDefined()
            expect(config.update).toBeDefined()
            expect(config.has).toBeDefined()
            expect(config.inspect).toBeDefined()

            expect(config.get('setting')).toBe(true)
            expect(config.has('setting')).toBe(true)
            expect(config.inspect('setting')).toEqual({ globalValue: true })
        })

        it('should set up workspace file system mocks', async () => {
            const fileData = await mocks.vscode.workspace.fs.readFile({} as any)
            expect(fileData).toBeInstanceOf(Uint8Array)
            expect(Array.from(fileData)).toEqual([116, 101, 115, 116]) // "test"

            await expect(mocks.vscode.workspace.fs.writeFile({} as any, new Uint8Array())).resolves.toBeUndefined()
            
            const stat = await mocks.vscode.workspace.fs.stat({} as any)
            expect(stat).toEqual({ type: 1, size: 1024 })

            await expect(mocks.vscode.workspace.fs.createDirectory({} as any)).resolves.toBeUndefined()
            await expect(mocks.vscode.workspace.fs.delete({} as any)).resolves.toBeUndefined()
            await expect(mocks.vscode.workspace.fs.copy({} as any, {} as any)).resolves.toBeUndefined()
            await expect(mocks.vscode.workspace.fs.rename({} as any, {} as any)).resolves.toBeUndefined()
        })

        it('should set up Uri mock', () => {
            const uri = mocks.vscode.Uri.file('/test/path')
            expect(uri).toEqual({
                scheme: 'file',
                authority: '',
                path: '/test/path',
                query: '',
                fragment: '',
                fsPath: '/test/path',
                with: expect.any(Function),
                toString: expect.any(Function),
            })

            expect(uri.toString()).toBe('file:///test/path')
        })

        it('should set up TreeItem mock', () => {
            const treeItem = mocks.vscode.TreeItem('label', 0)
            expect(treeItem).toEqual({
                label: 'label',
                collapsibleState: 0,
                resourceUri: undefined,
                description: undefined,
                tooltip: undefined,
                contextValue: undefined,
                iconPath: undefined,
            })
        })

        it('should set up ThemeIcon mock', () => {
            const themeIcon = mocks.vscode.ThemeIcon('icon-id', 'theme')
            expect(themeIcon).toEqual({
                id: 'icon-id',
                theme: 'theme',
                color: undefined,
            })
        })

        it('should set up ThemeColor mock', () => {
            const themeColor = mocks.vscode.ThemeColor('color-id')
            expect(themeColor).toEqual({
                id: 'color-id',
            })
        })

        it('should set up RelativePattern mock', () => {
            const pattern = mocks.vscode.RelativePattern({} as any, '*.ts')
            expect(pattern).toEqual({
                base: {},
                pattern: '*.ts',
                match: expect.any(Function),
            })
            expect(pattern.match('test.ts')).toBe(true)
        })

        it('should set up EventEmitter mock', () => {
            const emitter = mocks.vscode.EventEmitter()
            expect(emitter).toEqual({
                event: expect.any(Function),
                fire: expect.any(Function),
                dispose: expect.any(Function),
            })
        })

        it('should set up Disposable mock', () => {
            const dispose = vi.fn()
            const disposable = mocks.vscode.Disposable(dispose)
            expect(disposable).toEqual({
                dispose,
            })
        })
    })

    describe('resetExtensionMocks', () => {
        beforeEach(() => {
            setupVSCodeMocks(mocks)
        })

        it('should reset all mock functions', () => {
            // Call some mocks first
            mocks.vscode.commands.registerCommand('test', () => {})
            mocks.vscode.window.showInformationMessage('test')
            mocks.vscode.workspace.getConfiguration('test')

            // Reset mocks
            resetExtensionMocks(mocks)

            // Verify mocks were reset
            expect(mocks.vscode.commands.registerCommand).toHaveBeenCalledTimes(0)
            expect(mocks.vscode.window.showInformationMessage).toHaveBeenCalledTimes(0)
            expect(mocks.vscode.workspace.getConfiguration).toHaveBeenCalledTimes(0)
        })
    })

    describe('Text Editor Scenarios', () => {
        describe('setupVSCodeTextEditorScenario', () => {
            it('should set up text editor with default options', () => {
                setupVSCodeTextEditorScenario(mocks)

                expect(mocks.vscode.window.activeTextEditor).toBeDefined()
                expect(mocks.vscode.window.activeTextEditor.document.fileName).toBe('/test/file.ts')
                expect(mocks.vscode.window.activeTextEditor.document.getText()).toBe('const test = "hello world";\nconsole.log(test);')
                expect(mocks.vscode.window.activeTextEditor.selection).toEqual({
                    start: { line: 0, character: 0 },
                    end: { line: 0, character: 5 },
                })
            })

            it('should set up text editor with custom options', () => {
                setupVSCodeTextEditorScenario(mocks, {
                    fileName: '/custom/file.ts',
                    content: 'custom content',
                    selection: { start: { line: 1, character: 2 }, end: { line: 1, character: 8 } },
                    selections: [
                        { start: { line: 1, character: 2 }, end: { line: 1, character: 8 } },
                        { start: { line: 2, character: 0 }, end: { line: 2, character: 5 } },
                    ],
                })

                expect(mocks.vscode.window.activeTextEditor.document.fileName).toBe('/custom/file.ts')
                expect(mocks.vscode.window.activeTextEditor.document.getText()).toBe('custom content')
                expect(mocks.vscode.window.activeTextEditor.selection).toEqual({
                    start: { line: 1, character: 2 },
                    end: { line: 1, character: 8 },
                })
                expect(mocks.vscode.window.activeTextEditor.selections).toHaveLength(2)
            })

            it('should set up edit function', async () => {
                setupVSCodeTextEditorScenario(mocks)

                const callback = vi.fn().mockImplementation((builder) => {
                    builder.insert({ line: 0, character: 0 }, 'text')
                })

                const result = await mocks.vscode.window.activeTextEditor.edit(callback)
                expect(result).toBe(true)
                expect(callback).toHaveBeenCalledTimes(1)
                
                // Verify the callback was called with an edit builder that has the expected methods
                const editBuilder = callback.mock.calls[0][0]
                expect(editBuilder.insert).toBeDefined()
                expect(editBuilder.replace).toBeDefined()
                expect(editBuilder.delete).toBeDefined()
            })
        })

        describe('setupVSCodeNoActiveEditorScenario', () => {
            it('should set active text editor to undefined', () => {
                setupVSCodeNoActiveEditorScenario(mocks)
                expect(mocks.vscode.window.activeTextEditor).toBeUndefined()
            })
        })
    })

    describe('Command Registration Scenarios', () => {
        describe('setupVSCodeCommandRegistrationScenario', () => {
            it('should set up successful command registration', () => {
                setupVSCodeCommandRegistrationScenario(mocks, {
                    commandName: 'test.command',
                    shouldSucceed: true,
                })

                const disposable = mocks.vscode.commands.registerCommand('test.command', () => {})
                expect(disposable).toBeDefined()
                expect(disposable.dispose).toBeDefined()
                expect(vi.isMockFunction(disposable.dispose)).toBe(true)
            })

            it('should set up failed command registration', () => {
                setupVSCodeCommandRegistrationScenario(mocks, {
                    commandName: 'test.command',
                    shouldSucceed: false,
                    errorMessage: 'Registration failed',
                })

                expect(() => {
                    mocks.vscode.commands.registerCommand('test.command', () => {})
                }).toThrow('Registration failed')
            })

            it('should use default error message when not provided', () => {
                setupVSCodeCommandRegistrationScenario(mocks, {
                    commandName: 'test.command',
                    shouldSucceed: false,
                })

                expect(() => {
                    mocks.vscode.commands.registerCommand('test.command', () => {})
                }).toThrow('Command failed')
            })
        })
    })

    describe('Window/UI Scenarios', () => {
        describe('setupVSCodeWindowMessageScenario', () => {
            it('should set up info message scenario', async () => {
                setupVSCodeWindowMessageScenario(mocks, 'info', 'Test message')
                await expect(mocks.vscode.window.showInformationMessage('Test message')).resolves.toBeUndefined()
            })

            it('should set up warning message scenario', async () => {
                setupVSCodeWindowMessageScenario(mocks, 'warning', 'Test warning')
                await expect(mocks.vscode.window.showWarningMessage('Test warning')).resolves.toBeUndefined()
            })

            it('should set up error message scenario', async () => {
                setupVSCodeWindowMessageScenario(mocks, 'error', 'Test error')
                await expect(mocks.vscode.window.showErrorMessage('Test error')).resolves.toBeUndefined()
            })
        })
    })

    describe('ExtensionMockBuilder', () => {
        let builder: ExtensionMockBuilder

        beforeEach(() => {
            builder = createExtensionMockBuilder(mocks)
        })

        it('should create builder instance', () => {
            expect(builder).toBeInstanceOf(ExtensionMockBuilder)
        })

        it('should support fluent chaining', () => {
            const result = builder
                .textEditor({ fileName: '/test/file.ts' })
                .commandRegistration({ commandName: 'test.command' })
                .windowMessage('info', 'Test message')
                .build()

            expect(result).toBe(mocks)
        })

        it('should set up text editor scenario', () => {
            builder.textEditor({ fileName: '/test/file.ts', content: 'test content' })

            expect(mocks.vscode.window.activeTextEditor.document.fileName).toBe('/test/file.ts')
            expect(mocks.vscode.window.activeTextEditor.document.getText()).toBe('test content')
        })

        it('should set up no active editor scenario', () => {
            builder.noActiveEditor()

            expect(mocks.vscode.window.activeTextEditor).toBeUndefined()
        })

        it('should set up command registration scenario', () => {
            builder.commandRegistration({ commandName: 'test.command', shouldSucceed: true })

            const disposable = mocks.vscode.commands.registerCommand('test.command', () => {})
            expect(disposable).toBeDefined()
        })

        it('should set up window message scenario', async () => {
            builder.windowMessage('info', 'Test message')

            await expect(mocks.vscode.window.showInformationMessage('Test message')).resolves.toBeUndefined()
        })

        it('should build and return mocks', () => {
            const result = builder.build()
            expect(result).toBe(mocks)
        })
    })

    describe('createExtensionMockBuilder', () => {
        it('should create ExtensionMockBuilder instance', () => {
            const builder = createExtensionMockBuilder(mocks)
            expect(builder).toBeInstanceOf(ExtensionMockBuilder)
        })
    })
})
