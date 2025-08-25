import { describe, it, expect } from 'vitest'
import { PathUtilsAdapter } from '../../src/adapters/PathUtilsAdapter.js'
import * as path from 'node:path'

describe('PathUtilsAdapter', () => {
	let adapter: PathUtilsAdapter

	beforeEach(() => {
		adapter = new PathUtilsAdapter()
	})

	describe('sanitizePath', () => {
		it('should normalize path separators', () => {
			const result = adapter.sanitizePath('path/to\\file')

			expect(result).toBe(path.normalize('path/to\\file'))
		})

		it('should handle relative paths', () => {
			const result = adapter.sanitizePath('./path/../file')

			expect(result).toBe(path.normalize('./path/../file'))
		})

		it('should handle absolute paths', () => {
			const result = adapter.sanitizePath('/absolute/path')

			expect(result).toBe(path.normalize('/absolute/path'))
		})
	})

	describe('join', () => {
		it('should join multiple path segments', () => {
			const result = adapter.join('path', 'to', 'file')

			expect(result).toBe(path.join('path', 'to', 'file'))
		})

		it('should handle empty segments', () => {
			const result = adapter.join('path', '', 'file')

			expect(result).toBe(path.join('path', '', 'file'))
		})

		it('should handle single segment', () => {
			const result = adapter.join('file')

			expect(result).toBe(path.join('file'))
		})
	})

	describe('dirname', () => {
		it('should return directory name', () => {
			const result = adapter.dirname('/path/to/file.txt')

			expect(result).toBe(path.dirname('/path/to/file.txt'))
		})

		it('should handle root path', () => {
			const result = adapter.dirname('/file.txt')

			expect(result).toBe(path.dirname('/file.txt'))
		})

		it('should handle relative path', () => {
			const result = adapter.dirname('path/file.txt')

			expect(result).toBe(path.dirname('path/file.txt'))
		})
	})

	describe('basename', () => {
		it('should return file name without extension', () => {
			const result = adapter.basename('/path/to/file.txt')

			expect(result).toBe(path.basename('/path/to/file.txt'))
		})

		it('should return file name with extension removed', () => {
			const result = adapter.basename('/path/to/file.txt', '.txt')

			expect(result).toBe(path.basename('/path/to/file.txt', '.txt'))
		})

		it('should handle path without extension', () => {
			const result = adapter.basename('/path/to/file')

			expect(result).toBe(path.basename('/path/to/file'))
		})
	})

	describe('parse', () => {
		it('should parse path into components', () => {
			const result = adapter.parse('/path/to/file.txt')
			const expected = path.parse('/path/to/file.txt')

			expect(result).toEqual(expected)
		})

		it('should handle relative path', () => {
			const result = adapter.parse('path/file.txt')
			const expected = path.parse('path/file.txt')

			expect(result).toEqual(expected)
		})

		it('should handle path without extension', () => {
			const result = adapter.parse('/path/to/file')
			const expected = path.parse('/path/to/file')

			expect(result).toEqual(expected)
		})
	})

	describe('extname', () => {
		it('should return file extension', () => {
			const result = adapter.extname('/path/to/file.txt')

			expect(result).toBe(path.extname('/path/to/file.txt'))
		})

		it('should return empty string for file without extension', () => {
			const result = adapter.extname('/path/to/file')

			expect(result).toBe(path.extname('/path/to/file'))
		})

		it('should handle hidden files', () => {
			const result = adapter.extname('/path/to/.hidden')

			expect(result).toBe(path.extname('/path/to/.hidden'))
		})
	})
})
