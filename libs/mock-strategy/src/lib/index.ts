// Shared Library Mock Strategy Library
// Provides standardized mock interfaces and helpers for shared utility packages

import { vi } from 'vitest'

export interface LibTestMocks {
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
    }
    childProcess: {
        spawn: ReturnType<typeof vi.fn>
        spawnSync: ReturnType<typeof vi.fn>
        exec: ReturnType<typeof vi.fn>
        execSync: ReturnType<typeof vi.fn>
    }
    util: {
        promisify: ReturnType<typeof vi.fn>
        inspect: ReturnType<typeof vi.fn>
    }
    os: {
        platform: ReturnType<typeof vi.fn>
        arch: ReturnType<typeof vi.fn>
        homedir: ReturnType<typeof vi.fn>
        tmpdir: ReturnType<typeof vi.fn>
    }
}

export function setupLibTestEnvironment(): LibTestMocks {
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
            argv: ['node', 'script.js'],
            exit: vi.fn(),
            env: {},
            cwd: vi.fn(),
            platform: 'linux',
        },
        childProcess: {
            spawn: vi.fn(),
            spawnSync: vi.fn(),
            exec: vi.fn(),
            execSync: vi.fn(),
        },
        util: {
            promisify: vi.fn(),
            inspect: vi.fn(),
        },
        os: {
            platform: vi.fn(),
            arch: vi.fn(),
            homedir: vi.fn(),
            tmpdir: vi.fn(),
        },
    }
}

export function setupLibFileSystemMocks(mocks: LibTestMocks): void {
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

export function setupLibPathMocks(mocks: LibTestMocks): void {
    mocks.path.dirname.mockImplementation(
        (path: string) => path.split('/').slice(0, -1).join('/') || '.'
    )
    mocks.path.basename.mockImplementation((path: string) => path.split('/').pop() || '')
    mocks.path.join.mockImplementation((...paths: string[]) => paths.join('/'))
    mocks.path.resolve.mockImplementation((path: string) => path)
    mocks.path.extname.mockImplementation((path: string) => {
        const lastDot = path.lastIndexOf('.')
        return lastDot === -1 ? '' : path.slice(lastDot)
    })
}

export function setupLibProcessMocks(mocks: LibTestMocks): void {
    mocks.process.cwd.mockReturnValue('/test/workspace')
    mocks.process.exit.mockImplementation((code?: number) => {
        throw new Error(`process.exit called with code: ${code}`)
    })
    mocks.process.env = { NODE_ENV: 'test' }
}

export function setupLibChildProcessMocks(mocks: LibTestMocks): void {
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

export function resetLibMocks(mocks: LibTestMocks): void {
    Object.values(mocks.fileSystem).forEach((mock) => mock.mockReset())
    Object.values(mocks.path).forEach((mock) => {
        if (typeof mock === 'function') {
            mock.mockReset()
        }
    })
    Object.values(mocks.process).forEach((mock) => {
        if (typeof mock === 'function') {
            mock.mockReset()
        }
    })
    Object.values(mocks.childProcess).forEach((mock) => mock.mockReset())
    Object.values(mocks.util).forEach((mock) => mock.mockReset())
    Object.values(mocks.os).forEach((mock) => mock.mockReset())
}

// Process Execution Scenarios
export interface ProcessExecutionScenarioOptions {
    command: string
    args?: string[]
    shouldSucceed?: boolean
    exitCode?: number
    stdout?: string
    stderr?: string
    error?: string
}

export function setupProcessSuccessScenario(
    mocks: LibTestMocks,
    options: ProcessExecutionScenarioOptions
): void {
    const {
        command,
        args = [],
        exitCode = 0,
        stdout = 'success output',
        stderr = '',
    } = options

    mocks.childProcess.spawnSync.mockReturnValue({
        status: exitCode,
        stdout: Buffer.from(stdout),
        stderr: Buffer.from(stderr),
        error: undefined,
    })
}

export function setupProcessErrorScenario(
    mocks: LibTestMocks,
    options: ProcessExecutionScenarioOptions
): void {
    const {
        command,
        args = [],
        exitCode = 1,
        stdout = '',
        stderr = 'error output',
        error = 'Process failed',
    } = options

    mocks.childProcess.spawnSync.mockReturnValue({
        status: exitCode,
        stdout: Buffer.from(stdout),
        stderr: Buffer.from(stderr),
        error: new Error(error),
    })
}

// File System Scenarios
export interface LibFileSystemScenarioOptions {
    sourcePath: string
    targetPath?: string
    content?: string
    shouldExist?: boolean
    fileType?: 'file' | 'directory'
}

export function setupLibFileReadScenario(
    mocks: LibTestMocks,
    options: LibFileSystemScenarioOptions
): void {
    const { sourcePath, content = 'file content' } = options

    mocks.fileSystem.readFile.mockResolvedValue(content)
    mocks.fileSystem.stat.mockResolvedValue({ type: 'file' as const })
}

export function setupLibFileWriteScenario(
    mocks: LibTestMocks,
    options: LibFileSystemScenarioOptions
): void {
    const { targetPath } = options

    mocks.fileSystem.writeFile.mockResolvedValue(undefined)
    mocks.fileSystem.stat.mockResolvedValue({ type: 'file' as const })
}

// Fluent Builder Pattern
export class LibMockBuilder {
    constructor(private mocks: LibTestMocks) {}

    processSuccess(options: ProcessExecutionScenarioOptions): LibMockBuilder {
        setupProcessSuccessScenario(this.mocks, options)
        return this
    }

    processError(options: ProcessExecutionScenarioOptions): LibMockBuilder {
        setupProcessErrorScenario(this.mocks, options)
        return this
    }

    fileRead(options: LibFileSystemScenarioOptions): LibMockBuilder {
        setupLibFileReadScenario(this.mocks, options)
        return this
    }

    fileWrite(options: LibFileSystemScenarioOptions): LibMockBuilder {
        setupLibFileWriteScenario(this.mocks, options)
        return this
    }

    windowsPath(): LibMockBuilder {
        this.mocks.path.sep = '\\'
        this.mocks.path.join.mockImplementation((...paths: string[]) => paths.join('\\'))
        this.mocks.path.dirname.mockImplementation(
            (path: string) => path.split('\\').slice(0, -1).join('\\') || '.'
        )
        return this
    }

    unixPath(): LibMockBuilder {
        this.mocks.path.sep = '/'
        this.mocks.path.join.mockImplementation((...paths: string[]) => paths.join('/'))
        this.mocks.path.dirname.mockImplementation(
            (path: string) => path.split('/').slice(0, -1).join('/') || '.'
        )
        return this
    }

    build(): LibTestMocks {
        return this.mocks
    }
}

export function createLibMockBuilder(mocks: LibTestMocks): LibMockBuilder {
    return new LibMockBuilder(mocks)
}

