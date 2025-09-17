export interface IPathUtilsService {
	getDottedPath: (from: string, to: string) => string | undefined
}

export interface ICommonUtilsService {
	errMsg: (message: string) => void
}