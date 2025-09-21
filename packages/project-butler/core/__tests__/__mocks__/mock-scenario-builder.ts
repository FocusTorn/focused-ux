import { vi } from 'vitest'
import * as fs from 'node:fs/promises'
import * as path from 'node:path'
import { CoreTestMocks } from './helpers'

// ┌──────────────────────────────────────────────────────────────────────────┐
// │                        MOCK SCENARIO BUILDER                             │
// └──────────────────────────────────────────────────────────────────────────┘

// ┌──────────────────────────────────────────────────────────────────────────┐
// │                        Backup Management Scenarios                       │
// └──────────────────────────────────────────────────────────────────────────┘

export interface BackupScenarioOptions {
    sourcePath: string
    backupPath: string
    baseName?: string
    directory?: string
}

export function setupBackupSuccessScenario(
    mocks: CoreTestMocks,
    options: BackupScenarioOptions
): void {
    const { sourcePath, backupPath, baseName, directory } = options

    mocks.path.basename.mockReturnValue(baseName || sourcePath.split('/').pop() || '')
    mocks.path.dirname.mockReturnValue(directory || sourcePath.split('/').slice(0, -1).join('/'))
    mocks.path.join.mockReturnValue(backupPath)
    mocks.fileSystem.stat.mockRejectedValue(new Error('File not found')) // Backup doesn't exist
    mocks.fileSystem.copyFile.mockResolvedValue(undefined)
}

export function setupBackupConflictScenario(
    mocks: CoreTestMocks,
    options: BackupScenarioOptions
): void {
    const { sourcePath, backupPath, baseName, directory } = options
    const backupPath1 = backupPath
    const backupPath2 = backupPath.replace('.bak', '.bak2')

    mocks.path.basename.mockReturnValue(baseName || sourcePath.split('/').pop() || '')
    mocks.path.dirname.mockReturnValue(directory || sourcePath.split('/').slice(0, -1).join('/'))
    mocks.path.join
        .mockReturnValueOnce(backupPath1)
        .mockReturnValueOnce(backupPath2)

    // First backup exists, second doesn't
    mocks.fileSystem.stat
        .mockResolvedValueOnce({ type: 'file' }) // .bak exists
        .mockRejectedValueOnce(new Error('File not found')) // .bak2 doesn't exist
    mocks.fileSystem.copyFile.mockResolvedValue(undefined)
}

export function setupBackupErrorScenario(
    mocks: CoreTestMocks,
    options: BackupScenarioOptions,
    errorType: 'stat' | 'copy',
    errorMessage: string
): void {
    const { sourcePath, backupPath, baseName, directory } = options

    mocks.path.basename.mockReturnValue(baseName || sourcePath.split('/').pop() || '')
    mocks.path.dirname.mockReturnValue(directory || sourcePath.split('/').slice(0, -1).join('/'))
    mocks.path.join.mockReturnValue(backupPath)

    if (errorType === 'stat') {
        mocks.fileSystem.stat.mockRejectedValue(new Error(errorMessage))
        mocks.fileSystem.copyFile.mockResolvedValue(undefined)
    } else {
        mocks.fileSystem.stat.mockRejectedValue(new Error('File not found'))
        mocks.fileSystem.copyFile.mockRejectedValue(new Error(errorMessage))
    }
}

export function setupBackupStatErrorGracefulScenario(
    mocks: CoreTestMocks,
    options: BackupScenarioOptions,
    errorMessage: string
): void {
    const { sourcePath, backupPath, baseName, directory } = options

    mocks.path.basename.mockReturnValue(baseName || sourcePath.split('/').pop() || '')
    mocks.path.dirname.mockReturnValue(directory || sourcePath.split('/').slice(0, -1).join('/'))
    mocks.path.join.mockReturnValue(backupPath)
    mocks.fileSystem.stat.mockRejectedValue(new Error(errorMessage))
    mocks.fileSystem.copyFile.mockResolvedValue(undefined)
}

// ┌──────────────────────────────────────────────────────────────────────────┐
// │                        Terminal Management Scenarios                     │
// └──────────────────────────────────────────────────────────────────────────┘

