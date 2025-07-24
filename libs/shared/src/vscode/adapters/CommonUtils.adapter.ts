import type { ICommonUtilsService } from '../../_interfaces/IUtilServices.js'

export class CommonUtilsAdapter implements ICommonUtilsService {

	constructor(private readonly window: any) {}

	public errMsg(message: string): void {
		this.window.showErrorMessage(message)
	}

}
