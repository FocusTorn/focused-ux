import type { AwilixContainer } from 'awilix'
import { createContainer, InjectionMode, asValue, asClass, asFunction } from 'awilix'
import type { ExtensionContext } from 'vscode'

// Core Services & Interfaces
import {
	IconActionsService,
	IconThemeGeneratorService,
} from '@fux/dynamicons-core'
import type { IIconActionsService, IIconThemeGeneratorService, ICommands, ICommonUtils, IContext, IFileSystem, IPath, IQuickPick, IWindow, IWorkspace } from '@fux/dynamicons-core'

// Adapters
import { CommandsAdapter } from './adapters/Commands.adapter.js'
import { CommonUtilsAdapter } from './adapters/CommonUtils.adapter.js'
import { ContextAdapter } from './adapters/Context.adapter.js'
import { FileSystemAdapter } from './adapters/FileSystem.adapter.js'
import { PathAdapter } from './adapters/Path.adapter.js'
import { QuickPickAdapter } from './adapters/QuickPick.adapter.js'
import { WindowAdapter } from './adapters/Window.adapter.js'
import { WorkspaceAdapter } from './adapters/Workspace.adapter.js'

// Cradle interface for typed resolutions
export interface Cradle {
	// Adapters
	context: IContext
	commands: ICommands
	commonUtils: ICommonUtils
	fileSystem: IFileSystem
	path: IPath
	quickPick: IQuickPick
	window: IWindow
	workspace: IWorkspace

	// Core Services
	iconThemeGeneratorService: IIconThemeGeneratorService
	iconActionsService: IIconActionsService
}

export async function createDIContainer(context: ExtensionContext): Promise<AwilixContainer> {
	const container = createContainer({
		injectionMode: InjectionMode.PROXY,
	})

	// 1. Register Adapters
	container.register({
		context: asValue(new ContextAdapter(context)),
		commands: asClass(CommandsAdapter).singleton(),
		commonUtils: asClass(CommonUtilsAdapter).singleton(),
		fileSystem: asClass(FileSystemAdapter).singleton(),
		path: asClass(PathAdapter).singleton(),
		quickPick: asClass(QuickPickAdapter).singleton(),
		window: asClass(WindowAdapter).singleton(),
		workspace: asClass(WorkspaceAdapter).singleton(),
	})

	// 2. Manually construct and register core services using factory functions
	container.register({
		iconThemeGeneratorService: asFunction((cradle: Cradle) =>
			new IconThemeGeneratorService(
				cradle.fileSystem,
				cradle.path,
				cradle.commonUtils,
			),
		).singleton(),

		iconActionsService: asFunction((cradle: Cradle) =>
			new IconActionsService(
				cradle.context,
				cradle.window,
				cradle.commands,
				cradle.workspace,
				cradle.path,
				cradle.quickPick,
				cradle.commonUtils,
				cradle.fileSystem,
				cradle.iconThemeGeneratorService, // Depends on the other constructed service
			),
		).singleton(),
	})

	return container
}
