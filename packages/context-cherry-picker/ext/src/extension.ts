import * as vscode from 'vscode'
import process from 'node:process'
import {
    ContextCherryPickerManager,
    StorageService,
    GoogleGenAiService,
    ContextDataCollectorService,
    FileContentProviderService,
    ContextFormattingService,
    FileExplorerService,
    SavedStatesService,
    QuickSettingsService,
    TokenizerService,
    TreeFormatterService,
    FileUtilsService,
} from '@fux/context-cherry-picker-core'
import { ContextAdapter } from './adapters/Context.adapter.js'
import { FileSystemAdapter } from './adapters/FileSystem.adapter.js'
import { PathAdapter } from './adapters/Path.adapter.js'
import { WindowAdapter } from './adapters/Window.adapter.js'
import { WorkspaceAdapter } from './adapters/Workspace.adapter.js'
import { TreeItemFactoryAdapter } from './adapters/TreeItemFactory.adapter.js'
import { FileExplorerViewProvider } from './providers/FileExplorer.provider.js'
import { SavedStatesViewProvider } from './providers/SavedStates.provider.js'
import { QuickSettingsViewProvider } from './providers/QuickSettings.provider.js'
import { ccpConstants } from '@fux/context-cherry-picker-core'

// --- Environment Check ---
// VS Code's test runner sets this environment variable.
const IS_TEST_ENVIRONMENT = process.env.VSCODE_TEST === '1'

export async function activate(context: vscode.ExtensionContext): Promise<void> {
    try {
        // Create adapters
        const contextAdapter = new ContextAdapter(context)
        const fileSystem = new FileSystemAdapter()
        const path = new PathAdapter()
        const window = new WindowAdapter()
        const workspace = new WorkspaceAdapter()
        const treeItemFactory = new TreeItemFactoryAdapter()

        // Create core services with their dependencies
        const storageService = new StorageService(contextAdapter)
        const googleGenAiService = new GoogleGenAiService()
        const contextDataCollectorService = new ContextDataCollectorService(fileSystem, path)
        const fileContentProviderService = new FileContentProviderService(fileSystem, path)
        const contextFormattingService = new ContextFormattingService()
        const fileExplorerService = new FileExplorerService(fileSystem, path, workspace, window, treeItemFactory)
        const savedStatesService = new SavedStatesService(storageService)
        const quickSettingsService = new QuickSettingsService(workspace, fileSystem, path, contextAdapter)
        const tokenizerService = new TokenizerService()
        const treeFormatterService = new TreeFormatterService()
        const fileUtilsService = new FileUtilsService(fileSystem, path)

        // Create manager service with aggregated dependencies
        const ccpManager = new ContextCherryPickerManager({
            contextDataCollector: contextDataCollectorService,
            contextFormatting: contextFormattingService,
            fileContentProvider: fileContentProviderService,
            fileExplorer: fileExplorerService,
            fileUtils: fileUtilsService,
            googleGenAi: googleGenAiService,
            quickSettings: quickSettingsService,
            savedStates: savedStatesService,
            storage: storageService,
            tokenizer: tokenizerService,
            treeFormatter: treeFormatterService,
        })

        // Create view providers
        const fileExplorerProvider = new FileExplorerViewProvider(fileExplorerService)
        const savedStatesProvider = new SavedStatesViewProvider(savedStatesService)
        const quickSettingsProvider = new QuickSettingsViewProvider(quickSettingsService)

        // Register tree views
        const explorerView = vscode.window.createTreeView(ccpConstants.views.contextCherryPicker.explorer, {
            treeDataProvider: fileExplorerProvider,
            showCollapseAll: true,
            canSelectMany: true,
        })

        explorerView.onDidChangeCheckboxState((e: vscode.TreeCheckboxChangeEvent<any>) => {
            for (const [item, state] of e.items) {
                fileExplorerService.updateCheckboxState(item.uri, state)
            }
        })

        const savedStatesView = vscode.window.createTreeView(ccpConstants.views.contextCherryPicker.savedStates, {
            treeDataProvider: savedStatesProvider,
        })

        const quickSettingsView = vscode.window.registerWebviewViewProvider(
            ccpConstants.views.contextCherryPicker.quickSettings,
            quickSettingsProvider,
        )

        // Register all commands
        const disposables = [
            vscode.commands.registerCommand(ccpConstants.commands.contextCherryPicker.saveCheckedState, () => ccpManager.saveCurrentCheckedState()),
            vscode.commands.registerCommand(ccpConstants.commands.contextCherryPicker.refreshExplorer, () => ccpManager.refreshExplorerView()),
            vscode.commands.registerCommand(ccpConstants.commands.contextCherryPicker.deleteSavedState, (item: any) => ccpManager.deleteSavedState(item)),
            vscode.commands.registerCommand(ccpConstants.commands.contextCherryPicker.loadSavedState, (item: any) => ccpManager.loadSavedStateIntoExplorer(item)),
            vscode.commands.registerCommand(ccpConstants.commands.contextCherryPicker.clearAllCheckedInExplorer, () => ccpManager.clearAllCheckedInExplorer()),
            vscode.commands.registerCommand(ccpConstants.commands.contextCherryPicker.copyContextOfCheckedItems, () => ccpManager.copyContextOfCheckedItems()),
            explorerView,
            savedStatesView,
            quickSettingsView,
        ]

        context.subscriptions.push(...disposables)

        if (!IS_TEST_ENVIRONMENT) {
            await vscode.window.showInformationMessage(`${ccpConstants.extension.name} activated successfully!`)
        }
    } catch (error) {
        const errorMessage = `Failed to activate ${ccpConstants.extension.name}: ${error}`
        if (!IS_TEST_ENVIRONMENT) {
            await vscode.window.showErrorMessage(errorMessage)
        } else {
            throw new Error(errorMessage)
        }
    }
}

export function deactivate(): void {}
