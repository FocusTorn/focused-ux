// ESLint & Imports -->>

//= VSCODE TYPES & MOCKED INTERNALS ===========================================================================
import type { ITreeItemCollapsibleState, ITreeItemCheckboxState } from './ILocalTypes.js'

//--------------------------------------------------------------------------------------------------------------<<

export interface IFileExplorerItem {
	uri: string
	label: string
	type: 'file' | 'directory'
	collapsibleState: TreeItemCollapsibleState
	checkboxState?: TreeItemCheckboxState
	children?: IFileExplorerItem[]
}
