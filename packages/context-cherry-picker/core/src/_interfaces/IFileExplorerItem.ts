// ESLint & Imports -->>

//= VSCODE TYPES & MOCKED INTERNALS ===========================================================================
import type { TreeItemCheckboxState, TreeItemCollapsibleState } from 'vscode'

//--------------------------------------------------------------------------------------------------------------<<

export interface IFileExplorerItem { //>
	uri: string
	label: string
	tooltip?: string
	type: 'file' | 'directory'
	checkboxState?: TreeItemCheckboxState
	collapsibleState: TreeItemCollapsibleState
} //<
