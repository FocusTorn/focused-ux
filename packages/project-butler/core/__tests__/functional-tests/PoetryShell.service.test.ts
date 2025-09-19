import { describe, it, expect, beforeEach } from 'vitest'
import { PoetryShellService } from '../../src/services/PoetryShell.service'
import {
    setupTestEnvironment,
    resetAllMocks,
    setupFileSystemMocks,
    setupPathMocks,
    setupPoetryShellSuccessScenario,
    setupPoetryShellErrorScenario
} from '../_setup'

describe('PoetryShellService', () => {
    let service: PoetryShellService
    let mocks: ReturnType<typeof setupTestEnvironment>

    beforeEach(() => {
        mocks = setupTestEnvironment()
        setupFileSystemMocks(mocks)
        setupPathMocks(mocks)
		
        service = new PoetryShellService(mocks.fileSystem, mocks.path)
        resetAllMocks(mocks)
    })

    describe('enterPoetryShell', () => {
        it('should return poetry shell command for directory', async () => {
            // Arrange
            const filePath = '/test/directory'

            setupPoetryShellSuccessScenario(mocks, filePath)

            // Act
            const result = await service.enterPoetryShell(filePath)

            // Assert
            expect(result.command).toBe(`cd "${filePath}" && poetry shell`)
            expect(result.shouldShowTerminal).toBe(true)
            expect(mocks.fileSystem.stat).toHaveBeenCalledWith(filePath)
        })

        it('should return poetry shell command for file (using directory)', async () => {
            // Arrange
            const filePath = '/test/file.txt'
            const directoryPath = '/test'
			
            mocks.fileSystem.stat.mockResolvedValue({ type: 'file' })
            mocks.path.dirname.mockReturnValue(directoryPath)

            // Act
            const result = await service.enterPoetryShell(filePath)

            // Assert
            expect(result.command).toBe(`cd "${directoryPath}" && poetry shell`)
            expect(result.shouldShowTerminal).toBe(true)
            expect(mocks.fileSystem.stat).toHaveBeenCalledWith(filePath)
            expect(mocks.path.dirname).toHaveBeenCalledWith(filePath)
        })

        it('should return simple poetry shell command when no path provided', async () => {
            // Act
            const result = await service.enterPoetryShell()

            // Assert
            expect(result.command).toBe('poetry shell')
            expect(result.shouldShowTerminal).toBe(true)
        })

        it('should handle file system errors', async () => {
            // Arrange
            const filePath = '/test/file.txt'

            setupPoetryShellErrorScenario(mocks, filePath, 'File system error')

            // Act & Assert
            await expect(service.enterPoetryShell(filePath))
                .rejects
                .toThrow('File system error')
        })
    })

    describe('Complex Poetry Shell Scenarios', () => {
        it('should handle deeply nested directory paths', async () => {
            // Arrange
            const deepPath = '/very/deep/nested/directory/structure/with/many/levels'
            const expectedCommand = `cd "${deepPath}" && poetry shell`
			
            mocks.fileSystem.stat.mockResolvedValue({ type: 'directory' })

            // Act
            const result = await service.enterPoetryShell(deepPath)

            // Assert
            expect(result.command).toBe(expectedCommand)
            expect(result.shouldShowTerminal).toBe(true)
            expect(mocks.fileSystem.stat).toHaveBeenCalledWith(deepPath)
        })

        it('should handle paths with special characters', async () => {
            // Arrange
            const specialPath = '/path with spaces/and-special_chars@#$.txt'
            const directoryPath = '/path with spaces'
            const expectedCommand = `cd "${directoryPath}" && poetry shell`
			
            mocks.fileSystem.stat.mockResolvedValue({ type: 'file' })
            mocks.path.dirname.mockReturnValue(directoryPath)

            // Act
            const result = await service.enterPoetryShell(specialPath)

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
            const expectedCommand = `cd "${directoryPath}" && poetry shell`
			
            mocks.fileSystem.stat.mockResolvedValue({ type: 'file' })
            mocks.path.dirname.mockReturnValue(directoryPath)

            // Act
            const result = await service.enterPoetryShell(longPath)

            // Assert
            expect(result.command).toBe(expectedCommand)
            expect(result.shouldShowTerminal).toBe(true)
        })

        it('should handle Unicode characters in paths', async () => {
            // Arrange
            const unicodePath = '/café/naïve/文件.txt'
            const directoryPath = '/café/naïve'
            const expectedCommand = `cd "${directoryPath}" && poetry shell`
			
            mocks.fileSystem.stat.mockResolvedValue({ type: 'file' })
            mocks.path.dirname.mockReturnValue(directoryPath)

            // Act
            const result = await service.enterPoetryShell(unicodePath)

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
            const expectedCommand = `cd "${directoryPath}" && poetry shell`
			
            mocks.fileSystem.stat.mockResolvedValue({ type: 'file' })
            mocks.path.dirname.mockReturnValue(directoryPath)

            // Act
            const result = await service.enterPoetryShell(windowsPath)

            // Assert
            expect(result.command).toBe(expectedCommand)
            expect(result.shouldShowTerminal).toBe(true)
        })

        it('should handle Unix-style paths', async () => {
            // Arrange
            const unixPath = '/home/user/project/file.txt'
            const directoryPath = '/home/user/project'
            const expectedCommand = `cd "${directoryPath}" && poetry shell`
			
            mocks.fileSystem.stat.mockResolvedValue({ type: 'file' })
            mocks.path.dirname.mockReturnValue(directoryPath)

            // Act
            const result = await service.enterPoetryShell(unixPath)

            // Assert
            expect(result.command).toBe(expectedCommand)
            expect(result.shouldShowTerminal).toBe(true)
        })

        it('should handle network paths', async () => {
            // Arrange
            const networkPath = '\\\\server\\share\\project\\file.txt'
            const directoryPath = '\\\\server\\share\\project'
            const expectedCommand = `cd "${directoryPath}" && poetry shell`
			
            mocks.fileSystem.stat.mockResolvedValue({ type: 'file' })
            mocks.path.dirname.mockReturnValue(directoryPath)

            // Act
            const result = await service.enterPoetryShell(networkPath)

            // Assert
            expect(result.command).toBe(expectedCommand)
            expect(result.shouldShowTerminal).toBe(true)
        })
    })

    describe('Edge Cases and Error Scenarios', () => {
        it('should handle permission denied errors', async () => {
            // Arrange
            const protectedPath = '/protected/directory'

            mocks.fileSystem.stat.mockRejectedValue(new Error('Permission denied'))

            // Act & Assert
            await expect(service.enterPoetryShell(protectedPath))
                .rejects.toThrow('Permission denied')
        })

        it('should handle non-existent paths', async () => {
            // Arrange
            const nonExistentPath = '/non/existent/path'

            mocks.fileSystem.stat.mockRejectedValue(new Error('ENOENT: no such file or directory'))

            // Act & Assert
            await expect(service.enterPoetryShell(nonExistentPath))
                .rejects.toThrow('ENOENT: no such file or directory')
        })

        it('should handle file system corruption errors', async () => {
            // Arrange
            const corruptedPath = '/corrupted/path'

            mocks.fileSystem.stat.mockRejectedValue(new Error('File system corruption detected'))

            // Act & Assert
            await expect(service.enterPoetryShell(corruptedPath))
                .rejects.toThrow('File system corruption detected')
        })

        it('should handle symbolic links as regular files', async () => {
            // Arrange
            const symlinkPath = '/symlink-project/symlink.txt'
            const directoryPath = '/symlink-project'
            const expectedCommand = `cd "${directoryPath}" && poetry shell`
			
            mocks.fileSystem.stat.mockResolvedValue({ type: 'file' })
            mocks.path.dirname.mockReturnValue(directoryPath)

            // Act
            const result = await service.enterPoetryShell(symlinkPath)

            // Assert
            expect(result.command).toBe(expectedCommand)
            expect(result.shouldShowTerminal).toBe(true)
        })

        it('should handle directory without pyproject.toml gracefully', async () => {
            // Arrange
            const directoryPath = '/project-without-poetry'
            const expectedCommand = `cd "${directoryPath}" && poetry shell`
			
            mocks.fileSystem.stat.mockResolvedValue({ type: 'directory' })

            // Act
            const result = await service.enterPoetryShell(directoryPath)

            // Assert - Service should still work even if pyproject.toml doesn't exist
            expect(result.command).toBe(expectedCommand)
            expect(result.shouldShowTerminal).toBe(true)
        })
    })

    describe('Performance Scenarios', () => {
        it('should handle large directory structures efficiently', async () => {
            // Arrange
            const largePath = '/large/project/with/many/subdirectories'
            const expectedCommand = `cd "${largePath}" && poetry shell`
			
            mocks.fileSystem.stat.mockResolvedValue({ type: 'directory' })

            // Act
            const startTime = Date.now()
            const result = await service.enterPoetryShell(largePath)
            const endTime = Date.now()

            // Assert
            expect(result.command).toBe(expectedCommand)
            expect(endTime - startTime).toBeLessThan(100) // Should be fast with mocks
        })

        it('should handle concurrent operations', async () => {
            // Arrange
            const paths = ['/path1', '/path2', '/path3']
            const expectedCommands = [
                'cd "/path1" && poetry shell',
                'cd "/path2" && poetry shell',
                'cd "/path3" && poetry shell'
            ]
			
            paths.forEach(() => {
                mocks.fileSystem.stat.mockResolvedValue({ type: 'directory' })
            })

            // Act
            const results = await Promise.all(
                paths.map(path =>
                    service.enterPoetryShell(path))
            )

            // Assert
            expect(results).toHaveLength(3)
            results.forEach((result, index) => {
                expect(result.command).toBe(expectedCommands[index])
                expect(result.shouldShowTerminal).toBe(true)
            })
        })
    })

    describe('Constants Usage Testing', () => {
        it('should use POETRY_SHELL_COMMAND constant', async () => {
            // Arrange
            const filePath = '/test/directory'
            mocks.fileSystem.stat.mockResolvedValue({ type: 'directory' })

            // Act
            const result = await service.enterPoetryShell(filePath)

            // Assert - Verify the command uses the correct poetry shell command
            expect(result.command).toContain('poetry shell')
            expect(result.shouldShowTerminal).toBe(true)
        })

        it('should handle undefined filePath parameter', async () => {
            // Act
            const result = await service.enterPoetryShell(undefined)

            // Assert
            expect(result.command).toBe('poetry shell')
            expect(result.shouldShowTerminal).toBe(true)
        })
    })
})
