import type { IUri, IUriFactory } from '@fux/note-hub-core'
import * as vscode from 'vscode'

// Extended IUri that exposes the underlying VS Code URI for workspace.fs operations
interface IUriWithVscode extends IUri {
	uri: vscode.Uri
}

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
			uri: uri, // Expose the underlying VS Code URI
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
					uri: newUri, // Expose the underlying VS Code URI
					with: (change: any) => this.with(change),
				}
			},
		} as IUriWithVscode
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
			uri: uri, // Expose the underlying VS Code URI
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
					uri: newUri, // Expose the underlying VS Code URI
					with: (change: any) => this.with(change),
				}
			},
		} as IUriWithVscode
	}

	create(uri: any): IUri {
		// If uri is already an IUri with .uri property, return it
		if (uri && typeof uri.fsPath === 'string' && typeof uri.toString === 'function') {
			// Ensure it has the .uri property
			if (!uri.uri && uri.fsPath) {
				uri.uri = vscode.Uri.file(uri.fsPath)
			}
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
				uri: uri, // Expose the underlying VS Code URI
				with: (change: any) => {
					const newUri = uri.with(change)

					return this.create(newUri)
				},
			} as IUriWithVscode
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
			uri: joinedUri, // Expose the underlying VS Code URI
			with: (change: any) => {
				const newUri = joinedUri.with(change)

				return this.create(newUri)
			},
		} as IUriWithVscode
	}

	private with(_change: any): IUri {
		// This is a helper method for the with implementations
		return this.file('')
	}

}
