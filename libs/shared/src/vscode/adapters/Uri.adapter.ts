import type * as vscode from 'vscode'
import type { IUri } from '../../_interfaces/IVSCode.js'

export class UriAdapter implements IUri {

	constructor(public readonly uri: vscode.Uri) {}

	get path(): string {
		return this.uri.path
	}

	get query(): string {
		return this.uri.query
	}

	get fsPath(): string {
		return this.uri.fsPath
	}
    
	toString(): string {
		return this.uri.toString()
	}

}
