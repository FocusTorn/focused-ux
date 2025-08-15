import type { AwilixContainer } from 'awilix'
import { createContainer, InjectionMode, asClass, asFunction } from 'awilix'

// Shared Adapters
import {
	FileSystemAdapter,
	WindowAdapter,
	WorkspaceAdapter,
	CommandsAdapter,
	PathUtilsAdapter,
	ProcessAdapter,
	EnvAdapter,
	ConfigurationService,
	CommonUtilsAdapter,
	StorageService,
	TreeItemAdapter,
	ThemeIconAdapter,
	ThemeColorAdapter,
	UriAdapter,
	TreeItemCollapsibleStateAdapter,
} from '@fux/shared'

// Core Services
import { NotesHubService } from './services/NotesHub.service.js'
import { NotesHubActionService } from './services/NotesHubAction.service.js'
import { NotesHubConfigService } from './services/NotesHubConfig.service.js'
import { NotesHubProviderManager } from './services/NotesHubProvider.manager.js'

// Core Interfaces
import type { INotesHubActionService } from './_interfaces/INotesHubActionService.js'
import type { INotesHubConfigService } from './_interfaces/INotesHubConfigService.js'
import type { INotesHubProviderManager } from './_interfaces/INotesHubProviderManager.js'

// Shared Types
import type {
	IFileSystem,
	IWindow,
	IWorkspace,
	ICommands,
	IPathUtilsService,
	IEnv,
	ICommonUtilsService,
	IExtensionContext,
	IFrontmatterUtilsService,
	IFileType,
	IWorkspaceUtilsService,
	IStorageService,
} from '@fux/shared'

export function createCoreContainer(): AwilixContainer {
	const container = createContainer({
		injectionMode: InjectionMode.PROXY,
	})

	// Register shared adapters
	container.register({
		iFileSystem: asClass(FileSystemAdapter).singleton(),
		iWindow: asClass(WindowAdapter).singleton(),
		iWorkspace: asClass(WorkspaceAdapter).singleton(),
		iCommands: asClass(CommandsAdapter).singleton(),
		iPathUtils: asClass(PathUtilsAdapter).singleton(),
		iProcess: asClass(ProcessAdapter).singleton(),
		iEnv: asClass(EnvAdapter).singleton(),
		iConfigurationService: asClass(ConfigurationService).singleton(),
		iCommonUtils: asClass(CommonUtilsAdapter).singleton(),
		iStorage: asClass(StorageService).singleton(),
		// Register shared adapter services for NotesHubItem
		treeItemAdapter: asClass(TreeItemAdapter).singleton(),
		themeIconAdapter: asClass(ThemeIconAdapter).singleton(),
		themeColorAdapter: asClass(ThemeColorAdapter).singleton(),
		uriAdapter: asClass(UriAdapter).singleton(),
		treeItemCollapsibleStateAdapter: asClass(TreeItemCollapsibleStateAdapter).singleton(),
	})

	// Register core services using factories
	container.register({
		iNotesHubService: asFunction((cradle: {
			iWorkspace: IWorkspace
			iWindow: IWindow
			iCommands: ICommands
			iConfigService: INotesHubConfigService
			iActionService: INotesHubActionService
			iProviderManager: INotesHubProviderManager
		}) =>
			new NotesHubService(
				cradle.iWorkspace,
				cradle.iWindow,
				cradle.iCommands,
				cradle.iConfigService,
				cradle.iActionService,
				cradle.iProviderManager,
			),
		).singleton(),

		iProviderManager: asFunction((cradle: {
			iContext: IExtensionContext
			iWindow: IWindow
			iWorkspace: IWorkspace
			iCommands: ICommands
			iCommonUtils: ICommonUtilsService
			iFrontmatterUtils: IFrontmatterUtilsService
			iPathUtils: IPathUtilsService
			iFileTypeEnum: IFileType
			treeItemAdapter: any
			themeIconAdapter: any
			themeColorAdapter: any
			uriAdapter: any
			treeItemCollapsibleStateAdapter: any
		}) =>
			new NotesHubProviderManager(
				cradle.iContext,
				cradle.iWindow,
				cradle.iWorkspace,
				cradle.iCommands,
				cradle.iCommonUtils,
				cradle.iFrontmatterUtils,
				cradle.iPathUtils,
				cradle.iFileTypeEnum,
				cradle.treeItemAdapter,
				cradle.themeIconAdapter,
				cradle.themeColorAdapter,
				cradle.uriAdapter,
				cradle.treeItemCollapsibleStateAdapter,
			),
		).singleton(),

		iConfigService: asFunction((cradle: {
			iWorkspace: IWorkspace
			iPathUtils: IPathUtilsService
			iWorkspaceUtils: IWorkspaceUtilsService
			iCommonUtils: ICommonUtilsService
			iCommands: ICommands
			iFileSystem: IFileSystem
			iOsHomedir: any
			iPathJoin: any
			iPathNormalize: any
			uriAdapter: any
		}) =>
			new NotesHubConfigService(
				cradle.iWorkspace,
				cradle.iPathUtils,
				cradle.iWorkspaceUtils,
				cradle.iCommonUtils,
				cradle.iCommands,
				cradle.iFileSystem,
				cradle.iOsHomedir,
				cradle.iPathJoin,
				cradle.iPathNormalize,
				cradle.uriAdapter,
			),
		).singleton(),

		iActionService: asFunction((cradle: {
			iContext: IExtensionContext
			iCommands: ICommands
			iWindow: IWindow
			iWorkspace: IWorkspace
			iEnv: IEnv
			iCommonUtils: ICommonUtilsService
			iFrontmatterUtils: IFrontmatterUtilsService
			iPathUtils: IPathUtilsService
			iStorage: IStorageService
			iProviderManager: INotesHubProviderManager
			iPathJoin: any
			iPathDirname: any
			iPathBasename: any
			iPathParse: any
			iPathExtname: any
			iFspAccess: any
			iFspRename: any
			iFileTypeEnum: IFileType
			treeItemAdapter: any
			themeIconAdapter: any
			themeColorAdapter: any
			uriAdapter: any
			treeItemCollapsibleStateAdapter: any
		}) =>
			new NotesHubActionService(
				cradle.iContext,
				cradle.iCommands,
				cradle.iWindow,
				cradle.iWorkspace,
				cradle.iEnv,
				cradle.iCommonUtils,
				cradle.iFrontmatterUtils,
				cradle.iPathUtils,
				cradle.iStorage,
				cradle.iProviderManager,
				cradle.iPathJoin,
				cradle.iPathDirname,
				cradle.iPathBasename,
				cradle.iPathParse,
				cradle.iPathExtname,
				cradle.iFspAccess,
				cradle.iFspRename,
				cradle.iFileTypeEnum,
				cradle.treeItemAdapter,
				cradle.themeIconAdapter,
				cradle.themeColorAdapter,
				cradle.uriAdapter,
				cradle.treeItemCollapsibleStateAdapter,
			),
		).singleton(),
	})

	return container
}
