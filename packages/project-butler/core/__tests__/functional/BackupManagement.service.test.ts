import { describe, it, expect, beforeEach } from 'vitest'
import { BackupManagementService } from '../../src/services/BackupManagement.service'
import { setupTestEnvironment, resetAllMocks, setupFileSystemMocks, setupPathMocks } from '../_setup'

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
			const baseName = 'file.txt'
			const directory = '/test'
			const backupPath = '/test/file.txt.bak'

			mocks.path.basename.mockReturnValue(baseName)
			mocks.path.dirname.mockReturnValue(directory)
			mocks.path.join.mockReturnValue(backupPath)
			mocks.fileSystem.stat.mockRejectedValue(new Error('File not found')) // Backup doesn't exist

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
			const baseName = 'file.txt'
			const directory = '/test'
			const backupPath1 = '/test/file.txt.bak'
			const backupPath2 = '/test/file.txt.bak2'

			mocks.path.basename.mockReturnValue(baseName)
			mocks.path.dirname.mockReturnValue(directory)
			mocks.path.join
				.mockReturnValueOnce(backupPath1)
				.mockReturnValueOnce(backupPath2)
			
			// First backup exists, second doesn't
			mocks.fileSystem.stat
				.mockResolvedValueOnce({ type: 'file' }) // .bak exists
				.mockRejectedValueOnce(new Error('File not found')) // .bak2 doesn't exist

			// Act
			const result = await service.createBackup(sourcePath)

			// Assert
			expect(result).toBe(backupPath2)
			expect(mocks.fileSystem.copyFile).toHaveBeenCalledWith(sourcePath, backupPath2)
		})

		it('should handle file system errors during stat gracefully', async () => {
			// Arrange
			const sourcePath = '/test/file.txt'
			const backupPath = '/test/file.txt.bak'
			
			mocks.path.basename.mockReturnValue('file.txt')
			mocks.path.dirname.mockReturnValue('/test')
			mocks.path.join.mockReturnValue(backupPath)
			mocks.fileSystem.stat.mockRejectedValue(new Error('Permission denied'))

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

			mocks.path.basename.mockReturnValue('file.txt')
			mocks.path.dirname.mockReturnValue('/test')
			mocks.path.join.mockReturnValue(backupPath)
			mocks.fileSystem.stat.mockRejectedValue(new Error('File not found'))
			mocks.fileSystem.copyFile.mockRejectedValue(new Error('Copy failed'))

			// Act & Assert
			await expect(service.createBackup(sourcePath))
				.rejects.toThrow('Copy failed')
		})
	})
}) 