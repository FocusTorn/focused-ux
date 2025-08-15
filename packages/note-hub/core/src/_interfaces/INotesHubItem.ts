// ESLint & Imports -->>

//= VSCODE TYPES & MOCKED INTERNALS ===========================================================================
import type { TreeItemLabel, IUri, IThemeIcon } from '@fux/shared'

//= IMPLEMENTATION TYPES ======================================================================================

export interface INotesHubItem {
	// Basic properties
	filePath: string
	isDirectory: boolean
	parentUri?: IUri
	frontmatter?: { [key: string]: string }
	fileName: string

	// TreeItem interface compatibility
	label: TreeItemLabel | string
	resourceUri: IUri | undefined
	description: string | undefined
	tooltip: string | undefined
	contextValue: string | undefined
	iconPath: IThemeIcon | undefined
	collapsibleState: number

	// Additional methods
	toVsCode: () => any
	iconPathFromFrontmatter: (frontmatterData?: { [key: string]: string }) => IThemeIcon
}
