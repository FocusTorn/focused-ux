import { vi } from 'vitest'

export interface DynamiconsAssetsTestMocks {
    fileSystem: {
        readdir: ReturnType<typeof vi.fn>
        readFile: ReturnType<typeof vi.fn>
        writeFile: ReturnType<typeof vi.fn>
        mkdir: ReturnType<typeof vi.fn>
        access: ReturnType<typeof vi.fn>
        stat: ReturnType<typeof vi.fn>
        rename: ReturnType<typeof vi.fn>
        copyFile: ReturnType<typeof vi.fn>
        unlink: ReturnType<typeof vi.fn>
        appendFile: ReturnType<typeof vi.fn>
    }
    path: {
        join: ReturnType<typeof vi.fn>
        extname: ReturnType<typeof vi.fn>
        resolve: ReturnType<typeof vi.fn>
        dirname: ReturnType<typeof vi.fn>
        basename: ReturnType<typeof vi.fn>
    }
    childProcess: {
        exec: ReturnType<typeof vi.fn>
    }
    util: {
        promisify: ReturnType<typeof vi.fn>
    }
}

export function setupTestEnvironment(): DynamiconsAssetsTestMocks {
    return {
        fileSystem: {
            readdir: vi.fn(),
            readFile: vi.fn(),
            writeFile: vi.fn(),
            mkdir: vi.fn(),
            access: vi.fn(),
            stat: vi.fn(),
            rename: vi.fn(),
            copyFile: vi.fn(),
            unlink: vi.fn(),
            appendFile: vi.fn(),
        },
        path: {
            join: vi.fn(),
            extname: vi.fn(),
            resolve: vi.fn(),
            dirname: vi.fn(),
            basename: vi.fn(),
        },
        childProcess: {
            exec: vi.fn(),
        },
        util: {
            promisify: vi.fn(),
        },
    }
}

export function resetAllMocks(mocks: DynamiconsAssetsTestMocks): void {
    vi.clearAllMocks()
    // Reset individual mocks if they have specific implementations that need to be cleared
    mocks.fileSystem.readdir.mockReset()
    mocks.fileSystem.readFile.mockReset()
    mocks.fileSystem.writeFile.mockReset()
    mocks.fileSystem.mkdir.mockReset()
    mocks.fileSystem.access.mockReset()
    mocks.fileSystem.stat.mockReset()
    mocks.fileSystem.rename.mockReset()
    mocks.fileSystem.copyFile.mockReset()
    mocks.fileSystem.unlink.mockReset()
    mocks.fileSystem.appendFile.mockReset()
    mocks.path.join.mockReset()
    mocks.path.extname.mockReset()
    mocks.path.resolve.mockReset()
    mocks.path.dirname.mockReset()
    mocks.path.basename.mockReset()
    mocks.childProcess.exec.mockReset()
    mocks.util.promisify.mockReset()
}

export function setupFileSystemMocks(mocks: DynamiconsAssetsTestMocks): void {
    mocks.fileSystem.readdir.mockResolvedValue([])
    mocks.fileSystem.readFile.mockResolvedValue('file content')
    mocks.fileSystem.writeFile.mockResolvedValue(undefined)
    mocks.fileSystem.mkdir.mockResolvedValue(undefined)
    mocks.fileSystem.access.mockResolvedValue(undefined)
    mocks.fileSystem.stat.mockResolvedValue({ isFile: () => true, isDirectory: () => false } as any)
    mocks.fileSystem.rename.mockResolvedValue(undefined)
    mocks.fileSystem.copyFile.mockResolvedValue(undefined)
    mocks.fileSystem.unlink.mockResolvedValue(undefined)
    mocks.fileSystem.appendFile.mockResolvedValue(undefined)
}

export function setupPathMocks(mocks: DynamiconsAssetsTestMocks): void {
    mocks.path.join.mockImplementation((...paths: string[]) => paths.join('/'))
    mocks.path.extname.mockImplementation((file: string) => {
        const lastDot = file.lastIndexOf('.')
        return lastDot === -1 ? '' : file.substring(lastDot)
    })
    mocks.path.resolve.mockImplementation((...args: string[]) => args.join('/'))
    mocks.path.dirname.mockImplementation((file: string) => file.substring(0, file.lastIndexOf('/')))
    mocks.path.basename.mockImplementation((file: string) => file.split('/').pop() || '')
}

export function setupChildProcessMocks(mocks: DynamiconsAssetsTestMocks): void {
    mocks.childProcess.exec.mockImplementation((command: string, callback: any) => {
        // Simulate successful execution
        callback(null, { stdout: 'success', stderr: '' })
    })
}

export function setupUtilMocks(mocks: DynamiconsAssetsTestMocks): void {
    mocks.util.promisify.mockImplementation((fn: any) => fn)
}

export function createMockFileSystem(): DynamiconsAssetsTestMocks['fileSystem'] {
    return {
        readdir: vi.fn().mockResolvedValue([]),
        readFile: vi.fn().mockResolvedValue('file content'),
        writeFile: vi.fn().mockResolvedValue(undefined),
        mkdir: vi.fn().mockResolvedValue(undefined),
        access: vi.fn().mockResolvedValue(undefined),
        stat: vi.fn().mockResolvedValue({ isFile: () => true, isDirectory: () => false } as any),
        rename: vi.fn().mockResolvedValue(undefined),
        copyFile: vi.fn().mockResolvedValue(undefined),
        unlink: vi.fn().mockResolvedValue(undefined),
        appendFile: vi.fn().mockResolvedValue(undefined),
    }
}

export function createMockPath(): DynamiconsAssetsTestMocks['path'] {
    return {
        join: vi.fn().mockImplementation((...paths: string[]) => paths.join('/')),
        extname: vi.fn().mockImplementation((file: string) => {
            const lastDot = file.lastIndexOf('.')
            return lastDot === -1 ? '' : file.substring(lastDot)
        }),
        resolve: vi.fn().mockImplementation((...args: string[]) => args.join('/')),
        dirname: vi.fn().mockImplementation((file: string) => file.substring(0, file.lastIndexOf('/'))),
        basename: vi.fn().mockImplementation((file: string) => file.split('/').pop() || ''),
    }
}

export function createMockChildProcess(): DynamiconsAssetsTestMocks['childProcess'] {
    return {
        exec: vi.fn().mockImplementation((command: string, callback: any) => {
            callback(null, { stdout: 'success', stderr: '' })
        }),
    }
}

export function createMockUtil(): DynamiconsAssetsTestMocks['util'] {
    return {
        promisify: vi.fn().mockImplementation((fn: any) => fn),
    }
}
