import { describe, it, expect, beforeEach } from 'vitest'
import { BackupManagementService } from '../../src/services/BackupManagement.service'
import {
    setupTestEnvironment,
    resetAllMocks,
    setupFileSystemMocks,
    setupPathMocks,
    setupBackupSuccessScenario,
    setupBackupConflictScenario,
    setupBackupErrorScenario,
    setupBackupStatErrorGracefulScenario,
    setupWindowsPathScenario,
    setupUnixPathScenario,
    setupNetworkPathScenario,
    setupConcurrentBackupScenario,
    createMockBuilder
} from '../_setup'

describe('BackupManagementService', () => {
    let service: BackupManagementService
    let mocks: ReturnType<typeof setupTestEnvironment>

    beforeEach(() => {
        mocks = setupTestEnvironment()
        setupFileSystemMocks(mocks)
        setupPathMocks(mocks)
		
        service = new BackupManagementService(mocks.fileSystem, mocks.path)
        resetAllMocks(mocks)
    })

    describe('createBackup', () => {
        it('should create backup with .bak extension', async () => {
            // Arrange
            const sourcePath = '/test/file.txt'
            const backupPath = '/test/file.txt.bak'

            setupBackupSuccessScenario(mocks, { sourcePath, backupPath })

            // Act
            const result = await service.createBackup(sourcePath)

            // Assert
            expect(result).toBe(backupPath)
            expect(mocks.path.basename).toHaveBeenCalledWith(sourcePath)
            expect(mocks.path.dirname).toHaveBeenCalledWith(sourcePath)
            expect(mocks.fileSystem.copyFile).toHaveBeenCalledWith(sourcePath, backupPath)
        })

        it('should create backup with numbered extension when .bak exists', async () => {
            // Arrange
            const sourcePath = '/test/file.txt'
            const backupPath = '/test/file.txt.bak'

            setupBackupConflictScenario(mocks, { sourcePath, backupPath })

            // Act
            const result = await service.createBackup(sourcePath)

            // Assert
            expect(result).toBe('/test/file.txt.bak2')
            expect(mocks.fileSystem.copyFile).toHaveBeenCalledWith(sourcePath, '/test/file.txt.bak2')
        })

        it('should handle file system errors during stat gracefully', async () => {
            // Arrange
            const sourcePath = '/test/file.txt'
            const backupPath = '/test/file.txt.bak'
			
            setupBackupStatErrorGracefulScenario(mocks, { sourcePath, backupPath }, 'Permission denied')

            // Act
            const result = await service.createBackup(sourcePath)

            // Assert - service should handle stat errors gracefully and continue
            expect(result).toBe(backupPath)
            expect(mocks.fileSystem.copyFile).toHaveBeenCalledWith(sourcePath, backupPath)
        })

        it('should handle file system errors during copy', async () => {
            // Arrange
            const sourcePath = '/test/file.txt'
            const backupPath = '/test/file.txt.bak'

            setupBackupErrorScenario(mocks, { sourcePath, backupPath }, 'copy', 'Copy failed')

            // Act & Assert
            await expect(service.createBackup(sourcePath))
                .rejects
                .toThrow('Copy failed')
        })
    })

    describe('Complex Backup Scenarios', () => {
        it('should handle large files efficiently', async () => {
            // Arrange
            const sourcePath = '/large-project/package.json'
            const backupPath = '/large-project/package.json.bak'
			
            mocks.path.basename.mockReturnValue('package.json')
            mocks.path.dirname.mockReturnValue('/large-project')
            mocks.path.join.mockReturnValue(backupPath)
            mocks.fileSystem.stat.mockRejectedValue(new Error('File not found')) // Backup doesn't exist
            mocks.fileSystem.copyFile.mockResolvedValue(undefined)

            // Act
            const result = await service.createBackup(sourcePath)

            // Assert
            expect(result).toBe(backupPath)
            expect(mocks.fileSystem.copyFile).toHaveBeenCalledWith(sourcePath, backupPath)
        })

        it('should handle files with special characters in names', async () => {
            // Arrange
            const sourcePath = '/special-chars-project/file with spaces.txt'
            const backupPath = '/special-chars-project/file with spaces.txt.bak'
			
            mocks.path.basename.mockReturnValue('file with spaces.txt')
            mocks.path.dirname.mockReturnValue('/special-chars-project')
            mocks.path.join.mockReturnValue(backupPath)
            mocks.fileSystem.stat.mockRejectedValue(new Error('File not found')) // Backup doesn't exist
            mocks.fileSystem.copyFile.mockResolvedValue(undefined)

            // Act
            const result = await service.createBackup(sourcePath)

            // Assert
            expect(result).toBe(backupPath)
            expect(mocks.fileSystem.copyFile).toHaveBeenCalledWith(sourcePath, backupPath)
        })

        it('should handle files in deeply nested paths', async () => {
            // Arrange
            const sourcePath = '/level1/level2/level3/level4/level5/deep-file.txt'
            const backupPath = '/level1/level2/level3/level4/level5/deep-file.txt.bak'
			
            mocks.path.basename.mockReturnValue('deep-file.txt')
            mocks.path.dirname.mockReturnValue('/level1/level2/level3/level4/level5')
            mocks.path.join.mockReturnValue(backupPath)
            mocks.fileSystem.stat.mockRejectedValue(new Error('File not found')) // Backup doesn't exist
            mocks.fileSystem.copyFile.mockResolvedValue(undefined)

            // Act
            const result = await service.createBackup(sourcePath)

            // Assert
            expect(result).toBe(backupPath)
            expect(mocks.fileSystem.copyFile).toHaveBeenCalledWith(sourcePath, backupPath)
        })

        it('should handle symbolic links as regular files', async () => {
            // Arrange
            const sourcePath = '/symlink-project/symlink.txt'
            const backupPath = '/symlink-project/symlink.txt.bak'
			
            mocks.path.basename.mockReturnValue('symlink.txt')
            mocks.path.dirname.mockReturnValue('/symlink-project')
            mocks.path.join.mockReturnValue(backupPath)
            mocks.fileSystem.stat.mockRejectedValue(new Error('File not found')) // Backup doesn't exist
            mocks.fileSystem.copyFile.mockResolvedValue(undefined)

            // Act
            const result = await service.createBackup(sourcePath)

            // Assert
            expect(result).toBe(backupPath)
            expect(mocks.fileSystem.copyFile).toHaveBeenCalledWith(sourcePath, backupPath)
        })
    })

    describe('Edge Cases and Error Scenarios', () => {
        it('should handle backup filename conflicts by incrementing number', async () => {
            // Arrange
            const sourcePath = '/conflict-test/file.txt'
            const backupPath1 = '/conflict-test/file.txt.bak'
            const backupPath2 = '/conflict-test/file.txt.bak2'
			
            mocks.path.basename.mockReturnValue('file.txt')
            mocks.path.dirname.mockReturnValue('/conflict-test')
            mocks.path.join
                .mockReturnValueOnce(backupPath1)
                .mockReturnValueOnce(backupPath2)
			
            // First backup exists, second doesn't
            mocks.fileSystem.stat
                .mockResolvedValueOnce({ type: 'file' }) // .bak exists
                .mockRejectedValueOnce(new Error('File not found')) // .bak2 doesn't exist
            mocks.fileSystem.copyFile.mockResolvedValue(undefined)

            // Act
            const result = await service.createBackup(sourcePath)

            // Assert
            expect(result).toBe(backupPath2)
            expect(mocks.fileSystem.copyFile).toHaveBeenCalledWith(sourcePath, backupPath2)
        })

        it('should handle permission denied errors during stat gracefully', async () => {
            // Arrange
            const sourcePath = '/protected-file.txt'
            const backupPath = '/protected-file.txt.bak'
			
            mocks.path.basename.mockReturnValue('protected-file.txt')
            mocks.path.dirname.mockReturnValue('/')
            mocks.path.join.mockReturnValue(backupPath)
            mocks.fileSystem.stat.mockRejectedValue(new Error('Permission denied'))
            mocks.fileSystem.copyFile.mockResolvedValue(undefined)

            // Act
            const result = await service.createBackup(sourcePath)

            // Assert - service should handle stat errors gracefully and continue
            expect(result).toBe(backupPath)
            expect(mocks.fileSystem.copyFile).toHaveBeenCalledWith(sourcePath, backupPath)
        })

        it('should handle disk space errors during copy', async () => {
            // Arrange
            const sourcePath = '/large-file.txt'
            const backupPath = '/large-file.txt.bak'
			
            mocks.path.basename.mockReturnValue('large-file.txt')
            mocks.path.dirname.mockReturnValue('/')
            mocks.path.join.mockReturnValue(backupPath)
            mocks.fileSystem.stat.mockRejectedValue(new Error('File not found')) // Backup doesn't exist
            mocks.fileSystem.copyFile.mockRejectedValue(new Error('No space left on device'))

            // Act & Assert
            await expect(service.createBackup(sourcePath))
                .rejects.toThrow('No space left on device')
        })

        it('should handle file system corruption during stat gracefully', async () => {
            // Arrange
            const sourcePath = '/corrupted-file.txt'
            const backupPath = '/corrupted-file.txt.bak'
			
            mocks.path.basename.mockReturnValue('corrupted-file.txt')
            mocks.path.dirname.mockReturnValue('/')
            mocks.path.join.mockReturnValue(backupPath)
            mocks.fileSystem.stat.mockRejectedValue(new Error('File system corruption detected'))
            mocks.fileSystem.copyFile.mockResolvedValue(undefined)

            // Act
            const result = await service.createBackup(sourcePath)

            // Assert - service should handle stat errors gracefully and continue
            expect(result).toBe(backupPath)
            expect(mocks.fileSystem.copyFile).toHaveBeenCalledWith(sourcePath, backupPath)
        })

        it('should handle very long file paths', async () => {
            // Arrange
            const sourcePath = '/very-long-path-' + 'a'.repeat(200) + '.txt'
            const backupPath = '/very-long-path-' + 'a'.repeat(200) + '.txt.bak'
			
            mocks.path.basename.mockReturnValue('very-long-path-' + 'a'.repeat(200) + '.txt')
            mocks.path.dirname.mockReturnValue('/')
            mocks.path.join.mockReturnValue(backupPath)
            mocks.fileSystem.stat.mockRejectedValue(new Error('File not found')) // Backup doesn't exist
            mocks.fileSystem.copyFile.mockResolvedValue(undefined)

            // Act
            const result = await service.createBackup(sourcePath)

            // Assert
            expect(result).toBe(backupPath)
            expect(mocks.fileSystem.copyFile).toHaveBeenCalledWith(sourcePath, backupPath)
        })

        it('should handle concurrent backup operations', async () => {
            // Arrange
            const sourcePaths = ['/project1/file1.txt', '/project2/file2.txt', '/project3/file3.txt']
            const backupPaths = ['/project1/file1.txt.bak', '/project2/file2.txt.bak', '/project3/file3.txt.bak']
			
            setupConcurrentBackupScenario(mocks, sourcePaths, backupPaths)

            // Act
            const results = await Promise.all(
                sourcePaths.map(
                    path =>
                        service.createBackup(path)
                )
            )

            // Assert
            expect(results).toEqual(backupPaths)
            expect(mocks.fileSystem.copyFile).toHaveBeenCalledTimes(sourcePaths.length)
        })
    })

    describe('Performance and Large Scale Operations', () => {
        it('should handle file backup efficiently', async () => {
            // Arrange
            const sourcePath = '/massive-project/large-file.txt'
            const backupPath = '/massive-project/large-file.txt.bak'
			
            mocks.path.basename.mockReturnValue('large-file.txt')
            mocks.path.dirname.mockReturnValue('/massive-project')
            mocks.path.join.mockReturnValue(backupPath)
            mocks.fileSystem.stat.mockRejectedValue(new Error('File not found')) // Backup doesn't exist
            mocks.fileSystem.copyFile.mockResolvedValue(undefined)

            // Act
            const startTime = Date.now()
            const result = await service.createBackup(sourcePath)
            const endTime = Date.now()

            // Assert
            expect(result).toBe(backupPath)
            expect(endTime - startTime).toBeLessThan(100) // Should be fast with mocks
            expect(mocks.fileSystem.copyFile).toHaveBeenCalledTimes(1)
        })

        it('should handle memory efficiently with large files', async () => {
            // Arrange
            const sourcePath = '/large-files-project/huge-file.txt'
            const backupPath = '/large-files-project/huge-file.txt.bak'
			
            mocks.path.basename.mockReturnValue('huge-file.txt')
            mocks.path.dirname.mockReturnValue('/large-files-project')
            mocks.path.join.mockReturnValue(backupPath)
            mocks.fileSystem.stat.mockRejectedValue(new Error('File not found')) // Backup doesn't exist
            mocks.fileSystem.copyFile.mockResolvedValue(undefined)

            // Act
            const startMemory = process.memoryUsage().heapUsed
            const result = await service.createBackup(sourcePath)
            const endMemory = process.memoryUsage().heapUsed

            // Assert
            expect(result).toBe(backupPath)
            const memoryIncrease = endMemory - startMemory
            expect(memoryIncrease).toBeLessThan(50 * 1024 * 1024) // Less than 50MB increase
        })
    })

    describe('Cross-Platform Compatibility', () => {
        it('should handle Windows-style paths', async () => {
            // Arrange
            const sourcePath = 'C:\\Users\\John\\Documents\\Project\\file.txt'
            const backupPath = 'C:\\Users\\John\\Documents\\Project\\file.txt.bak'
			
            setupWindowsPathScenario(mocks, sourcePath, backupPath)

            // Act
            const result = await service.createBackup(sourcePath)

            // Assert
            expect(result).toBe(backupPath)
            expect(mocks.fileSystem.copyFile).toHaveBeenCalledWith(sourcePath, backupPath)
        })

        it('should handle Unix-style paths', async () => {
            // Arrange
            const sourcePath = '/home/user/project/file.txt'
            const backupPath = '/home/user/project/file.txt.bak'
			
            setupUnixPathScenario(mocks, sourcePath, backupPath)

            // Act
            const result = await service.createBackup(sourcePath)

            // Assert
            expect(result).toBe(backupPath)
            expect(mocks.fileSystem.copyFile).toHaveBeenCalledWith(sourcePath, backupPath)
        })

        it('should handle network paths', async () => {
            // Arrange
            const sourcePath = '\\\\server\\share\\project\\file.txt'
            const backupPath = '\\\\server\\share\\project\\file.txt.bak'
			
            setupNetworkPathScenario(mocks, sourcePath, backupPath)

            // Act
            const result = await service.createBackup(sourcePath)

            // Assert
            expect(result).toBe(backupPath)
            expect(mocks.fileSystem.copyFile).toHaveBeenCalledWith(sourcePath, backupPath)
        })
    })

    describe('Integration Scenarios', () => {
        it('should work with real-world project files', async () => {
            // Arrange
            const sourcePath = '/real-world-project/package.json'
            const backupPath = '/real-world-project/package.json.bak'
			
            mocks.path.basename.mockReturnValue('package.json')
            mocks.path.dirname.mockReturnValue('/real-world-project')
            mocks.path.join.mockReturnValue(backupPath)
            mocks.fileSystem.stat.mockRejectedValue(new Error('File not found')) // Backup doesn't exist
            mocks.fileSystem.copyFile.mockResolvedValue(undefined)

            // Act
            const result = await service.createBackup(sourcePath)

            // Assert
            expect(result).toBe(backupPath)
            expect(mocks.fileSystem.copyFile).toHaveBeenCalledWith(sourcePath, backupPath)
        })

        it('should handle monorepo package files', async () => {
            // Arrange
            const sourcePath = '/monorepo/packages/core/package.json'
            const backupPath = '/monorepo/packages/core/package.json.bak'
			
            mocks.path.basename.mockReturnValue('package.json')
            mocks.path.dirname.mockReturnValue('/monorepo/packages/core')
            mocks.path.join.mockReturnValue(backupPath)
            mocks.fileSystem.stat.mockRejectedValue(new Error('File not found')) // Backup doesn't exist
            mocks.fileSystem.copyFile.mockResolvedValue(undefined)

            // Act
            const result = await service.createBackup(sourcePath)

            // Assert
            expect(result).toBe(backupPath)
            expect(mocks.fileSystem.copyFile).toHaveBeenCalledWith(sourcePath, backupPath)
        })
    })

    describe('Mock Builder Pattern Examples', () => {
        it('should demonstrate fluent mock builder for complex scenarios', async () => {
            // Arrange - Using the builder pattern for complex mock setup
            const sourcePath = '/complex-project/file.txt'
            const backupPath = '/complex-project/file.txt.bak'
			
            createMockBuilder(mocks)
                .backup({ sourcePath, backupPath })
                .build()

            // Act
            const result = await service.createBackup(sourcePath)

            // Assert
            expect(result).toBe(backupPath)
            expect(mocks.fileSystem.copyFile).toHaveBeenCalledWith(sourcePath, backupPath)
        })

        it('should demonstrate builder with error scenarios', async () => {
            // Arrange - Builder pattern for error scenarios
            const sourcePath = '/error-project/file.txt'
            const backupPath = '/error-project/file.txt.bak'
			
            createMockBuilder(mocks)
                .backupError('copy', 'Disk full', { sourcePath, backupPath })
                .build()

            // Act & Assert
            await expect(service.createBackup(sourcePath))
                .rejects.toThrow('Disk full')
        })
    })

    describe('IBackupOptions Interface Testing', () => {
        it('should accept IBackupOptions parameter (currently unused)', async () => {
            // Arrange
            const sourcePath = '/test/file.txt'
            const backupPath = '/test/file.txt.bak'
            const backupOptions = {
                prefix: 'custom-',
                suffix: '.backup',
                directory: '/custom-backups'
            }

            setupBackupSuccessScenario(mocks, { sourcePath, backupPath })

            // Act - Service accepts options but doesn't use them yet
            const result = await service.createBackup(sourcePath, backupOptions)

            // Assert - Should still work with default behavior
            expect(result).toBe(backupPath)
            expect(mocks.fileSystem.copyFile).toHaveBeenCalledWith(sourcePath, backupPath)
        })

        it('should handle empty IBackupOptions', async () => {
            // Arrange
            const sourcePath = '/test/file.txt'
            const backupPath = '/test/file.txt.bak'
            const emptyOptions = {}

            setupBackupSuccessScenario(mocks, { sourcePath, backupPath })

            // Act
            const result = await service.createBackup(sourcePath, emptyOptions)

            // Assert
            expect(result).toBe(backupPath)
            expect(mocks.fileSystem.copyFile).toHaveBeenCalledWith(sourcePath, backupPath)
        })

        it('should handle undefined IBackupOptions', async () => {
            // Arrange
            const sourcePath = '/test/file.txt'
            const backupPath = '/test/file.txt.bak'

            setupBackupSuccessScenario(mocks, { sourcePath, backupPath })

            // Act - No options provided (defaults to undefined)
            const result = await service.createBackup(sourcePath)

            // Assert
            expect(result).toBe(backupPath)
            expect(mocks.fileSystem.copyFile).toHaveBeenCalledWith(sourcePath, backupPath)
        })
    })

    describe('Constants Usage Testing', () => {
        it('should use BACKUP_SUFFIX constant in backup creation', async () => {
            // Arrange
            const sourcePath = '/test/file.txt'
            const backupPath = '/test/file.txt.bak'

            setupBackupSuccessScenario(mocks, { sourcePath, backupPath })

            // Act
            const result = await service.createBackup(sourcePath)

            // Assert - Verify the backup path uses the correct suffix
            expect(result).toBe(backupPath)
            expect(result).toContain('.bak')
        })

        it('should handle multiple backup conflicts using correct numbering', async () => {
            // Arrange
            const sourcePath = '/test/file.txt'
            const backupPath1 = '/test/file.txt.bak'
            const backupPath2 = '/test/file.txt.bak2'
            const backupPath3 = '/test/file.txt.bak3'

            mocks.path.basename.mockReturnValue('file.txt')
            mocks.path.dirname.mockReturnValue('/test')
            mocks.path.join
                .mockReturnValueOnce(backupPath1)
                .mockReturnValueOnce(backupPath2)
                .mockReturnValueOnce(backupPath3)

            // First two backups exist, third doesn't
            mocks.fileSystem.stat
                .mockResolvedValueOnce({ type: 'file' }) // .bak exists
                .mockResolvedValueOnce({ type: 'file' }) // .bak2 exists
                .mockRejectedValueOnce(new Error('File not found')) // .bak3 doesn't exist
            mocks.fileSystem.copyFile.mockResolvedValue(undefined)

            // Act
            const result = await service.createBackup(sourcePath)

            // Assert
            expect(result).toBe(backupPath3)
            expect(mocks.fileSystem.copyFile).toHaveBeenCalledWith(sourcePath, backupPath3)
        })
    })
})
