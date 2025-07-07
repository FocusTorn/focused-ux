import type { ExtensionContext, Disposable, TreeView, TreeCheckboxChangeEvent } from 'vscode'
import * as vscode from 'vscode'
import { createDIContainer } from './injection.js'
import { ccpConstants } from '@fux/context-cherry-picker-core'
import type { SavedStateItem, IContextCherryPickerManager, IFileExplorerService, ISavedStatesService, IQuickSettingsService, FileExplorerItem, IWindow } from '@fux/context-cherry-picker-core'
import { FileExplorerViewProvider } from './providers/FileExplorer.provider.js'
import { SavedStatesViewProvider } from './providers/SavedStates.provider.js'
import { QuickSettingsViewProvider } from './providers/QuickSettings.provider.js'
import type { WindowAdapter } from './adapters/Window.adapter.js'

export async function activate(context: ExtensionContext): Promise<void> {
	console.log(`[${ccpConstants.extension.name}] Activating...`)

	const container = createDIContainer(context)

	const ccpManager = container.resolve<IContextCherryPickerManager>('ccpManager')
	const fileExplorerService = container.resolve<IFileExplorerService>('fileExplorerService')
	const savedStatesService = container.resolve<ISavedStatesService>('savedStatesService')
	const quickSettingsService = container.resolve<IQuickSettingsService>('quickSettingsService')
	const windowAdapter = container.resolve<IWindow>('window') as WindowAdapter

	const fileExplorerProvider = new FileExplorerViewProvider(fileExplorerService)
	const savedStatesProvider = new SavedStatesViewProvider(savedStatesService)
	const quickSettingsProvider = new QuickSettingsViewProvider(quickSettingsService)

	context.subscriptions.push(fileExplorerService)

	const explorerView: TreeView<FileExplorerItem> = vscode.window.createTreeView(ccpConstants.views.contextCherryPicker.explorer, {
		treeDataProvider: fileExplorerProvider,
		showCollapseAll: true,
		canSelectMany: true,
	})

	windowAdapter.setExplorerView(explorerView)

	explorerView.onDidChangeCheckboxState((e: TreeCheckboxChangeEvent<FileExplorerItem>) => {
		for (const [item, state] of e.items) {
			fileExplorerService.updateCheckboxState(item.uri, state)
		}
	})
	context.subscriptions.push(explorerView)

	context.subscriptions.push(
		vscode.window.createTreeView(ccpConstants.views.contextCherryPicker.savedStates, {
			treeDataProvider: savedStatesProvider,
		}),
	)

	context.subscriptions.push(
		vscode.window.registerWebviewViewProvider(
			ccpConstants.views.contextCherryPicker.quickSettings,
			quickSettingsProvider,
		),
	)

	const commandDisposables: Disposable[] = [
		vscode.commands.registerCommand(ccpConstants.commands.contextCherryPicker.saveCheckedState, () => ccpManager.saveCurrentCheckedState()),
		vscode.commands.registerCommand(ccpConstants.commands.contextCherryPicker.refreshExplorer, () => ccpManager.refreshExplorerView()),
		vscode.commands.registerCommand(ccpConstants.commands.contextCherryPicker.deleteSavedState, (item: SavedStateItem) => ccpManager.deleteSavedState(item)),
		vscode.commands.registerCommand(ccpConstants.commands.contextCherryPicker.loadSavedState, (item: SavedStateItem) => ccpManager.loadSavedStateIntoExplorer(item)),
		vscode.commands.registerCommand(ccpConstants.commands.contextCherryPicker.clearAllCheckedInExplorer, () => ccpManager.clearAllCheckedInExplorer()),
		vscode.commands.registerCommand(ccpConstants.commands.contextCherryPicker.copyContextOfCheckedItems, () => ccpManager.copyContextOfCheckedItems()),
	]

	context.subscriptions.push(...commandDisposables)

	console.log(`[${ccpConstants.extension.name}] Activated and commands registered.`)
}

export function deactivate(): void {}
