import { describe, it, expect, beforeEach } from 'vitest'
import { TerminalManagementService } from '../../src/services/TerminalManagement.service'
import { 
	setupTestEnvironment, 
	resetAllMocks, 
	setupFileSystemMocks, 
	setupPathMocks,
	setupTerminalDirectoryScenario,
	setupTerminalFileScenario,
	setupTerminalErrorScenario
} from '../_setup'

describe('TerminalManagementService', () => {
	let service: TerminalManagementService
	let mocks: ReturnType<typeof setupTestEnvironment>

	beforeEach(() => {
		mocks = setupTestEnvironment()
		setupFileSystemMocks(mocks)
		setupPathMocks(mocks)
		
		service = new TerminalManagementService(mocks.fileSystem, mocks.path)
		resetAllMocks(mocks)
	})

	describe('updateTerminalPath', () => {
		it('should return CD command for directory', async () => {
			// Arrange
			const filePath = '/test/directory'
			const expectedCommand = `cd "${filePath}"`

			setupTerminalDirectoryScenario(mocks, { path: filePath, expectedCommand })

			// Act
			const result = await service.updateTerminalPath(filePath)

			// Assert
			expect(result.command).toBe(expectedCommand)
			expect(result.shouldShowTerminal).toBe(true)
			expect(mocks.fileSystem.stat).toHaveBeenCalledWith(filePath)
		})

		it('should return CD command for file (using directory)', async () => {
			// Arrange
			const filePath = '/test/file.txt'
			const directoryPath = '/test'
			const expectedCommand = `cd "${directoryPath}"`
			
			setupTerminalFileScenario(mocks, { path: filePath, expectedCommand, directoryPath })

			// Act
			const result = await service.updateTerminalPath(filePath)

			// Assert
			expect(result.command).toBe(expectedCommand)
			expect(result.shouldShowTerminal).toBe(true)
			expect(mocks.fileSystem.stat).toHaveBeenCalledWith(filePath)
			expect(mocks.path.dirname).toHaveBeenCalledWith(filePath)
		})

		it('should handle file system errors', async () => {
			// Arrange
			const filePath = '/test/file.txt'

			setupTerminalErrorScenario(mocks, { path: filePath, expectedCommand: '' }, 'File system error')

			// Act & Assert
			await expect(service.updateTerminalPath(filePath))
				.rejects
				.toThrow('File system error')
		})
	})

	describe('Complex Path Scenarios', () => {
		it('should handle deeply nested directory paths', async () => {
			// Arrange
			const deepPath = '/very/deep/nested/directory/structure/with/many/levels'
			const expectedCommand = 'cd "/very/deep/nested/directory/structure/with/many/levels"'
			
			setupTerminalDirectoryScenario(mocks, { path: deepPath, expectedCommand })

			// Act
			const result = await service.updateTerminalPath(deepPath)

			// Assert
			expect(result.command).toBe(expectedCommand)
			expect(result.shouldShowTerminal).toBe(true)
			expect(mocks.fileSystem.stat).toHaveBeenCalledWith(deepPath)
		})

		it('should handle paths with special characters', async () => {
			// Arrange
			const specialPath = '/path with spaces/and-special_chars@#$.txt'
			const directoryPath = '/path with spaces'
			const expectedCommand = 'cd "/path with spaces"'
			
			setupTerminalFileScenario(mocks, { path: specialPath, expectedCommand, directoryPath })

			// Act
			const result = await service.updateTerminalPath(specialPath)

			// Assert
			expect(result.command).toBe(expectedCommand)
			expect(result.shouldShowTerminal).toBe(true)
			expect(mocks.fileSystem.stat).toHaveBeenCalledWith(specialPath)
			expect(mocks.path.dirname).toHaveBeenCalledWith(specialPath)
		})

		it('should handle very long file paths', async () => {
			// Arrange
			const longPath = '/very/long/path/' + 'a'.repeat(200) + '/file.txt'
			const directoryPath = '/very/long/path/' + 'a'.repeat(200)
			const expectedCommand = `cd "${directoryPath}"`
			
			setupTerminalFileScenario(mocks, { path: longPath, expectedCommand, directoryPath })

			// Act
			const result = await service.updateTerminalPath(longPath)

			// Assert
			expect(result.command).toBe(expectedCommand)
			expect(result.shouldShowTerminal).toBe(true)
		})

		it('should handle Unicode characters in paths', async () => {
			// Arrange
			const unicodePath = '/café/naïve/文件.txt'
			const directoryPath = '/café/naïve'
			const expectedCommand = 'cd "/café/naïve"'
			
			setupTerminalFileScenario(mocks, { path: unicodePath, expectedCommand, directoryPath })

			// Act
			const result = await service.updateTerminalPath(unicodePath)

			// Assert
			expect(result.command).toBe(expectedCommand)
			expect(result.shouldShowTerminal).toBe(true)
		})
	})

	describe('Cross-Platform Compatibility', () => {
		it('should handle Windows-style paths', async () => {
			// Arrange
			const windowsPath = 'C:\\Users\\John\\Documents\\Project\\file.txt'
			const directoryPath = 'C:\\Users\\John\\Documents\\Project'
			const expectedCommand = 'cd "C:\\Users\\John\\Documents\\Project"'
			
			setupTerminalFileScenario(mocks, { path: windowsPath, expectedCommand, directoryPath })

			// Act
			const result = await service.updateTerminalPath(windowsPath)

			// Assert
			expect(result.command).toBe(expectedCommand)
			expect(result.shouldShowTerminal).toBe(true)
		})

		it('should handle Unix-style paths', async () => {
			// Arrange
			const unixPath = '/home/user/project/file.txt'
			const directoryPath = '/home/user/project'
			const expectedCommand = 'cd "/home/user/project"'
			
			setupTerminalFileScenario(mocks, { path: unixPath, expectedCommand, directoryPath })

			// Act
			const result = await service.updateTerminalPath(unixPath)

			// Assert
			expect(result.command).toBe(expectedCommand)
			expect(result.shouldShowTerminal).toBe(true)
		})

		it('should handle network paths', async () => {
			// Arrange
			const networkPath = '\\\\server\\share\\project\\file.txt'
			const directoryPath = '\\\\server\\share\\project'
			const expectedCommand = 'cd "\\\\server\\share\\project"'
			
			setupTerminalFileScenario(mocks, { path: networkPath, expectedCommand, directoryPath })

			// Act
			const result = await service.updateTerminalPath(networkPath)

			// Assert
			expect(result.command).toBe(expectedCommand)
			expect(result.shouldShowTerminal).toBe(true)
		})
	})

	describe('Edge Cases and Error Scenarios', () => {
		it('should handle permission denied errors', async () => {
			// Arrange
			const protectedPath = '/protected/directory'

			setupTerminalErrorScenario(mocks, { path: protectedPath, expectedCommand: '' }, 'Permission denied')

			// Act & Assert
			await expect(service.updateTerminalPath(protectedPath))
				.rejects.toThrow('Permission denied')
		})

		it('should handle non-existent paths', async () => {
			// Arrange
			const nonExistentPath = '/non/existent/path'

			setupTerminalErrorScenario(mocks, { path: nonExistentPath, expectedCommand: '' }, 'ENOENT: no such file or directory')

			// Act & Assert
			await expect(service.updateTerminalPath(nonExistentPath))
				.rejects.toThrow('ENOENT: no such file or directory')
		})

		it('should handle file system corruption errors', async () => {
			// Arrange
			const corruptedPath = '/corrupted/path'

			setupTerminalErrorScenario(mocks, { path: corruptedPath, expectedCommand: '' }, 'File system corruption detected')

			// Act & Assert
			await expect(service.updateTerminalPath(corruptedPath))
				.rejects.toThrow('File system corruption detected')
		})
	})

	describe('Performance Scenarios', () => {
		it('should handle large directory structures efficiently', async () => {
			// Arrange
			const largePath = '/large/project/with/many/subdirectories'
			const expectedCommand = 'cd "/large/project/with/many/subdirectories"'
			
			setupTerminalDirectoryScenario(mocks, { path: largePath, expectedCommand })

			// Act
			const startTime = Date.now()
			const result = await service.updateTerminalPath(largePath)
			const endTime = Date.now()

			// Assert
			expect(result.command).toBe(expectedCommand)
			expect(endTime - startTime).toBeLessThan(100) // Should be fast with mocks
		})

		it('should handle concurrent operations', async () => {
			// Arrange
			const paths = ['/path1', '/path2', '/path3']
			const expectedCommands = ['cd "/path1"', 'cd "/path2"', 'cd "/path3"']
			
			paths.forEach((path, index) => {
				setupTerminalDirectoryScenario(mocks, { path, expectedCommand: expectedCommands[index] })
			})

			// Act
			const results = await Promise.all(
				paths.map(path => service.updateTerminalPath(path))
			)

			// Assert
			expect(results).toHaveLength(3)
			results.forEach((result, index) => {
				expect(result.command).toBe(expectedCommands[index])
				expect(result.shouldShowTerminal).toBe(true)
			})
		})
	})
})
