// ESLint & Imports -->>

//--------------------------------------------------------------------------------------------------------------<<

export interface IPath {
	basename: (p: string) => string
	relative: (from: string, to: string) => string
	join: (...paths: string[]) => string
	dirname: (p: string) => string
}
