// Tool Package Mock Strategy Library
// Provides standardized mock interfaces and helpers for CLI tool packages

import { vi } from 'vitest'

export interface ToolTestMocks {
    fileSystem: {
        readFile: ReturnType<typeof vi.fn>
        writeFile: ReturnType<typeof vi.fn>
        stat: ReturnType<typeof vi.fn>
        copyFile: ReturnType<typeof vi.fn>
        access: ReturnType<typeof vi.fn>
        readdir: ReturnType<typeof vi.fn>
        mkdir: ReturnType<typeof vi.fn>
        rmdir: ReturnType<typeof vi.fn>
        unlink: ReturnType<typeof vi.fn>
    }
    path: {
        dirname: ReturnType<typeof vi.fn>
        basename: ReturnType<typeof vi.fn>
        join: ReturnType<typeof vi.fn>
        resolve: ReturnType<typeof vi.fn>
        extname: ReturnType<typeof vi.fn>
        sep: string
    }
    process: {
        argv: string[]
        exit: ReturnType<typeof vi.fn>
        env: Record<string, string>
        cwd: ReturnType<typeof vi.fn>
        platform: string
        stdin: {
            on: ReturnType<typeof vi.fn>
            read: ReturnType<typeof vi.fn>
        }
        stdout: {
            write: ReturnType<typeof vi.fn>
            end: ReturnType<typeof vi.fn>
        }
        stderr: {
            write: ReturnType<typeof vi.fn>
            end: ReturnType<typeof vi.fn>
        }
    }
    childProcess: {
        spawn: ReturnType<typeof vi.fn>
        spawnSync: ReturnType<typeof vi.fn>
        exec: ReturnType<typeof vi.fn>
        execSync: ReturnType<typeof vi.fn>
    }
    readline: {
        createInterface: ReturnType<typeof vi.fn>
    }
    fs: {
        createReadStream: ReturnType<typeof vi.fn>
        createWriteStream: ReturnType<typeof vi.fn>
        watch: ReturnType<typeof vi.fn>
        watchFile: ReturnType<typeof vi.fn>
        unwatchFile: ReturnType<typeof vi.fn>
    }
    os: {
        platform: ReturnType<typeof vi.fn>
        arch: ReturnType<typeof vi.fn>
        homedir: ReturnType<typeof vi.fn>
        tmpdir: ReturnType<typeof vi.fn>
        cpus: ReturnType<typeof vi.fn>
        freemem: ReturnType<typeof vi.fn>
        totalmem: ReturnType<typeof vi.fn>
    }
}

export function setupToolTestEnvironment(): ToolTestMocks {
    return {
        fileSystem: {
            readFile: vi.fn(),
            writeFile: vi.fn(),
            stat: vi.fn(),
            copyFile: vi.fn(),
            access: vi.fn(),
            readdir: vi.fn(),
            mkdir: vi.fn(),
            rmdir: vi.fn(),
            unlink: vi.fn(),
        },
        path: {
            dirname: vi.fn(),
            basename: vi.fn(),
            join: vi.fn(),
            resolve: vi.fn(),
            extname: vi.fn(),
            sep: '/',
        },
        process: {
            argv: ['node', 'tool.js'],
            exit: vi.fn(),
            env: {},
            cwd: vi.fn(),
            platform: 'linux',
            stdin: {
                on: vi.fn(),
                read: vi.fn(),
            },
            stdout: {
                write: vi.fn(),
                end: vi.fn(),
            },
            stderr: {
                write: vi.fn(),
                end: vi.fn(),
            },
        },
        childProcess: {
            spawn: vi.fn(),
            spawnSync: vi.fn(),
            exec: vi.fn(),
            execSync: vi.fn(),
        },
        readline: {
            createInterface: vi.fn(),
        },
        fs: {
            createReadStream: vi.fn(),
            createWriteStream: vi.fn(),
            watch: vi.fn(),
            watchFile: vi.fn(),
            unwatchFile: vi.fn(),
        },
        os: {
            platform: vi.fn(),
            arch: vi.fn(),
            homedir: vi.fn(),
            tmpdir: vi.fn(),
            cpus: vi.fn(),
            freemem: vi.fn(),
            totalmem: vi.fn(),
        },
    }
}

