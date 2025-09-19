import { vi, beforeAll, afterAll, afterEach } from 'vitest'
import process from 'node:process'
import path from 'node:path'

// 1) Mock fs/promises globally (no real disk I/O)
// This is needed for the Node.js adapters to work properly in tests
vi.mock('node:fs/promises', () =>
    ({
        stat: vi.fn(),
        access: vi.fn(),
        copyFile: vi.fn(),
        readFile: vi.fn(),
        writeFile: vi.fn(),
        readdir: vi.fn(),
        mkdir: vi.fn(),
        rmdir: vi.fn(),
        unlink: vi.fn(),
    }))

// 2) Use fake timers globally (no real waits)
// Temporarily disabled to fix hanging tests
// beforeAll(() => {
// 	vi.useFakeTimers({ advanceTimers: true })
// })

// afterAll(() => {
// 	vi.useRealTimers()
// })

// 3) Keep mocks clean between tests
afterEach(() => {
    vi.clearAllMocks()
    vi.clearAllTimers()
})

// 4) Ensure proper cleanup after all tests
afterAll(() => {
    vi.restoreAllMocks()
    // Force garbage collection if available
    if (global.gc) {
        global.gc()
    }
})

// Console output configuration for tests
// Set this to true to enable console output for debugging
const ENABLE_CONSOLE_OUTPUT = process.env.ENABLE_TEST_CONSOLE === 'true'

if (ENABLE_CONSOLE_OUTPUT) {
    // Enable console output for debugging
    console.log('🔍 Test console output enabled - use ENABLE_TEST_CONSOLE=true to enable')
}
else {
    // Silence console by default to reduce noise and make assertions stable.
    // Use ENABLE_TEST_CONSOLE=true to opt-in when debugging.
    console.log = vi.fn()
    console.info = vi.fn()
    console.warn = vi.fn()
    console.error = vi.fn()
}

// Export a function to enable console output programmatically
export function enableTestConsoleOutput() {
    if (!ENABLE_CONSOLE_OUTPUT) {
        // Restore original console methods
        console.log = console.log || (() => {})
        console.info = console.info || (() => {})
        console.warn = console.warn || (() => {})
        console.error = console.error || (() => {})
        console.log('🔍 Test console output enabled programmatically')
    }
}

// Test helper functions and mock setup
export interface TestMocks {
    fileSystem: {
        readFile: ReturnType<typeof vi.fn>
        writeFile: ReturnType<typeof vi.fn>
        stat: ReturnType<typeof vi.fn>
        copyFile: ReturnType<typeof vi.fn>
    }
    path: {
        dirname: ReturnType<typeof vi.fn>
        basename: ReturnType<typeof vi.fn>
        join: ReturnType<typeof vi.fn>
        resolve: ReturnType<typeof vi.fn>
    }
    yaml: {
        load: ReturnType<typeof vi.fn>
    }
    window: {
        showInformationMessage: ReturnType<typeof vi.fn>
    }
}

export function setupTestEnvironment(): TestMocks {
    const fileSystem = {
        readFile: vi.fn(),
        writeFile: vi.fn(),
        stat: vi.fn(),
        copyFile: vi.fn(),
    }

    const path = {
        dirname: vi.fn(),
        basename: vi.fn(),
        join: vi.fn(),
        resolve: vi.fn(),
    }

    const yaml = {
        load: vi.fn(),
    }

    const window = {
        showInformationMessage: vi.fn(),
    }

    return {
        fileSystem,
        path,
        yaml,
        window,
    }
}

export function resetAllMocks(mocks: TestMocks): void {
    Object.values(mocks.fileSystem).forEach(mock =>
        mock.mockReset())
    Object.values(mocks.path).forEach(mock =>
        mock.mockReset())
    Object.values(mocks.yaml).forEach(mock =>
        mock.mockReset())
    Object.values(mocks.window).forEach(mock =>
        mock.mockReset())
}

export function setupFileSystemMocks(mocks: TestMocks): void {
    // Default implementations
    mocks.fileSystem.readFile.mockResolvedValue('file content')
    mocks.fileSystem.writeFile.mockResolvedValue(undefined)
    mocks.fileSystem.stat.mockResolvedValue({ type: 'file' as const })
    mocks.fileSystem.copyFile.mockResolvedValue(undefined)
}

export function setupPathMocks(mocks: TestMocks): void {
    // Default implementations
    mocks.path.dirname.mockImplementation((path: string) =>
        path.split('/').slice(0, -1).join('/') || '.')
    mocks.path.basename.mockImplementation((path: string) =>
        path.split('/').pop() || '')
    mocks.path.join.mockImplementation((...paths: string[]) =>
        paths.join('/'))
    mocks.path.resolve.mockImplementation((path: string) =>
        path)
}

