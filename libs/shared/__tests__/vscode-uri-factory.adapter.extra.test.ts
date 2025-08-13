import { describe, it, expect, vi } from 'vitest'

describe('VSCodeUriFactory error branches', () => {
	it('joinPath filters invalid inputs', async () => {
		vi.resetModules()
		vi.mock('vscode', () => ({
			Uri: {
				file: (p: string) => ({ fsPath: p, path: p }),
				joinPath: (base: any, ...segs: string[]) => ({ fsPath: [base.fsPath, ...segs].join('/'), path: [base.path, ...segs].join('/') }),
			},
		}))

		// Break circular import between VSCodeUriFactory and UriAdapter default-factory
		vi.mock('../src/vscode/adapters/Uri.adapter.js', () => ({
			UriAdapter: class { constructor(public uri: any) {} },
		}))

		const { VSCodeUriFactory: VF2 } = await import('../src/vscode/adapters/VSCodeUriFactory.js')
		const g = new VF2()
		const j = g.joinPath({ uri: { fsPath: '/r', path: '/r' } } as any, 'a', '', 'b') as any

		expect(j.path ?? j.uri?.path).toContain('/r/a/b')
	})
})