export interface TerminalScenarioOptions {
    path: string
    expectedCommand: string
    directoryPath?: string
}

export function setupTerminalDirectoryScenario(
    mocks: CoreTestMocks,
    options: TerminalScenarioOptions
): void {
    const { path: _path, expectedCommand: _expectedCommand } = options

    mocks.fileSystem.stat.mockResolvedValue({ type: 'directory' })
}

export function setupTerminalFileScenario(
    mocks: CoreTestMocks,
    options: TerminalScenarioOptions
): void {
    const { path, expectedCommand: _expectedCommand, directoryPath } = options

    mocks.fileSystem.stat.mockResolvedValue({ type: 'file' })
    mocks.path.dirname.mockReturnValue(directoryPath || path.split('/').slice(0, -1).join('/'))
}

export function setupTerminalErrorScenario(
    mocks: CoreTestMocks,
    options: TerminalScenarioOptions,
    errorMessage: string
): void {
    mocks.fileSystem.stat.mockRejectedValue(new Error(errorMessage))
}

// ┌──────────────────────────────────────────────────────────────────────────┐
// │                        Package JSON Formatting Scenarios                 │
// └──────────────────────────────────────────────────────────────────────────┘

export interface PackageJsonScenarioOptions {
    packageJsonPath: string
    workspaceRoot: string
    configContent: string
    packageContent: string
    expectedOrder?: string[]
}

export function setupPackageJsonSuccessScenario(
    mocks: CoreTestMocks,
    options: PackageJsonScenarioOptions
): void {
    const { configContent, packageContent, expectedOrder } = options

    mocks.fileSystem.readFile
        .mockResolvedValueOnce(configContent) // .FocusedUX config
        .mockResolvedValueOnce(packageContent) // package.json content

    mocks.yaml.load.mockReturnValue({
        ProjectButler: {
            'packageJson-order': expectedOrder || ['name', 'version', 'description', 'main', 'scripts', 'dependencies'],
        },
    })
}

export function setupPackageJsonConfigErrorScenario(
    mocks: CoreTestMocks,
    options: PackageJsonScenarioOptions
): void {
    const { configContent: _configContent } = options

    mocks.fileSystem.readFile.mockRejectedValueOnce(new Error('File not found'))
}

export function setupPackageJsonYamlErrorScenario(
    mocks: CoreTestMocks,
    options: PackageJsonScenarioOptions
): void {
    const { configContent } = options

    mocks.fileSystem.readFile.mockResolvedValueOnce(configContent)
    mocks.yaml.load.mockImplementation(() => {
        throw new Error('Invalid YAML')
    })
}

// ┌──────────────────────────────────────────────────────────────────────────┐
// │                          Poetry Shell Scenarios                          │
// └──────────────────────────────────────────────────────────────────────────┘

export function setupPoetryShellSuccessScenario(
    mocks: CoreTestMocks,
    _projectPath: string
): void {
    mocks.fileSystem.stat.mockResolvedValue({ type: 'directory' })
}

export function setupPoetryShellErrorScenario(
    mocks: CoreTestMocks,
    projectPath: string,
    errorMessage: string
): void {
    mocks.fileSystem.stat.mockRejectedValue(new Error(errorMessage))
}

// ┌──────────────────────────────────────────────────────────────────────────┐
// │                        Cross-Platform Path Scenarios                    │
// └──────────────────────────────────────────────────────────────────────────┘

export function setupWindowsPathScenario(
    mocks: CoreTestMocks,
    sourcePath: string,
    backupPath: string
): void {
    const baseName = sourcePath.split('\\').pop() || ''
    const directory = sourcePath.split('\\').slice(0, -1).join('\\')

    mocks.path.basename.mockReturnValue(baseName)
    mocks.path.dirname.mockReturnValue(directory)
    mocks.path.join.mockReturnValue(backupPath)
    mocks.fileSystem.stat.mockRejectedValue(new Error('File not found'))
    mocks.fileSystem.copyFile.mockResolvedValue(undefined)
}

