// Interfaces
export type { INotesHubDataProvider } from './_interfaces/INotesHubDataProvider.js'
export type { INotesHubItem } from './_interfaces/INotesHubItem.js'
export type { INotesHubService } from './_interfaces/INotesHubService.js'
export type { INotesHubManagerService, INotesHubDependencies } from './_interfaces/INotesHubManagerService.js'
export type { INotesHubActionService } from './_interfaces/INotesHubActionService.js'
export type { INotesHubConfigService, NotesHubConfig } from './_interfaces/INotesHubConfigService.js'
export type { INotesHubProviderManager } from './_interfaces/INotesHubProviderManager.js'

// Local Interfaces (replacing shared dependencies)
export type { IWindow } from './_interfaces/IWindow.js'
export type { IWorkspace, IConfiguration, IFileSystemWatcher } from './_interfaces/IWorkspace.js'
export type { ICommands } from './_interfaces/ICommands.js'
export type { Disposable } from './_interfaces/IDisposable.js'
export type { ICommonUtilsService } from './_interfaces/ICommonUtils.js'
export type { IPathUtilsService } from './_interfaces/IPathUtils.js'
export type { IFrontmatterUtilsService } from './_interfaces/IFrontmatterUtils.js'
export type { IExtensionContext } from './_interfaces/IExtensionContext.js'
export type { IUri, IUriFactory } from './_interfaces/IUri.js'
export type { IFileType } from './_interfaces/IFileType.js'
export type { IStorageService } from './_interfaces/IStorage.js'
export type { IEnv } from './_interfaces/IEnv.js'
export type { IWorkspaceUtilsService } from './_interfaces/IWorkspaceUtils.js'
export type { IFileSystem } from './_interfaces/IFileSystem.js'
export type { IWorkspaceFolder } from './_interfaces/IWorkspaceFolder.js'
export type { Event } from './_interfaces/IEvent.js'
export type { ITreeItem } from './_interfaces/ITreeItem.js'

// Models
export { NotesHubItem } from './models/NotesHubItem.js'

// Providers
export { BaseNotesDataProvider } from './providers/BaseNotesDataProvider.js'
export { GlobalNotesDataProvider } from './providers/GlobalNotesDataProvider.js'
export { ProjectNotesDataProvider } from './providers/ProjectNotesDataProvider.js'
export { RemoteNotesDataProvider } from './providers/RemoteNotesDataProvider.js'

// Services
export { NotesHubService } from './services/NotesHub.service.js'
export { NotesHubManagerService } from './services/NotesHubManager.service.js'
export { NotesHubActionService } from './services/NotesHubAction.service.js'
export { NotesHubConfigService } from './services/NotesHubConfig.service.js'
export { NotesHubProviderManager } from './services/NotesHubProvider.manager.js'

// Services
export { WorkspaceUtilsService } from './services/WorkspaceUtils.service.js'
export { FrontmatterUtilsService } from './services/FrontmatterUtils.service.js'

// Adapters
export { EventEmitterAdapter } from './adapters/EventEmitterAdapter.js'
export { RelativePatternAdapter } from './adapters/RelativePatternAdapter.js'
export { TreeItemAdapter } from './adapters/TreeItemAdapter.js'
export { ThemeIconAdapter } from './adapters/ThemeIconAdapter.js'
export { TreeItemCollapsibleStateAdapter } from './adapters/TreeItemCollapsibleStateAdapter.js'
export { PathUtilsAdapter } from './adapters/PathUtilsAdapter.js'
export { FileSystemAdapter } from './adapters/FileSystemAdapter.js'
export { CommonUtilsAdapter } from './adapters/CommonUtilsAdapter.js'

// Constants
export { notesHubConstants } from './_config/constants.js'
