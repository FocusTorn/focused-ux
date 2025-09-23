// ESLint & Imports -->>

//= IMPLEMENTATION TYPES ======================================================================================
import type { Uri } from 'vscode'
import type { IWindow } from './IWindow.js'
import type { ICommands } from './ICommands.js'
import type { IContext } from './IContext.js'
import type { IPath } from './IPath.js'
import type { ICommonUtils } from './ICommonUtils.js'
import type { IFileSystem } from './IFileSystem.js'
import type { IIconThemeGeneratorService } from './IIconThemeGeneratorService.js'
import type { IConfigurationService } from '../services/ConfigurationService.js'
import type { IIconPickerService } from '../services/IconPickerService.js'
import type { IUri, IUriFactory } from './IUri.js'

//--------------------------------------------------------------------------------------------------------------<<

export interface IDynamiconsDependencies {
    context: IContext
    window: IWindow
    commands: ICommands
    path: IPath
    commonUtils: ICommonUtils
    fileSystem: IFileSystem
    iconThemeGenerator: IIconThemeGeneratorService
    configService: IConfigurationService
    iconPicker: IIconPickerService
    uriFactory: IUriFactory
}

export interface IDynamiconsManagerService {
    assignIconToResource: (resourceUris: Uri[], iconTypeScope?: 'file' | 'folder' | 'language') => Promise<void>
    showAvailableIconsQuickPick: (assignableToType?: 'file' | 'folder', currentFilter?: (iconName: string) => boolean) => Promise<string | undefined>
    showUserIconAssignments: (type: 'file' | 'folder' | 'language') => Promise<void>
    revertIconAssignment: (resourceUris: Uri[]) => Promise<void>
    toggleExplorerArrows: () => Promise<void>
    refreshIconTheme: () => Promise<void>

    // Complex orchestration methods
    assignIconWithValidation: (resourceUris: Uri[], iconTypeScope?: 'file' | 'folder' | 'language') => Promise<{ assigned: boolean; resourceCount: number; iconName?: string }>
    revertIconWithValidation: (resourceUris: Uri[]) => Promise<{ reverted: boolean; resourceCount: number }>
    completeIconWorkflow: (resourceUris: Uri[], operation: 'assign' | 'revert', iconTypeScope?: 'file' | 'folder' | 'language') => Promise<{ success: boolean; operation: string; resourceCount: number }>
}
