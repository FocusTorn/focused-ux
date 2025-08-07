// ESLint & Imports -->>

//= VSCODE TYPES & MOCKED INTERNALS ===========================================================================
import type { TreeItemCheckboxState, TreeItemCollapsibleState } from '@fux/shared'

//= IMPLEMENTATION TYPES ======================================================================================
import type { IFileExplorerItem } from '../_interfaces/IFileExplorerItem.js'

//--------------------------------------------------------------------------------------------------------------<<

// Factory function to get enum values (will be provided by adapters)
export interface ITreeItemFactory {
	getCheckboxStateUnchecked: () => TreeItemCheckboxState
	getCheckboxStateChecked: () => TreeItemCheckboxState
	getCollapsibleStateNone: () => TreeItemCollapsibleState
	getCollapsibleStateCollapsed: () => TreeItemCollapsibleState
	getCollapsibleStateExpanded: () => TreeItemCollapsibleState
}

// Re-export the shared TreeItemFactory for convenience
export type { TreeItemFactory } from '@fux/shared'

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
		initialCheckboxState: TreeItemCheckboxState,
		parentUri?: string,
		initialCollapsibleState?: TreeItemCollapsibleState,
	) {
		this.type = fileType
		this.checkboxState = initialCheckboxState
		this.parentUri = parentUri
		this.collapsibleState = initialCollapsibleState ?? (fileType === 'directory' ? 1 : 0)
	}

	static create(
		uri: string,
		label: string,
		fileType: 'file' | 'directory',
		factory: ITreeItemFactory,
		initialCheckboxState?: TreeItemCheckboxState,
		parentUri?: string,
		initialCollapsibleState?: TreeItemCollapsibleState,
	): FileExplorerItem {
		return new FileExplorerItem(
			uri,
			label,
			fileType,
			initialCheckboxState ?? factory.getCheckboxStateUnchecked(),
			parentUri,
			initialCollapsibleState,
		)
	}

}
