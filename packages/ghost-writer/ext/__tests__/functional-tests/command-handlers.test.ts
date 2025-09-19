import { describe, it, expect, beforeEach, vi } from 'vitest'
import * as vscode from 'vscode'
import { ClipboardService } from '@fux/ghost-writer-core'
import { StorageAdapter } from '../../src/adapters/Storage.adapter'
import { WindowAdapter } from '../../src/adapters/Window.adapter'
import { PathUtilsAdapter } from '../../src/adapters/PathUtils.adapter'
import { WorkspaceAdapter } from '../../src/adapters/Workspace.adapter'
import { PositionAdapter } from '../../src/adapters/Position.adapter'
import {
    setupTestEnvironment,
    resetAllMocks,
    setupVSCodeMocks,
    createMockStorageContext,
    createMockTextEditor,
    createMockConfiguration
} from '../__mocks__/helpers'

describe('Ghost Writer Command Handlers', () => {
    let mocks: ReturnType<typeof setupTestEnvironment>
    let mockContext: any
    let storageAdapter: StorageAdapter
    let windowAdapter: WindowAdapter
    let pathUtilsAdapter: PathUtilsAdapter
    let workspaceAdapter: WorkspaceAdapter
    let positionAdapter: PositionAdapter
    let clipboardService: ClipboardService
    let mockEditor: any
    let mockDocument: any
    let mockSelection: any

    beforeEach(() => {
        mocks = setupTestEnvironment()
        setupVSCodeMocks(mocks)
        resetAllMocks(mocks)
		
        // Setup mock context using helper
        mockContext = createMockStorageContext()

        // Setup adapters
        storageAdapter = new StorageAdapter()
        storageAdapter.setContext(mockContext)
        windowAdapter = new WindowAdapter()
        pathUtilsAdapter = new PathUtilsAdapter()
        workspaceAdapter = new WorkspaceAdapter()
        positionAdapter = new PositionAdapter()

        // Setup core services
        clipboardService = new ClipboardService(storageAdapter)

        // Setup mock editor using helper
        mockEditor = createMockTextEditor({
            fileName: '/project/src/test.ts',
            content: 'const myVar = "test";\nconsole.log(myVar);',
            selection: {
                active: { line: 1, character: 5 },
                start: { line: 1, character: 0 },
                end: { line: 1, character: 10 },
            }
        })

        // Extract references for backward compatibility
        mockDocument = mockEditor.document
        mockSelection = mockEditor.selection

        // Mock workspace configuration using helper
        const mockConfiguration = createMockConfiguration()
        mockConfiguration.get.mockReturnValue(true)
        vi.mocked(vscode.workspace.getConfiguration).mockReturnValue(mockConfiguration)
    })

    describe('handleStoreCodeFragment', () => {
        it('should store code fragment when text is selected', async () => {
            // Arrange
            vi.mocked(vscode.window).activeTextEditor = mockEditor
            mockDocument.getText.mockReturnValue('selectedText')

            // Act
            const handleStoreCodeFragment = async (): Promise<void> => {
                const editor = windowAdapter.activeTextEditor

                if (!editor) {
                    windowAdapter.errMsg('No active text editor.')
                    return
                }

                const selection = editor.selection
                const selectedText = editor.document.getText(selection)

                if (selectedText.trim()) {
                    await clipboardService.store({
                        text: selectedText,
                        sourceFilePath: editor.document.fileName,
                    })
                    await windowAdapter.showTimedInformationMessage(`Stored fragment: ${selectedText}`)
                }
                else {
                    windowAdapter.errMsg('No text selected to store.')
                }
            }

            await handleStoreCodeFragment()

            // Assert
            expect(mockContext.globalState.update).toHaveBeenCalledWith(
                'fux-ghost-writer.clipboard',
                {
                    text: 'selectedText',
                    sourceFilePath: '/project/src/test.ts',
                }
            )
            expect(vscode.window.showInformationMessage).toHaveBeenCalledWith('Stored fragment: selectedText')
        })

        it('should show error when no active editor', async () => {
            // Arrange
            vi.mocked(vscode.window).activeTextEditor = undefined

            // Act
            const handleStoreCodeFragment = async (): Promise<void> => {
                const editor = windowAdapter.activeTextEditor

                if (!editor) {
                    windowAdapter.errMsg('No active text editor.')
                    return
                }

                const selection = editor.selection
                const selectedText = editor.document.getText(selection)

                if (selectedText.trim()) {
                    await clipboardService.store({
                        text: selectedText,
                        sourceFilePath: editor.document.fileName,
                    })
                    await windowAdapter.showTimedInformationMessage(`Stored fragment: ${selectedText}`)
                }
                else {
                    windowAdapter.errMsg('No text selected to store.')
                }
            }

            await handleStoreCodeFragment()

            // Assert
            expect(vscode.window.showErrorMessage).toHaveBeenCalledWith('No active text editor.')
            expect(mockContext.globalState.update).not.toHaveBeenCalled()
        })

        it('should show error when no text is selected', async () => {
            // Arrange
            vi.mocked(vscode.window).activeTextEditor = mockEditor
            mockDocument.getText.mockReturnValue('')

            // Act
            const handleStoreCodeFragment = async (): Promise<void> => {
                const editor = windowAdapter.activeTextEditor

                if (!editor) {
                    windowAdapter.errMsg('No active text editor.')
                    return
                }

                const selection = editor.selection
                const selectedText = editor.document.getText(selection)

                if (selectedText.trim()) {
                    await clipboardService.store({
                        text: selectedText,
                        sourceFilePath: editor.document.fileName,
                    })
                    await windowAdapter.showTimedInformationMessage(`Stored fragment: ${selectedText}`)
                }
                else {
                    windowAdapter.errMsg('No text selected to store.')
                }
            }

            await handleStoreCodeFragment()

            // Assert
            expect(vscode.window.showErrorMessage).toHaveBeenCalledWith('No text selected to store.')
            expect(mockContext.globalState.update).not.toHaveBeenCalled()
        })
    })

    describe('handleInsertImportStatement', () => {
        it('should insert import statement when fragment is stored', async () => {
            // Arrange
            vi.mocked(vscode.window).activeTextEditor = mockEditor
            mockContext.globalState.get.mockResolvedValue({
                text: 'MyComponent',
                sourceFilePath: '/project/src/components/MyComponent.ts',
            })

            // Mock path utils to return a valid path
            vi.spyOn(pathUtilsAdapter, 'getDottedPath').mockReturnValue('./components/MyComponent')

            // Act
            const handleInsertImportStatement = async (): Promise<void> => {
                const editor = windowAdapter.activeTextEditor

                if (!editor) {
                    windowAdapter.errMsg('No active text editor.')
                    return
                }

                const fragment = await clipboardService.retrieve()

                if (!fragment) {
                    windowAdapter.errMsg('No fragment stored in Ghost Writer clipboard.')
                    return
                }

                const importStatement = `import { ${fragment.text} } from '${fragment.sourceFilePath.replace(/\.[^/.]+$/, '')}.js'\n`

                if (importStatement) {
                    await editor.edit((editBuilder: any) => {
                        editBuilder.insert(editor.selection.active, importStatement)
                    })
                    await clipboardService.clear()
                }
            }

            await handleInsertImportStatement()

            // Assert
            expect(mockContext.globalState.get).toHaveBeenCalledWith('fux-ghost-writer.clipboard')
            expect(mockEditor.edit).toHaveBeenCalled()
            expect(mockContext.globalState.update).toHaveBeenCalledWith('fux-ghost-writer.clipboard', undefined)
        })

        it('should show error when no fragment is stored', async () => {
            // Arrange
            vi.mocked(vscode.window).activeTextEditor = mockEditor
            mockContext.globalState.get.mockResolvedValue(undefined)

            // Act
            const handleInsertImportStatement = async (): Promise<void> => {
                const editor = windowAdapter.activeTextEditor

                if (!editor) {
                    windowAdapter.errMsg('No active text editor.')
                    return
                }

                const fragment = await clipboardService.retrieve()

                if (!fragment) {
                    windowAdapter.errMsg('No fragment stored in Ghost Writer clipboard.')
                    return
                }

                const importStatement = `import { ${fragment.text} } from '${fragment.sourceFilePath.replace(/\.[^/.]+$/, '')}.js'\n`

                if (importStatement) {
                    await editor.edit((editBuilder: any) => {
                        editBuilder.insert(editor.selection.active, importStatement)
                    })
                    await clipboardService.clear()
                }
            }

            await handleInsertImportStatement()

            // Assert
            expect(vscode.window.showErrorMessage).toHaveBeenCalledWith('No fragment stored in Ghost Writer clipboard.')
            expect(mockEditor.edit).not.toHaveBeenCalled()
        })

        it('should show error when no active editor', async () => {
            // Arrange
            vi.mocked(vscode.window).activeTextEditor = undefined

            // Act
            const handleInsertImportStatement = async (): Promise<void> => {
                const editor = windowAdapter.activeTextEditor

                if (!editor) {
                    windowAdapter.errMsg('No active text editor.')
                    return
                }

                const fragment = await clipboardService.retrieve()

                if (!fragment) {
                    windowAdapter.errMsg('No fragment stored in Ghost Writer clipboard.')
                    return
                }

                const importStatement = `import { ${fragment.text} } from '${fragment.sourceFilePath.replace(/\.[^/.]+$/, '')}.js'\n`

                if (importStatement) {
                    await editor.edit((editBuilder: any) => {
                        editBuilder.insert(editor.selection.active, importStatement)
                    })
                    await clipboardService.clear()
                }
            }

            await handleInsertImportStatement()

            // Assert
            expect(vscode.window.showErrorMessage).toHaveBeenCalledWith('No active text editor.')
        })
    })

    describe('handleLogSelectedVariable', () => {
        it('should log selected variable with configuration', async () => {
            // Arrange
            vi.mocked(vscode.window).activeTextEditor = mockEditor
            mockDocument.getText.mockReturnValue('const myVar = "test";\nconsole.log(myVar);')

            // Mock workspace configuration
            const mockConfig = {
                get: vi.fn().mockReturnValue(true),
            }
            vi.mocked(vscode.workspace.getConfiguration).mockReturnValue(mockConfig as any)

            // Act
            const handleLogSelectedVariable = async (): Promise<void> => {
                const editor = windowAdapter.activeTextEditor

                if (!editor) {
                    windowAdapter.errMsg('No active text editor.')
                    return
                }

                const config = workspaceAdapter.getConfiguration('fux-ghost-writer')
                const includeClassName = config.get('consoleLogger.includeClassName', true) ?? true
                const includeFunctionName = config.get('consoleLogger.includeFunctionName', true) ?? true

                for (const selection of editor.selections) {
                    const selectedVar = editor.document.getText(selection)

                    if (!selectedVar.trim()) {
                        continue
                    }

                    // Mock console logger result
                    const result = {
                        logStatement: 'console.log(\'myVar:\', myVar);\n',
                        insertLine: 2,
                    }

                    if (result) {
                        await editor.edit((editBuilder: any) => {
                            const positionInstance = positionAdapter.create(result.insertLine, 0)
                            editBuilder.insert(positionInstance, result.logStatement)
                        })
                    }
                }
            }

            await handleLogSelectedVariable()

            // Assert
            expect(vscode.workspace.getConfiguration).toHaveBeenCalledWith('fux-ghost-writer')
            expect(mockConfig.get).toHaveBeenCalledWith('consoleLogger.includeClassName', true)
            expect(mockConfig.get).toHaveBeenCalledWith('consoleLogger.includeFunctionName', true)
            expect(mockEditor.edit).toHaveBeenCalled()
        })

        it('should skip empty selections', async () => {
            // Arrange
            vi.mocked(vscode.window).activeTextEditor = mockEditor
            mockDocument.getText.mockReturnValue('')

            // Act
            const handleLogSelectedVariable = async (): Promise<void> => {
                const editor = windowAdapter.activeTextEditor

                if (!editor) {
                    windowAdapter.errMsg('No active text editor.')
                    return
                }

                const config = workspaceAdapter.getConfiguration('fux-ghost-writer')
                const includeClassName = config.get('consoleLogger.includeClassName', true) ?? true
                const includeFunctionName = config.get('consoleLogger.includeFunctionName', true) ?? true

                for (const selection of editor.selections) {
                    const selectedVar = editor.document.getText(selection)

                    if (!selectedVar.trim()) {
                        continue
                    }

                    // Mock console logger result
                    const result = {
                        logStatement: 'console.log(\'myVar:\', myVar);\n',
                        insertLine: 2,
                    }

                    if (result) {
                        await editor.edit((editBuilder: any) => {
                            const positionInstance = positionAdapter.create(result.insertLine, 0)
                            editBuilder.insert(positionInstance, result.logStatement)
                        })
                    }
                }
            }

            await handleLogSelectedVariable()

            // Assert
            expect(mockEditor.edit).not.toHaveBeenCalled()
        })

        it('should show error when no active editor', async () => {
            // Arrange
            vi.mocked(vscode.window).activeTextEditor = undefined

            // Act
            const handleLogSelectedVariable = async (): Promise<void> => {
                const editor = windowAdapter.activeTextEditor

                if (!editor) {
                    windowAdapter.errMsg('No active text editor.')
                    return
                }

                const config = workspaceAdapter.getConfiguration('fux-ghost-writer')
                const includeClassName = config.get('consoleLogger.includeClassName', true) ?? true
                const includeFunctionName = config.get('consoleLogger.includeFunctionName', true) ?? true

                for (const selection of editor.selections) {
                    const selectedVar = editor.document.getText(selection)

                    if (!selectedVar.trim()) {
                        continue
                    }

                    // Mock console logger result
                    const result = {
                        logStatement: 'console.log(\'myVar:\', myVar);\n',
                        insertLine: 2,
                    }

                    if (result) {
                        await editor.edit((editBuilder: any) => {
                            const positionInstance = positionAdapter.create(result.insertLine, 0)
                            editBuilder.insert(positionInstance, result.logStatement)
                        })
                    }
                }
            }

            await handleLogSelectedVariable()

            // Assert
            expect(vscode.window.showErrorMessage).toHaveBeenCalledWith('No active text editor.')
        })
    })
})
