import { describe, it, expect, beforeEach, vi, beforeAll, afterAll } from 'vitest'
import { Buffer } from 'node:buffer'
import { MocklyService } from '../../src/services/Mockly.service.js'

describe('Mockly Node.js Adapters', () => {
	let mockly: MocklyService

	beforeAll(() => {
		vi.useRealTimers()
	})

	afterAll(() => {
		vi.useFakeTimers()
	})

	beforeEach(async () => {
		mockly = new MocklyService()
	})

	describe('Path Adapters', () => {
		describe('join method', () => {
			it('should join paths correctly', () => {
				const result = mockly.node.path.join('path', 'to', 'file')

				expect(result).toBe('path/to/file')
			})

			it('should handle absolute paths', () => {
				const result = mockly.node.path.join('/root', 'path', 'to', 'file')

				expect(result).toBe('/root/path/to/file')
			})

			it('should normalize path separators to forward slashes', () => {
				const result = mockly.node.path.join('path\\to', 'file')

				expect(result).toBe('path/to/file')
			})

			it('should handle empty segments', () => {
				const result = mockly.node.path.join('path', '', 'file')

				expect(result).toBe('path/file')
			})

			it('should handle single segment', () => {
				const result = mockly.node.path.join('file')

				expect(result).toBe('file')
			})
		})

		describe('normalize method', () => {
			it('should normalize paths correctly', () => {
				const result = mockly.node.path.normalize('path/to/../file')

				expect(result).toBe('path/file')
			})

			it('should handle double slashes', () => {
				const result = mockly.node.path.normalize('path//to//file')

				expect(result).toBe('path/to/file')
			})

			it('should normalize path separators to forward slashes', () => {
				const result = mockly.node.path.normalize('path\\to\\file')

				expect(result).toBe('path/to/file')
			})

			it('should handle relative paths', () => {
				const result = mockly.node.path.normalize('./path/to/file')

				expect(result).toBe('path/to/file') // Node.js path.normalize removes leading ./
			})
		})

		describe('dirname method', () => {
			it('should return directory name', () => {
				const result = mockly.node.path.dirname('/path/to/file.txt')

				expect(result).toBe('/path/to')
			})

			it('should handle root directory', () => {
				const result = mockly.node.path.dirname('/file.txt')

				expect(result).toBe('/')
			})

			it('should handle relative paths', () => {
				const result = mockly.node.path.dirname('path/to/file.txt')

				expect(result).toBe('path/to')
			})
		})

		describe('basename method', () => {
			it('should return file name without extension', () => {
				const result = mockly.node.path.basename('/path/to/file.txt')

				expect(result).toBe('file.txt')
			})

			it('should remove extension when specified', () => {
				const result = mockly.node.path.basename('/path/to/file.txt', '.txt')

				expect(result).toBe('file')
			})

			it('should handle paths without extension', () => {
				const result = mockly.node.path.basename('/path/to/file')

				expect(result).toBe('file')
			})
		})

		describe('extname method', () => {
			it('should return file extension', () => {
				const result = mockly.node.path.extname('/path/to/file.txt')

				expect(result).toBe('.txt')
			})

			it('should return empty string for files without extension', () => {
				const result = mockly.node.path.extname('/path/to/file')

				expect(result).toBe('')
			})

			it('should handle hidden files', () => {
				const result = mockly.node.path.extname('/path/to/.hidden')

				expect(result).toBe('')
			})
		})

		describe('parse method', () => {
			it('should parse path correctly', () => {
				const result = mockly.node.path.parse('/path/to/file.txt')

				expect(result).toEqual({
					root: '/',
					dir: '/path/to',
					base: 'file.txt',
					ext: '.txt',
					name: 'file',
				})
			})

			it('should handle relative paths', () => {
				const result = mockly.node.path.parse('path/to/file.txt')

				expect(result.dir).toBe('path/to')
				expect(result.base).toBe('file.txt')
			})
		})
	})

	describe('FS Adapters', () => {
		describe('readFile method', () => {
			it('should read file with default encoding', async () => {
				const fsMock = vi.mocked(await import('node:fs/promises'))

				fsMock.readFile.mockResolvedValue('file content')

				const result = await mockly.node.fs.readFile('/test/file.txt')

				expect(fsMock.readFile).toHaveBeenCalledWith('/test/file.txt', undefined)
				expect(result).toBe('file content')
			})

			it('should read file with specified encoding', async () => {
				const fsMock = vi.mocked(await import('node:fs/promises'))

				fsMock.readFile.mockResolvedValue('file content')

				const result = await mockly.node.fs.readFile('/test/file.txt', 'utf-8')

				expect(fsMock.readFile).toHaveBeenCalledWith('/test/file.txt', 'utf-8')
				expect(result).toBe('file content')
			})

			it('should handle read errors', async () => {
				const fsMock = vi.mocked(await import('node:fs/promises'))
				const error = new Error('File not found')

				fsMock.readFile.mockRejectedValue(error)

				await expect(mockly.node.fs.readFile('/nonexistent/file.txt')).rejects.toThrow('File not found')
			})
		})

		describe('writeFile method', () => {
			it('should write file with string content', async () => {
				const fsMock = vi.mocked(await import('node:fs/promises'))

				fsMock.writeFile.mockResolvedValue(undefined)

				await mockly.node.fs.writeFile('/test/file.txt', 'content')

				expect(fsMock.writeFile).toHaveBeenCalledWith('/test/file.txt', 'content')
			})

			it('should write file with Buffer content', async () => {
				const fsMock = vi.mocked(await import('node:fs/promises'))

				fsMock.writeFile.mockResolvedValue(undefined)

				const buffer = Buffer.from('content')

				await mockly.node.fs.writeFile('/test/file.txt', buffer)

				expect(fsMock.writeFile).toHaveBeenCalledWith('/test/file.txt', buffer)
			})

			it('should handle write errors', async () => {
				const fsMock = vi.mocked(await import('node:fs/promises'))
				const error = new Error('Permission denied')

				fsMock.writeFile.mockRejectedValue(error)

				await expect(mockly.node.fs.writeFile('/protected/file.txt', 'content')).rejects.toThrow('Permission denied')
			})
		})

		describe('access method', () => {
			it('should check file access', async () => {
				const fsMock = vi.mocked(await import('node:fs/promises'))

				fsMock.access.mockResolvedValue(undefined)

				await mockly.node.fs.access('/test/file.txt')

				expect(fsMock.access).toHaveBeenCalledWith('/test/file.txt')
			})

			it('should handle access errors', async () => {
				const fsMock = vi.mocked(await import('node:fs/promises'))
				const error = new Error('Permission denied')

				fsMock.access.mockRejectedValue(error)

				await expect(mockly.node.fs.access('/protected/file.txt')).rejects.toThrow('Permission denied')
			})
		})

		describe('stat method', () => {
			it('should get file stats', async () => {
				const fsMock = vi.mocked(await import('node:fs/promises'))
				const mockStats = {
					isDirectory: () => false,
					isFile: () => true,
					size: 1024,
					birthtime: new Date('2023-01-01T00:00:00Z'),
					mtime: new Date('2023-01-02T00:00:00Z'),
				} as any

				fsMock.stat.mockResolvedValue(mockStats)

				const result = await mockly.node.fs.stat('/test/file.txt')

				expect(fsMock.stat).toHaveBeenCalledWith('/test/file.txt')
				expect(result).toBe(mockStats)
			})

			it('should handle stat errors', async () => {
				const fsMock = vi.mocked(await import('node:fs/promises'))
				const error = new Error('File not found')

				fsMock.stat.mockRejectedValue(error)

				await expect(mockly.node.fs.stat('/nonexistent/file.txt')).rejects.toThrow('File not found')
			})
		})

		describe('readdir method', () => {
			it('should read directory contents', async () => {
				const fsMock = vi.mocked(await import('node:fs/promises'))
				const files = ['file1.txt', 'file2.txt', 'subdir']

				fsMock.readdir.mockResolvedValue(files as any)

				const result = await mockly.node.fs.readdir('/test/directory')

				expect(fsMock.readdir).toHaveBeenCalledWith('/test/directory')
				expect(result).toEqual(files)
			})

			it('should handle readdir errors', async () => {
				const fsMock = vi.mocked(await import('node:fs/promises'))
				const error = new Error('Directory not found')

				fsMock.readdir.mockRejectedValue(error)

				await expect(mockly.node.fs.readdir('/nonexistent/directory')).rejects.toThrow('Directory not found')
			})
		})

		describe('mkdir method', () => {
			it('should create directory', async () => {
				const fsMock = vi.mocked(await import('node:fs/promises'))

				fsMock.mkdir.mockResolvedValue(undefined)

				await mockly.node.fs.mkdir('/test/new-directory')

				expect(fsMock.mkdir).toHaveBeenCalledWith('/test/new-directory', undefined)
			})

			it('should create directory with options', async () => {
				const fsMock = vi.mocked(await import('node:fs/promises'))

				fsMock.mkdir.mockResolvedValue(undefined)

				const options = { recursive: true }

				await mockly.node.fs.mkdir('/test/new-directory', options)

				expect(fsMock.mkdir).toHaveBeenCalledWith('/test/new-directory', options)
			})

			it('should handle mkdir errors', async () => {
				const fsMock = vi.mocked(await import('node:fs/promises'))
				const error = new Error('Directory already exists')

				fsMock.mkdir.mockRejectedValue(error)

				await expect(mockly.node.fs.mkdir('/existing/directory')).rejects.toThrow('Directory already exists')
			})
		})

		describe('rmdir method', () => {
			it('should remove directory', async () => {
				const fsMock = vi.mocked(await import('node:fs/promises'))

				fsMock.rmdir.mockResolvedValue(undefined)

				await mockly.node.fs.rmdir('/test/directory')

				expect(fsMock.rmdir).toHaveBeenCalledWith('/test/directory')
			})

			it('should handle rmdir errors', async () => {
				const fsMock = vi.mocked(await import('node:fs/promises'))
				const error = new Error('Directory not empty')

				fsMock.rmdir.mockRejectedValue(error)

				await expect(mockly.node.fs.rmdir('/non-empty/directory')).rejects.toThrow('Directory not empty')
			})
		})

		describe('unlink method', () => {
			it('should remove file', async () => {
				const fsMock = vi.mocked(await import('node:fs/promises'))

				fsMock.unlink.mockResolvedValue(undefined)

				await mockly.node.fs.unlink('/test/file.txt')

				expect(fsMock.unlink).toHaveBeenCalledWith('/test/file.txt')
			})

			it('should handle unlink errors', async () => {
				const fsMock = vi.mocked(await import('node:fs/promises'))
				const error = new Error('File not found')

				fsMock.unlink.mockRejectedValue(error)

				await expect(mockly.node.fs.unlink('/nonexistent/file.txt')).rejects.toThrow('File not found')
			})
		})

		describe('rename method', () => {
			it('should rename file using Mockly workspace', async () => {
				// Mock the workspace.fs.rename method
				const mockRename = vi.fn().mockResolvedValue(undefined)

				mockly.workspace.fs.rename = mockRename

				await mockly.node.fs.rename('/old/path.txt', '/new/path.txt')

				expect(mockRename).toHaveBeenCalledWith(
					expect.objectContaining({ fsPath: '/old/path.txt' }),
					expect.objectContaining({ fsPath: '/new/path.txt' }),
					{ overwrite: true },
				)
			})

			it('should handle rename errors', async () => {
				const mockRename = vi.fn().mockRejectedValue(new Error('Rename failed'))

				mockly.workspace.fs.rename = mockRename

				await expect(mockly.node.fs.rename('/old/path.txt', '/new/path.txt')).rejects.toThrow('Rename failed')
			})
		})

		describe('copyFile method', () => {
			it('should copy file', async () => {
				const fsMock = vi.mocked(await import('node:fs/promises'))

				fsMock.copyFile.mockResolvedValue(undefined)

				await mockly.node.fs.copyFile('/source/file.txt', '/dest/file.txt')

				expect(fsMock.copyFile).toHaveBeenCalledWith('/source/file.txt', '/dest/file.txt')
			})

			it('should handle copyFile errors', async () => {
				const fsMock = vi.mocked(await import('node:fs/promises'))
				const error = new Error('Source file not found')

				fsMock.copyFile.mockRejectedValue(error)

				await expect(mockly.node.fs.copyFile('/nonexistent/source.txt', '/dest/file.txt')).rejects.toThrow('Source file not found')
			})
		})
	})

	describe('Integration Tests', () => {
		it('should handle complete file lifecycle', async () => {
			const fsMock = vi.mocked(await import('node:fs/promises'))
			
			// Mock all fs operations
			fsMock.writeFile.mockResolvedValue(undefined)
			fsMock.readFile.mockResolvedValue('test content')
			fsMock.stat.mockResolvedValue({
				isDirectory: () => false,
				isFile: () => true,
				size: 12,
				birthtime: new Date('2023-01-01T00:00:00Z'),
				mtime: new Date('2023-01-01T00:00:00Z'),
			} as any)
			fsMock.access.mockResolvedValue(undefined)
			fsMock.copyFile.mockResolvedValue(undefined)

			// Test file operations
			await mockly.node.fs.writeFile('/test/file.txt', 'test content')
			expect(fsMock.writeFile).toHaveBeenCalledWith('/test/file.txt', 'test content')

			const content = await mockly.node.fs.readFile('/test/file.txt')

			expect(content).toBe('test content')

			const stats = await mockly.node.fs.stat('/test/file.txt')

			expect(stats.isFile()).toBe(true)

			await mockly.node.fs.copyFile('/test/file.txt', '/test/copy.txt')
			expect(fsMock.copyFile).toHaveBeenCalledWith('/test/file.txt', '/test/copy.txt')
		})

		it('should handle path operations consistently', () => {
			// Test path operations
			const joinedPath = mockly.node.path.join('path', 'to', 'file.txt')

			expect(joinedPath).toBe('path/to/file.txt')

			const normalizedPath = mockly.node.path.normalize('path//to//file.txt')

			expect(normalizedPath).toBe('path/to/file.txt')

			const dirname = mockly.node.path.dirname('/path/to/file.txt')

			expect(dirname).toBe('/path/to')

			const basename = mockly.node.path.basename('/path/to/file.txt')

			expect(basename).toBe('file.txt')

			const extname = mockly.node.path.extname('/path/to/file.txt')

			expect(extname).toBe('.txt')
		})

		it('should handle error scenarios gracefully', async () => {
			const fsMock = vi.mocked(await import('node:fs/promises'))
			
			// Mock various error conditions
			fsMock.readFile.mockRejectedValue(new Error('Read failed'))
			fsMock.writeFile.mockRejectedValue(new Error('Write failed'))
			fsMock.access.mockRejectedValue(new Error('Access denied'))
			fsMock.stat.mockRejectedValue(new Error('File not found'))

			// Test error handling
			await expect(mockly.node.fs.readFile('/test/file.txt')).rejects.toThrow('Read failed')
			await expect(mockly.node.fs.writeFile('/test/file.txt', 'content')).rejects.toThrow('Write failed')
			await expect(mockly.node.fs.access('/test/file.txt')).rejects.toThrow('Access denied')
			await expect(mockly.node.fs.stat('/test/file.txt')).rejects.toThrow('File not found')
		})
	})

	describe('Reset Functionality', () => {
		it('should reset Mockly service without affecting Node.js adapters', () => {
			// Test that reset doesn't break Node.js adapters
			const originalJoin = mockly.node.path.join
			const originalReadFile = mockly.node.fs.readFile

			mockly.reset()

			// Node.js adapters should still work after reset
			expect(mockly.node.path.join).toBe(originalJoin)
			expect(mockly.node.fs.readFile).toBe(originalReadFile)

			// Test that they still function
			const joinedPath = mockly.node.path.join('path', 'to', 'file')

			expect(joinedPath).toBe('path/to/file')
		})
	})
})
