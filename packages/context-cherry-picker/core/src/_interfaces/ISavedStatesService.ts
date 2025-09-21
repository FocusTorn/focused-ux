// ESLint & Imports -->>

import type { IEvent } from './ILocalTypes.js'
import type { SavedStateItem } from '../models/SavedStateItem.js'

//--------------------------------------------------------------------------------------------------------------<<

export interface ISavedStatesService { //>
	onDidChangeTreeData: Event<SavedStateItem | undefined | null | void>
	getTreeItem: (element: SavedStateItem) => SavedStateItem
	getChildren: (element?: SavedStateItem) => Promise<SavedStateItem[]>
	refresh: () => void
} //<
