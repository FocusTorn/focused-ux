import * as vscode from 'vscode'
import type { IExtensions } from '../../_interfaces/IVSCode.js'

export class ExtensionsAdapter implements IExtensions {

	get all() {
		return vscode.extensions.all
	}

}
