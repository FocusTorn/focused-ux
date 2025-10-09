// General Mock Strategy Library
// Provides standardized mock interfaces and helpers for Node.js built-ins and general system modules

import { vi } from 'vitest'

export interface GeneralTestMocks {
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
    }
    os: {
        platform: ReturnType<typeof vi.fn>
        homedir: ReturnType<typeof vi.fn>
        tmpdir: ReturnType<typeof vi.fn>
        userInfo: ReturnType<typeof vi.fn>
    }
    process: {
        cwd: ReturnType<typeof vi.fn>
        exit: ReturnType<typeof vi.fn>
        nextTick: ReturnType<typeof vi.fn>
    }
    childProcess: {
        spawn: ReturnType<typeof vi.fn>
        exec: ReturnType<typeof vi.fn>
        execSync: ReturnType<typeof vi.fn>
        spawnSync: ReturnType<typeof vi.fn>
    }
}

export function setupGeneralTestEnvironment(): GeneralTestMocks {
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
        },
        os: {
            platform: vi.fn(),
            homedir: vi.fn(),
            tmpdir: vi.fn(),
            userInfo: vi.fn(),
        },
        process: {
            cwd: vi.fn(),
            exit: vi.fn(),
            nextTick: vi.fn(),
        },
        childProcess: {
            spawn: vi.fn(),
            exec: vi.fn(),
            execSync: vi.fn(),
            spawnSync: vi.fn(),
        },
    }
}

