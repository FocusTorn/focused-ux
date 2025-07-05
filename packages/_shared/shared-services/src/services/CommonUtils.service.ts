// ESLint & Imports -->>

//= IMPLEMENTATION TYPES ======================================================================================
import type { ICommonUtilsService, IWindow } from '../interfaces.js'

//--------------------------------------------------------------------------------------------------------------<<

export class CommonUtilsService implements ICommonUtilsService {

	constructor(
		private readonly iWindow: IWindow,
	) {}

	public delay( //>
		ms: number,
	): Promise<void> {
		if (ms === 0) {
			return Promise.resolve()
		}
		return new Promise(resolve => setTimeout(resolve, ms))
	} //<

	public errMsg( //>
		msg: string,
		err?: any,
	): void {
		this.iWindow.showErrorMessage(msg)
		console.error(msg)
		if (err) {
			console.error(err)
		}
	} //<

}
