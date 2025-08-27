import { describe, it, expect, beforeEach } from 'vitest'
import { ProjectButlerManagerService } from '../../src/services/ProjectButlerManager.service'
import { PackageJsonFormattingService } from '../../src/services/PackageJsonFormatting.service'
import { TerminalManagementService } from '../../src/services/TerminalManagement.service'
import { BackupManagementService } from '../../src/services/BackupManagement.service'
import { PoetryShellService } from '../../src/services/PoetryShell.service'
import { setupTestEnvironment, resetAllMocks, setupFileSystemMocks, setupPathMocks, setupYamlMocks } from '../_setup'

describe('ProjectButlerManager Integration', () => {
	let projectButlerManager: ProjectButlerManagerService
	let mocks: ReturnType<typeof setupTestEnvironment>

	beforeEach(() => {
		mocks = setupTestEnvironment()
		setupFileSystemMocks(mocks)
		setupPathMocks(mocks)
		setupYamlMocks(mocks)
		
		// Create services with mocked dependencies
		const packageJsonFormatting = new PackageJsonFormattingService(mocks.fileSystem, mocks.yaml)
		const terminalManagement = new TerminalManagementService(mocks.fileSystem, mocks.path)
		const backupManagement = new BackupManagementService(mocks.fileSystem, mocks.path)
		const poetryShell = new PoetryShellService(mocks.fileSystem, mocks.path)
		
		// Create the manager service with all dependencies
		projectButlerManager = new ProjectButlerManagerService({
			packageJsonFormatting,
			terminalManagement,
			backupManagement,
			poetryShell,
		})
		
		resetAllMocks(mocks)
	})

	describe('formatPackageJson', () => {
		it('should format package.json through complete service chain', async () => {
			// Arrange
			const packageJsonPath = '/test/package.json'
			const workspaceRoot = '/test'
			const configContent = 'ProjectButler:\n  packageJson-order:\n    - name\n    - version\n    - scripts'
			const packageContent = JSON.stringify({
				scripts: { test: 'jest' },
				name: 'test-package',
				version: '1.0.0',
			}, null, 2)

			mocks.fileSystem.readFile
				.mockResolvedValueOnce(configContent)
				.mockResolvedValueOnce(packageContent)

			mocks.yaml.load.mockReturnValue({
				ProjectButler: {
					'packageJson-order': ['name', 'version', 'scripts'],
				},
			})

			// Act
			await projectButlerManager.formatPackageJson(packageJsonPath, workspaceRoot)

			// Assert
			expect(mocks.fileSystem.writeFile).toHaveBeenCalledWith(
				packageJsonPath,
				expect.stringContaining('"name": "test-package"'),
			)
		})
	})

	describe('updateTerminalPath', () => {
		it('should generate terminal command through complete service chain', async () => {
			// Arrange
			const filePath = '/test/file.txt'
			const directoryPath = '/test'
			
			mocks.fileSystem.stat.mockResolvedValue({ type: 'file' })
			mocks.path.dirname.mockReturnValue(directoryPath)

			// Act
			await projectButlerManager.updateTerminalPath(filePath)

			// Assert
			expect(mocks.fileSystem.stat).toHaveBeenCalledWith(filePath)
			expect(mocks.path.dirname).toHaveBeenCalledWith(filePath)
		})
	})

	describe('createBackup', () => {
		it('should create backup through complete service chain', async () => {
			// Arrange
			const sourcePath = '/test/file.txt'
			const backupPath = '/test/file.txt.bak'

			mocks.path.basename.mockReturnValue('file.txt')
			mocks.path.dirname.mockReturnValue('/test')
			mocks.path.join.mockReturnValue(backupPath)
			mocks.fileSystem.stat.mockRejectedValue(new Error('File not found'))

			// Act
			await projectButlerManager.createBackup(sourcePath)

			// Assert
			expect(mocks.fileSystem.copyFile).toHaveBeenCalledWith(sourcePath, backupPath)
		})
	})

	describe('enterPoetryShell', () => {
		it('should generate poetry shell command through complete service chain', async () => {
			// Arrange
			const filePath = '/test/file.txt'
			const directoryPath = '/test'
			
			mocks.fileSystem.stat.mockResolvedValue({ type: 'file' })
			mocks.path.dirname.mockReturnValue(directoryPath)

			// Act
			await projectButlerManager.enterPoetryShell(filePath)

			// Assert
			expect(mocks.fileSystem.stat).toHaveBeenCalledWith(filePath)
			expect(mocks.path.dirname).toHaveBeenCalledWith(filePath)
		})
	})
})
