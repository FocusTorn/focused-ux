// ESLint & Imports -->>

// _UTILITIES ==================================================================================================
// import { ICommonUtilsService, IFrontmatterUtilsService, IPathUtilsService, IWindow, IWorkspace, ICommands } from '@fux/_utilities' (update to actual path)
import type { ExtensionContext } from 'vscode'
import { BaseNotesDataProvider } from './BaseNotesDataProvider.js'
// import type { ICommonUtilsService, IFrontmatterUtilsService, IPathUtilsService, IWindow, IWorkspace, ICommands } from '@fux/_utilities' (update to actual path)

//--------------------------------------------------------------------------------------------------------------<<

export class GlobalNotesDataProvider extends BaseNotesDataProvider {
	// Awilix-ready constructor (no decorators)
	constructor(
		context: ExtensionContext,
		window: any, // TODO: Replace 'any' with IWindow from _utilities
		workspace: any, // TODO: Replace 'any' with IWorkspace from _utilities
		commands: any, // TODO: Replace 'any' with ICommands from _utilities
		commonUtils: any, // TODO: Replace 'any' with ICommonUtilsService from _utilities
		frontmatterUtils: any, // TODO: Replace 'any' with IFrontmatterUtilsService from _utilities
		pathUtils: any, // TODO: Replace 'any' with IPathUtilsService from _utilities
		notesDir: string,
		openNoteCommandId: string,
	) {
		super(notesDir, 'global', openNoteCommandId, context, window, workspace, commands, commonUtils, frontmatterUtils, pathUtils)
	}
}