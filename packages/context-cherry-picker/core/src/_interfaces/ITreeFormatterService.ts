// ESLint & Imports -->>

//--------------------------------------------------------------------------------------------------------------<<

export interface TreeFormatterNode { //>
	label: string
	details?: string // Optional, pre-formatted string to append to the label.
	isDirectory?: boolean // Optional flag to add a trailing slash to the label.
	children?: TreeFormatterNode[]
} //<

export interface ITreeFormatterService { //>
	formatTree: (rootNode: TreeFormatterNode) => string
} //<
