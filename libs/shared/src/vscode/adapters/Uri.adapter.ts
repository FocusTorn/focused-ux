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
		console.log('[UriAdapter] file() called with path:', path)
		console.log('[UriAdapter] file() path type:', typeof path)
		console.log('[UriAdapter] file() path length:', path?.length)
		console.log('[UriAdapter] file() path trimmed:', path?.trim())
		
		if (!path || typeof path !== 'string' || path.trim() === '') {
			console.warn('[UriAdapter] Invalid path provided to file():', path)
			// Return a fallback URI to prevent crashes
			return new UriAdapter(vscode.Uri.file('/invalid-path'))
		}
		
		try {
			console.log('[UriAdapter] file() calling vscode.Uri.file with:', path)

			const vscodeUri = vscode.Uri.file(path)

			console.log('[UriAdapter] file() vscode.Uri.file succeeded, creating UriAdapter')
			return new UriAdapter(vscodeUri)
		}
		catch (error) {
			console.error('[UriAdapter] file() vscode.Uri.file failed:', error)
			console.error('[UriAdapter] file() error type:', typeof error)
			console.error('[UriAdapter] file() error message:', (error as Error)?.message)
			console.error('[UriAdapter] file() error stack:', (error as Error)?.stack)
			throw error
		}
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
