// ESLint & Imports -->>

//= VSCODE TYPES & MOCKED INTERNALS ===========================================================================
import type { TreeItemCollapsibleState } from 'vscode'
import type { TreeItemCheckboxState } from 'vscode'

//--------------------------------------------------------------------------------------------------------------<<

export interface IFileExplorerItem {
	uri: string
	label: string
	type: 'file' | 'directory'
	collapsibleState: TreeItemCollapsibleState
	checkboxState?: TreeItemCheckboxState
	children?: IFileExplorerItem[]
}
