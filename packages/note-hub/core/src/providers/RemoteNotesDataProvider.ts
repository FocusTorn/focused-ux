// ESLint & Imports -->>

// _UTILITIES ==================================================================================================
import type { IWindow, IWorkspace, ICommonUtilsService, IPathUtilsService, IFrontmatterUtilsService, ICommands, IFileType, IExtensionContext } from '@fux/shared'

import { BaseNotesDataProvider } from './BaseNotesDataProvider.js'

//--------------------------------------------------------------------------------------------------------------<<

export class RemoteNotesDataProvider extends BaseNotesDataProvider {

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
		uriAdapter: any,
		treeItemCollapsibleStateAdapter: any,
	) {
		super(notesDir, 'remote', openNoteCommandId, context, window, workspace, commands, commonUtils, frontmatterUtils, pathUtils, fileTypeEnum, treeItemAdapter, themeIconAdapter, themeColorAdapter, uriAdapter, treeItemCollapsibleStateAdapter)
	}

}
