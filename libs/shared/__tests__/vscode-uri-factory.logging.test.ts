import { describe, it, expect, vi } from 'vitest'

describe('VSCodeUriFactory logging (warn)', () => {
	it('emits warn on invalid path in file()', async () => {
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

		const warnSpy = vi.spyOn(console, 'warn')
		const { VSCodeUriFactory } = await import('../src/vscode/adapters/VSCodeUriFactory.js')
		const f = new VSCodeUriFactory()

		const _res = f.file('')

		expect(warnSpy).toHaveBeenCalled()

		const args = warnSpy.mock.calls.at(-1) ?? []

		expect(String(args[0])).toContain('Invalid path provided to file()')
	})
})
