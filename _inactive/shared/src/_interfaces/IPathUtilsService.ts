export interface IPathUtilsService {
	getDottedPath: (from: string, to: string) => string | undefined
	sanitizePath: (path: string) => string
}
