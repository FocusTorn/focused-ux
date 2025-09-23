import { describe, it, expect, beforeEach } from 'vitest'
import { ProjectButlerManagerService } from '../../src/services/ProjectButlerManager.service'
import { PackageJsonFormattingService } from '../../src/services/PackageJsonFormatting.service'
import { TerminalManagementService } from '../../src/services/TerminalManagement.service'
import { BackupManagementService } from '../../src/services/BackupManagement.service'
import { PoetryShellService } from '../../src/services/PoetryShell.service'
import {
    setupTestEnvironment,
    resetAllMocks,
    setupFileSystemMocks,
    setupPathMocks,
    setupYamlMocks,
} from '../__mocks__/helpers'

describe('ProjectButlerManager Complex Orchestration', () => {
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

    describe('formatPackageJsonWithBackup', () => {
        it('should execute complete workflow: backup creation + package.json formatting', async () => {
            // Arrange
            const packageJsonPath = '/test/package.json'
            const workspaceRoot = '/test'
            const backupPath = '/test/package.json.bak'
            const configContent = 'ProjectButler:\n  packageJson-order:\n    - name\n    - version\n    - scripts'
            const packageContent = JSON.stringify({
                scripts: { test: 'jest' },
                name: 'test-package',
                version: '1.0.0',
            }, null, 2)

            // Setup mocks for the complete workflow
            mocks.fileSystem.readFile
                .mockResolvedValueOnce(configContent) // .FocusedUX config
                .mockResolvedValueOnce(packageContent) // package.json content
            
            mocks.yaml.load.mockReturnValue({
                ProjectButler: {
                    'packageJson-order': ['name', 'version', 'scripts'],
                },
            })

            // Setup backup mocks
            mocks.path.basename.mockReturnValue('package.json')
            mocks.path.dirname.mockReturnValue('/test')
            mocks.path.join.mockReturnValue(backupPath)
            mocks.fileSystem.stat.mockRejectedValue(new Error('File not found')) // Backup doesn't exist
            mocks.fileSystem.copyFile.mockResolvedValue(undefined)

            // Act
            const result = await projectButlerManager.formatPackageJsonWithBackup(packageJsonPath, workspaceRoot)

            // Assert
            expect(result).toEqual({
                backupPath,
                formatted: true
            })
            
            // Verify backup was created first
            expect(mocks.fileSystem.copyFile).toHaveBeenCalledWith(packageJsonPath, backupPath)
            
            // Verify package.json was formatted after backup
            expect(mocks.fileSystem.writeFile).toHaveBeenCalledWith(
                packageJsonPath,
                expect.stringContaining('"name": "test-package"')
            )
            
            // Verify config was read
            expect(mocks.fileSystem.readFile).toHaveBeenCalledWith(`${workspaceRoot}/.FocusedUX`)
            
            // Verify yaml was parsed
            expect(mocks.yaml.load).toHaveBeenCalledWith(configContent)
        })

        it('should handle backup creation failure gracefully', async () => {
            // Arrange
            const packageJsonPath = '/test/package.json'
            const workspaceRoot = '/test'
            
            mocks.fileSystem.copyFile.mockRejectedValue(new Error('Backup failed'))

            // Act & Assert
            await expect(projectButlerManager.formatPackageJsonWithBackup(packageJsonPath, workspaceRoot))
                .rejects.toThrow('Format package.json with backup failed: Backup failed')
        })

        it('should handle package.json formatting failure after successful backup', async () => {
            // Arrange
            const packageJsonPath = '/test/package.json'
            const workspaceRoot = '/test'
            const backupPath = '/test/package.json.bak'
            
            // Setup backup success
            mocks.path.basename.mockReturnValue('package.json')
            mocks.path.dirname.mockReturnValue('/test')
            mocks.path.join.mockReturnValue(backupPath)
            mocks.fileSystem.stat.mockRejectedValue(new Error('File not found'))
            mocks.fileSystem.copyFile.mockResolvedValue(undefined)
            
            // Setup formatting failure
            mocks.fileSystem.readFile.mockRejectedValue(new Error('Config not found'))

            // Act & Assert
            await expect(projectButlerManager.formatPackageJsonWithBackup(packageJsonPath, workspaceRoot))
                .rejects.toThrow('Format package.json with backup failed')
        })
    })

    describe('completeProjectSetupWorkflow', () => {
        it('should execute complete workflow: backup + formatting + terminal navigation', async () => {
            // Arrange
            const packageJsonPath = '/test/package.json'
            const workspaceRoot = '/test'
            const filePath = '/test/file.txt'
            const backupPath = '/test/package.json.bak'
            const directoryPath = '/test'
            const configContent = 'ProjectButler:\n  packageJson-order:\n    - name\n    - version\n    - scripts'
            const packageContent = JSON.stringify({
                scripts: { test: 'jest' },
                name: 'test-package',
                version: '1.0.0',
            }, null, 2)

            // Setup package.json formatting mocks
            mocks.fileSystem.readFile
                .mockResolvedValueOnce(configContent) // .FocusedUX config
                .mockResolvedValueOnce(packageContent) // package.json content
            
            mocks.yaml.load.mockReturnValue({
                ProjectButler: {
                    'packageJson-order': ['name', 'version', 'scripts'],
                },
            })

            // Setup backup mocks
            mocks.path.basename.mockReturnValue('package.json')
            mocks.path.dirname.mockReturnValue('/test')
            mocks.path.join.mockReturnValue(backupPath)
            mocks.fileSystem.stat.mockRejectedValue(new Error('File not found'))
            mocks.fileSystem.copyFile.mockResolvedValue(undefined)

            // Setup terminal mocks
            mocks.fileSystem.stat.mockResolvedValue({ type: 'file' })
            mocks.path.dirname.mockReturnValue(directoryPath)

            // Act
            const result = await projectButlerManager.completeProjectSetupWorkflow(
                packageJsonPath, 
                workspaceRoot, 
                filePath
            )

            // Assert
            expect(result).toEqual({
                backupPath,
                formatted: true,
                terminalCommand: expect.stringContaining('cd')
            })
            
            // Verify all steps were executed
            expect(mocks.fileSystem.copyFile).toHaveBeenCalledWith(packageJsonPath, backupPath)
            expect(mocks.fileSystem.writeFile).toHaveBeenCalledWith(
                packageJsonPath,
                expect.stringContaining('"name": "test-package"')
            )
            expect(mocks.fileSystem.stat).toHaveBeenCalledWith(filePath)
            expect(mocks.path.dirname).toHaveBeenCalledWith(filePath)
        })

        it('should handle terminal navigation failure after successful backup and formatting', async () => {
            // Arrange
            const packageJsonPath = '/test/package.json'
            const workspaceRoot = '/test'
            const filePath = '/test/file.txt'
            const backupPath = '/test/package.json.bak'
            const configContent = 'ProjectButler:\n  packageJson-order:\n    - name\n    - version\n    - scripts'
            const packageContent = JSON.stringify({
                scripts: { test: 'jest' },
                name: 'test-package',
                version: '1.0.0',
            }, null, 2)

            // Setup package.json formatting mocks
            mocks.fileSystem.readFile
                .mockResolvedValueOnce(configContent)
                .mockResolvedValueOnce(packageContent)
            
            mocks.yaml.load.mockReturnValue({
                ProjectButler: {
                    'packageJson-order': ['name', 'version', 'scripts'],
                },
            })

            // Setup backup mocks
            mocks.path.basename.mockReturnValue('package.json')
            mocks.path.dirname.mockReturnValue('/test')
            mocks.path.join.mockReturnValue(backupPath)
            mocks.fileSystem.stat.mockRejectedValue(new Error('File not found'))
            mocks.fileSystem.copyFile.mockResolvedValue(undefined)
            
            // Setup terminal failure
            mocks.fileSystem.stat.mockRejectedValue(new Error('File not found'))

            // Act & Assert
            await expect(projectButlerManager.completeProjectSetupWorkflow(
                packageJsonPath, 
                workspaceRoot, 
                filePath
            )).rejects.toThrow('Complete project setup workflow failed')
        })
    })

    describe('poetryEnvironmentSetup', () => {
        it('should setup poetry environment with terminal navigation only', async () => {
            // Arrange
            const filePath = '/test/file.txt'
            const directoryPath = '/test'
            
            mocks.fileSystem.stat.mockResolvedValue({ type: 'file' })
            mocks.path.dirname.mockReturnValue(directoryPath)

            // Act
            const result = await projectButlerManager.poetryEnvironmentSetup(filePath)

            // Assert
            expect(result).toEqual({
                poetryCommand: expect.stringContaining('poetry shell'),
                terminalCommand: expect.stringContaining('cd'),
                backupPath: undefined
            })
            
            // Verify poetry shell command was generated
            expect(mocks.fileSystem.stat).toHaveBeenCalledWith(filePath)
            expect(mocks.path.dirname).toHaveBeenCalledWith(filePath)
            
            // Verify no backup operations occurred
            expect(mocks.fileSystem.copyFile).not.toHaveBeenCalled()
        })

        it('should setup poetry environment with package.json formatting when provided', async () => {
            // Arrange
            const filePath = '/test/file.txt'
            const packageJsonPath = '/test/package.json'
            const workspaceRoot = '/test'
            const backupPath = '/test/package.json.bak'
            const directoryPath = '/test'
            const configContent = 'ProjectButler:\n  packageJson-order:\n    - name\n    - version\n    - scripts'
            const packageContent = JSON.stringify({
                scripts: { test: 'jest' },
                name: 'test-package',
                version: '1.0.0',
            }, null, 2)

            // Setup package.json formatting mocks
            mocks.fileSystem.readFile
                .mockResolvedValueOnce(configContent)
                .mockResolvedValueOnce(packageContent)
            
            mocks.yaml.load.mockReturnValue({
                ProjectButler: {
                    'packageJson-order': ['name', 'version', 'scripts'],
                },
            })

            // Setup backup mocks
            mocks.path.basename.mockReturnValue('package.json')
            mocks.path.dirname.mockReturnValue('/test')
            mocks.path.join.mockReturnValue(backupPath)
            mocks.fileSystem.stat.mockRejectedValue(new Error('File not found'))
            mocks.fileSystem.copyFile.mockResolvedValue(undefined)

            // Setup terminal mocks
            mocks.fileSystem.stat.mockResolvedValue({ type: 'file' })
            mocks.path.dirname.mockReturnValue(directoryPath)

            // Act
            const result = await projectButlerManager.poetryEnvironmentSetup(
                filePath, 
                packageJsonPath, 
                workspaceRoot
            )

            // Assert
            expect(result).toEqual({
                poetryCommand: expect.stringContaining('poetry shell'),
                terminalCommand: expect.stringContaining('cd'),
                backupPath
            })
            
            // Verify all operations were executed
            expect(mocks.fileSystem.copyFile).toHaveBeenCalledWith(packageJsonPath, backupPath)
            expect(mocks.fileSystem.writeFile).toHaveBeenCalledWith(
                packageJsonPath,
                expect.stringContaining('"name": "test-package"')
            )
            expect(mocks.fileSystem.stat).toHaveBeenCalledWith(filePath)
            expect(mocks.path.dirname).toHaveBeenCalledWith(filePath)
        })

        it('should handle poetry shell failure gracefully', async () => {
            // Arrange
            const filePath = '/test/file.txt'
            
            mocks.fileSystem.stat.mockRejectedValue(new Error('File not found'))

            // Act & Assert
            await expect(projectButlerManager.poetryEnvironmentSetup(filePath))
                .rejects.toThrow('Poetry environment setup failed')
        })

        it('should handle package.json formatting failure in poetry setup', async () => {
            // Arrange
            const filePath = '/test/file.txt'
            const packageJsonPath = '/test/package.json'
            const workspaceRoot = '/test'
            
            mocks.fileSystem.stat.mockResolvedValue({ type: 'file' })
            mocks.path.dirname.mockReturnValue('/test')
            mocks.fileSystem.readFile.mockRejectedValue(new Error('Config not found'))

            // Act & Assert
            await expect(projectButlerManager.poetryEnvironmentSetup(
                filePath, 
                packageJsonPath, 
                workspaceRoot
            )).rejects.toThrow('Poetry environment setup failed')
        })
    })

    describe('Error Recovery and Validation', () => {
        it('should validate all parameters in formatPackageJsonWithBackup', async () => {
            // Act & Assert
            await expect(projectButlerManager.formatPackageJsonWithBackup('', '/test'))
                .rejects.toThrow('Invalid file path provided')
            
            await expect(projectButlerManager.formatPackageJsonWithBackup('/test/package.json', ''))
                .rejects.toThrow('Invalid file path provided')
            
            await expect(projectButlerManager.formatPackageJsonWithBackup('', ''))
                .rejects.toThrow('Invalid file path provided')
        })

        it('should validate all parameters in completeProjectSetupWorkflow', async () => {
            // Act & Assert
            await expect(projectButlerManager.completeProjectSetupWorkflow('', '/test', '/test/file.txt'))
                .rejects.toThrow('Invalid file path provided')
            
            await expect(projectButlerManager.completeProjectSetupWorkflow('/test/package.json', '', '/test/file.txt'))
                .rejects.toThrow('Invalid file path provided')
            
            await expect(projectButlerManager.completeProjectSetupWorkflow('/test/package.json', '/test', ''))
                .rejects.toThrow('Invalid file path provided')
        })

        it('should validate file path in poetryEnvironmentSetup', async () => {
            // Act & Assert
            await expect(projectButlerManager.poetryEnvironmentSetup(''))
                .rejects.toThrow('Invalid file path provided')
        })

        it('should validate package.json parameters when provided in poetryEnvironmentSetup', async () => {
            // Act & Assert
            await expect(projectButlerManager.poetryEnvironmentSetup('/test/file.txt', '', '/test'))
                .rejects.toThrow('Invalid file path provided')
            
            await expect(projectButlerManager.poetryEnvironmentSetup('/test/file.txt', '/test/package.json', ''))
                .rejects.toThrow('Invalid file path provided')
        })
    })
})
