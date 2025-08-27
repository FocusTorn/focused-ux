// ESLint & Imports -->>

//= VSCODE TYPES & MOCKED INTERNALS ===========================================================================
import type { TreeItemCheckboxState } from '@fux/shared'

//= IMPLEMENTATION TYPES ======================================================================================
import type { ISavedStateItem } from '../_interfaces/ISavedStateItem.js'

//--------------------------------------------------------------------------------------------------------------<<

export class SavedStateItem implements ISavedStateItem {

	public id: string
	public label: string
	public timestamp: number
	public checkedItems: Array<{ uriString: string, checkboxState: TreeItemCheckboxState }>

	constructor(
		id: string,
		name: string,
		timestamp: number,
		checkedItems: Array<{ uriString: string, checkboxState: TreeItemCheckboxState }>,
	) {
		this.id = id
		this.label = name
		this.timestamp = timestamp
		this.checkedItems = checkedItems
	}

}
