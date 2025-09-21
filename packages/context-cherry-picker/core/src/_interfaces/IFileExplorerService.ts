// ESLint & Imports -->>

//= VSCODE TYPES & MOCKED INTERNALS ===========================================================================
import type { IEvent, ITreeItemCheckboxState } from './ILocalTypes.js'
import type { IFileExplorerItem } from './IFileExplorerItem.js'

//= IMPLEMENTATION TYPES ======================================================================================
import type { FileGroupsConfig } from './ccp.types.js'

//--------------------------------------------------------------------------------------------------------------<<

export interface IFileExplorerService { //>
	onDidChangeTreeData: Event<IFileExplorerItem | undefined | null | void>

	getTreeItem: (element: IFileExplorerItem) => Promise<IFileExplorerItem>
	getChildren: (element?: IFileExplorerItem) => Promise<IFileExplorerItem[]>

	refresh: () => Promise<void>
	updateCheckboxState: (uri: string, state: TreeItemCheckboxState) => void
	getCheckboxState: (uri: string) => TreeItemCheckboxState | undefined
	getAllCheckedItems: () => string[]
	loadCheckedState: (checkedItems: Array<{ uriString: string, checkboxState: TreeItemCheckboxState }>) => void
	clearAllCheckboxes: () => void

	getCoreScanIgnoreGlobs: () => string[]

	getProjectTreeAlwaysShowGlobs: () => string[]
	getProjectTreeAlwaysHideGlobs: () => string[]
	getProjectTreeShowIfSelectedGlobs: () => string[]

	getContextExplorerIgnoreGlobs: () => string[]
	getContextExplorerHideChildrenGlobs: () => string[]

	getFileGroupsConfig: () => FileGroupsConfig | undefined

	dispose: () => void
} //<
