import type { ExtensionContext, Disposable, TreeView, TreeCheckboxChangeEvent } from 'vscode'
import type { WindowAdapter } from '@fux/shared'
import { ExtensionContextAdapter, ExtensionAPIAdapter } from '@fux/shared'
import { createDIContainer } from './injection.js'
import { ccpConstants } from '@fux/context-cherry-picker-core'
import type { SavedStateItem, IContextCherryPickerManager, IFileExplorerService, ISavedStatesService, IQuickSettingsService, FileExplorerItem } from '@fux/context-cherry-picker-core'
import { FileExplorerViewProvider } from './providers/FileExplorer.provider.js'
import { SavedStatesViewProvider } from './providers/SavedStates.provider.js'

// Intentional linting error
import { QuickSettingsViewProvider } from './providers/QuickSettings.provider.js'

// FIX The filter quick settings ignores directories starting with a ., EG.  '.shared'

export async function activate(context: ExtensionContext): Promise<void> {
	console.log(`[${ccpConstants.extension.name}] Activating...`)

	const extensionContext = new ExtensionContextAdapter(context)
	const extensionAPI = new ExtensionAPIAdapter()
	const container = await createDIContainer(context)

	const ccpManager = container.resolve<IContextCherryPickerManager>('ccpManager')
	const fileExplorerService = container.resolve<IFileExplorerService>('fileExplorerService')
	const savedStatesService = container.resolve<ISavedStatesService>('savedStatesService')
	const quickSettingsService = container.resolve<IQuickSettingsService>('quickSettingsService')
	const windowAdapter = container.resolve<WindowAdapter>('window')

	const fileExplorerProvider = new FileExplorerViewProvider(fileExplorerService)
	const savedStatesProvider = new SavedStatesViewProvider(savedStatesService)
	const quickSettingsProvider = new QuickSettingsViewProvider(quickSettingsService)

	extensionContext.subscriptions.push(fileExplorerService)

	const explorerView: TreeView<FileExplorerItem> = extensionAPI.createTreeView(ccpConstants.views.contextCherryPicker.explorer, {
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
	extensionContext.subscriptions.push(explorerView)

	extensionContext.subscriptions.push(
		extensionAPI.createTreeView(ccpConstants.views.contextCherryPicker.savedStates, {
			treeDataProvider: savedStatesProvider,
		}),
	)

	extensionContext.subscriptions.push(
		extensionAPI.registerWebviewViewProvider(
			ccpConstants.views.contextCherryPicker.quickSettings,
			quickSettingsProvider,
		),
	)

	const commandDisposables: Disposable[] = [
		extensionAPI.registerCommand(ccpConstants.commands.contextCherryPicker.saveCheckedState, () => ccpManager.saveCurrentCheckedState()),
		extensionAPI.registerCommand(ccpConstants.commands.contextCherryPicker.refreshExplorer, () => ccpManager.refreshExplorerView()),
		extensionAPI.registerCommand(ccpConstants.commands.contextCherryPicker.deleteSavedState, (item: SavedStateItem) => ccpManager.deleteSavedState(item)),
		extensionAPI.registerCommand(ccpConstants.commands.contextCherryPicker.loadSavedState, (item: SavedStateItem) => ccpManager.loadSavedStateIntoExplorer(item)),
		extensionAPI.registerCommand(ccpConstants.commands.contextCherryPicker.clearAllCheckedInExplorer, () => ccpManager.clearAllCheckedInExplorer()),
		extensionAPI.registerCommand(ccpConstants.commands.contextCherryPicker.copyContextOfCheckedItems, () => ccpManager.copyContextOfCheckedItems()),
	]

	extensionContext.subscriptions.push(...commandDisposables)

	console.log(`[${ccpConstants.extension.name}] Activated and commands registered.`)
}

export function deactivate(): void {}
