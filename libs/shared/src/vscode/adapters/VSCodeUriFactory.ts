import * as vscode from 'vscode'
import type { IUri } from '../../_interfaces/IVSCode.js'
import type { IUriFactory } from '../../_interfaces/IUriFactory.js'
import { UriAdapter } from './Uri.adapter.js'

export class VSCodeUriFactory implements IUriFactory {

	file(path: string): IUri {
		// Validate path before creating URI
		console.log('[VSCodeUriFactory] file() called with path:', path)
		console.log('[VSCodeUriFactory] file() path type:', typeof path)
		console.log('[VSCodeUriFactory] file() path length:', path?.length)
		console.log('[VSCodeUriFactory] file() path trimmed:', path?.trim())
		
		if (!path || typeof path !== 'string' || path.trim() === '') {
			console.warn('[VSCodeUriFactory] Invalid path provided to file():', path)
			// Return a fallback URI to prevent crashes
			return new UriAdapter(vscode.Uri.file('/invalid-path'))
		}
		
		try {
			console.log('[VSCodeUriFactory] file() calling vscode.Uri.file with:', path)

			const vscodeUri = vscode.Uri.file(path)

			console.log('[VSCodeUriFactory] file() vscode.Uri.file succeeded, creating UriAdapter')
			return new UriAdapter(vscodeUri)
		}
		catch (error) {
			console.error('[VSCodeUriFactory] file() vscode.Uri.file failed:', error)
			console.error('[VSCodeUriFactory] file() error type:', typeof error)
			console.error('[VSCodeUriFactory] file() error message:', (error as Error)?.message)
			console.error('[VSCodeUriFactory] file() error stack:', (error as Error)?.stack)
			throw error
		}
	}

	create(uri: any): IUri {
		return new UriAdapter(uri)
	}

	joinPath(base: IUri, ...paths: string[]): IUri {
		const vscodeBase = (base as UriAdapter).uri

		// Validate paths before joining
		const validPaths = paths.filter(path => path && typeof path === 'string' && path.trim() !== '')

		if (validPaths.length !== paths.length) {
			console.warn('[VSCodeUriFactory] Invalid paths provided to joinPath():', paths)
		}

		return new UriAdapter(vscode.Uri.joinPath(vscodeBase, ...validPaths))
	}

	dirname(uri: IUri): IUri {
		const vscodeUri = (uri as UriAdapter).uri

		// Validate URI before processing
		if (!vscodeUri || !vscodeUri.path) {
			console.warn('[VSCodeUriFactory] Invalid URI provided to dirname():', uri)
			// Return a fallback URI to prevent crashes
			return new UriAdapter(vscode.Uri.file('/'))
		}

		return new UriAdapter(vscode.Uri.joinPath(vscodeUri, '..'))
	}

}
