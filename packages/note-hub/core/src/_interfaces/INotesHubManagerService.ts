// ESLint & Imports -->>

//= IMPLEMENTATION TYPES ======================================================================================
import type { IWindow } from './IWindow.js'
import type { IWorkspace } from './IWorkspace.js'
import type { ICommands } from './ICommands.js'
import type { IDisposable } from './IDisposable.js'
import type { INotesHubService } from './INotesHubService.js'
import type { INotesHubDataProvider } from './INotesHubDataProvider.js'
import type { INotesHubItem } from './INotesHubItem.js'
import type { INotesHubConfigService, NotesHubConfig } from './INotesHubConfigService.js'
import type { INotesHubActionService } from './INotesHubActionService.js'
import type { INotesHubProviderManager } from './INotesHubProviderManager.js'
import type { ICommonUtilsService } from './ICommonUtils.js'
import type { IFrontmatterUtilsService } from './IFrontmatterUtils.js'
import type { IPathUtilsService } from './IPathUtils.js'
import type { IFileType } from './IFileType.js'
import type { IExtensionContext } from './IExtensionContext.js'
import type { IUriFactory } from './IUri.js'

//--------------------------------------------------------------------------------------------------------------<<

export interface INotesHubDependencies {
    // Core services
    workspace: IWorkspace
    window: IWindow
    commands: ICommands
    configService: INotesHubConfigService
    actionService: INotesHubActionService
    providerManager: INotesHubProviderManager
    
    // Provider manager dependencies
    context: IExtensionContext
    commonUtils: ICommonUtilsService
    frontmatterUtils: IFrontmatterUtilsService
    pathUtils: IPathUtilsService
    fileTypeEnum: IFileType
    uriFactory: IUriFactory
    
    // Adapters
    treeItemAdapter: any
    themeIconAdapter: any
    themeColorAdapter: any
    treeItemCollapsibleStateAdapter: any
}

export interface INotesHubManagerService {
    // Core service methods
    initializeNotesHub: (configPrefix?: string, commandPrefix?: string) => Promise<void>
    dispose: () => void
    getNotesHubConfig: () => NotesHubConfig
    getProviderForNote: (item: INotesHubItem) => Promise<INotesHubDataProvider | undefined>
    refreshProviders: (providersToRefresh?: 'project' | 'remote' | 'global' | 'all' | Array<'project' | 'remote' | 'global'>) => void
    revealNotesHubItem: (provider: INotesHubDataProvider, item: INotesHubItem, select?: boolean) => Promise<void>
    
    // Action service methods
    openNote: (noteItem: INotesHubItem) => Promise<void>
    renameItem: (item: INotesHubItem) => Promise<void>
    addFrontmatter: (noteItem: INotesHubItem) => Promise<void>
    openNotePreview: (noteItem: INotesHubItem) => Promise<void>
    deleteItem: (item: INotesHubItem) => Promise<void>
    copyItem: (item: INotesHubItem) => Promise<void>
    cutItem: (item: INotesHubItem) => Promise<void>
    pasteItem: (targetFolderItem: INotesHubItem) => Promise<void>
    newNoteInFolder: (targetFolderItem: INotesHubItem) => Promise<void>
    newFolderInFolder: (targetFolderItem: INotesHubItem) => Promise<void>
    newNoteAtRoot: (providerName: 'project' | 'remote' | 'global') => Promise<void>
    newFolderAtRoot: (providerName: 'project' | 'remote' | 'global') => Promise<void>

    // Complex orchestration methods
    openNoteWithValidation: (noteItem: INotesHubItem) => Promise<{ opened: boolean; notePath?: string }>
    createNoteWithValidation: (providerName: 'project' | 'remote' | 'global', noteName?: string) => Promise<{ created: boolean; notePath?: string; providerName?: string }>
    completeNoteWorkflow: (operation: 'open' | 'create' | 'delete', noteItem?: INotesHubItem, providerName?: 'project' | 'remote' | 'global') => Promise<{ success: boolean; operation: string; notePath?: string }>
}
