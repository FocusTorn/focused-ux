import { describe, it, expect } from 'vitest'
import { RelativePatternAdapter } from '../../src/adapters/RelativePatternAdapter.js'

describe('RelativePatternAdapter', () => {
	describe('create', () => {
		it('should create relative pattern with base and pattern', () => {
			const result = RelativePatternAdapter.create('/workspace', '**/*.md')

			expect(result).toEqual({
				base: '/workspace',
				pattern: '**/*.md',
			})
		})

		it('should handle empty base path', () => {
			const result = RelativePatternAdapter.create('', '**/*.ts')

			expect(result).toEqual({
				base: '',
				pattern: '**/*.ts',
			})
		})

		it('should handle empty pattern', () => {
			const result = RelativePatternAdapter.create('/workspace', '')

			expect(result).toEqual({
				base: '/workspace',
				pattern: '',
			})
		})

		it('should handle complex patterns', () => {
			const result = RelativePatternAdapter.create('/workspace/src', '{**/*.ts,**/*.js}')

			expect(result).toEqual({
				base: '/workspace/src',
				pattern: '{**/*.ts,**/*.js}',
			})
		})

		it('should handle relative base paths', () => {
			const result = RelativePatternAdapter.create('./src', '**/*.json')

			expect(result).toEqual({
				base: './src',
				pattern: '**/*.json',
			})
		})

		it('should handle Windows-style paths', () => {
			const result = RelativePatternAdapter.create('C:\\workspace', '**\\*.md')

			expect(result).toEqual({
				base: 'C:\\workspace',
				pattern: '**\\*.md',
			})
		})
	})
})
