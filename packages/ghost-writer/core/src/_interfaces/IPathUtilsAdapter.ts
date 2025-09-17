export interface IPathUtilsAdapter {
	getDottedPath: (from: string, to: string) => string | undefined
}
