import type { ICommonUtils, IWindow } from '@fux/dynamicons-core'

export class CommonUtilsAdapter implements ICommonUtils {

	constructor(private window: IWindow) {}

	async delay(ms: number): Promise<void> {
		return new Promise(resolve => setTimeout(resolve, ms))
	}

	errMsg(msg: string, _err?: any): void {
		this.window.showErrorMessage(msg)
	}

}
