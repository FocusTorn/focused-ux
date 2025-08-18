import { describe, it, expect, vi, beforeEach } from 'vitest'

describe('Tree Item Coverage Tests', () => {
	beforeEach(() => {
		vi.resetModules()
	})

	it('should handle tree item adapter branches', async () => {
		vi.mock('vscode', () => ({
			TreeItem: class MockTreeItem {
				constructor(public label: string, public collapsibleState: any) {}
			},
			TreeItemCollapsibleState: {
				None: 0,
				Collapsed: 1,
				Expanded: 2,
			},
		}))

		const { TreeItemAdapter } = await import('../../src/vscode/adapters/TreeItem.adapter.js')
		const vscode: any = await import('vscode')

		const adapter = TreeItemAdapter.create('test', vscode.TreeItemCollapsibleState.Collapsed)
		expect(adapter.label).toBe('test')
		expect(adapter.collapsibleState).toBe(vscode.TreeItemCollapsibleState.Collapsed)
	})

	it('should handle tree item factory adapter', async () => {
		vi.mock('vscode', () => ({
			TreeItem: class MockTreeItem {
				constructor(public label: string, public collapsibleState: any) {}
			},
			TreeItemCollapsibleState: {
				None: 0,
				Collapsed: 1,
				Expanded: 2,
			},
		}))

		const { TreeItemAdapter } = await import('../../src/vscode/adapters/TreeItem.adapter.js')
		const vscode: any = await import('vscode')

		const item = TreeItemAdapter.create('test', vscode.TreeItemCollapsibleState.Collapsed)
		expect(item.label).toBe('test')
	})
}) 