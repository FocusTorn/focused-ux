// ESLint & Imports -->>

//= VSCODE TYPES & MOCKED INTERNALS ===========================================================================
import type { TreeItemCollapsibleState, TreeItemCheckboxState } from '@fux/shared'

//--------------------------------------------------------------------------------------------------------------<<

export interface IFileExplorerItem {
	uri: string
	label: string
	type: 'file' | 'directory'
	collapsibleState: TreeItemCollapsibleState
	checkboxState?: TreeItemCheckboxState
	children?: IFileExplorerItem[]
}
