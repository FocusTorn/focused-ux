import { asClass, asValue, createContainer, InjectionMode } from 'awilix'
import type { AwilixContainer } from 'awilix'
import type { ExtensionContext } from 'vscode'
import {
	ClipboardService,
	ConsoleLoggerService,
	ImportGeneratorService,
	
} from '@fux/ghost-writer-core'
import type { IStorageService, ICommonUtilsService, IPathUtilsService } from '@fux/ghost-writer-core'
import { StorageAdapter } from './services/Storage.adapter.js'
import { CommonUtilsAdapter } from './services/adapters/CommonUtils.adapter.js'
import { PathUtilsAdapter } from './services/adapters/PathUtils.adapter.js'
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
		window: asClass(WindowAdapter).singleton(),
		workspace: asClass(WorkspaceAdapter).singleton(),
		pathUtils: asClass(PathUtilsAdapter).singleton(),
		commonUtils: asClass(CommonUtilsAdapter).singleton(),
	})

	// Manually construct core services
	const clipboardService = new ClipboardService(
		container.resolve<IStorageService>('storageService'),
	)
	const consoleLoggerService = new ConsoleLoggerService()
	const importGeneratorService = new ImportGeneratorService(
		container.resolve<IPathUtilsService>('pathUtils'),
		container.resolve<ICommonUtilsService>('commonUtils'),
	)

	// Register service instances as values
	container.register({
		clipboardService: asValue(clipboardService),
		consoleLoggerService: asValue(consoleLoggerService),
		importGeneratorService: asValue(importGeneratorService),
	})

	return container
}
