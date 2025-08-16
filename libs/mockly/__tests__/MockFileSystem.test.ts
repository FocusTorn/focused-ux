import { describe, it, expect, beforeEach } from 'vitest'
import { MockFileSystem } from '../src/_vscCore/MockFileSystem.js'
import { mockly } from '../src/index.js'

describe('MockFileSystem', () => {
	let fileSystem: MockFileSystem
	let mockUri: any

	beforeEach(() => {
		fileSystem = new MockFileSystem()
		mockUri = mockly.Uri.file('/test/path')
	})

	describe('constructor', () => {
		it('should initialize with empty file system', () => {
			expect(fileSystem).toBeInstanceOf(MockFileSystem)
		})
	})

	describe('stat', () => {
		it('should throw error for non-existent files', async () => {
			await expect(fileSystem.stat(mockUri)).rejects.toThrow('File not found: /test/path')
		})

		it('should return file stats for existing files', async () => {
			// Create a file first
			await fileSystem.writeFile(mockUri, new TextEncoder().encode('test content'))
			
			const result = await fileSystem.stat(mockUri)

			expect(result).toBeDefined()
			expect(result?.type).toBe(1) // File
			expect(result?.ctime).toBeDefined()
			expect(result?.mtime).toBeDefined()
			expect(result?.size).toBe(12) // 'test content' length (actual implementation)
		})

		it('should return directory stats for directories', async () => {
			// Create a directory
			await fileSystem.createDirectory(mockUri)
			
			const result = await fileSystem.stat(mockUri)

			expect(result).toBeDefined()
			expect(result?.type).toBe(2) // Directory
		})
	})

	describe('readFile', () => {
		it('should throw error for non-existent files', async () => {
			await expect(fileSystem.readFile(mockUri)).rejects.toThrow('File not found: /test/path')
		})

		it('should return file content for existing files', async () => {
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

			expect(stats?.type).toBe(2)
		})
	})

	describe('readDirectory', () => {
		it('should throw error for non-existent directories', async () => {
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

		it('should delete directory contents recursively', async () => {
			await fileSystem.createDirectory(mockUri)
			await fileSystem.writeFile(mockly.Uri.file('/test/path/file.txt'), 'content')
			
			await fileSystem.delete(mockUri, { recursive: true })
			
			// After deletion, both the file and directory should not exist
			await expect(fileSystem.readFile(mockly.Uri.file('/test/path/file.txt'))).rejects.toThrow('File not found: /test/path/file.txt')
			await expect(fileSystem.stat(mockUri)).rejects.toThrow('File not found: /test/path')
		})
	})

	describe('copy', () => {
		it('should copy file to new location', async () => {
			const sourceUri = mockly.Uri.file('/source/file.txt')
			const targetUri = mockly.Uri.file('/target/file.txt')
			
			await fileSystem.writeFile(sourceUri, 'source content')
			await fileSystem.copy(sourceUri, targetUri)
			
			const sourceContent = await fileSystem.readFile(sourceUri, 'utf8')
			const targetContent = await fileSystem.readFile(targetUri, 'utf8')

			expect(sourceContent).toBe('source content')
			expect(targetContent).toBe('source content')
		})

		it('should overwrite existing target file', async () => {
			const sourceUri = mockly.Uri.file('/source/file.txt')
			const targetUri = mockly.Uri.file('/target/file.txt')
			
			await fileSystem.writeFile(sourceUri, 'source content')
			await fileSystem.writeFile(targetUri, 'old content')
			await fileSystem.copy(sourceUri, targetUri)
		
			const targetContent = await fileSystem.readFile(targetUri, 'utf8')

			expect(targetContent).toBe('source content')
		})

		it('should throw error for non-existent source', async () => {
			const sourceUri = mockly.Uri.file('/source/file.txt')
			const targetUri = mockly.Uri.file('/target/file.txt')
			
			await expect(fileSystem.copy(sourceUri, targetUri)).rejects.toThrow('Source file not found: /source/file.txt')
		})
	})

	describe('rename', () => {
		it('should rename file to new location', async () => {
			const oldUri = mockly.Uri.file('/old/file.txt')
			const newUri = mockly.Uri.file('/new/file.txt')
			
			await fileSystem.writeFile(oldUri, 'file content')
			await fileSystem.rename(oldUri, newUri)
			
			// After rename, the old file should not exist and the new file should have the content
			await expect(fileSystem.readFile(oldUri)).rejects.toThrow('File not found: /old/file.txt')

			const newContent = await fileSystem.readFile(newUri, 'utf8')

			expect(newContent).toBe('file content')
		})

		it('should throw error for non-existent source', async () => {
			const oldUri = mockly.Uri.file('/old/file.txt')
			const newUri = mockly.Uri.file('/new/file.txt')
			
			await expect(fileSystem.rename(oldUri, newUri)).rejects.toThrow('Source file not found: /old/file.txt')
		})
	})

	describe('file system state management', () => {
		it('should maintain separate state for different URIs', async () => {
			const uri1 = mockly.Uri.file('/path1/file.txt')
			const uri2 = mockly.Uri.file('/path2/file.txt')
			
			await fileSystem.writeFile(uri1, 'content1')
			await fileSystem.writeFile(uri2, 'content2')
			
			const content1 = await fileSystem.readFile(uri1, 'utf8')
			const content2 = await fileSystem.readFile(uri2, 'utf8')

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
			const promises = []

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
