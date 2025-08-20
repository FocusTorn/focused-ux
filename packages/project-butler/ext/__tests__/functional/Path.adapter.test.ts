import { describe, it, expect, beforeEach } from 'vitest'
import { PathAdapter } from '../../src/adapters/Path.adapter'

describe('PathAdapter', () => {
	let adapter: PathAdapter

	beforeEach(() => {
		adapter = new PathAdapter()
	})

	describe('dirname', () => {
		it('should return directory name from file path', () => {
			// Act
			const result = adapter.dirname('/test/file.txt')

			// Assert
			expect(result).toBe('/test')
		})

		it('should handle root directory', () => {
			// Act
			const result = adapter.dirname('/file.txt')

			// Assert
			expect(result).toBe('/')
		})

		it('should handle current directory', () => {
			// Act
			const result = adapter.dirname('file.txt')

			// Assert
			expect(result).toBe('.')
		})
	})

	describe('basename', () => {
		it('should return file name from path', () => {
			// Act
			const result = adapter.basename('/test/file.txt')

			// Assert
			expect(result).toBe('file.txt')
		})

		it('should handle root file', () => {
			// Act
			const result = adapter.basename('/file.txt')

			// Assert
			expect(result).toBe('file.txt')
		})
	})

	describe('join', () => {
		it('should join multiple path segments', () => {
			// Act
			const result = adapter.join('/test', 'subdir', 'file.txt')

			// Assert - Node.js path.join uses platform-specific separators
			// On Windows: \test\subdir\file.txt, On Unix: /test/subdir/file.txt
			expect(result).toMatch(/[\/\\]test[\/\\]subdir[\/\\]file\.txt/)
		})

		it('should handle single path', () => {
			// Act
			const result = adapter.join('/test')

			// Assert - Node.js path.join normalizes paths using platform-specific separators
			// On Windows: \test, On Unix: /test
			expect(result).toMatch(/[\/\\]test/)
		})
	})
}) 