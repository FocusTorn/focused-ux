import { describe, it, expect, beforeEach } from 'vitest'
import { Buffer } from 'node:buffer'
import { mockly } from '../../src/index.js'

describe('MockFileSystem', () => {
	let fileSystem: any
	let mockUri: any

	beforeEach(() => {
		fileSystem = mockly.workspace.fs
		mockUri = mockly.Uri.file('/test/path')
	})

	describe('readFile', () => {
		it('should read existing file content', async () => {
			const content = 'test file content'

			await fileSystem.writeFile(mockUri, content)
			
			const result = await fileSystem.readFile(mockUri, 'utf8')

			expect(result).toBe(content)
		})

		it('should handle different content types', async () => {
			const buffer = Buffer.from('test buffer content')

			await fileSystem.writeFile(mockUri, buffer)
			
			const result = await fileSystem.readFile(mockUri)

			expect(result).toEqual(buffer)
		})
	})

	describe('writeFile', () => {
		it('should create new file with content', async () => {
			const content = 'new file content'

			await fileSystem.writeFile(mockUri, content)
			
			const result = await fileSystem.readFile(mockUri, 'utf8')

			expect(result).toBe(content)
		})

		it('should overwrite existing file', async () => {
			const initialContent = 'initial content'
			const newContent = 'new content'
			
			await fileSystem.writeFile(mockUri, initialContent)
			await fileSystem.writeFile(mockUri, newContent)
			
			const result = await fileSystem.readFile(mockUri, 'utf8')

			expect(result).toBe(newContent)
		})

		it('should handle Buffer content', async () => {
			const buffer = Buffer.from('buffer content')

			await fileSystem.writeFile(mockUri, buffer)
			
			const result = await fileSystem.readFile(mockUri)

			expect(result).toEqual(buffer)
		})

		it('should update file stats after write', async () => {
			await fileSystem.writeFile(mockUri, 'content')
			
			const stats = await fileSystem.stat(mockUri)

			expect(stats?.size).toBe(7)
			expect(stats?.type).toBe(1) // File
		})
	})

	describe('createDirectory', () => {
		it('should create new directory', async () => {
			await fileSystem.createDirectory(mockUri)
			
			const stats = await fileSystem.stat(mockUri)

			expect(stats?.type).toBe(2) // Directory
		})

		it('should handle existing directory gracefully', async () => {
			await fileSystem.createDirectory(mockUri)
			await fileSystem.createDirectory(mockUri) // Should not throw
			
			const stats = await fileSystem.stat(mockUri)

			expect(stats?.type).toBe(2)
		})

		it('should create parent directories as needed', async () => {
			const deepPath = mockly.Uri.file('/deep/nested/directory')

			await fileSystem.createDirectory(deepPath)
			
			const stats = await fileSystem.stat(deepPath)

			expect(stats?.type).toBe(2) // Directory
		})
	})

	describe('readDirectory', () => {
		it('should return empty array for non-existent paths', async () => {
			// MockFileSystem returns empty array for non-existent paths, not an error
			const result = await fileSystem.readDirectory(mockUri)

			expect(result).toEqual([])
		})

		it('should throw error for existing files (not directories)', async () => {
			// Create a file first
			await fileSystem.writeFile(mockUri, 'content')
			
			// readDirectory should throw for files
			await expect(fileSystem.readDirectory(mockUri)).rejects.toThrow('Directory not found: /test/path')
		})

		it('should return directory contents', async () => {
			await fileSystem.createDirectory(mockUri)
			await fileSystem.writeFile(mockly.Uri.file('/test/path/file1.txt'), 'content1')
			await fileSystem.writeFile(mockly.Uri.file('/test/path/file2.txt'), 'content2')
			
			const result = await fileSystem.readDirectory(mockUri)

			expect(result).toEqual(expect.arrayContaining([
				['file1.txt', 1],
				['file2.txt', 1],
			]))
		})

		it('should include subdirectories', async () => {
			await fileSystem.createDirectory(mockUri)
			await fileSystem.createDirectory(mockly.Uri.file('/test/path/subdir'))
			
			const result = await fileSystem.readDirectory(mockUri)

			expect(result).toEqual(expect.arrayContaining([['subdir', 2]]))
		})
	})

	describe('delete', () => {
		it('should delete existing file', async () => {
			await fileSystem.writeFile(mockUri, 'content')
			await fileSystem.delete(mockUri)
			
			// After deletion, readFile should throw an error because the file doesn't exist
			await expect(fileSystem.readFile(mockUri)).rejects.toThrow('File not found: /test/path')
		})

		it('should delete existing directory', async () => {
			await fileSystem.createDirectory(mockUri)
			await fileSystem.delete(mockUri)
			
			// After deletion, stat should throw an error because the directory doesn't exist
			await expect(fileSystem.stat(mockUri)).rejects.toThrow('File not found: /test/path')
		})

		it('should throw error for non-existent paths', async () => {
			await expect(fileSystem.delete(mockUri)).rejects.toThrow('File not found: /test/path')
		})
	})

	describe('stat', () => {
		it('should return file stats', async () => {
			await fileSystem.writeFile(mockUri, 'content')
			
			const stats = await fileSystem.stat(mockUri)

			expect(stats?.size).toBe(7)
			expect(stats?.type).toBe(1) // File
		})

		it('should return directory stats', async () => {
			await fileSystem.createDirectory(mockUri)
			
			const stats = await fileSystem.stat(mockUri)

			expect(stats?.type).toBe(2) // Directory
		})

		it('should throw error for non-existent paths', async () => {
			// Use a different path that hasn't been created by other tests
			const nonExistentUri = mockly.Uri.file('/non/existent/path')
			
			await expect(fileSystem.stat(nonExistentUri)).rejects.toThrow('File not found: /non/existent/path')
		})
	})

	describe('copy', () => {
		it('should copy file to new location', async () => {
			const sourceUri = mockly.Uri.file('/source/file.txt')
			const destUri = mockly.Uri.file('/dest/file.txt')
			const content = 'source content'

			await fileSystem.writeFile(sourceUri, content)
			await fileSystem.copy(sourceUri, destUri)
			
			const copiedContent = await fileSystem.readFile(destUri, 'utf8')

			expect(copiedContent).toBe(content)
		})

		it('should copy directory (but not recursively)', async () => {
			const sourceDir = mockly.Uri.file('/source/dir')
			const destDir = mockly.Uri.file('/dest/dir')
			const sourceFile = mockly.Uri.file('/source/dir/file.txt')
			const content = 'file content'

			await fileSystem.createDirectory(sourceDir)
			await fileSystem.writeFile(sourceFile, content)
			await fileSystem.copy(sourceDir, destDir)
			
			// MockFileSystem only copies the top-level directory, not nested files
			// So we expect the directory to exist but not the nested file
			const destStats = await fileSystem.stat(destDir)

			expect(destStats.type).toBe(2) // Directory
			
			// The nested file should not exist in the destination
			await expect(fileSystem.readFile(mockly.Uri.file('/dest/dir/file.txt'))).rejects.toThrow()
		})
	})

	describe('rename', () => {
		it('should rename file', async () => {
			const oldUri = mockly.Uri.file('/old/file.txt')
			const newUri = mockly.Uri.file('/new/file.txt')
			const content = 'file content'

			await fileSystem.writeFile(oldUri, content)
			await fileSystem.rename(oldUri, newUri)
			
			const renamedContent = await fileSystem.readFile(newUri, 'utf8')

			// Check that old file doesn't exist by trying to read it
			await expect(fileSystem.readFile(oldUri)).rejects.toThrow()

			expect(renamedContent).toBe(content)
		})

		it('should rename directory (but not recursively)', async () => {
			const oldDir = mockly.Uri.file('/old/dir')
			const newDir = mockly.Uri.file('/new/dir')
			const oldFile = mockly.Uri.file('/old/dir/file.txt')
			const content = 'file content'

			await fileSystem.createDirectory(oldDir)
			await fileSystem.writeFile(oldFile, content)
			await fileSystem.rename(oldDir, newDir)
			
			// MockFileSystem only moves the top-level directory, not nested files
			// So we expect the new directory to exist but not the nested file
			const newDirStats = await fileSystem.stat(newDir)

			expect(newDirStats.type).toBe(2) // Directory
			
			// The nested file should not exist in the new location
			await expect(fileSystem.readFile(mockly.Uri.file('/new/dir/file.txt'))).rejects.toThrow()
		})
	})

	describe('integration tests', () => {
		it('should handle multiple file operations', async () => {
			const file1 = mockly.Uri.file('/test/file1.txt')
			const file2 = mockly.Uri.file('/test/file2.txt')

			await fileSystem.writeFile(file1, 'content1')
			await fileSystem.writeFile(file2, 'content2')
			
			const content1 = await fileSystem.readFile(file1, 'utf8')
			const content2 = await fileSystem.readFile(file2, 'utf8')

			expect(content1).toBe('content1')
			expect(content2).toBe('content2')
		})

		it('should handle complex directory structures', async () => {
			const rootDir = mockly.Uri.file('/project')
			const srcDir = mockly.Uri.file('/project/src')
			const testDir = mockly.Uri.file('/project/test')
			const srcFile = mockly.Uri.file('/project/src/main.ts')
			const testFile = mockly.Uri.file('/project/test/main.test.ts')
			
			await fileSystem.createDirectory(rootDir)
			await fileSystem.createDirectory(srcDir)
			await fileSystem.createDirectory(testDir)
			await fileSystem.writeFile(srcFile, 'export function main() {}')
			await fileSystem.writeFile(testFile, 'describe("main", () => {})')
			
			const rootContents = await fileSystem.readDirectory(rootDir)
			const srcContents = await fileSystem.readDirectory(srcDir)
			const testContents = await fileSystem.readDirectory(testDir)
			
			expect(rootContents).toEqual(expect.arrayContaining([
				['src', 2],
				['test', 2],
			]))
			expect(srcContents).toEqual(expect.arrayContaining([['main.ts', 1]]))
			expect(testContents).toEqual(expect.arrayContaining([['main.test.ts', 1]]))
		})
	})

	describe('edge cases', () => {
		it('should handle empty file content', async () => {
			await fileSystem.writeFile(mockUri, '')

			const result = await fileSystem.readFile(mockUri, 'utf8')

			expect(result).toBe('')
		})

		it('should handle very long file content', async () => {
			const longContent = 'x'.repeat(10000)

			await fileSystem.writeFile(mockUri, longContent)
			
			const result = await fileSystem.readFile(mockUri, 'utf8')

			expect(result).toBe(longContent)
		})

		it('should handle special characters in file names', async () => {
			const specialUri = mockly.Uri.file('/test/path/file with spaces!@#$%.txt')

			await fileSystem.writeFile(specialUri, 'special content')

			const result = await fileSystem.readFile(specialUri, 'utf8')

			expect(result).toBe('special content')
		})

		it('should handle root path operations', async () => {
			const rootUri = mockly.Uri.file('/')

			await fileSystem.createDirectory(rootUri)
			
			const stats = await fileSystem.stat(rootUri)

			expect(stats?.type).toBe(2) // Directory
		})
	})

	describe('error handling', () => {
		it('should handle invalid URI gracefully', async () => {
			const invalidUri = {} as any
			
			await expect(fileSystem.readFile(invalidUri)).rejects.toThrow()
			await expect(fileSystem.writeFile(invalidUri, 'content')).rejects.toThrow()
			await expect(fileSystem.stat(invalidUri)).rejects.toThrow()
		})

		it('should handle concurrent operations', async () => {
			const promises: Promise<void>[] = []

			for (let i = 0; i < 10; i++) {
				const uri = mockly.Uri.file(`/test/file${i}.txt`)

				promises.push(fileSystem.writeFile(uri, `content${i}`))
			}
			
			await Promise.all(promises)
			
			for (let i = 0; i < 10; i++) {
				const uri = mockly.Uri.file(`/test/file${i}.txt`)
				const content = await fileSystem.readFile(uri, 'utf8')

				expect(content).toBe(`content${i}`)
			}
		})
	})
})
