import { describe, it, expect } from 'vitest'
import { ThemeIconAdapter } from '../../src/adapters/ThemeIconAdapter.js'

describe('ThemeIconAdapter', () => {
	describe('create', () => {
		it('should create theme icon with id', () => {
			const result = ThemeIconAdapter.create('file')

			expect(result).toEqual({
				id: 'file',
			})
		})

		it('should handle empty icon id', () => {
			const result = ThemeIconAdapter.create('')

			expect(result).toEqual({
				id: '',
			})
		})

		it('should handle common VSCode icon ids', () => {
			const iconIds = ['file', 'folder', 'document', 'package', 'gear', 'star']
            
			iconIds.forEach((iconId) => {
				const result = ThemeIconAdapter.create(iconId)

				expect(result).toEqual({
					id: iconId,
				})
			})
		})

		it('should handle special characters in icon id', () => {
			const result = ThemeIconAdapter.create('icon-with-special-chars')

			expect(result).toEqual({
				id: 'icon-with-special-chars',
			})
		})

		it('should handle long icon id', () => {
			const longIconId = 'a'.repeat(100)
			const result = ThemeIconAdapter.create(longIconId)

			expect(result).toEqual({
				id: longIconId,
			})
		})

		it('should handle numeric icon id', () => {
			const result = ThemeIconAdapter.create('123')

			expect(result).toEqual({
				id: '123',
			})
		})

		it('should handle icon id with spaces', () => {
			const result = ThemeIconAdapter.create('file icon')

			expect(result).toEqual({
				id: 'file icon',
			})
		})
	})
})
