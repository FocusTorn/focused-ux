import { vi } from 'vitest'
import process from 'node:process'
import type { IUri } from '../_interfaces/IVSCode.js'
import type { IUriFactory } from '../_interfaces/IUriFactory.js'
import { UriAdapter } from '../vscode/adapters/Uri.adapter.js'

const ENABLE_CONSOLE_OUTPUT = process.env.ENABLE_TEST_CONSOLE === 'true'

if (!ENABLE_CONSOLE_OUTPUT) {
	console.log = vi.fn()
	console.info = vi.fn()
	console.warn = vi.fn()
	console.error = vi.fn()
}

class LocalMockUriFactory implements IUriFactory {

	file(path: string): IUri {
		const mockUri = {
			fsPath: path,
			path,
			scheme: 'file',
			authority: '',
			query: '',
			fragment: '',
			toString: () => `file://${path}`,
		}

		return new UriAdapter(mockUri as any)
	}

	create(uri: any): IUri {
		const path = uri?.fsPath ?? uri?.path ?? String(uri)

		return this.file(path)
	}

	joinPath(base: IUri, ...paths: string[]): IUri {
		const basePath = (base as any).uri?.fsPath ?? (base as any).uri?.path ?? String(base)
		const fullPath = [basePath, ...paths]
			.join('/')
			.replace(/\\/g, '/')
			.replace(/\/+/g, '/')

		return this.file(fullPath)
	}

	dirname(uri: IUri): IUri {
		const basePath = (uri as any).uri?.fsPath ?? (uri as any).uri?.path ?? String(uri)
		const pathString = typeof basePath === 'string' ? basePath : String(basePath)
		const dirPath = pathString.split('/').slice(0, -1).join('/') || '/'

		return this.file(dirPath)
	}

}

UriAdapter.setFactory(new LocalMockUriFactory())