export function setupYamlMocks(mocks: TestMocks): void {
    // Default implementations
    mocks.yaml.load.mockReturnValue({
        ProjectButler: {
            'packageJson-order': ['name', 'version', 'description', 'main', 'scripts', 'dependencies'],
        },
    })
}

export function setupWindowMocks(mocks: TestMocks): void {
    // Default implementations
    mocks.window.showInformationMessage.mockResolvedValue(undefined)
}

export function createMockFileSystem(): TestMocks['fileSystem'] {
    return {
        readFile: vi.fn(),
        writeFile: vi.fn(),
        stat: vi.fn(),
        copyFile: vi.fn(),
    }
}

export function createMockPathUtils(): TestMocks['path'] {
    return {
        dirname: vi.fn(),
        basename: vi.fn(),
        join: vi.fn(),
        resolve: vi.fn(),
    }
}

export function createMockYaml(): TestMocks['yaml'] {
    return {
        load: vi.fn(),
    }
}

// ============================================================================
// REUSABLE MOCK SCENARIOS
// ============================================================================

/**
 * Backup Management Mock Scenarios
 */

export interface BackupScenarioOptions {
    sourcePath: string
    backupPath: string
    baseName?: string
    directory?: string
}

export function setupBackupSuccessScenario(mocks: TestMocks, options: BackupScenarioOptions): void {
    const { sourcePath, backupPath, baseName, directory } = options
	
    mocks.path.basename.mockReturnValue(baseName || sourcePath.split('/').pop() || '')
    mocks.path.dirname.mockReturnValue(directory || sourcePath.split('/').slice(0, -1).join('/'))
    mocks.path.join.mockReturnValue(backupPath)
    mocks.fileSystem.stat.mockRejectedValue(new Error('File not found')) // Backup doesn't exist
    mocks.fileSystem.copyFile.mockResolvedValue(undefined)
}

