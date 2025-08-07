import type { AwilixContainer } from 'awilix'
import { createContainer, InjectionMode, asValue, asClass, asFunction } from 'awilix'
import type { ExtensionContext } from 'vscode'
import type { IConfigurationService, IProcess as ISharedProcess } from '@fux/shared'
import { ConfigurationService, WindowAdapter, WorkspaceCCPAdapter } from '@fux/shared'

// Core Services
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
import type { IContext, ITreeItemFactory } from '@fux/context-cherry-picker-core'

// Adapters
import { FileSystemAdapter } from './adapters/FileSystem.adapter.js'
import { PathAdapter } from './adapters/Path.adapter.js'

// CCP-specific adapters
class CCPContextAdapter implements IContext {

	constructor(private context: ExtensionContext) {}

	get globalStorageUri(): string {
		return this.context.globalStorageUri.fsPath
	}

	get extensionUri(): string {
		return this.context.extensionUri.fsPath
	}

	get subscriptions(): { dispose: () => any }[] {
		return this.context.subscriptions
	}

}

class CCPTreeItemFactoryAdapter implements ITreeItemFactory {

	getCheckboxStateUnchecked() {
		return 1 // TreeItemCheckboxState.Unchecked
	}

	getCheckboxStateChecked() {
		return 2 // TreeItemCheckboxState.Checked
	}

	getCollapsibleStateNone() {
		return 0 // TreeItemCollapsibleState.None
	}

	getCollapsibleStateCollapsed() {
		return 1 // TreeItemCollapsibleState.Collapsed
	}

	getCollapsibleStateExpanded() {
		return 2 // TreeItemCollapsibleState.Expanded
	}

}

export async function createDIContainer(context: ExtensionContext): Promise<AwilixContainer> {
	const container = createContainer({
		injectionMode: InjectionMode.PROXY,
	})

	// Adapters for CCP's own interfaces
	container.register({
		context: asValue(new CCPContextAdapter(context)),
		fileSystem: asClass(FileSystemAdapter).singleton(),
		path: asClass(PathAdapter).singleton(),
		workspace: asClass(WorkspaceCCPAdapter).singleton(),
		treeItemFactory: asValue(new CCPTreeItemFactoryAdapter()),
	})

	// Create an adapter for the shared IProcess interface
	const sharedProcessAdapter: ISharedProcess = {
		getWorkspaceRoot: () => container.resolve<WorkspaceCCPAdapter>('workspace').workspaceFolders?.[0]?.uri,
		exec: () => { throw new Error('exec not implemented for this adapter') },
	}

	// Manually construct shared services
	const configurationService = new ConfigurationService(
		container.resolve<FileSystemAdapter>('fileSystem'),
		sharedProcessAdapter,
	)

	// Register shared services
	container.register({
		configurationService: asValue(configurationService),
	})

	// Manually construct adapters that need shared services
	const windowAdapter = new WindowAdapter(container.resolve<IConfigurationService>('configurationService'))

	container.register({
		window: asValue(windowAdapter),
	})

	// Core Services
	container.register({
		tokenizerService: asClass(TokenizerService).singleton(),
		treeFormatterService: asClass(TreeFormatterService).singleton(),
		fileUtilsService: asClass(FileUtilsService).singleton(),
		storageService: asFunction((cradle: { context: CCPContextAdapter, fileSystem: FileSystemAdapter, path: PathAdapter }) =>
			new StorageService(cradle.context, cradle.fileSystem, cradle.path)).singleton(),
		googleGenAiService: asFunction((cradle: { workspace: WorkspaceCCPAdapter }) =>
			new GoogleGenAiService(cradle.workspace)).singleton(),
		contextDataCollector: asFunction((cradle: { workspace: WorkspaceCCPAdapter, fileSystem: FileSystemAdapter, path: PathAdapter }) =>
			new ContextDataCollectorService(cradle.workspace, cradle.fileSystem, cradle.path)).singleton(),
		fileContentProvider: asFunction((cradle: { fileSystem: FileSystemAdapter, window: WindowAdapter, tokenizerService: TokenizerService }) =>
			new FileContentProviderService(cradle.fileSystem, cradle.window, cradle.tokenizerService)).singleton(),
		contextFormatter: asFunction((cradle: { treeFormatterService: TreeFormatterService, fileUtilsService: FileUtilsService, path: PathAdapter }) =>
			new ContextFormattingService(cradle.treeFormatterService, cradle.fileUtilsService, cradle.path)).singleton(),
		quickSettingsService: asFunction((cradle: { context: CCPContextAdapter, workspace: WorkspaceCCPAdapter, fileSystem: FileSystemAdapter, path: PathAdapter }) =>
			new QuickSettingsService(cradle.context, cradle.workspace, cradle.fileSystem, cradle.path)).singleton(),
		fileExplorerService: asFunction((cradle: { workspace: WorkspaceCCPAdapter, window: WindowAdapter, quickSettingsService: QuickSettingsService, tokenizerService: TokenizerService, fileSystem: FileSystemAdapter, path: PathAdapter, treeItemFactory: CCPTreeItemFactoryAdapter }) =>
			new FileExplorerService(cradle.workspace, cradle.window, cradle.quickSettingsService, cradle.tokenizerService, cradle.fileSystem, cradle.path, cradle.treeItemFactory)).singleton(),
		savedStatesService: asFunction((cradle: { storageService: StorageService }) =>
			new SavedStatesService(cradle.storageService)).singleton(),
		ccpManager: asFunction((cradle: {
			fileExplorerService: FileExplorerService
			savedStatesService: SavedStatesService
			quickSettingsService: QuickSettingsService
			storageService: StorageService
			contextDataCollector: ContextDataCollectorService
			fileContentProvider: FileContentProviderService
			contextFormatter: ContextFormattingService
			window: WindowAdapter
			workspace: WorkspaceCCPAdapter
			path: PathAdapter
			configurationService: IConfigurationService
			treeItemFactory: CCPTreeItemFactoryAdapter
		}) => new ContextCherryPickerManager(
			cradle.fileExplorerService,
			cradle.savedStatesService,
			cradle.quickSettingsService,
			cradle.storageService,
			cradle.contextDataCollector,
			cradle.fileContentProvider,
			cradle.contextFormatter,
			cradle.window,
			cradle.workspace,
			cradle.path,
			cradle.configurationService,
			cradle.treeItemFactory,
		)).singleton(),
	})

	return container
}
