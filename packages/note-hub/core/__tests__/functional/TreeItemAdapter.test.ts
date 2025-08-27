import { describe, it, expect } from 'vitest'
import { TreeItemAdapter } from '../../src/adapters/TreeItemAdapter.js'

describe('TreeItemAdapter', () => {
	describe('create', () => {
		it('should create tree item with label and collapsible state', () => {
			const result = TreeItemAdapter.create('Test Item', 'expanded')

			expect(result).toEqual({
				label: 'Test Item',
				collapsibleState: 'expanded',
			})
		})

		it('should handle empty label', () => {
			const result = TreeItemAdapter.create('', 'collapsed')

			expect(result).toEqual({
				label: '',
				collapsibleState: 'collapsed',
			})
		})

		it('should handle null collapsible state', () => {
			const result = TreeItemAdapter.create('Test Item', null)

			expect(result).toEqual({
				label: 'Test Item',
				collapsibleState: null,
			})
		})

		it('should handle undefined collapsible state', () => {
			const result = TreeItemAdapter.create('Test Item', undefined)

			expect(result).toEqual({
				label: 'Test Item',
				collapsibleState: undefined,
			})
		})

		it('should handle special characters in label', () => {
			const result = TreeItemAdapter.create('Test Item with special chars: !@#$%^&*()', 'none')

			expect(result).toEqual({
				label: 'Test Item with special chars: !@#$%^&*()',
				collapsibleState: 'none',
			})
		})

		it('should handle long label', () => {
			const longLabel = 'A'.repeat(1000)
			const result = TreeItemAdapter.create(longLabel, 'expanded')

			expect(result).toEqual({
				label: longLabel,
				collapsibleState: 'expanded',
			})
		})

		it('should handle different collapsible states', () => {
			const states = ['expanded', 'collapsed', 'none']
            
			states.forEach((state) => {
				const result = TreeItemAdapter.create('Test Item', state)

				expect(result).toEqual({
					label: 'Test Item',
					collapsibleState: state,
				})
			})
		})
	})
})
