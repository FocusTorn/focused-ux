// ESLint & Imports -->>

// _UTILITIES ==================================================================================================
import type { ExtensionContext } from 'vscode'
import type { IWindow, IWorkspace, ICommands, ICommonUtilsService, IFrontmatterUtilsService, IPathUtilsService, IFileType } from '@fux/shared'
import { BaseNotesDataProvider } from './BaseNotesDataProvider.js'

//--------------------------------------------------------------------------------------------------------------<<

export class ProjectNotesDataProvider extends BaseNotesDataProvider {

	// Awilix-ready constructor (no decorators)
	constructor(
		notesDir: string,
		context: ExtensionContext,
		window: IWindow,
		workspace: IWorkspace,
		commands: ICommands,
		commonUtils: ICommonUtilsService,
		frontmatterUtils: IFrontmatterUtilsService,
		pathUtils: IPathUtilsService,
		fileTypeEnum: IFileType,
		openNoteCommandId: string,
	) {
		super(notesDir, 'project', openNoteCommandId, context, window, workspace, commands, commonUtils, frontmatterUtils, pathUtils, fileTypeEnum)
	}

}
