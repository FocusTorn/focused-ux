export interface ICommonUtils {
	delay: (ms: number) => Promise<void>
	errMsg: (msg: string, err?: any) => void
}
