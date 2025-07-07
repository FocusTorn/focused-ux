// ESLint & Imports -->>

//= VSCODE TYPES & MOCKED INTERNALS ===========================================================================
import type { TreeItemCheckboxState, TreeItemCollapsibleState } from 'vscode'
import { TreeItemCheckboxState as VsCodeCheckboxStateValue } from 'vscode'

//= IMPLEMENTATION TYPES ======================================================================================
import type { IFileExplorerItem } from '../_interfaces/IFileExplorerItem.js'

//--------------------------------------------------------------------------------------------------------------<<

export class FileExplorerItem implements IFileExplorerItem {

	public type: 'file' | 'directory'
	public parentUri?: string
	public checkboxState?: TreeItemCheckboxState
	public collapsibleState: TreeItemCollapsibleState
	public description?: string
	public tooltip?: string

	constructor(
		public readonly uri: string,
		public label: string,
		fileType: 'file' | 'directory',
		initialCheckboxState: TreeItemCheckboxState = VsCodeCheckboxStateValue.Unchecked,
		parentUri?: string,
		initialCollapsibleState?: TreeItemCollapsibleState,
	) {
		this.type = fileType
		this.checkboxState = initialCheckboxState
		this.parentUri = parentUri
		this.collapsibleState = initialCollapsibleState ?? (fileType === 'directory' ? 1 : 0)
	}

}
