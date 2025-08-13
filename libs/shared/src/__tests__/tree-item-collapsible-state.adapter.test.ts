import { describe, it, expect, vi } from 'vitest'

describe('TreeItemCollapsibleStateAdapter', () => {
	it('maps to vscode enum values', async () => {
		vi.resetModules()
		vi.mock('vscode', () => ({ TreeItemCollapsibleState: { None: 0, Collapsed: 1, Expanded: 2 } }))

		const { TreeItemCollapsibleStateAdapter } = await import('../vscode/adapters/TreeItemCollapsibleState.adapter.js')
		const a = new TreeItemCollapsibleStateAdapter()

		expect(a.None).toBe(0)
		expect(a.Collapsed).toBe(1)
		expect(a.Expanded).toBe(2)
	})
})
