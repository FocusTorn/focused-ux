import { describe, it, expect, vi } from 'vitest'

describe('TreeItem-related adapters', () => {
	it('TreeItemAdapter get/set and toVsCode', async () => {
		vi.resetModules()

		vi.mock('vscode', () => ({
			TreeItem: class { constructor(public label: any, public collapsibleState?: any) {} },
			ThemeIcon: class { constructor(public id: string, public color?: any) {} },
			ThemeColor: class { constructor(public id: string) {} },
		}))

		const { TreeItemAdapter, ThemeIconAdapter, ThemeColorAdapter } = await import('../src/vscode/adapters/TreeItem.adapter.js')
		const vs: any = await import('vscode')
		const ti = new vs.TreeItem('L', 1) as any
		const a = new TreeItemAdapter(ti)

		a.label = 'L2'
		expect(a.label).toBe('L2')
		a.description = 'd'
		expect(a.description).toBe('d')
		a.tooltip = 't'
		expect(a.tooltip).toBe('t')
		a.contextValue = 'c'
		expect(a.contextValue).toBe('c')
		a.collapsibleState = 2 as any
		expect(a.collapsibleState).toBe(2)

		const icon = ThemeIconAdapter.create('ico')

		a.iconPath = icon
		expect((a.iconPath as any)?.id).toBe('ico')

		const vItem = a.toVsCode()

		expect(vItem).toBe(ti)
	})

	it('TreeItemFactoryAdapter variants', async () => {
		vi.resetModules()

		vi.mock('vscode', () => ({
			TreeItem: class { constructor(public label: any, public collapsibleState?: any) {} },
			ThemeIcon: class { constructor(public id: string, public color?: any) {} },
			TreeItemCollapsibleState: { None: 0 },
		}))

		const { TreeItemFactoryAdapter } = await import('../src/vscode/adapters/TreeItemFactory.adapter.js')
		const f = new TreeItemFactoryAdapter()
		const a = f.create('A', 0 as any)

		expect(a.label).toBe('A')

		const b = f.createWithIcon('B', 'ico')

		expect((b as any).iconPath.id).toBe('ico')

		const c = f.createWithCommand('C', 'cmd')

		expect((c as any).command).toEqual({ command: 'cmd', title: 'C' })
	})
})
