import { describe, it, expect, vi } from 'vitest'

describe('coverage-only: TreeItemAdapter edge branches', () => {
	it('create() with resourceUri, iconPath getter undefined, ThemeColorAdapter color undefined', async () => {
		vi.resetModules()
		vi.mock('vscode', () => ({
			TreeItem: class { public resourceUri?: any; public iconPath?: any; constructor(public label: any, public collapsibleState?: any) { this.resourceUri = undefined; this.iconPath = undefined } },
			ThemeIcon: class { constructor(public id: string, public color?: any) {} },
			ThemeColor: class { constructor(public id: string) {} },
			Uri: { file: (p: string) => ({ fsPath: p, path: p }) },
		}))

		const { TreeItemAdapter, ThemeIconAdapter } = await import('../../src/vscode/adapters/TreeItem.adapter.js')
		const vs: any = await import('vscode')

		const created = TreeItemAdapter.create('L', 1 as any, vs.Uri.file('/r')) as any

		expect(created.resourceUri?.uri?.fsPath).toBe('/r')

		const a = new TreeItemAdapter(new vs.TreeItem('x', 0))

		expect(a.iconPath).toBeUndefined()

		const icon = new (ThemeIconAdapter as any)({ id: 'i', color: undefined })

		expect(icon.color).toBeUndefined()

		// Also cover ThemeIconAdapter.create path which sets a ThemeIcon and exposes a color when provided
		const color = new vs.ThemeColor('c')
		const themed = (await import('../../src/vscode/adapters/TreeItem.adapter.js')).ThemeIconAdapter.create('ico', color as any) as any

		expect(themed.color?.id).toBe('c')
	})
})

