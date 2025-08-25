import { describe, it, expect, beforeEach } from 'vitest'
import { PoetryShellService } from '../../src/services/PoetryShell.service'
import { setupTestEnvironment, resetAllMocks, setupFileSystemMocks, setupPathMocks } from '../_setup'

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

			mocks.fileSystem.stat.mockResolvedValue({ type: 'directory' })

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

			mocks.fileSystem.stat.mockRejectedValue(new Error('File system error'))

			// Act & Assert
			await expect(service.enterPoetryShell(filePath))
				.rejects
				.toThrow('File system error')
		})
	})
})
