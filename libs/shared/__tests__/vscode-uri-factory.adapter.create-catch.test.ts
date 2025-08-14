import { describe, it, expect, vi } from 'vitest'

describe('VSCodeUriFactory create() and error catch path', () => {
	it('create wraps uri and file() catch branch rethrows', async () => {
		vi.resetModules()
		vi.mock('vscode', () => ({
			Uri: {
				file: (_p: string) => { throw new Error('boom') },
				joinPath: (base: any, ...segs: string[]) => ({ fsPath: [base.fsPath, ...segs].join('/'), path: [base.path, ...segs].join('/') }),
			},
		}))

		// Break circular import between VSCodeUriFactory and UriAdapter default-factory
		vi.mock('../src/vscode/adapters/Uri.adapter.js', () => ({
			UriAdapter: class { constructor(public uri: any) {} },
		}))

		const { VSCodeUriFactory } = await import('../src/vscode/adapters/VSCodeUriFactory.js')
		const f = new VSCodeUriFactory()

		expect(() => f.file('/will-throw')).toThrow('boom')

		const created = f.create({ fsPath: '/ok', path: '/ok' } as any) as any

		expect(created.uri.fsPath).toBe('/ok')
	})
})
