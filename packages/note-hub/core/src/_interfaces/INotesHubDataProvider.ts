// ESLint & Imports -->>

//= VSCODE TYPES & MOCKED INTERNALS ===========================================================================
import type { INotesHubItem } from './INotesHubItem.js'
import type { Event, ITreeDataProvider, ITreeDragAndDropController, IUri, ITreeItem } from '@fux/shared'

//--------------------------------------------------------------------------------------------------------------<<

export interface INotesHubDataProvider extends ITreeDataProvider<INotesHubItem>, ITreeDragAndDropController<INotesHubItem> {
	onDidChangeTreeData: Event<INotesHubItem | undefined | null | void>
	readonly notesDir: string
	readonly providerName: 'project' | 'remote' | 'global'

	refresh: () => void
	getNotesHubItem: (uri: IUri) => Promise<INotesHubItem | undefined>
	initializeTreeView: (viewId: string) => void
	
	// Override the sync methods to be async
	getTreeItem: (element: INotesHubItem) => Promise<ITreeItem>
	getChildren: (element?: INotesHubItem) => Promise<INotesHubItem[]>
}
