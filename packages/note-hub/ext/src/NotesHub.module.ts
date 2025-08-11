// ESLint & Imports -->>

// _UTILITIES (direct imports) =======================================================================
import type { Disposable, WindowAdapter } from '@fux/shared'
import type { ExtensionContext } from 'vscode'
import * as vscode from 'vscode'
import type {
	INotesHubItem,
	INotesHubService,
} from '@fux/note-hub-core'

import { constants } from './_config/constants.js'

//--------------------------------------------------------------------------------------------------------------<<

export class NotesHubModule {

	private service?: INotesHubService

	constructor(
		private readonly notesHubService: INotesHubService,
		private readonly windowAdapter: WindowAdapter,
	) {
		this.service = notesHubService
	}

	public registerCommands(
		_context: ExtensionContext,
	): Disposable[] {
		const service = this.service!
		const commandMap: { [key: string]: (...args: any[]) => any } = {
			[constants.commands.newProjectFolder]: () => service.newFolderAtRoot('project'),
			[constants.commands.newRemoteFolder]: () => service.newFolderAtRoot('remote'),
			[constants.commands.newGlobalFolder]: () => service.newFolderAtRoot('global'),
			[constants.commands.newProjectNote]: () => service.newNoteAtRoot('project'),
			[constants.commands.newRemoteNote]: () => service.newNoteAtRoot('remote'),
			[constants.commands.newGlobalNote]: () => service.newNoteAtRoot('global'),
			[constants.commands.newNestedNote]: (item?: INotesHubItem) => item ? service.newNoteInFolder(item) : this.windowAdapter.showWarningMessage('Select a folder to create a nested note.'),
			[constants.commands.newNestedFolder]: (item?: INotesHubItem) => item ? service.newFolderInFolder(item) : this.windowAdapter.showWarningMessage('Select a folder to create a nested folder.'),
			[constants.commands.openNote]: (item?: INotesHubItem) => item && service.openNote(item),
			[constants.commands.openNotePreview]: (item?: INotesHubItem) => item && service.openNotePreview(item),
			[constants.commands.addFrontmatter]: (item?: INotesHubItem) => item && service.addFrontmatter(item),
			[constants.commands.copyItem]: (item?: INotesHubItem) => item && service.copyItem(item),
			[constants.commands.cutItem]: (item?: INotesHubItem) => item && service.cutItem(item),
			[constants.commands.pasteItem]: (item?: INotesHubItem) => item && service.pasteItem(item),
			[constants.commands.renameItem]: (item?: INotesHubItem) => item && service.renameItem(item),
		}

		return Object.entries(commandMap).map(([command, handler]) => {
			try {
				// Use vscode.commands.registerCommand directly since we don't have access to the commands adapter here
				return vscode.commands.registerCommand(command, handler)
			}
			catch (_error) {
				// If command is already registered, just return a no-op disposable
				console.warn(`[${constants.extension.name}] Command ${command} is already registered, skipping.`)
				return { dispose: () => {} }
			}
		})
	}

	public async initializeModule(): Promise<void> {
		await this.service!.initializeNotesHub(constants.extension.configKey, constants.extension.id)
		console.log(`[${constants.extension.name}] NotesHubModule initialized.`)
	}

	public dispose(): void {
		this.service?.dispose()
		console.log(`[${constants.extension.name}] NotesHubModule disposed.`)
	}

}
