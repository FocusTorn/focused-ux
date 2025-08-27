// Mock URI implementation that's completely independent of shared
export interface IMockUri {
	fsPath: string
	toString: () => string
	path: string
	scheme: string
	authority: string
	query: string
	fragment: string
}

export interface IMockUriFactory {
	file: (path: string) => IMockUri
	create: (uri: any) => IMockUri
	joinPath: (base: IMockUri, ...paths: string[]) => IMockUri
	dirname: (uri: IMockUri) => IMockUri
}

class MockUri implements IMockUri {

	constructor(
		public readonly scheme: string,
		public readonly authority: string,
		public readonly path: string,
		public readonly query: string,
		public readonly fragment: string,
	) {}

	get fsPath(): string {
		return this.scheme === 'file' ? this.path : this.path
	}

	toString(): string {
		return `${this.scheme}://${this.authority}${this.path}${this.query ? `?${this.query}` : ''}${this.fragment ? `#${this.fragment}` : ''}`
	}

}

export class MockUriFactoryService implements IMockUriFactory {

	file(path: string): IMockUri {
		// Create a mock URI that matches the expected structure
		return new MockUri('file', '', path, '', '')
	}

	create(uri: any): IMockUri {
		const path = uri.fsPath || uri.path || uri

		return this.file(path)
	}

	joinPath(base: IMockUri, ...paths: string[]): IMockUri {
		const basePath = base.fsPath || base.path
		const fullPath = [basePath, ...paths].join('/').replace(/\/+/g, '/')

		return this.file(fullPath)
	}

	dirname(uri: IMockUri): IMockUri {
		const path = uri.fsPath || uri.path
		// Ensure path is a string before calling split
		const pathString = typeof path === 'string' ? path : String(path)
		const dirPath = pathString.split('/').slice(0, -1).join('/') || '/'

		return this.file(dirPath)
	}

}
