import type { window as vscodeWindow } from 'vscode'
import type { ICommonUtilsService } from '@fux/ghost-writer-core'

export class WindowAdapter implements ICommonUtilsService {

	constructor(private readonly window: typeof vscodeWindow) {}

	errMsg(message: string): void {
		this.window.showErrorMessage(message)
	}

	showInformationMessage(message: string): Thenable<string | undefined> {
		return this.window.showInformationMessage(message)
	}

	showTimedInformationMessage(message: string): Thenable<string | undefined> {
		return this.window.showInformationMessage(message)
	}

	get activeTextEditor() {
		return this.window.activeTextEditor
	}

}
