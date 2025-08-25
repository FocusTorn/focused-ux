import { describe, it, expect, vi, beforeEach } from 'vitest'
import { FileSystemAdapter } from '../../src/adapters/FileSystemAdapter.js'
import { Buffer } from 'node:buffer'

import * as fs from 'node:fs/promises'

// Mock fs/promises
vi.mock('node:fs/promises', () => ({
	readFile: vi.fn(),
	writeFile: vi.fn(),
	mkdir: vi.fn(),
	access: vi.fn(),
	stat: vi.fn(),
	readdir: vi.fn(),
	unlink: vi.fn(),
	rename: vi.fn(),
}))

describe('FileSystemAdapter', () => {
	let adapter: FileSystemAdapter

	beforeEach(() => {
		adapter = new FileSystemAdapter()
		vi.clearAllMocks()
	})

	describe('readFile', () => {
		it('should read file and return buffer', async () => {
			const mockBuffer = Buffer.from('test content')

			vi.mocked(fs.readFile).mockResolvedValue(mockBuffer)

			const result = await adapter.readFile('/path/to/file.txt')

			expect(fs.readFile).toHaveBeenCalledWith('/path/to/file.txt')
			expect(result).toBe(mockBuffer)
		})

		it('should handle read errors', async () => {
			const error = new Error('File not found')

			vi.mocked(fs.readFile).mockRejectedValue(error)

			await expect(adapter.readFile('/nonexistent/file.txt')).rejects.toThrow('File not found')
		})
	})

	describe('writeFile', () => {
		it('should write string content to file', async () => {
			vi.mocked(fs.writeFile).mockResolvedValue(undefined)

			await adapter.writeFile('/path/to/file.txt', 'test content')

			expect(fs.writeFile).toHaveBeenCalledWith('/path/to/file.txt', 'test content')
		})

		it('should write buffer content to file', async () => {
			const buffer = Buffer.from('test content')

			vi.mocked(fs.writeFile).mockResolvedValue(undefined)

			await adapter.writeFile('/path/to/file.txt', buffer)

			expect(fs.writeFile).toHaveBeenCalledWith('/path/to/file.txt', buffer)
		})
	})

	describe('mkdir', () => {
		it('should create directory without options', async () => {
			vi.mocked(fs.mkdir).mockResolvedValue(undefined)

			await adapter.mkdir('/path/to/directory')

			expect(fs.mkdir).toHaveBeenCalledWith('/path/to/directory', undefined)
		})

		it('should create directory with recursive option', async () => {
			vi.mocked(fs.mkdir).mockResolvedValue(undefined)

			await adapter.mkdir('/path/to/directory', { recursive: true })

			expect(fs.mkdir).toHaveBeenCalledWith('/path/to/directory', { recursive: true })
		})
	})

	describe('createDirectory', () => {
		it('should create directory with recursive option', async () => {
			vi.mocked(fs.mkdir).mockResolvedValue(undefined)

			await adapter.createDirectory('/path/to/directory')

			expect(fs.mkdir).toHaveBeenCalledWith('/path/to/directory', { recursive: true })
		})
	})

	describe('access', () => {
		it('should check file access', async () => {
			vi.mocked(fs.access).mockResolvedValue(undefined)

			await adapter.access('/path/to/file.txt')

			expect(fs.access).toHaveBeenCalledWith('/path/to/file.txt')
		})

		it('should handle access errors', async () => {
			const error = new Error('Permission denied')

			vi.mocked(fs.access).mockRejectedValue(error)

			await expect(adapter.access('/restricted/file.txt')).rejects.toThrow('Permission denied')
		})
	})

	describe('stat', () => {
		it('should get file stats', async () => {
			const mockStats = {
				isFile: () => true,
				isDirectory: () => false,
				size: 1024,
			}

			vi.mocked(fs.stat).mockResolvedValue(mockStats as any)

			const result = await adapter.stat('/path/to/file.txt')

			expect(fs.stat).toHaveBeenCalledWith('/path/to/file.txt')
			expect(result).toBe(mockStats)
		})
	})

	describe('readdir', () => {
		it('should read directory contents', async () => {
			const mockFiles = ['file1.txt', 'file2.txt', 'subdir']

			vi.mocked(fs.readdir).mockResolvedValue(mockFiles)

			const result = await adapter.readdir('/path/to/directory')

			expect(fs.readdir).toHaveBeenCalledWith('/path/to/directory')
			expect(result).toEqual(mockFiles)
		})
	})

	describe('unlink', () => {
		it('should delete file', async () => {
			vi.mocked(fs.unlink).mockResolvedValue(undefined)

			await adapter.unlink('/path/to/file.txt')

			expect(fs.unlink).toHaveBeenCalledWith('/path/to/file.txt')
		})
	})

	describe('rename', () => {
		it('should rename file', async () => {
			vi.mocked(fs.rename).mockResolvedValue(undefined)

			await adapter.rename('/old/path/file.txt', '/new/path/file.txt')

			expect(fs.rename).toHaveBeenCalledWith('/old/path/file.txt', '/new/path/file.txt')
		})
	})
})
