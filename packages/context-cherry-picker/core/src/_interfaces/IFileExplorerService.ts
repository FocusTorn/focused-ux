// ESLint & Imports -->>

//= VSCODE TYPES & MOCKED INTERNALS ===========================================================================
import type { Event, TreeItemCheckboxState } from 'vscode'

//= IMPLEMENTATION TYPES ======================================================================================
import type { FileExplorerItem } from '../models/FileExplorerItem.js'
import type { FileGroupsConfig } from './ccp.types.js'

//--------------------------------------------------------------------------------------------------------------<<

export interface IFileExplorerService { //>
	onDidChangeTreeData: Event<FileExplorerItem | undefined | null | void>

	getTreeItem: (element: FileExplorerItem) => Promise<FileExplorerItem>
	getChildren: (element?: FileExplorerItem) => Promise<FileExplorerItem[]>

	refresh: () => Promise<void>
	updateCheckboxState: (uri: string, state: TreeItemCheckboxState) => void
	getCheckboxState: (uri: string) => TreeItemCheckboxState | undefined
	getAllCheckedItems: () => string[]
	loadCheckedState: (items: Array<{ uriString: string, checkboxState: number }>) => void
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
