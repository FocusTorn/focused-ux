import type { ICommonUtilsService } from '@fux/ghost-writer-core'
import type { IWindow } from '../../_interfaces/IVSCode.js'

export class CommonUtilsAdapter implements ICommonUtilsService {

	constructor(private readonly window: IWindow) {}

	public errMsg(message: string): void {
		this.window.showErrorMessage(message)
	}

}
