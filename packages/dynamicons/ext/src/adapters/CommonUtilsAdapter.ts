import type { ICommonUtils } from '@fux/dynamicons-core'
import type { IWindow } from '@fux/dynamicons-core'

export class CommonUtilsAdapter implements ICommonUtils {
	constructor(private window: IWindow) {}

	async delay(ms: number): Promise<void> {
		return new Promise(resolve => setTimeout(resolve, ms))
	}

	errMsg(msg: string, err?: any): void {
		this.window.showErrorMessage(msg)
	}
} 