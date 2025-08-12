import type * as vscode from 'vscode'
import type { IUri } from '../../_interfaces/IVSCode.js'
import type { IUriFactory } from '../../_interfaces/IUriFactory.js'
import { VSCodeUriFactory } from './VSCodeUriFactory.js'

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

	// Static methods for backward compatibility - these delegate to the default factory
	static create(uri: vscode.Uri): IUri {
		return UriAdapter.defaultFactory.create(uri)
	}

	static file(path: string): IUri {
		return UriAdapter.defaultFactory.file(path)
	}

	static joinPath(base: IUri, ...paths: string[]): IUri {
		return UriAdapter.defaultFactory.joinPath(base, ...paths)
	}

	static dirname(uri: IUri): IUri {
		return UriAdapter.defaultFactory.dirname(uri)
	}

	// Default factory instance for backward compatibility
	private static defaultFactory: IUriFactory = new VSCodeUriFactory()

	// Method to set a custom factory (useful for testing)
	static setFactory(factory: IUriFactory): void {
		UriAdapter.defaultFactory = factory
	}

	// Method to get the current factory
	static getFactory(): IUriFactory {
		return UriAdapter.defaultFactory
	}

}
