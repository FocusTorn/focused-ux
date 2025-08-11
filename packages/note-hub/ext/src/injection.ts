import type { AwilixContainer } from 'awilix'
import { createContainer, InjectionMode, asValue, asClass, asFunction } from 'awilix'
import type { IFileType,	IConfigurationService,	ICommonUtilsService,	IFileSystem,	IPathUtilsService,	IProcess,	IWindow,	IWorkspace,	IWorkspaceUtilsService,	IFrontmatterUtilsService,	IEnv,	ICommands } from '@fux/shared'
import type { ExtensionContext } from 'vscode'
import os from 'node:os'
import path from 'node:path'
import fs from 'node:fs/promises'

// F-UX Shared Imports
import {
	FileTypeAdapter,
	EnvAdapter,
	CommandsAdapter,
	ConfigurationService,
	CommonUtilsAdapter,
	FileSystemAdapter,
	PathUtilsAdapter,
	ProcessAdapter,
	WindowAdapter,
	WorkspaceAdapter,
} from '@fux/shared'

// Note Hub Core Imports
import {
	NotesHubService,
	NotesHubActionService,
	NotesHubConfigService,
	NotesHubProviderManager,
} from '@fux/note-hub-core'
import type {
	INotesHubService,
	INotesHubActionService,
	INotesHubConfigService,
	INotesHubProviderManager,
} from '@fux/note-hub-core'
import { NotesHubModule } from './NotesHub.module.js'

// Local Adapters
import { WorkspaceUtilsAdapter } from './adapters/WorkspaceUtils.adapter.js'
import { FrontmatterUtilsAdapter } from './adapters/FrontmatterUtils.adapter.js'

export async function createDIContainer(context: ExtensionContext): Promise<AwilixContainer> {
	const container = createContainer({
		injectionMode: InjectionMode.PROXY,
	})

	// VSCode Primitives & Node built-ins
	container.register({
		extensionContext: asValue(context),
		iOsHomedir: asValue(os.homedir),
		iPathJoin: asValue(path.join),
		iPathNormalize: asValue(path.normalize),
		iPathDirname: asValue(path.dirname),
		iPathBasename: asValue(path.basename),
		iPathParse: asValue(path.parse),
		iPathExtname: asValue(path.extname),
		iFspAccess: asValue(fs.access),
		iFspRename: asValue(fs.rename),
		iFileTypeEnum: asValue(new FileTypeAdapter()),
	})

	// Shared & Local Adapters
	container.register({
		iFileSystem: asClass(FileSystemAdapter).singleton(),
		iProcess: asClass(ProcessAdapter).singleton(),
		iPathUtils: asClass(PathUtilsAdapter).singleton(),
		iWorkspace: asClass(WorkspaceAdapter).singleton(),
		iEnv: asClass(EnvAdapter).singleton(),
		iCommands: asClass(CommandsAdapter).singleton(),
		iFrontmatterUtils: asFunction((cradle: { iFileSystem: IFileSystem }) => new FrontmatterUtilsAdapter(cradle.iFileSystem)).singleton(),
		iWorkspaceUtils: asFunction((cradle: { iWorkspace: IWorkspace }) => new WorkspaceUtilsAdapter(cradle.iWorkspace)).singleton(),
		iConfigurationService: asFunction((cradle: { iFileSystem: IFileSystem, iProcess: IProcess }) => new ConfigurationService(cradle.iFileSystem, cradle.iProcess)).singleton(),
		iWindow: asFunction((cradle: { iConfigurationService: IConfigurationService }) => new WindowAdapter(cradle.iConfigurationService)).singleton(),
		iCommonUtils: asFunction((cradle: { iWindow: IWindow }) => new CommonUtilsAdapter(cradle.iWindow)).singleton(),
	})

	// Note Hub Core Services (using factories to inject dependencies)
	container.register({
		iProviderManager: asFunction((cradle: {
			extensionContext: ExtensionContext
			iWindow: IWindow
			iWorkspace: IWorkspace
			iCommands: ICommands
			iCommonUtils: ICommonUtilsService
			iFrontmatterUtils: IFrontmatterUtilsService
			iPathUtils: IPathUtilsService
			iFileTypeEnum: IFileType
		}) => new NotesHubProviderManager(
			cradle.extensionContext,
			cradle.iWindow,
			cradle.iWorkspace,
			cradle.iCommands,
			cradle.iCommonUtils,
			cradle.iFrontmatterUtils,
			cradle.iPathUtils,
			cradle.iFileTypeEnum,
		)).singleton(),

		iConfigService: asFunction((cradle: {
			iWorkspace: IWorkspace
			iPathUtils: IPathUtilsService
			iWorkspaceUtils: IWorkspaceUtilsService
			iCommonUtils: ICommonUtilsService
			iCommands: ICommands
			iFileSystem: IFileSystem
			iOsHomedir: typeof os.homedir
			iPathJoin: typeof path.join
			iPathNormalize: typeof path.normalize
		}) => new NotesHubConfigService(
			cradle.iWorkspace,
			cradle.iPathUtils,
			cradle.iWorkspaceUtils,
			cradle.iCommonUtils,
			cradle.iCommands,
			cradle.iFileSystem,
			cradle.iOsHomedir,
			cradle.iPathJoin,
			cradle.iPathNormalize,
		)).singleton(),

		iActionService: asFunction((cradle: {
			extensionContext: ExtensionContext
			iWindow: IWindow
			iWorkspace: IWorkspace
			iEnv: IEnv
			iCommonUtils: ICommonUtilsService
			iFrontmatterUtils: IFrontmatterUtilsService
			iPathUtils: IPathUtilsService
			iProviderManager: NotesHubProviderManager
			iCommands: ICommands
			iPathJoin: typeof path.join
			iPathDirname: typeof path.dirname
			iPathBasename: typeof path.basename
			iPathParse: typeof path.parse
			iPathExtname: typeof path.extname
			iFspAccess: typeof fs.access
			iFspRename: typeof fs.rename
			iFileTypeEnum: IFileType
		}) => new NotesHubActionService(
			cradle.extensionContext,
			cradle.iWindow,
			cradle.iWorkspace,
			cradle.iEnv,
			cradle.iCommonUtils,
			cradle.iFrontmatterUtils,
			cradle.iPathUtils,
			cradle.iProviderManager,
			cradle.iCommands,
			cradle.iPathJoin,
			cradle.iPathDirname,
			cradle.iPathBasename,
			cradle.iPathParse,
			cradle.iPathExtname,
			cradle.iFspAccess,
			cradle.iFspRename,
			cradle.iFileTypeEnum,
		)).singleton(),

		notesHubService: asFunction((cradle: {
			iWorkspace: IWorkspace
			iWindow: IWindow
			iCommands: ICommands
			iConfigService: INotesHubConfigService
			iActionService: INotesHubActionService
			iProviderManager: INotesHubProviderManager
		}) => new NotesHubService(
			cradle.iWorkspace,
			cradle.iWindow,
			cradle.iCommands,
			cradle.iConfigService,
			cradle.iActionService,
			cradle.iProviderManager,
		)).singleton(),
		notesHubModule: asFunction((cradle: { notesHubService: INotesHubService, iWindow: IWindow, iConfigurationService: IConfigurationService }) => {
			const windowAdapter = new WindowAdapter(cradle.iConfigurationService)

			return new NotesHubModule(cradle.notesHubService, windowAdapter)
		}).singleton(),
	})

	return container
}
