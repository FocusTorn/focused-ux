import * as vscode from 'vscode'
import type { IUri } from '../../_interfaces/IVSCode.js'
import type { IUriFactory } from '../../_interfaces/IUriFactory.js'
import { UriAdapter } from './Uri.adapter.js'

export class VSCodeUriFactory implements IUriFactory {

	file(path: string): IUri {
		// Validate path before creating URI
		// (debug logs removed)
		
		if (!path || typeof path !== 'string' || path.trim() === '') {
			console.warn('[VSCodeUriFactory] Invalid path provided to file():', path)
			// Return a fallback URI to prevent crashes
			return new UriAdapter(vscode.Uri.file('/invalid-path'))
		}
		
		try {
			// (debug logs removed)

			const vscodeUri = vscode.Uri.file(path)

			// (debug logs removed)
			return new UriAdapter(vscodeUri)
		}
		catch (error) {
			// (error logs kept as thrown error)
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
			// (warn removed)
		}

		return new UriAdapter(vscode.Uri.joinPath(vscodeBase, ...validPaths))
	}

	dirname(uri: IUri): IUri {
		const vscodeUri = (uri as UriAdapter).uri

		// Validate URI before processing
		if (!vscodeUri || !vscodeUri.path) {
			// (warn removed)
			// Return a fallback URI to prevent crashes
			return new UriAdapter(vscode.Uri.file('/'))
		}

		return new UriAdapter(vscode.Uri.joinPath(vscodeUri, '..'))
	}

}
