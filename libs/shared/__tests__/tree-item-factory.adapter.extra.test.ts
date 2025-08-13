import { describe, it, expect, vi } from 'vitest'

describe('TreeItemFactoryAdapter extra', () => {
	it('covers checkboxState branch', async () => {
		vi.resetModules()
		vi.mock('vscode', () => ({
			TreeItem: class { constructor(public label: any, public collapsibleState?: any) {} public checkboxState?: any },
			TreeItemCollapsibleState: { None: 0 },
			ThemeIcon: class { constructor(public id: string) {} },
		}))

		const { TreeItemFactoryAdapter } = await import('../src/vscode/adapters/TreeItemFactory.adapter.js')
		const f = new TreeItemFactoryAdapter()
		const ti = f.create('L', 0 as any, 1 as any) as any

		expect(ti.checkboxState).toBe(1)
	})
})
