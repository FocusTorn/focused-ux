import { describe, it, expect } from 'vitest'
import { TreeItemCollapsibleStateAdapter } from '../../src/adapters/TreeItemCollapsibleStateAdapter.js'

describe('TreeItemCollapsibleStateAdapter', () => {
	let adapter: TreeItemCollapsibleStateAdapter

	beforeEach(() => {
		adapter = new TreeItemCollapsibleStateAdapter()
	})

	describe('collapsible state values', () => {
		it('should have correct None value', () => {
			expect(adapter.None).toBe(0)
		})

		it('should have correct Collapsed value', () => {
			expect(adapter.Collapsed).toBe(1)
		})

		it('should have correct Expanded value', () => {
			expect(adapter.Expanded).toBe(2)
		})

		it('should have all required collapsible states', () => {
			expect(adapter).toHaveProperty('None')
			expect(adapter).toHaveProperty('Collapsed')
			expect(adapter).toHaveProperty('Expanded')
		})

		it('should have unique values for each state', () => {
			const values = [adapter.None, adapter.Collapsed, adapter.Expanded]
			const uniqueValues = new Set(values)
            
			expect(uniqueValues.size).toBe(3)
		})

		it('should have values in correct order', () => {
			expect(adapter.None).toBeLessThan(adapter.Collapsed)
			expect(adapter.Collapsed).toBeLessThan(adapter.Expanded)
		})
	})

	describe('usage scenarios', () => {
		it('should work with tree item creation', () => {
			const treeItem = {
				label: 'Test Item',
				collapsibleState: adapter.Expanded,
			}

			expect(treeItem.collapsibleState).toBe(2)
		})

		it('should work with conditional logic', () => {
			const state = adapter.Collapsed
            
			if (state === adapter.None) {
				expect(true).toBe(false) // Should not reach here
			}
			else if (state === adapter.Collapsed) {
				expect(true).toBe(true) // Should reach here
			}
			else if (state === adapter.Expanded) {
				expect(true).toBe(false) // Should not reach here
			}
		})

		it('should work with array operations', () => {
			const states = [adapter.None, adapter.Collapsed, adapter.Expanded]
            
			expect(states).toEqual([0, 1, 2])
			expect(states.includes(adapter.Collapsed)).toBe(true)
		})
	})
})
