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
import {
    setupPackageJsonSuccessScenario,
    // setupTerminalDirectoryScenario,
    setupBackupSuccessScenario,
    // setupPoetryShellSuccessScenario
} from '../__mocks__/mock-scenario-builder'

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

            setupPackageJsonSuccessScenario(mocks, {
                packageJsonPath,
                workspaceRoot,
                configContent,
                packageContent,
                expectedOrder: ['name', 'version', 'scripts']
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

            setupBackupSuccessScenario(mocks, { sourcePath, backupPath })

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

    describe('Complex Orchestration Methods', () => {
        describe('formatPackageJsonWithBackup', () => {
            it('should format package.json and create backup in one operation', async () => {
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

                setupPackageJsonSuccessScenario(mocks, {
                    packageJsonPath,
                    workspaceRoot,
                    configContent,
                    packageContent,
                    expectedOrder: ['name', 'version', 'scripts']
                })

                setupBackupSuccessScenario(mocks, {
                    sourcePath: packageJsonPath,
                    backupPath
                })

                // Act
                const result = await projectButlerManager.formatPackageJsonWithBackup(packageJsonPath, workspaceRoot)

                // Assert
                expect(result).toEqual({
                    backupPath,
                    formatted: true
                })
                expect(mocks.fileSystem.copyFile).toHaveBeenCalledWith(packageJsonPath, backupPath)
                expect(mocks.fileSystem.writeFile).toHaveBeenCalledWith(
                    packageJsonPath,
                    expect.stringContaining('"name": "test-package"')
                )
            })

            it('should throw error for invalid parameters', async () => {
                // Act & Assert
                await expect(projectButlerManager.formatPackageJsonWithBackup('', '/test'))
                    .rejects.toThrow('Invalid file path provided')
                
                await expect(projectButlerManager.formatPackageJsonWithBackup('/test/package.json', ''))
                    .rejects.toThrow('Invalid file path provided')
            })
        })

        describe('completeProjectSetupWorkflow', () => {
            it('should execute complete project setup workflow', async () => {
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

                setupPackageJsonSuccessScenario(mocks, {
                    packageJsonPath,
                    workspaceRoot,
                    configContent,
                    packageContent,
                    expectedOrder: ['name', 'version', 'scripts']
                })

                setupBackupSuccessScenario(mocks, {
                    sourcePath: packageJsonPath,
                    backupPath
                })

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
                expect(mocks.fileSystem.copyFile).toHaveBeenCalledWith(packageJsonPath, backupPath)
                expect(mocks.fileSystem.writeFile).toHaveBeenCalledWith(
                    packageJsonPath,
                    expect.stringContaining('"name": "test-package"')
                )
                expect(mocks.fileSystem.stat).toHaveBeenCalledWith(filePath)
            })

            it('should throw error for invalid parameters', async () => {
                // Act & Assert
                await expect(projectButlerManager.completeProjectSetupWorkflow('', '/test', '/test/file.txt'))
                    .rejects.toThrow('Invalid file path provided')
                
                await expect(projectButlerManager.completeProjectSetupWorkflow('/test/package.json', '', '/test/file.txt'))
                    .rejects.toThrow('Invalid file path provided')
                
                await expect(projectButlerManager.completeProjectSetupWorkflow('/test/package.json', '/test', ''))
                    .rejects.toThrow('Invalid file path provided')
            })
        })

        describe('poetryEnvironmentSetup', () => {
            it('should setup poetry environment with terminal navigation', async () => {
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
                expect(mocks.fileSystem.stat).toHaveBeenCalledWith(filePath)
            })

            it('should setup poetry environment with package.json formatting', async () => {
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

                setupPackageJsonSuccessScenario(mocks, {
                    packageJsonPath,
                    workspaceRoot,
                    configContent,
                    packageContent,
                    expectedOrder: ['name', 'version', 'scripts']
                })

                setupBackupSuccessScenario(mocks, {
                    sourcePath: packageJsonPath,
                    backupPath
                })

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
                expect(mocks.fileSystem.copyFile).toHaveBeenCalledWith(packageJsonPath, backupPath)
                expect(mocks.fileSystem.writeFile).toHaveBeenCalledWith(
                    packageJsonPath,
                    expect.stringContaining('"name": "test-package"')
                )
            })

            it('should throw error for invalid file path', async () => {
                // Act & Assert
                await expect(projectButlerManager.poetryEnvironmentSetup(''))
                    .rejects.toThrow('Invalid file path provided')
            })
        })
    })
})
