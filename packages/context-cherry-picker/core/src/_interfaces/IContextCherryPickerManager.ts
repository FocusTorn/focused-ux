// ESLint & Imports -->>

//= IMPLEMENTATION TYPES ======================================================================================
import type { SavedStateItem } from '../models/SavedStateItem.js'
import type { IFileExplorerService } from './IFileExplorerService.js'
import type { ISavedStatesService } from './ISavedStatesService.js'
import type { IStorageService } from './IStorageService.js'
import type { IContextDataCollectorService } from './IContextDataCollectorService.js'
import type { IFileContentProviderService } from './IFileContentProviderService.js'
import type { IContextFormattingService } from './IContextFormattingService.js'
import type { IWindow } from './IWindow.js'
import type { IWorkspace } from './IWorkspace.js'
import type { IPath } from './IPath.js'
import type { IQuickSettingsService } from './IQuickSettingsService.js'
import type { IConfigurationService } from './ILocalTypes.js'
import type { ITreeItemFactory } from '../models/FileExplorerItem.js'

//--------------------------------------------------------------------------------------------------------------<<

export interface IContextCherryPickerDependencies {
    fileExplorerService: IFileExplorerService
    savedStatesService: ISavedStatesService
    quickSettingsService: IQuickSettingsService
    storageService: IStorageService
    contextDataCollector: IContextDataCollectorService
    fileContentProvider: IFileContentProviderService
    contextFormatter: IContextFormattingService
    window: IWindow
    workspace: IWorkspace
    path: IPath
    configurationService: IConfigurationService
    treeItemFactory: ITreeItemFactory
}

export interface IContextCherryPickerManager { //>
	saveCurrentCheckedState: () => Promise<void>
	copyCheckedFilePaths: () => Promise<void>
	refreshExplorerView: () => Promise<void>
	deleteSavedState: (stateItem: SavedStateItem) => Promise<void>
	loadSavedStateIntoExplorer: (stateItem: SavedStateItem) => Promise<void>
	clearAllCheckedInExplorer: () => Promise<void>
	copyContextOfCheckedItems: () => Promise<void>
	getQuickSettingState: (settingId: string) => Promise<unknown>
	showStatusMessage: (message: string) => Promise<void>

	// Complex orchestration methods
	saveStateWithValidation: (stateName?: string) => Promise<{ saved: boolean; stateName?: string; itemCount: number }>
	copyContextWithAnalysis: () => Promise<{ copied: boolean; tokenCount: number; fileCount: number }>
	completeContextWorkflow: (includeProjectStructure?: boolean) => Promise<{ contextCopied: boolean; stateSaved: boolean; tokenCount: number }>
} //<
