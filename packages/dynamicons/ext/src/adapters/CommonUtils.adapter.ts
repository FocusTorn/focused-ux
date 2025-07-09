import { window as VsCodeWindow } from 'vscode'
import type { ICommonUtils } from '@fux/dynamicons-core'

export class CommonUtilsAdapter implements ICommonUtils {

	public delay(ms: number): Promise<void> {
		if (ms === 0) {
			return Promise.resolve()
		}
		return new Promise(resolve => setTimeout(resolve, ms))
	}

	public errMsg(msg: string, err?: any): void {
		VsCodeWindow.showErrorMessage(msg)
		console.error(msg)
		if (err) {
			console.error(err)
		}
	}

}