export function setupFileSystemMocks(mocks: GeneralTestMocks): void {
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

export function setupPathMocks(mocks: GeneralTestMocks): void {
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

export function setupOsMocks(mocks: GeneralTestMocks): void {
    mocks.os.platform.mockReturnValue('win32')
    mocks.os.homedir.mockReturnValue('/home/user')
    mocks.os.tmpdir.mockReturnValue('/tmp')
    mocks.os.userInfo.mockReturnValue({
        username: 'testuser',
        uid: 1000,
        gid: 1000,
        shell: '/bin/bash',
        homedir: '/home/testuser'
    })
}

export function setupProcessMocks(mocks: GeneralTestMocks): void {
    mocks.process.cwd.mockReturnValue('/current/working/directory')
    mocks.process.exit.mockImplementation(() => {
        throw new Error('process.exit() called')
    })
    mocks.process.nextTick.mockImplementation((callback: () => void) => {
        setTimeout(callback, 0)
    })
}

export function setupChildProcessMocks(mocks: GeneralTestMocks): void {
    mocks.childProcess.spawn.mockReturnValue({
        stdout: { on: vi.fn() },
        stderr: { on: vi.fn() },
        on: vi.fn(),
        kill: vi.fn(),
        pid: 12345
    } as any)
    
    mocks.childProcess.exec.mockImplementation((command, callback) => {
        if (callback) {
            callback(null, 'command output', '')
        }
        return {} as any
    })
    
    mocks.childProcess.execSync.mockReturnValue(Buffer.from('command output'))
    
    mocks.childProcess.spawnSync.mockReturnValue({
        status: 0,
        signal: null,
        output: [null, Buffer.from('command output'), Buffer.from('')],
        stdout: Buffer.from('command output'),
        stderr: Buffer.from(''),
        pid: 12345
    })
}

export function resetGeneralMocks(mocks: GeneralTestMocks): void {
    Object.values(mocks.fileSystem).forEach((mock) => mock.mockReset())
    Object.values(mocks.path).forEach((mock) => mock.mockReset())
    Object.values(mocks.os).forEach((mock) => mock.mockReset())
    Object.values(mocks.process).forEach((mock) => mock.mockReset())
    Object.values(mocks.childProcess).forEach((mock) => mock.mockReset())
}

// File System Scenarios
export interface FileSystemScenarioOptions {
    sourcePath: string
    targetPath?: string
    shouldExist?: boolean
    content?: string
    fileType?: 'file' | 'directory'
}

export function setupFileReadScenario(
    mocks: GeneralTestMocks,
    options: FileSystemScenarioOptions
): void {
    const { sourcePath, content = 'file content' } = options
    mocks.fileSystem.readFile.mockResolvedValue(content)
    mocks.fileSystem.stat.mockResolvedValue({ type: 'file' as const })
}

export function setupFileWriteScenario(
    mocks: GeneralTestMocks,
    options: FileSystemScenarioOptions
): void {
    const { targetPath } = options
    mocks.fileSystem.writeFile.mockResolvedValue(undefined)
    mocks.fileSystem.stat.mockResolvedValue({ type: 'file' as const })
}

export function setupFileCopyScenario(
    mocks: GeneralTestMocks,
    options: FileSystemScenarioOptions
): void {
    const { sourcePath, targetPath } = options
    mocks.fileSystem.copyFile.mockResolvedValue(undefined)
    mocks.fileSystem.stat.mockResolvedValue({ type: 'file' as const })
}

export function setupFileDeleteScenario(
    mocks: GeneralTestMocks,
    options: FileSystemScenarioOptions
): void {
    const { targetPath } = options
    mocks.fileSystem.unlink.mockResolvedValue(undefined)
    mocks.fileSystem.stat.mockRejectedValue(new Error('File not found'))
}

export function setupFileSystemErrorScenario(
    mocks: GeneralTestMocks,
    operation: 'read' | 'write' | 'copy' | 'delete' | 'mkdir',
    errorMessage: string,
    options: FileSystemScenarioOptions
): void {
    switch (operation) {
        case 'read':
            mocks.fileSystem.readFile.mockRejectedValue(new Error(errorMessage))
            break
        case 'write':
            mocks.fileSystem.writeFile.mockRejectedValue(new Error(errorMessage))
            break
        case 'copy':
            mocks.fileSystem.copyFile.mockRejectedValue(new Error(errorMessage))
            break
        case 'delete':
            mocks.fileSystem.unlink.mockRejectedValue(new Error(errorMessage))
            break
        case 'mkdir':
            mocks.fileSystem.mkdir.mockRejectedValue(new Error(errorMessage))
            break
    }
}

// Path Scenarios
export function setupWindowsPathScenario(
    mocks: GeneralTestMocks,
    sourcePath: string,
    targetPath: string
): void {
    mocks.path.join.mockImplementation((...paths: string[]) => paths.join('\\'))
    mocks.path.dirname.mockImplementation(
        (path: string) => path.split('\\').slice(0, -1).join('\\') || '.'
    )
    mocks.path.basename.mockImplementation((path: string) => path.split('\\').pop() || '')
}

export function setupUnixPathScenario(
    mocks: GeneralTestMocks,
    sourcePath: string,
    targetPath: string
): void {
    mocks.path.join.mockImplementation((...paths: string[]) => paths.join('/'))
    mocks.path.dirname.mockImplementation(
        (path: string) => path.split('/').slice(0, -1).join('/') || '.'
    )
    mocks.path.basename.mockImplementation((path: string) => path.split('/').pop() || '')
}

// Fluent Builder Pattern
export class GeneralMockBuilder {
    constructor(protected mocks: GeneralTestMocks) {}

    fileRead(options: FileSystemScenarioOptions): GeneralMockBuilder {
        setupFileReadScenario(this.mocks, options)
        return this
    }

    fileWrite(options: FileSystemScenarioOptions): GeneralMockBuilder {
        setupFileWriteScenario(this.mocks, options)
        return this
    }

    fileCopy(options: FileSystemScenarioOptions): GeneralMockBuilder {
        setupFileCopyScenario(this.mocks, options)
        return this
    }

    fileDelete(options: FileSystemScenarioOptions): GeneralMockBuilder {
        setupFileDeleteScenario(this.mocks, options)
        return this
    }

    fileSystemError(
        operation: 'read' | 'write' | 'copy' | 'delete' | 'mkdir',
        errorMessage: string,
        options: FileSystemScenarioOptions
    ): GeneralMockBuilder {
        setupFileSystemErrorScenario(this.mocks, operation, errorMessage, options)
        return this
    }

    windowsPath(sourcePath: string, targetPath: string): GeneralMockBuilder {
        setupWindowsPathScenario(this.mocks, sourcePath, targetPath)
        return this
    }

    unixPath(sourcePath: string, targetPath: string): GeneralMockBuilder {
        setupUnixPathScenario(this.mocks, sourcePath, targetPath)
        return this
    }

    build(): GeneralTestMocks {
        return this.mocks
    }
}

export function createGeneralMockBuilder(mocks: GeneralTestMocks): GeneralMockBuilder {
    return new GeneralMockBuilder(mocks)
}