export function setupBackupConflictScenario(mocks: TestMocks, options: BackupScenarioOptions): void {
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

export function setupBackupErrorScenario(mocks: TestMocks, options: BackupScenarioOptions, errorType: 'stat' | 'copy', errorMessage: string): void {
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

export function setupBackupStatErrorGracefulScenario(mocks: TestMocks, options: BackupScenarioOptions, errorMessage: string): void {
    const { sourcePath, backupPath, baseName, directory } = options
	
    mocks.path.basename.mockReturnValue(baseName || sourcePath.split('/').pop() || '')
    mocks.path.dirname.mockReturnValue(directory || sourcePath.split('/').slice(0, -1).join('/'))
    mocks.path.join.mockReturnValue(backupPath)
    mocks.fileSystem.stat.mockRejectedValue(new Error(errorMessage))
    mocks.fileSystem.copyFile.mockResolvedValue(undefined)
}

/**
 * Terminal Management Mock Scenarios
 */

export interface TerminalScenarioOptions {
    path: string
    expectedCommand: string
    directoryPath?: string
}

export function setupTerminalDirectoryScenario(mocks: TestMocks, options: TerminalScenarioOptions): void {
    const { path: _path, expectedCommand: _expectedCommand } = options
	
    mocks.fileSystem.stat.mockResolvedValue({ type: 'directory' })
}

export function setupTerminalFileScenario(mocks: TestMocks, options: TerminalScenarioOptions): void {
    const { path, expectedCommand: _expectedCommand, directoryPath } = options
	
    mocks.fileSystem.stat.mockResolvedValue({ type: 'file' })
    mocks.path.dirname.mockReturnValue(directoryPath || path.split('/').slice(0, -1).join('/'))
}

export function setupTerminalErrorScenario(mocks: TestMocks, options: TerminalScenarioOptions, errorMessage: string): void {
    mocks.fileSystem.stat.mockRejectedValue(new Error(errorMessage))
}

/**
 * Package JSON Formatting Mock Scenarios
 */

export interface PackageJsonScenarioOptions {
    packageJsonPath: string
    workspaceRoot: string
    configContent: string
    packageContent: string
    expectedOrder?: string[]
}

export function setupPackageJsonSuccessScenario(mocks: TestMocks, options: PackageJsonScenarioOptions): void {
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

export function setupPackageJsonConfigErrorScenario(mocks: TestMocks, options: PackageJsonScenarioOptions): void {
    const { configContent: _configContent } = options
	
    mocks.fileSystem.readFile.mockRejectedValueOnce(new Error('File not found'))
}

export function setupPackageJsonYamlErrorScenario(mocks: TestMocks, options: PackageJsonScenarioOptions): void {
    const { configContent } = options
	
    mocks.fileSystem.readFile.mockResolvedValueOnce(configContent)
    mocks.yaml.load.mockImplementation(() => {
        throw new Error('Invalid YAML')
    })
}

/**
 * Poetry Shell Mock Scenarios
 */

export function setupPoetryShellSuccessScenario(mocks: TestMocks, _projectPath: string): void {
    mocks.fileSystem.stat.mockResolvedValue({ type: 'directory' })
}

export function setupPoetryShellErrorScenario(mocks: TestMocks, projectPath: string, errorMessage: string): void {
    mocks.fileSystem.stat.mockRejectedValue(new Error(errorMessage))
}

/**
 * Cross-Platform Path Scenarios
 */

export function setupWindowsPathScenario(mocks: TestMocks, sourcePath: string, backupPath: string): void {
    const baseName = sourcePath.split('\\').pop() || ''
    const directory = sourcePath.split('\\').slice(0, -1).join('\\')
	
    mocks.path.basename.mockReturnValue(baseName)
    mocks.path.dirname.mockReturnValue(directory)
    mocks.path.join.mockReturnValue(backupPath)
    mocks.fileSystem.stat.mockRejectedValue(new Error('File not found'))
    mocks.fileSystem.copyFile.mockResolvedValue(undefined)
}

export function setupUnixPathScenario(mocks: TestMocks, sourcePath: string, backupPath: string): void {
    const baseName = sourcePath.split('/').pop() || ''
    const directory = sourcePath.split('/').slice(0, -1).join('/')
	
    mocks.path.basename.mockReturnValue(baseName)
    mocks.path.dirname.mockReturnValue(directory)
    mocks.path.join.mockReturnValue(backupPath)
    mocks.fileSystem.stat.mockRejectedValue(new Error('File not found'))
    mocks.fileSystem.copyFile.mockResolvedValue(undefined)
}

export function setupNetworkPathScenario(mocks: TestMocks, sourcePath: string, backupPath: string): void {
    const baseName = sourcePath.split('\\').pop() || ''
    const directory = sourcePath.split('\\').slice(0, -1).join('\\')
	
    mocks.path.basename.mockReturnValue(baseName)
    mocks.path.dirname.mockReturnValue(directory)
    mocks.path.join.mockReturnValue(backupPath)
    mocks.fileSystem.stat.mockRejectedValue(new Error('File not found'))
    mocks.fileSystem.copyFile.mockResolvedValue(undefined)
}

/**
 * Performance and Concurrency Scenarios
 */

export function setupConcurrentBackupScenario(mocks: TestMocks, sourcePaths: string[], backupPaths: string[]): void {
    sourcePaths.forEach((path, index) => {
        mocks.path.basename.mockReturnValueOnce(path.split('/').pop() || '')
        mocks.path.dirname.mockReturnValueOnce(path.split('/').slice(0, -1).join('/'))
        mocks.path.join.mockReturnValueOnce(backupPaths[index])
    })
    mocks.fileSystem.stat.mockRejectedValue(new Error('File not found'))
    mocks.fileSystem.copyFile.mockResolvedValue(undefined)
}

/**
 * Mock Builder Pattern for Complex Scenarios
 */

export class MockBuilder {

    constructor(private mocks: TestMocks) {}

    backup(options: BackupScenarioOptions): MockBuilder {
        setupBackupSuccessScenario(this.mocks, options)
        return this
    }

    backupConflict(options: BackupScenarioOptions): MockBuilder {
        setupBackupConflictScenario(this.mocks, options)
        return this
    }

    backupError(errorType: 'stat' | 'copy', errorMessage: string, options: BackupScenarioOptions): MockBuilder {
        setupBackupErrorScenario(this.mocks, options, errorType, errorMessage)
        return this
    }

    terminalDirectory(options: TerminalScenarioOptions): MockBuilder {
        setupTerminalDirectoryScenario(this.mocks, options)
        return this
    }

    terminalFile(options: TerminalScenarioOptions): MockBuilder {
        setupTerminalFileScenario(this.mocks, options)
        return this
    }

    packageJson(options: PackageJsonScenarioOptions): MockBuilder {
        setupPackageJsonSuccessScenario(this.mocks, options)
        return this
    }

    build(): TestMocks {
        return this.mocks
    }

}

export function createMockBuilder(mocks: TestMocks): MockBuilder {
    return new MockBuilder(mocks)
}