export function setupUnixPathScenario(
    mocks: CoreTestMocks,
    sourcePath: string,
    backupPath: string
): void {
    const baseName = sourcePath.split('/').pop() || ''
    const directory = sourcePath.split('/').slice(0, -1).join('/')

    mocks.path.basename.mockReturnValue(baseName)
    mocks.path.dirname.mockReturnValue(directory)
    mocks.path.join.mockReturnValue(backupPath)
    mocks.fileSystem.stat.mockRejectedValue(new Error('File not found'))
    mocks.fileSystem.copyFile.mockResolvedValue(undefined)
}

export function setupNetworkPathScenario(
    mocks: CoreTestMocks,
    sourcePath: string,
    backupPath: string
): void {
    const baseName = sourcePath.split('\\').pop() || ''
    const directory = sourcePath.split('\\').slice(0, -1).join('\\')

    mocks.path.basename.mockReturnValue(baseName)
    mocks.path.dirname.mockReturnValue(directory)
    mocks.path.join.mockReturnValue(backupPath)
    mocks.fileSystem.stat.mockRejectedValue(new Error('File not found'))
    mocks.fileSystem.copyFile.mockResolvedValue(undefined)
}

// ┌──────────────────────────────────────────────────────────────────────────┐
// │                        Performance and Concurrency Scenarios             │
// └──────────────────────────────────────────────────────────────────────────┘

export function setupConcurrentBackupScenario(
    mocks: CoreTestMocks,
    sourcePaths: string[],
    backupPaths: string[]
): void {
    sourcePaths.forEach((path, index) => {
        mocks.path.basename.mockReturnValueOnce(path.split('/').pop() || '')
        mocks.path.dirname.mockReturnValueOnce(path.split('/').slice(0, -1).join('/'))
        mocks.path.join.mockReturnValueOnce(backupPaths[index])
    })
    mocks.fileSystem.stat.mockRejectedValue(new Error('File not found'))
    mocks.fileSystem.copyFile.mockResolvedValue(undefined)
}

// ┌──────────────────────────────────────────────────────────────────────────┐
// │                        Mock Builder Pattern                              │
// └──────────────────────────────────────────────────────────────────────────┘

export class ProjectButlerMockBuilder {

    constructor(private mocks: CoreTestMocks) {}

    backup(options: BackupScenarioOptions): ProjectButlerMockBuilder {
        setupBackupSuccessScenario(this.mocks, options)
        return this
    }

    backupConflict(options: BackupScenarioOptions): ProjectButlerMockBuilder {
        setupBackupConflictScenario(this.mocks, options)
        return this
    }

    backupError(
        errorType: 'stat' | 'copy',
        errorMessage: string,
        options: BackupScenarioOptions
    ): ProjectButlerMockBuilder {
        setupBackupErrorScenario(this.mocks, options, errorType, errorMessage)
        return this
    }

    terminalDirectory(options: TerminalScenarioOptions): ProjectButlerMockBuilder {
        setupTerminalDirectoryScenario(this.mocks, options)
        return this
    }

    terminalFile(options: TerminalScenarioOptions): ProjectButlerMockBuilder {
        setupTerminalFileScenario(this.mocks, options)
        return this
    }

    packageJson(options: PackageJsonScenarioOptions): ProjectButlerMockBuilder {
        setupPackageJsonSuccessScenario(this.mocks, options)
        return this
    }

    poetryShell(projectPath: string): ProjectButlerMockBuilder {
        setupPoetryShellSuccessScenario(this.mocks, projectPath)
        return this
    }

    windowsPath(sourcePath: string, backupPath: string): ProjectButlerMockBuilder {
        setupWindowsPathScenario(this.mocks, sourcePath, backupPath)
        return this
    }

    unixPath(sourcePath: string, backupPath: string): ProjectButlerMockBuilder {
        setupUnixPathScenario(this.mocks, sourcePath, backupPath)
        return this
    }

    build(): CoreTestMocks {
        return this.mocks
    }

}

export function createProjectButlerMockBuilder(mocks: CoreTestMocks): ProjectButlerMockBuilder {
    return new ProjectButlerMockBuilder(mocks)
}
