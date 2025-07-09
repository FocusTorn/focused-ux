import { createContainer, asClass, asValue, asFunction, InjectionMode } from 'awilix'
import type { AwilixContainer } from 'awilix'
import type { ExtensionContext } from 'vscode'
import { ConfigurationService } from '@fux/services'
import type { IConfigurationService, IProcess as ISharedProcess } from '@fux/services'

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

// Adapters
import { ContextAdapter } from './adapters/Context.adapter.js'
import { FileSystemAdapter } from './adapters/FileSystem.adapter.js'
import { PathAdapter } from './adapters/Path.adapter.js'
import { WindowAdapter } from './adapters/Window.adapter.js'
import { WorkspaceAdapter } from './adapters/Workspace.adapter.js'

export function createDIContainer(context: ExtensionContext): AwilixContainer {
	const container = createContainer({
		injectionMode: InjectionMode.PROXY,
	})

	// Adapters for CCP's own interfaces
	container.register({
		context: asValue(new ContextAdapter(context)),
		fileSystem: asClass(FileSystemAdapter).singleton(),
		path: asClass(PathAdapter).singleton(),
		workspace: asClass(WorkspaceAdapter).singleton(),
	})

	// Create an adapter for the shared IProcess interface
	const sharedProcessAdapter: ISharedProcess = {
		getWorkspaceRoot: () => container.resolve<WorkspaceAdapter>('workspace').workspaceFolders?.[0]?.uri,
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
		storageService: asFunction(cradle => new StorageService(cradle.context, cradle.fileSystem, cradle.path)).singleton(),
		googleGenAiService: asFunction(cradle => new GoogleGenAiService(cradle.workspace)).singleton(),
		contextDataCollector: asFunction(cradle => new ContextDataCollectorService(cradle.workspace, cradle.fileSystem, cradle.path)).singleton(),
		fileContentProvider: asFunction(cradle => new FileContentProviderService(cradle.fileSystem, cradle.window, cradle.tokenizerService)).singleton(),
		contextFormatter: asFunction(cradle => new ContextFormattingService(cradle.treeFormatterService, cradle.fileUtilsService, cradle.path)).singleton(),
		quickSettingsService: asFunction(cradle => new QuickSettingsService(cradle.context, cradle.workspace, cradle.fileSystem, cradle.path)).singleton(),
		fileExplorerService: asFunction(cradle => new FileExplorerService(cradle.workspace, cradle.window, cradle.quickSettingsService, cradle.tokenizerService, cradle.fileSystem, cradle.path)).singleton(),
		savedStatesService: asFunction(cradle => new SavedStatesService(cradle.storageService)).singleton(),
		ccpManager: asFunction(cradle => new ContextCherryPickerManager(
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
		)).singleton(),
	})

	return container
}
