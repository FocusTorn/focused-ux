import type { IUriFactory, IUri } from '@fux/dynamicons-core'
import * as vscode from 'vscode'

export class UriAdapter implements IUriFactory {

	file(path: string): IUri {
		if (!path || typeof path !== 'string' || path.trim() === '') {
			console.warn('[UriAdapter] Invalid path provided to file():', path)
			return this._toIUri(vscode.Uri.file('/invalid-path'))
		}
		return this._toIUri(vscode.Uri.file(path))
	}

	create(uri: any): IUri {
		if (typeof uri === 'string') {
			return this.file(uri)
		}
		if (!uri || typeof uri !== 'object') {
			console.warn('[UriAdapter] Invalid URI provided to create():', uri)
			return this._toIUri(vscode.Uri.file('/invalid-uri'))
		}
		return this._toIUri(uri)
	}

	joinPath(base: IUri, ...pathSegments: string[]): IUri {
		if (!base || typeof base !== 'object') {
			console.warn('[UriAdapter] Invalid base URI provided to joinPath():', base)
			return this._toIUri(vscode.Uri.file('/invalid-base'))
		}
		
		// Filter out invalid path segments
		const validSegments = pathSegments.filter(segment =>
			segment && typeof segment === 'string' && segment.trim() !== '',
		)
		
		// Convert IUri back to vscode.Uri for joinPath
		const vscodeUri = vscode.Uri.parse(base.toString())

		return this._toIUri(vscode.Uri.joinPath(vscodeUri, ...validSegments))
	}

	parse(value: string): IUri {
		if (!value || typeof value !== 'string') {
			console.warn('[UriAdapter] Invalid value provided to parse():', value)
			return this._toIUri(vscode.Uri.file('/invalid-parse'))
		}
		return this._toIUri(vscode.Uri.parse(value))
	}

	dirname(uri: vscode.Uri): string {
		if (!uri || typeof uri !== 'object' || !uri.fsPath) {
			console.warn('[UriAdapter] Invalid URI provided to dirname():', uri)
			return '/'
		}
		return vscode.Uri.file(uri.fsPath).path.split('/').slice(0, -1).join('/') || '/'
	}

	private _toIUri(vscodeUri: vscode.Uri): IUri {
		return {
			fsPath: vscodeUri.fsPath,
			scheme: vscodeUri.scheme,
			authority: vscodeUri.authority,
			path: vscodeUri.path,
			query: vscodeUri.query,
			fragment: vscodeUri.fragment,
			toString: () => vscodeUri.toString(),
			with: (change: {
				scheme?: string
				authority?: string
				path?: string
				query?: string
				fragment?: string
			}) => this._toIUri(vscodeUri.with(change)),
		}
	}

}
