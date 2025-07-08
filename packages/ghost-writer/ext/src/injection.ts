import { asClass, asValue, createContainer, InjectionMode } from 'awilix'
import type { AwilixContainer } from 'awilix'
import type { ExtensionContext } from 'vscode'
import { ClipboardService, ConsoleLoggerService, ImportGeneratorService } from '@fux/ghost-writer-core'
import type { IPathUtilsService, IStorageService } from '@fux/ghost-writer-core'
import { ConfigurationService } from '@fux/services'
import type { IFileSystem, IProcess } from '@fux/services'
import { StorageAdapter } from './services/Storage.adapter.js'
import { CommonUtilsAdapter } from './services/adapters/CommonUtils.adapter.js'
import { FileSystemAdapter } from './services/adapters/FileSystem.adapter.js'
import { PathUtilsAdapter } from './services/adapters/PathUtils.adapter.js'
import { ProcessAdapter } from './services/adapters/Process.adapter.js'
import { WindowAdapter } from './services/adapters/Window.adapter.js'
import { WorkspaceAdapter } from './services/adapters/Workspace.adapter.js'

export function createDIContainer(context: ExtensionContext): AwilixContainer {
	const container = createContainer({
		injectionMode: InjectionMode.PROXY,
	})

	// Register VSCode Primitives
	container.register({
		extensionContext: asValue(context),
	})

	// Register Local Adapters
	container.register({
		storageService: asClass(StorageAdapter).singleton(),
		workspace: asClass(WorkspaceAdapter).singleton(),
		pathUtils: asClass(PathUtilsAdapter).singleton(),
		fileSystem: asClass(FileSystemAdapter).singleton(),
		process: asClass(ProcessAdapter).singleton(),
	})

	// Manually construct services with cross-dependencies
	const configurationService = new ConfigurationService(
		container.resolve<IFileSystem>('fileSystem'),
		container.resolve<IProcess>('process'),
	)
	const windowAdapter = new WindowAdapter(configurationService)
	const commonUtilsAdapter = new CommonUtilsAdapter(windowAdapter)

	// Manually construct core services
	const clipboardService = new ClipboardService(
		container.resolve<IStorageService>('storageService'),
	)
	const consoleLoggerService = new ConsoleLoggerService()
	const importGeneratorService = new ImportGeneratorService(
		container.resolve<IPathUtilsService>('pathUtils'),
		commonUtilsAdapter,
	)

	// Register manually created instances
	container.register({
		configurationService: asValue(configurationService),
		window: asValue(windowAdapter),
		commonUtils: asValue(commonUtilsAdapter),
		clipboardService: asValue(clipboardService),
		consoleLoggerService: asValue(consoleLoggerService),
		importGeneratorService: asValue(importGeneratorService),
	})

	return container
}
