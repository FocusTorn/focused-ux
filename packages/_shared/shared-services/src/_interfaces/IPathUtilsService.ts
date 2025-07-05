// ESLint & Imports -->>

//--------------------------------------------------------------------------------------------------------------<<

export interface IPathUtilsService { //>
	santizePath: (uncleanPath: string) => string
	getNormalizedDirectory: (filePath: string) => string
	getDottedPath: (targetPath: string, pointingPath: string) => string | null
	iPathJoin: (...paths: string[]) => string
	iPathBasename: (p: string, ext?: string) => string
	iPathDirname: (p: string) => string
} //<