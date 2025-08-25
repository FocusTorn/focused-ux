import { describe, it, expect, beforeEach } from 'vitest'
import { TerminalManagementService } from '../../src/services/TerminalManagement.service'
import { setupTestEnvironment, resetAllMocks, setupFileSystemMocks, setupPathMocks } from '../_setup'

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

			mocks.fileSystem.stat.mockResolvedValue({ type: 'directory' })

			// Act
			const result = await service.updateTerminalPath(filePath)

			// Assert
			expect(result.command).toBe(`cd "${filePath}"`)
			expect(result.shouldShowTerminal).toBe(true)
			expect(mocks.fileSystem.stat).toHaveBeenCalledWith(filePath)
		})

		it('should return CD command for file (using directory)', async () => {
			// Arrange
			const filePath = '/test/file.txt'
			const directoryPath = '/test'
			
			mocks.fileSystem.stat.mockResolvedValue({ type: 'file' })
			mocks.path.dirname.mockReturnValue(directoryPath)

			// Act
			const result = await service.updateTerminalPath(filePath)

			// Assert
			expect(result.command).toBe(`cd "${directoryPath}"`)
			expect(result.shouldShowTerminal).toBe(true)
			expect(mocks.fileSystem.stat).toHaveBeenCalledWith(filePath)
			expect(mocks.path.dirname).toHaveBeenCalledWith(filePath)
		})

		it('should handle file system errors', async () => {
			// Arrange
			const filePath = '/test/file.txt'

			mocks.fileSystem.stat.mockRejectedValue(new Error('File system error'))

			// Act & Assert
			await expect(service.updateTerminalPath(filePath))
				.rejects
				.toThrow('File system error')
		})
	})
})
