// ESLint & Imports -->>

// _UTILITIES ==================================================================================================
import type { IWindow, IWorkspace, ICommonUtilsService, IPathUtilsService, IFrontmatterUtilsService, ICommands, IExtensionContext, IFileType } from '@fux/shared'

import { BaseNotesDataProvider } from './BaseNotesDataProvider.js'

//--------------------------------------------------------------------------------------------------------------<<

export class ProjectNotesDataProvider extends BaseNotesDataProvider {

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
		super(notesDir, 'project', openNoteCommandId, context, window, workspace, commands, commonUtils, frontmatterUtils, pathUtils, fileTypeEnum, treeItemAdapter, themeIconAdapter, themeColorAdapter, uriAdapter, treeItemCollapsibleStateAdapter)
	}

}
