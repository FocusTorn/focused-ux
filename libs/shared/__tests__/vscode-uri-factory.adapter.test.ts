import { describe, it, expect, vi } from 'vitest'

describe('VSCodeUriFactory', () => {
	it('file validates input and returns fallback on invalid; joinPath filters; dirname handles invalid', async () => {
		vi.resetModules()
		vi.mock('vscode', () => ({
			Uri: {
				file: (p: string) => ({ fsPath: p, path: p, toString: () => `file://${p}` }),
				joinPath: (base: any, ...segs: string[]) => ({ fsPath: [base.fsPath, ...segs].join('/'), path: [base.path, ...segs].join('/') }),
			},
		}))

		// Break circular import between VSCodeUriFactory and UriAdapter default-factory
		vi.mock('../src/vscode/adapters/Uri.adapter.js', () => ({
			UriAdapter: class { constructor(public uri: any) {} },
		}))

		const { VSCodeUriFactory } = await import('../src/vscode/adapters/VSCodeUriFactory.js')
		const f = new VSCodeUriFactory()

		const bad = f.file('') as any

		expect(bad.uri.fsPath).toBe('/invalid-path')

		const good = f.file('/root/x.txt') as any

		expect(good.uri.fsPath).toBe('/root/x.txt')

		const base = { uri: { fsPath: '/root', path: '/root' } } as any
		const joined = f.joinPath(base, 'a', '', 'b') as any

		expect(joined.uri.fsPath).toContain('/root/a/b')

		const d1 = f.dirname({ uri: { fsPath: '/root/a', path: '/root/a' } } as any) as any

		expect(d1.uri.fsPath).toContain('/..')

		const d2 = f.dirname({ uri: {} } as any) as any

		expect(d2.uri.fsPath).toBe('/')
	})
})
