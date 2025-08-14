import { describe, it, expect, vi } from 'vitest'

describe('coverage-only: TreeItemFactoryAdapter extra branches', () => {
	it('create assigns checkboxState when provided; UriFactory.file proxies', async () => {
		vi.resetModules()
		vi.mock('vscode', () => ({
			TreeItem: class { constructor(public label: any, public collapsibleState?: any) {} },
			TreeItemCollapsibleState: { None: 0 },
			ThemeIcon: class { constructor(public id: string) {} },
			Uri: { file: (p: string) => ({ fsPath: p, path: p }) },
		}))

		const { TreeItemFactoryAdapter, UriFactory } = await import('../../src/vscode/adapters/TreeItemFactory.adapter.js')
		const f = new TreeItemFactoryAdapter()
		const ti: any = f.create('L', 0 as any, { state: 'on' } as any)

		expect(ti.checkboxState).toEqual({ state: 'on' })

		const vsUri = UriFactory.file('/x') as any

		expect(vsUri.fsPath ?? vsUri.uri?.fsPath).toBe('/x')
	})
})

