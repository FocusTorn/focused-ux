// ESLint & Imports -->>

//= VSCODE TYPES & MOCKED INTERNALS ===========================================================================
import type { INotesHubItem } from './INotesHubItem.js'
import type { Event } from './IEvent.js'
import type { IUri } from './IUri.js'
import type { ITreeItem } from './ITreeItem.js'

//--------------------------------------------------------------------------------------------------------------<<

export interface INotesHubDataProvider {
	onDidChangeTreeData: Event<INotesHubItem | undefined | null | void>
	readonly notesDir: string
	readonly providerName: 'project' | 'remote' | 'global'
	readonly dropMimeTypes: string[]
	readonly dragMimeTypes: string[]

	refresh: () => void
	getNotesHubItem: (uri: IUri) => Promise<INotesHubItem | undefined>
	initializeTreeView: (viewId: string) => void
	
	// Tree data provider methods
	getTreeItem: (element: INotesHubItem) => Promise<ITreeItem>
	getChildren: (element?: INotesHubItem) => Promise<INotesHubItem[]>
}
