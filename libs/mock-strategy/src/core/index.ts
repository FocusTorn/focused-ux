// Core Package Mock Strategy Library
// Provides standardized mock interfaces and helpers for business logic packages

import { vi } from 'vitest'

export interface CoreTestMocks {
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
    yaml?: {
        load: ReturnType<typeof vi.fn>
    }
    buffer?: {
        from: ReturnType<typeof vi.fn>
    }
}

export function setupCoreTestEnvironment(): CoreTestMocks {
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
    }
}

export function setupFileSystemMocks(mocks: CoreTestMocks): void {
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

export function setupPathMocks(mocks: CoreTestMocks): void {
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

export function resetCoreMocks(mocks: CoreTestMocks): void {
    Object.values(mocks.fileSystem).forEach((mock) => mock.mockReset())
    Object.values(mocks.path).forEach((mock) => mock.mockReset())
    if (mocks.yaml) mocks.yaml.load.mockReset()
    if (mocks.buffer) mocks.buffer.from.mockReset()
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
    mocks: CoreTestMocks,
    options: FileSystemScenarioOptions
): void {
    const { sourcePath, content = 'file content' } = options

    mocks.fileSystem.readFile.mockResolvedValue(content)
    mocks.fileSystem.stat.mockResolvedValue({ type: 'file' as const })
}

export function setupFileWriteScenario(
    mocks: CoreTestMocks,
    options: FileSystemScenarioOptions
): void {
    const { targetPath } = options

    mocks.fileSystem.writeFile.mockResolvedValue(undefined)
    mocks.fileSystem.stat.mockResolvedValue({ type: 'file' as const })
}

export function setupFileCopyScenario(
    mocks: CoreTestMocks,
    options: FileSystemScenarioOptions
): void {
    const { sourcePath, targetPath } = options

    mocks.fileSystem.copyFile.mockResolvedValue(undefined)
    mocks.fileSystem.stat.mockResolvedValue({ type: 'file' as const })
}

export function setupFileDeleteScenario(
    mocks: CoreTestMocks,
    options: FileSystemScenarioOptions
): void {
    const { targetPath } = options

    mocks.fileSystem.unlink.mockResolvedValue(undefined)
    mocks.fileSystem.stat.mockRejectedValue(new Error('File not found'))
}

export function setupFileSystemErrorScenario(
    mocks: CoreTestMocks,
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
    mocks: CoreTestMocks,
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
    mocks: CoreTestMocks,
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
export class CoreMockBuilder {

    constructor(private mocks: CoreTestMocks) {}

    fileRead(options: FileSystemScenarioOptions): CoreMockBuilder {
        setupFileReadScenario(this.mocks, options)
        return this
    }

    fileWrite(options: FileSystemScenarioOptions): CoreMockBuilder {
        setupFileWriteScenario(this.mocks, options)
        return this
    }

    fileCopy(options: FileSystemScenarioOptions): CoreMockBuilder {
        setupFileCopyScenario(this.mocks, options)
        return this
    }

    fileDelete(options: FileSystemScenarioOptions): CoreMockBuilder {
        setupFileDeleteScenario(this.mocks, options)
        return this
    }

    fileSystemError(
        operation: 'read' | 'write' | 'copy' | 'delete' | 'mkdir',
        errorMessage: string,
        options: FileSystemScenarioOptions
    ): CoreMockBuilder {
        setupFileSystemErrorScenario(this.mocks, operation, errorMessage, options)
        return this
    }

    windowsPath(sourcePath: string, targetPath: string): CoreMockBuilder {
        setupWindowsPathScenario(this.mocks, sourcePath, targetPath)
        return this
    }

    unixPath(sourcePath: string, targetPath: string): CoreMockBuilder {
        setupUnixPathScenario(this.mocks, sourcePath, targetPath)
        return this
    }

    build(): CoreTestMocks {
        return this.mocks
    }

}

export function createCoreMockBuilder(mocks: CoreTestMocks): CoreMockBuilder {
    return new CoreMockBuilder(mocks)
}