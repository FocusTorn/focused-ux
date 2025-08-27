import type { ICommonUtilsService } from '../_interfaces/ICommonUtils.js'

export class CommonUtilsAdapter implements ICommonUtilsService {

	errMsg(message: string, error?: any): void {
		console.error(message, error || '')
	}

	infoMsg(message: string): void {
		console.info(message)
	}

	warnMsg(message: string): void {
		console.warn(message)
	}

}