export function setupToolFileSystemMocks(mocks: ToolTestMocks): void {
    mocks.fileSystem.readFile.mockResolvedValue('file content')
    mocks.fileSystem.writeFile.mockResolvedValue(undefined)
    mocks.fileSystem.stat.mockResolvedValue({ type: 'file' as const })
    mocks.fileSystem.copyFile.mockResolvedValue(undefined)
    mocks.fileSystem.access.mockResolvedValue(undefined)
    mocks.fileSystem.readdir.mockResolvedValue([])
    mocks.fileSystem.mkdir.mockResolvedValue(undefined)
    mocks.fileSystem.rmdir.mockResolvedValue(undefined)
    mocks.fileSystem.unlink.mockResolvedValue(undefined)
}

export function setupToolProcessMocks(mocks: ToolTestMocks): void {
    mocks.process.cwd.mockReturnValue('/test/workspace')
    mocks.process.exit.mockImplementation((code?: number) => {
        throw new Error(`process.exit called with code: ${code}`)
    })
    mocks.process.env = { NODE_ENV: 'test' }
    mocks.process.stdout.write.mockReturnValue(true)
    mocks.process.stderr.write.mockReturnValue(true)
}

export function setupToolChildProcessMocks(mocks: ToolTestMocks): void {
    mocks.childProcess.spawn.mockReturnValue({
        pid: 12345,
        stdout: { on: vi.fn() },
        stderr: { on: vi.fn() },
        on: vi.fn(),
        kill: vi.fn(),
    } as any)
    
    mocks.childProcess.spawnSync.mockReturnValue({
        status: 0,
        stdout: Buffer.from(''),
        stderr: Buffer.from(''),
        error: undefined,
    })
    
    mocks.childProcess.exec.mockImplementation((command, callback) => {
        if (callback) {
            callback(null, 'output', '')
        }
        return { pid: 12345 } as any
    })
    
    mocks.childProcess.execSync.mockReturnValue(Buffer.from('output'))
}

export function setupToolReadlineMocks(mocks: ToolTestMocks): void {
    const mockInterface = {
        question: vi.fn(),
        close: vi.fn(),
        on: vi.fn(),
        write: vi.fn(),
    }
    
    mocks.readline.createInterface.mockReturnValue(mockInterface as any)
}

export function setupToolFileStreamMocks(mocks: ToolTestMocks): void {
    const mockReadStream = {
        on: vi.fn(),
        pipe: vi.fn(),
        close: vi.fn(),
        destroy: vi.fn(),
    }
    
    const mockWriteStream = {
        write: vi.fn(),
        end: vi.fn(),
        close: vi.fn(),
        destroy: vi.fn(),
        on: vi.fn(),
    }
    
    mocks.fs.createReadStream.mockReturnValue(mockReadStream as any)
    mocks.fs.createWriteStream.mockReturnValue(mockWriteStream as any)
    mocks.fs.watch.mockReturnValue({ close: vi.fn() } as any)
    mocks.fs.watchFile.mockReturnValue(undefined)
    mocks.fs.unwatchFile.mockReturnValue(undefined)
}

export function resetToolMocks(mocks: ToolTestMocks): void {
    Object.values(mocks.fileSystem).forEach((mock) => mock.mockReset())
    Object.values(mocks.path).forEach((mock) => {
        if (typeof mock === 'function') {
            mock.mockReset()
        }
    })
    Object.values(mocks.process).forEach((mock) => {
        if (typeof mock === 'function') {
            mock.mockReset()
        } else if (typeof mock === 'object' && mock !== null) {
            Object.values(mock).forEach((subMock) => {
                if (typeof subMock === 'function') {
                    subMock.mockReset()
                }
            })
        }
    })
    Object.values(mocks.childProcess).forEach((mock) => mock.mockReset())
    Object.values(mocks.readline).forEach((mock) => mock.mockReset())
    Object.values(mocks.fs).forEach((mock) => mock.mockReset())
    Object.values(mocks.os).forEach((mock) => mock.mockReset())
}

