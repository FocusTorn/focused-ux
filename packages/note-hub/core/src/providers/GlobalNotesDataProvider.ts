// ESLint & Imports -->>

// _UTILITIES ==================================================================================================
import type { IWindow } from '../_interfaces/IWindow.js'
import type { IWorkspace } from '../_interfaces/IWorkspace.js'
import type { ICommonUtilsService } from '../_interfaces/ICommonUtils.js'
import type { IPathUtilsService } from '../_interfaces/IPathUtils.js'
import type { IFrontmatterUtilsService } from '../_interfaces/IFrontmatterUtils.js'
import type { ICommands } from '../_interfaces/ICommands.js'
import type { IExtensionContext } from '../_interfaces/IExtensionContext.js'
import type { IFileType } from '../_interfaces/IFileType.js'
import type { IUriFactory } from '../_interfaces/IUri.js'

import { BaseNotesDataProvider } from './BaseNotesDataProvider.js'

//--------------------------------------------------------------------------------------------------------------<<

export class GlobalNotesDataProvider extends BaseNotesDataProvider {

	// Awilix-ready constructor (no decorators)
	constructor(
		notesDir: string,
		context: IExtensionContext,
		window: IWindow,
		workspace: IWorkspace,
		commands: ICommands,
		commonUtils: ICommonUtilsService,
		frontmatterUtils: IFrontmatterUtilsService,
		pathUtils: IPathUtilsService,
		fileTypeEnum: IFileType,
		openNoteCommandId: string,
		treeItemAdapter: any,
		themeIconAdapter: any,
		themeColorAdapter: any,
		uriAdapter: IUriFactory,
		treeItemCollapsibleStateAdapter: any,
	) {
		super(notesDir, 'global', openNoteCommandId, context, window, workspace, commands, commonUtils, frontmatterUtils, pathUtils, fileTypeEnum, treeItemAdapter, themeIconAdapter, themeColorAdapter, uriAdapter, treeItemCollapsibleStateAdapter)
	}

}
