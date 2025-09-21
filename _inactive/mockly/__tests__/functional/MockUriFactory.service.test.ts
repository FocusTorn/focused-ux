import { describe, it, expect, beforeEach } from 'vitest'
import { MockUriFactoryService } from '../../src/services/MockUriFactory.service.js'

describe('MockUriFactoryService', () => {
	let service: MockUriFactoryService

	beforeEach(() => {
		service = new MockUriFactoryService()
	})

	describe('file method', () => {
		it('should create a file URI with correct scheme', () => {
			const uri = service.file('/test/path')

			expect(uri.scheme).toBe('file')
		})

		it('should create a file URI with correct path', () => {
			const uri = service.file('/test/path')

			expect(uri.path).toBe('/test/path')
		})

		it('should create a file URI with empty authority', () => {
			const uri = service.file('/test/path')

			expect(uri.authority).toBe('')
		})

		it('should create a file URI with empty query', () => {
			const uri = service.file('/test/path')

			expect(uri.query).toBe('')
		})

		it('should create a file URI with empty fragment', () => {
			const uri = service.file('/test/path')

			expect(uri.fragment).toBe('')
		})

		it('should handle relative paths', () => {
			const uri = service.file('./relative/path')

			expect(uri.path).toBe('./relative/path')
		})

		it('should handle absolute paths', () => {
			const uri = service.file('/absolute/path')

			expect(uri.path).toBe('/absolute/path')
		})
	})

	describe('create method', () => {
		it('should create a URI from object with fsPath', () => {
			const uri = service.create({ fsPath: '/test/path' })

			expect(uri.scheme).toBe('file')
			expect(uri.path).toBe('/test/path')
		})

		it('should create a URI from object with path', () => {
			const uri = service.create({ path: '/test/path' })

			expect(uri.scheme).toBe('file')
			expect(uri.path).toBe('/test/path')
		})

		it('should create a URI from string', () => {
			const uri = service.create('/test/path')

			expect(uri.scheme).toBe('file')
			expect(uri.path).toBe('/test/path')
		})
	})

	describe('joinPath method', () => {
		it('should join paths correctly', () => {
			const baseUri = service.file('/base/path')
			const result = service.joinPath(baseUri, 'subdir', 'file.txt')

			expect(result.path).toBe('/base/path/subdir/file.txt')
		})

		it('should handle single path segment', () => {
			const baseUri = service.file('/base/path')
			const result = service.joinPath(baseUri, 'file.txt')

			expect(result.path).toBe('/base/path/file.txt')
		})

		it('should handle empty path segments', () => {
			const baseUri = service.file('/base/path')
			const result = service.joinPath(baseUri, '', 'file.txt')

			expect(result.path).toBe('/base/path/file.txt')
		})

		it('should normalize multiple slashes', () => {
			const baseUri = service.file('/base/path')
			const result = service.joinPath(baseUri, '//subdir//', '//file.txt')

			expect(result.path).toBe('/base/path/subdir/file.txt')
		})
	})

	describe('dirname method', () => {
		it('should return parent directory', () => {
			const uri = service.file('/path/to/file.txt')
			const result = service.dirname(uri)

			expect(result.path).toBe('/path/to')
		})

		it('should handle root path', () => {
			const uri = service.file('/file.txt')
			const result = service.dirname(uri)

			expect(result.path).toBe('/')
		})

		it('should handle single level path', () => {
			const uri = service.file('file.txt')
			const result = service.dirname(uri)

			expect(result.path).toBe('/')
		})
	})

	describe('fsPath property', () => {
		it('should return path for file URIs', () => {
			const uri = service.file('/test/path')

			expect(uri.fsPath).toBe('/test/path')
		})

		it('should return path for non-file URIs', () => {
			const uri = service.file('/test/path')

			expect(uri.fsPath).toBe('/test/path')
		})
	})

	describe('toString method', () => {
		it('should format file URIs correctly', () => {
			const uri = service.file('/test/path')

			expect(uri.toString()).toBe('file:///test/path')
		})

		it('should handle empty path', () => {
			const uri = service.file('')

			expect(uri.toString()).toBe('file://')
		})

		it('should handle root path', () => {
			const uri = service.file('/')

			expect(uri.toString()).toBe('file:///')
		})
	})

	describe('edge cases', () => {
		it('should handle empty path', () => {
			const uri = service.file('')

			expect(uri.path).toBe('')
			expect(uri.toString()).toBe('file://')
		})

		it('should handle root path', () => {
			const uri = service.file('/')

			expect(uri.path).toBe('/')
			expect(uri.toString()).toBe('file:///')
		})

		it('should handle special characters in path', () => {
			const uri = service.file('/path/with spaces/and-special-chars!@#$%')

			expect(uri.path).toBe('/path/with spaces/and-special-chars!@#$%')
		})
	})
})
