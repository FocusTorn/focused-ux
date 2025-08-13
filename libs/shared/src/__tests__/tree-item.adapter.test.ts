import { describe, it, expect, vi } from 'vitest'

describe('TreeItem-related adapters', () => {
	it('TreeItemAdapter get/set and toVsCode', async () => {
		vi.resetModules()

		const TreeItem = class { constructor(public label: any, public collapsibleState?: any) {} }
		const ThemeIcon = class { constructor(public id: string, public color?: any) {} }
		const ThemeColor = class { constructor(public id: string) {} }

		vi.mock('vscode', () => ({ TreeItem, ThemeIcon, ThemeColor }))

		const { TreeItemAdapter, ThemeIconAdapter, ThemeColorAdapter } = await import('../vscode/adapters/TreeItem.adapter.js')
		const ti = new TreeItem('L', 1) as any
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

		const color = ThemeColorAdapter.create('clr')
		const icon = ThemeIconAdapter.create('ico', (color as any).themeColor)

		a.iconPath = icon
		expect((a.iconPath as any)?.id).toBe('ico')

		const vs = a.toVsCode()

		expect(vs).toBe(ti)
	})

	it('TreeItemFactoryAdapter variants', async () => {
		vi.resetModules()

		const TreeItem = class { constructor(public label: any, public collapsibleState?: any) {} } as any
		const ThemeIcon = class { constructor(public id: string, public color?: any) {} } as any

		vi.mock('vscode', () => ({ TreeItem, ThemeIcon, TreeItemCollapsibleState: { None: 0 } }))

		const { TreeItemFactoryAdapter } = await import('../vscode/adapters/TreeItemFactory.adapter.js')
		const f = new TreeItemFactoryAdapter()
		const a = f.create('A', 0 as any)

		expect(a.label).toBe('A')

		const b = f.createWithIcon('B', 'ico')

		expect((b as any).iconPath.id).toBe('ico')

		const c = f.createWithCommand('C', 'cmd')

		expect((c as any).command).toEqual({ command: 'cmd', title: 'C' })
	})
})
