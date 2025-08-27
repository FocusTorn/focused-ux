// ESLint & Imports -->>

//= IMPLEMENTATION TYPES ======================================================================================
import type { SavedStateItem } from '../models/SavedStateItem.js'

//--------------------------------------------------------------------------------------------------------------<<

export interface IContextCherryPickerManager { //>
	saveCurrentCheckedState: () => Promise<void>
	copyCheckedFilePaths: () => Promise<void>
	refreshExplorerView: () => Promise<void>
	deleteSavedState: (stateItem: SavedStateItem) => Promise<void>
	loadSavedStateIntoExplorer: (stateItem: SavedStateItem) => Promise<void>
	clearAllCheckedInExplorer: () => Promise<void>
	copyContextOfCheckedItems: () => Promise<void>
	getQuickSettingState: (settingId: string) => Promise<any>
	showStatusMessage: (message: string) => Promise<void>
} //<
