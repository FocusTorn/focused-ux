export interface ICommonUtilsService {
	errMsg: (message: string, error?: any) => void
	infoMsg: (message: string) => void
	warnMsg: (message: string) => void
}
