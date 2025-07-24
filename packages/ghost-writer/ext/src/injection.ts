import { asClass, asValue, createContainer, InjectionMode } from 'awilix'
import type { AwilixContainer } from 'awilix'
import type { ExtensionContext } from 'vscode'
import { ClipboardService, ConsoleLoggerService, ImportGeneratorService } from '@fux/ghost-writer-core'
import type { IPathUtilsService, IStorageService } from '@fux/ghost-writer-core'
import {
	CommonUtilsAdapter,
	ConfigurationService,
	FileSystemAdapter,
	PathUtilsAdapter,
	ProcessAdapter,
	WindowAdapter,
	WorkspaceAdapter,
} from '@fux/shared'
import type { IFileSystem, IProcess } from '@fux/shared'
import { StorageAdapter } from './services/Storage.adapter.js'

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
