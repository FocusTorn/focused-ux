import * as vscode from 'vscode'
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

	static create(uri: vscode.Uri): IUri {
		return new UriAdapter(uri)
	}

	static file(path: string): IUri {
		return new UriAdapter(vscode.Uri.file(path))
	}

	static joinPath(base: IUri, ...paths: string[]): IUri {
		const vscodeBase = (base as UriAdapter).uri

		return new UriAdapter(vscode.Uri.joinPath(vscodeBase, ...paths))
	}

	static dirname(uri: IUri): IUri {
		const vscodeUri = (uri as UriAdapter).uri

		return new UriAdapter(vscode.Uri.joinPath(vscodeUri, '..'))
	}

}
