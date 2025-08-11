import type { IUriFactory, IUri } from '@fux/shared'
import { UriAdapter } from '@fux/shared'

export class MockUriFactoryService implements IUriFactory {

	file(path: string): IUri {
		// Create a mock URI that matches the expected structure
		const mockUri = {
			uri: {
				fsPath: path,
				toString: () => `file://${path}`,
				path,
				scheme: 'file',
				authority: '',
				query: '',
				fragment: '',
			},
			fsPath: path,
			toString: () => `file://${path}`,
			path,
			scheme: 'file',
			authority: '',
			query: '',
			fragment: '',
		}

		return new UriAdapter(mockUri as any)
	}

	create(uri: any): IUri {
		const path = uri.fsPath || uri.path || uri

		return this.file(path)
	}

	joinPath(base: IUri, ...paths: string[]): IUri {
		const basePath = (base as UriAdapter).uri.fsPath || (base as UriAdapter).uri.path || base
		const fullPath = [basePath, ...paths].join('/').replace(/\/+/g, '/')

		return this.file(fullPath)
	}

	dirname(uri: IUri): IUri {
		const path = (uri as UriAdapter).uri.fsPath || (uri as UriAdapter).uri.path || uri
		// Ensure path is a string before calling split
		const pathString = typeof path === 'string' ? path : String(path)
		const dirPath = pathString.split('/').slice(0, -1).join('/') || '/'

		return this.file(dirPath)
	}

}
