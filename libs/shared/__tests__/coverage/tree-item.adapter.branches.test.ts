import { describe, it, expect, vi } from 'vitest'

describe('coverage-only: TreeItemAdapter setter branches and ThemeColorAdapter.create', () => {
	it('resourceUri setter handles UriAdapter and undefined; ThemeColorAdapter.create path', async () => {
		vi.resetModules()
		vi.mock('vscode', () => ({
			TreeItem: class { public resourceUri?: any; public iconPath?: any; constructor(public label: any, public collapsibleState?: any) { this.resourceUri = undefined; this.iconPath = undefined } },
			ThemeIcon: class { constructor(public id: string, public color?: any) {} },
			ThemeColor: class { constructor(public id: string) {} },
			Uri: { file: (p: string) => ({ fsPath: p, path: p }) },
		}))

		const { TreeItemAdapter, ThemeColorAdapter } = await import('../../src/vscode/adapters/TreeItem.adapter.js')
		const { UriAdapter } = await import('../../src/vscode/adapters/Uri.adapter.js')
		const vs: any = await import('vscode')

		const ti = new vs.TreeItem('L', 1)
		const a = new TreeItemAdapter(ti)

		// resourceUri getter false branch when underlying is undefined
		expect(a.resourceUri).toBeUndefined()

		// set with UriAdapter
		a.resourceUri = new UriAdapter(vs.Uri.file('/z')) as any
		expect((ti as any).resourceUri.fsPath).toBe('/z')

		// set to undefined clears underlying value
		a.resourceUri = undefined
		expect((ti as any).resourceUri).toBeUndefined()

		// ThemeColorAdapter.create path
		const c = ThemeColorAdapter.create('c') as any

		expect(c.id).toBe('c')

		// iconPath setter undefined branch
		a.iconPath = undefined
		expect((ti as any).iconPath).toBeUndefined()

		// TreeItemAdapter.create without resourceUri hits false branch of if (resourceUri)
		const createdNoUri = TreeItemAdapter.create('N', 0 as any)

		expect(createdNoUri.resourceUri).toBeUndefined()
	})
})