// CLI Interaction Scenarios
export interface CliInteractionScenarioOptions {
    input?: string
    output?: string
    error?: string
    exitCode?: number
}

export function setupCliSuccessScenario(
    mocks: ToolTestMocks,
    options: CliInteractionScenarioOptions = {}
): void {
    const { input = 'test input', output = 'test output', exitCode = 0 } = options

    // Mock readline interface
    const mockInterface = {
        question: vi.fn().mockImplementation((prompt, callback) => {
            callback(input)
        }),
        close: vi.fn(),
        on: vi.fn(),
        write: vi.fn(),
    }
    
    mocks.readline.createInterface.mockReturnValue(mockInterface as any)
    
    // Mock process stdout
    mocks.process.stdout.write.mockImplementation((data) => {
        return true
    })
    
    // Mock process exit
    mocks.process.exit.mockImplementation((code?: number) => {
        throw new Error(`process.exit called with code: ${code}`)
    })
}

export function setupCliErrorScenario(
    mocks: ToolTestMocks,
    options: CliInteractionScenarioOptions = {}
): void {
    const { error = 'CLI error', exitCode = 1 } = options

    // Mock process stderr
    mocks.process.stderr.write.mockImplementation((data) => {
        return true
    })
    
    // Mock process exit with error code
    mocks.process.exit.mockImplementation((code?: number) => {
        throw new Error(`process.exit called with code: ${code}`)
    })
}

// File Processing Scenarios
export interface ToolFileProcessingScenarioOptions {
    sourcePath: string
    targetPath?: string
    content?: string
    shouldExist?: boolean
    fileType?: 'file' | 'directory'
}

export function setupToolFileProcessingScenario(
    mocks: ToolTestMocks,
    options: ToolFileProcessingScenarioOptions
): void {
    const { sourcePath, targetPath, content = 'processed content' } = options

    mocks.fileSystem.readFile.mockResolvedValue(content)
    mocks.fileSystem.writeFile.mockResolvedValue(undefined)
    mocks.fileSystem.stat.mockResolvedValue({ type: 'file' as const })
}

// Fluent Builder Pattern
export class ToolMockBuilder {
    constructor(private mocks: ToolTestMocks) {}

    cliSuccess(options: CliInteractionScenarioOptions = {}): ToolMockBuilder {
        setupCliSuccessScenario(this.mocks, options)
        return this
    }

    cliError(options: CliInteractionScenarioOptions = {}): ToolMockBuilder {
        setupCliErrorScenario(this.mocks, options)
        return this
    }

    fileProcessing(options: ToolFileProcessingScenarioOptions): ToolMockBuilder {
        setupToolFileProcessingScenario(this.mocks, options)
        return this
    }

    windowsPath(): ToolMockBuilder {
        this.mocks.path.sep = '\\'
        this.mocks.path.join.mockImplementation((...paths: string[]) => paths.join('\\'))
        this.mocks.path.dirname.mockImplementation(
            (path: string) => path.split('\\').slice(0, -1).join('\\') || '.'
        )
        this.mocks.os.platform.mockReturnValue('win32')
        return this
    }

    unixPath(): ToolMockBuilder {
        this.mocks.path.sep = '/'
        this.mocks.path.join.mockImplementation((...paths: string[]) => paths.join('/'))
        this.mocks.path.dirname.mockImplementation(
            (path: string) => path.split('/').slice(0, -1).join('/') || '.'
        )
        this.mocks.os.platform.mockReturnValue('linux')
        return this
    }

    build(): ToolTestMocks {
        return this.mocks
    }
}

export function createToolMockBuilder(mocks: ToolTestMocks): ToolMockBuilder {
    return new ToolMockBuilder(mocks)
}

