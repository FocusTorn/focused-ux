import type { ExtensionContext, Disposable, TextEditorEdit, WorkspaceConfiguration } from 'vscode'

import { ClipboardService, ConsoleLoggerService, ImportGeneratorService } from '@fux/ghost-writer-core'
import { constants } from './_config/constants.js'
import { StorageAdapter } from './adapters/Storage.adapter.js'
import { WindowAdapter } from './adapters/Window.adapter.js'
import { PathUtilsAdapter } from './adapters/PathUtils.adapter.js'
import { WorkspaceAdapter } from './adapters/Workspace.adapter.js'
import { CommandsAdapter } from './adapters/Commands.adapter.js'
import { PositionAdapter } from './adapters/Position.adapter.js'
import * as vscode from 'vscode'

export function activate(context: ExtensionContext): void {
    console.log(`[${constants.extension.name}] Activating...`)

    // Create adapters
    const storageAdapter = new StorageAdapter()

    storageAdapter.setContext(context)

    const windowAdapter = new WindowAdapter()
    const pathUtilsAdapter = new PathUtilsAdapter()
    const workspaceAdapter = new WorkspaceAdapter()
    const commandsAdapter = new CommandsAdapter()
    const positionAdapter = new PositionAdapter()

    // Create core services
    const clipboardService = new ClipboardService(storageAdapter)
    const consoleLoggerService = new ConsoleLoggerService()
    const importGeneratorService = new ImportGeneratorService(pathUtilsAdapter, windowAdapter)

    // Command Handlers
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

        const importStatement = importGeneratorService.generate(
            editor.document.fileName,
            fragment,
        )

        if (importStatement) {
            await editor.edit((editBuilder: TextEditorEdit) => {
                editBuilder.insert(editor.selection.active, importStatement)
            })
            await clipboardService.clear()
        } else {
            windowAdapter.errMsg('Failed to generate import statement. Could not determine relative path.')
        }
    }

    const handleLogSelectedVariable = async (): Promise<void> => {
        const editor = windowAdapter.activeTextEditor

        if (!editor) {
            windowAdapter.errMsg('No active text editor.')
            return
        }

        const config: WorkspaceConfiguration = workspaceAdapter.getConfiguration(constants.extension.configKey)
        const includeClassName = config.get<boolean>(
            constants.configKeys.loggerIncludeClassName,
            true,
        ) ?? true
        const includeFunctionName = config.get<boolean>(
            constants.configKeys.loggerIncludeFunctionName,
            true,
        ) ?? true

        for (const selection of editor.selections) {
            const selectedVar = editor.document.getText(selection)

            if (!selectedVar.trim()) {
                continue
            }

            const result = consoleLoggerService.generate({
                documentContent: editor.document.getText(),
                fileName: editor.document.fileName,
                selectedVar,
                selectionLine: selection.active.line,
                includeClassName,
                includeFunctionName,
            })

            if (result) {
                await editor.edit((editBuilder: TextEditorEdit) => {
                    const positionInstance = positionAdapter.create(result.insertLine, 0)

                    editBuilder.insert(positionInstance, result.logStatement)
                })
            } else {
                windowAdapter.errMsg('Failed to generate console log statement.')
            }
        }
    }

    const disposables: Disposable[] = [
        commandsAdapter.registerCommand(
            constants.commands.storeCodeFragment,
            handleStoreCodeFragment,
        ),
        commandsAdapter.registerCommand(
            constants.commands.insertImportStatement,
            handleInsertImportStatement,
        ),
        commandsAdapter.registerCommand(
            constants.commands.logSelectedVariable,
            handleLogSelectedVariable,
        ),
    ]

    context.subscriptions.push(...disposables)

    console.log(`[${constants.extension.name}] Activated.`)
}

export function deactivate(): void {}
