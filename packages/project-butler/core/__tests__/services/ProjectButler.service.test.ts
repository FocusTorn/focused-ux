import { describe, it, expect, beforeEach, vi } from 'vitest'
import { createTestProjectButlerService, setupFileSystemMocks, setupWindowMocks, setupWorkspaceMocks } from '../helpers.js'

describe('ProjectButlerService', () => {
	let service: ReturnType<typeof createTestProjectButlerService>

	beforeEach(() => {
		setupFileSystemMocks()
		setupWindowMocks()
		setupWorkspaceMocks()
		service = createTestProjectButlerService()
	})

	describe('updateTerminalPath', () => {
		it('should handle missing URI gracefully', async () => {
			// Mock window to return no active editor
			const mockWindow = (service as any).window

			mockWindow.activeTextEditorUri = undefined

			await service.updateTerminalPath()

			expect(mockWindow.showErrorMessage).toHaveBeenCalledWith('No file or folder context to update terminal path.')
		})

		it('should handle directory paths correctly', async () => {
			const mockFs = (service as any).fileSystem
			const mockWindow = (service as any).window

			mockFs.stat = vi.fn().mockResolvedValue({
				type: 'directory',
				isDirectory: () => true,
			})

			try {
				await service.updateTerminalPath('/test/directory')
			}
			catch (error) {
				console.log('Actual error:', error)
				throw error
			}

			// Should not show error message
			expect(mockWindow.showErrorMessage).not.toHaveBeenCalled()
		})
	})

	describe('createBackup', () => {
		it('should handle missing URI gracefully', async () => {
			const mockWindow = (service as any).window

			mockWindow.activeTextEditorUri = undefined

			await service.createBackup()

			expect(mockWindow.showErrorMessage).toHaveBeenCalledWith('No file selected or open to back up.')
		})
	})

	describe('enterPoetryShell', () => {
		it('should handle missing URI gracefully', async () => {
			const mockWindow = (service as any).window

			mockWindow.activeTextEditorUri = undefined

			try {
				await service.enterPoetryShell()
			}
			catch (error) {
				console.log('Actual error:', error)
				throw error
			}

			// Should not show error message for missing URI
			expect(mockWindow.showErrorMessage).not.toHaveBeenCalled()
		})
	})

	describe('formatPackageJson', () => {
		it('should validate package.json file extension', async () => {
			await service.formatPackageJson('/test/file.txt')

			const mockWindow = (service as any).window

			expect(mockWindow.showErrorMessage).toHaveBeenCalledWith('This command can only be run on a package.json file.')
		})

		it('should handle missing workspace root', async () => {
			const mockProcess = (service as any).process

			mockProcess.getWorkspaceRoot = vi.fn().mockReturnValue(undefined)

			await service.formatPackageJson('/test/package.json')

			const mockWindow = (service as any).window

			expect(mockWindow.showErrorMessage).toHaveBeenCalledWith('Could not find workspace root. Cannot format package.json.')
		})
	})
})
