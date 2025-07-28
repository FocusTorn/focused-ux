import type { ICommonUtilsService } from '../../_interfaces/IUtilServices.js'

export class CommonUtilsAdapter implements ICommonUtilsService {

	constructor(private readonly window: any) {}

	public errMsg(message: string, error?: any): void {
		this.window.showErrorMessage(message)
	}

	public async delay(ms: number): Promise<void> {
		return new Promise(resolve => setTimeout(resolve, ms))
	}

}
