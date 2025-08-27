export interface IUri {
	fsPath: string
	scheme: string
	authority: string
	path: string
	query: string
	fragment: string
	toString: () => string
	with: (change: {
		scheme?: string
		authority?: string
		path?: string
		query?: string
		fragment?: string
	}) => IUri
}

export interface IUriFactory {
	file: (path: string) => IUri
	parse: (value: string) => IUri
	create: (uri: any) => IUri
	joinPath: (base: IUri, ...paths: string[]) => IUri
}
