import { describe, it, expect, vi, beforeEach } from 'vitest'

describe('Path Utils Coverage Tests', () => {
	beforeEach(() => {
		vi.resetModules()
	})

	it('should handle path utils adapter branches', async () => {
		const { PathUtilsAdapter } = await import('../../src/vscode/adapters/PathUtils.adapter.js')

		// Create instance and test various path operations
		const pathUtils = new PathUtilsAdapter()
		const result1 = pathUtils.getDottedPath('/a/b/c', '/a/b/d/file.txt')
		const result2 = pathUtils.sanitizePath('test<path>')
		const result3 = pathUtils.sanitizePath('valid/path')
		const result4 = pathUtils.sanitizePath('')

		expect(result1).toBe('../c')
		expect(result2).toBe('test_path_')
		expect(result3).toBe('valid/path')
		expect(result4).toBe('')
	})
}) 