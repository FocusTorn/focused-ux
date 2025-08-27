export interface IPathUtilsService {
	sanitizePath: (path: string) => string
	join: (...paths: string[]) => string
	dirname: (path: string) => string
	basename: (path: string, ext?: string) => string
	parse: (path: string) => {
		root: string
		dir: string
		base: string
		ext: string
		name: string
	}
	extname: (path: string) => string
}
