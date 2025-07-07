// ESLint & Imports -->>

import type { Event } from 'vscode'
import type { SavedStateItem } from '../models/SavedStateItem.js'

//--------------------------------------------------------------------------------------------------------------<<

export interface ISavedStatesService { //>
	onDidChangeTreeData: Event<SavedStateItem | undefined | null | void>
	getTreeItem: (element: SavedStateItem) => SavedStateItem
	getChildren: (element?: SavedStateItem) => Promise<SavedStateItem[]>
	refresh: () => void
} //<
