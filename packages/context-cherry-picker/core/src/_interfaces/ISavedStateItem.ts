// ESLint & Imports -->>

//= VSCODE TYPES & MOCKED INTERNALS ===========================================================================
import type { ITreeItemLabel } from './ILocalTypes.js'

//--------------------------------------------------------------------------------------------------------------<<

export interface ISavedStateItem { //>
	id: string
	label?: string | TreeItemLabel | undefined
	timestamp: number
	checkedItems: Array<{ uriString: string, checkboxState: number }>
} //<
