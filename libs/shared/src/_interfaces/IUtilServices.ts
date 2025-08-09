export interface IPathUtilsService {
	getDottedPath: (from: string, to: string) => string | undefined
	sanitizePath: (path: string) => string
}

export interface ICommonUtilsService {
	errMsg: (message: string, error?: any) => void
	delay: (ms: number) => Promise<void>
}
