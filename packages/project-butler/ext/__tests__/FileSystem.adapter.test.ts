import { describe, it, expect, vi, beforeEach } from 'vitest'
import { FileSystemAdapter } from '../src/_adapters/FileSystem.adapter.js'

// Mock Node.js fs module
vi.mock('node:fs/promises', () => ({
	stat: vi.fn(),
	access: vi.fn(),
	copyFile: vi.fn(),
	readFile: vi.fn(),
	writeFile: vi.fn(),
}))

describe('FileSystemAdapter', () => {
	let fileSystemAdapter: FileSystemAdapter
	let mockFs: any

	beforeEach(async () => {
		// Reset all mocks
		vi.clearAllMocks()

		// Get the mocked fs module
		mockFs = await import('node:fs/promises')

		// Create a fresh instance for each test
		fileSystemAdapter = new FileSystemAdapter()
	})

	describe('stat method', () => {
		it('should return correct FileStat for directory', async () => {
			const mockStats = {
				isDirectory: () => true,
				isFile: () => false,
				size: 1024,
				birthtime: new Date('2023-01-01T00:00:00Z'),
				mtime: new Date('2023-01-02T00:00:00Z'),
			}

			vi.mocked(mockFs.stat).mockResolvedValue(mockStats)

			const result = await fileSystemAdapter.stat('/test/directory')

			expect(mockFs.stat).toHaveBeenCalledWith('/test/directory')
			expect(result).toEqual({
				type: 2, // Directory
				size: 1024,
				ctime: 1672531200000, // birthtime timestamp
				mtime: 1672617600000, // mtime timestamp
			})
		})

		it('should return correct FileStat for file', async () => {
			const mockStats = {
				isDirectory: () => false,
				isFile: () => true,
				size: 512,
				birthtime: new Date('2023-01-01T00:00:00Z'),
				mtime: new Date('2023-01-02T00:00:00Z'),
			}

			vi.mocked(mockFs.stat).mockResolvedValue(mockStats)

			const result = await fileSystemAdapter.stat('/test/file.txt')

			expect(mockFs.stat).toHaveBeenCalledWith('/test/file.txt')
			expect(result).toEqual({
				type: 1, // File
				size: 512,
				ctime: 1672531200000, // birthtime timestamp
				mtime: 1672617600000, // mtime timestamp
			})
		})

		it('should handle fs.stat errors', async () => {
			const error = new Error('File not found')

			vi.mocked(mockFs.stat).mockRejectedValue(error)

			await expect(fileSystemAdapter.stat('/nonexistent/path')).rejects.toThrow('File not found')
			expect(mockFs.stat).toHaveBeenCalledWith('/nonexistent/path')
		})
	})

	describe('access method', () => {
		it('should call fs.access with correct path', async () => {
			vi.mocked(mockFs.access).mockResolvedValue(undefined)

			await fileSystemAdapter.access('/test/path')

			expect(mockFs.access).toHaveBeenCalledWith('/test/path')
		})

		it('should handle fs.access errors', async () => {
			const error = new Error('Permission denied')

			vi.mocked(mockFs.access).mockRejectedValue(error)

			await expect(fileSystemAdapter.access('/protected/path')).rejects.toThrow('Permission denied')
			expect(mockFs.access).toHaveBeenCalledWith('/protected/path')
		})
	})

	describe('copyFile method', () => {
		it('should call fs.copyFile with correct parameters', async () => {
			vi.mocked(mockFs.copyFile).mockResolvedValue(undefined)

			await fileSystemAdapter.copyFile('/source/file.txt', '/dest/file.txt')

			expect(mockFs.copyFile).toHaveBeenCalledWith('/source/file.txt', '/dest/file.txt')
		})

		it('should handle fs.copyFile errors', async () => {
			const error = new Error('Copy failed')

			vi.mocked(mockFs.copyFile).mockRejectedValue(error)

			await expect(
				fileSystemAdapter.copyFile('/source/file.txt', '/dest/file.txt'),
			).rejects.toThrow('Copy failed')
			expect(mockFs.copyFile).toHaveBeenCalledWith('/source/file.txt', '/dest/file.txt')
		})
	})

	describe('readFile method', () => {
		it('should call fs.readFile with correct parameters and encoding', async () => {
			const fileContent = 'Hello, World!'

			vi.mocked(mockFs.readFile).mockResolvedValue(fileContent)

			const result = await fileSystemAdapter.readFile('/test/file.txt')

			expect(mockFs.readFile).toHaveBeenCalledWith('/test/file.txt', 'utf-8')
			expect(result).toBe(fileContent)
		})

		it('should handle fs.readFile errors', async () => {
			const error = new Error('Read failed')

			vi.mocked(mockFs.readFile).mockRejectedValue(error)

			await expect(fileSystemAdapter.readFile('/test/file.txt')).rejects.toThrow('Read failed')
			expect(mockFs.readFile).toHaveBeenCalledWith('/test/file.txt', 'utf-8')
		})
	})

	describe('writeFile method', () => {
		it('should call fs.writeFile with correct parameters', async () => {
			const content = new Uint8Array([72, 101, 108, 108, 111]) // "Hello"

			vi.mocked(mockFs.writeFile).mockResolvedValue(undefined)

			await fileSystemAdapter.writeFile('/test/file.txt', content)

			expect(mockFs.writeFile).toHaveBeenCalledWith('/test/file.txt', content)
		})

		it('should handle fs.writeFile errors', async () => {
			const error = new Error('Write failed')
			const content = new Uint8Array([72, 101, 108, 108, 111])

			vi.mocked(mockFs.writeFile).mockRejectedValue(error)

			await expect(
				fileSystemAdapter.writeFile('/test/file.txt', content),
			).rejects.toThrow('Write failed')
			expect(mockFs.writeFile).toHaveBeenCalledWith('/test/file.txt', content)
		})
	})

	describe('FileStat interface compliance', () => {
		it('should return FileStat objects that match VSCode interface', async () => {
			const mockStats = {
				isDirectory: () => true,
				isFile: () => false,
				size: 1024,
				birthtime: new Date('2023-01-01T00:00:00Z'),
				mtime: new Date('2023-01-02T00:00:00Z'),
			}

			vi.mocked(mockFs.stat).mockResolvedValue(mockStats)

			const result = await fileSystemAdapter.stat('/test/directory')

			// Verify the result matches FileStat interface
			expect(result).toMatchObject({
				type: expect.any(Number),
				size: expect.any(Number),
				ctime: expect.any(Number),
				mtime: expect.any(Number),
			})

			// Verify type values are correct
			expect([1, 2]).toContain(result.type) // 1 = File, 2 = Directory
		})

		it('should handle edge cases for file sizes and timestamps', async () => {
			const mockStats = {
				isDirectory: () => false,
				isFile: () => true,
				size: 0, // Empty file
				birthtime: new Date(0), // Unix epoch
				mtime: new Date(0), // Unix epoch
			}

			vi.mocked(mockFs.stat).mockResolvedValue(mockStats)

			const result = await fileSystemAdapter.stat('/test/empty.txt')

			expect(result).toEqual({
				type: 1, // File
				size: 0,
				ctime: 0,
				mtime: 0,
			})
		})
	})
})
