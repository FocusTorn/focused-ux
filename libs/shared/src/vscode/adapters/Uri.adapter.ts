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
		// Validate path before creating URI
		if (!path || typeof path !== 'string' || path.trim() === '') {
			console.warn('[UriAdapter] Invalid path provided to file():', path)
			// Return a fallback URI to prevent crashes
			return new UriAdapter(vscode.Uri.file('/invalid-path'))
		}
		return new UriAdapter(vscode.Uri.file(path))
	}

	static joinPath(base: IUri, ...paths: string[]): IUri {
		const vscodeBase = (base as UriAdapter).uri

		// Validate paths before joining
		const validPaths = paths.filter(path => path && typeof path === 'string' && path.trim() !== '')

		if (validPaths.length !== paths.length) {
			console.warn('[UriAdapter] Invalid paths provided to joinPath():', paths)
		}

		return new UriAdapter(vscode.Uri.joinPath(vscodeBase, ...validPaths))
	}

	static dirname(uri: IUri): IUri {
		const vscodeUri = (uri as UriAdapter).uri

		// Validate URI before processing
		if (!vscodeUri || !vscodeUri.path) {
			console.warn('[UriAdapter] Invalid URI provided to dirname():', uri)
			// Return a fallback URI to prevent crashes
			return new UriAdapter(vscode.Uri.file('/'))
		}

		return new UriAdapter(vscode.Uri.joinPath(vscodeUri, '..'))
	}

}
