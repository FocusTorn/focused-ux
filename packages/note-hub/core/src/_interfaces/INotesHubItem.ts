// ESLint & Imports -->>

//= LOCAL TYPE DEFINITIONS ====================================================================================
export type TreeItemLabel = string | { label: string, highlights?: [number, number][] }
export interface IUri {
	scheme: string
	authority: string
	path: string
	query: string
	fragment: string
	fsPath: string
	with: (change: { scheme?: string, authority?: string, path?: string, query?: string, fragment?: string }) => IUri
	toString: () => string
}

export interface IUriFactory {
	file: (path: string) => IUri
	parse: (value: string) => IUri
	create: (uri: any) => IUri
	joinPath: (base: IUri, ...paths: string[]) => IUri
}

interface IThemeColor {
	readonly id: string
}
export interface IThemeIcon {
	id: string
	theme?: string
	color?: IThemeColor
}

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
