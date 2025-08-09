// ESLint & Imports -->>

//= VSCODE TYPES & MOCKED INTERNALS ===========================================================================
import type { Event, TreeDataProvider, TreeDragAndDropController, Uri } from 'vscode'

//= IMPLEMENTATION TYPES ======================================================================================
import type { INotesHubItem } from './INotesHubItem.js'

//--------------------------------------------------------------------------------------------------------------<<

export interface INotesHubDataProvider extends TreeDataProvider<INotesHubItem>, TreeDragAndDropController<INotesHubItem> {
	onDidChangeTreeData: Event<INotesHubItem | undefined | null | void>
	readonly notesDir: string
	readonly providerName: 'project' | 'remote' | 'global'

	refresh: () => void
	getNotesHubItem: (uri: Uri) => Promise<INotesHubItem | undefined>
	initializeTreeView: (viewId: string) => void
}
