// ESLint & Imports -->>

//--------------------------------------------------------------------------------------------------------------<<

export interface FileSystemEntry { //>
	uri: string
	isFile: boolean
	size?: number
	name: string
	relativePath: string
} //<

export interface FileGroup { //>
	initially_visible: boolean
	items: string[]
} //<

export interface FileGroupsConfig { //>
	[groupName: string]: FileGroup
} //<
