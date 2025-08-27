import type { IUri, IUriFactory } from '@fux/note-hub-core'
import * as vscode from 'vscode'

export class UriAdapter implements IUriFactory {

	file(path: string): IUri {
		const uri = vscode.Uri.file(path)

		return {
			fsPath: uri?.fsPath || path,
			scheme: uri?.scheme || 'file',
			authority: uri?.authority || '',
			path: uri?.path || path,
			query: uri?.query || '',
			fragment: uri?.fragment || '',
			toString: () => uri?.toString() || `file://${path}`,
			with: (change: any) => {
				const newUri = uri?.with(change)

				return {
					fsPath: newUri?.fsPath || path,
					scheme: newUri?.scheme || 'file',
					authority: newUri?.authority || '',
					path: newUri?.path || path,
					query: newUri?.query || '',
					fragment: newUri?.fragment || '',
					toString: () => newUri?.toString() || `file://${path}`,
					with: (change: any) => this.with(change),
				}
			},
		}
	}

	parse(value: string): IUri {
		const uri = vscode.Uri.parse(value)

		return {
			fsPath: uri?.fsPath || value,
			scheme: uri?.scheme || 'file',
			authority: uri?.authority || '',
			path: uri?.path || value,
			query: uri?.query || '',
			fragment: uri?.fragment || '',
			toString: () => uri?.toString() || value,
			with: (change: any) => {
				const newUri = uri?.with(change)

				return {
					fsPath: newUri?.fsPath || value,
					scheme: newUri?.scheme || 'file',
					authority: newUri?.authority || '',
					path: newUri?.path || value,
					query: newUri?.query || '',
					fragment: newUri?.fragment || '',
					toString: () => newUri?.toString() || value,
					with: (change: any) => this.with(change),
				}
			},
		}
	}

	create(uri: any): IUri {
		// If uri is already an IUri, return it
		if (uri && typeof uri.fsPath === 'string' && typeof uri.toString === 'function') {
			return uri
		}
        
		// If uri is a VSCode URI, convert it
		if (uri && uri.fsPath && uri.scheme) {
			return {
				fsPath: uri.fsPath,
				scheme: uri.scheme,
				authority: uri.authority || '',
				path: uri.path,
				query: uri.query || '',
				fragment: uri.fragment || '',
				toString: () => uri.toString(),
				with: (change: any) => {
					const newUri = uri.with(change)

					return this.create(newUri)
				},
			}
		}
        
		// Fallback to file method if uri is a string path
		if (typeof uri === 'string') {
			return this.file(uri)
		}
        
		// Return a default URI if nothing else works
		return this.file('/')
	}

	joinPath(base: IUri, ...paths: string[]): IUri {
		// Convert IUri to VSCode URI for joining
		const vscodeUri = vscode.Uri.file(base.fsPath)
		const joinedUri = vscode.Uri.joinPath(vscodeUri, ...paths)
        
		return {
			fsPath: joinedUri.fsPath,
			scheme: joinedUri.scheme,
			authority: joinedUri.authority,
			path: joinedUri.path,
			query: joinedUri.query,
			fragment: joinedUri.fragment,
			toString: () => joinedUri.toString(),
			with: (change: any) => {
				const newUri = joinedUri.with(change)

				return this.create(newUri)
			},
		}
	}

	private with(_change: any): IUri {
		// This is a helper method for the with implementations
		return this.file('')
	}

}
