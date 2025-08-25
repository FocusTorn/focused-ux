import type { ICommonUtilsService, IWindow } from '@fux/note-hub-core'

export class CommonUtilsAdapter implements ICommonUtilsService {

	constructor(private window: IWindow) {}

	errMsg(message: string): void {
		this.window.showErrorMessage(message)
	}

	infoMsg(message: string): void {
		this.window.showInformationMessage(message)
	}

	warnMsg(message: string): void {
		this.window.showWarningMessage(message)
	}

}
