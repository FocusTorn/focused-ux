import { describe, it, expect, vi } from 'vitest'

// Mock vscode module to avoid slow real API calls
vi.mock('vscode', () => ({
	TreeItem: vi.fn().mockImplementation((label, collapsibleState) => ({
		label,
		collapsibleState,
		description: undefined,
		tooltip: undefined,
		contextValue: undefined,
		iconPath: undefined,
		command: undefined,
	})),
	ThemeIcon: vi.fn().mockImplementation((id, color) => ({
		id,
		color,
	})),
	EventEmitter: vi.fn().mockImplementation(() => ({
		event: vi.fn(),
		fire: vi.fn(),
		dispose: vi.fn(),
	})),
	TreeItemCollapsibleState: {
		None: 0,
		Collapsed: 1,
		Expanded: 2,
	},
	SymbolKind: {
		Function: 12,
	},
}))

describe('Tree Comprehensive Tests', () => {
	describe('TreeItem-related adapters', () => {
		it('TreeItemAdapter get/set and toVsCode', async () => {
			// const { TreeItemAdapter, ThemeIconAdapter, ThemeColorAdapter } = await import('../../src/vscode/adapters/TreeItem.adapter.js')
			const { TreeItemAdapter, ThemeIconAdapter } = await import('../../src/vscode/adapters/TreeItem.adapter.js')
            
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
			const { TreeItemFactoryAdapter } = await import('../../src/vscode/adapters/TreeItemFactory.adapter.js')
			const f = new TreeItemFactoryAdapter()
			const a = f.create('A', 0 as any)

			expect(a.label).toBe('A')

			const b = f.createWithIcon('B', 'ico')

			expect((b as any).iconPath.id).toBe('ico')

			const c = f.createWithCommand('C', 'cmd')

			expect((c as any).command).toEqual({ command: 'cmd', title: 'C' })
		})
	})

	describe('TreeDataProviderAdapter', () => {
		it('wires events, getTreeItem and getChildren', async () => {
			const { TreeDataProviderAdapter } = await import('../../src/vscode/adapters/TreeDataProvider.adapter.js')
			const service = {
				onDidChangeTreeData: (listener: any) => ({ dispose: vi.fn(() => listener(undefined)) }),
				getChildren: vi.fn().mockResolvedValue([1, 2, 3]),
			}
			const factory = vi.fn((x: number) => ({ label: String(x) }))
			const a = new TreeDataProviderAdapter<number>(service as any, factory as any)

			await a.getChildren()
			expect(service.getChildren).toHaveBeenCalled()
			expect(a.getTreeItem(7)).toEqual({ label: '7' })
			a.dispose()
		})
	})

	describe('TreeItemCollapsibleStateAdapter', () => {
		it('maps to vscode enum values', async () => {
			const { TreeItemCollapsibleStateAdapter } = await import('../../src/vscode/adapters/TreeItemCollapsibleState.adapter.js')
			const a = new TreeItemCollapsibleStateAdapter()

			expect(a.None).toBe(0)
			expect(a.Collapsed).toBe(1)
			expect(a.Expanded).toBe(2)
		})
	})
})
