import { vi } from 'vitest'
import { NoteHubCoreTestMocks } from './helpers'

// File System Scenarios
export interface FileSystemScenarioOptions {
    sourcePath: string
    targetPath: string
    shouldExist?: boolean
    content?: string
    fileType?: 'file' | 'directory'
}

export function setupFileReadScenario(
    mocks: NoteHubCoreTestMocks,
    options: FileSystemScenarioOptions
): void {
    const { sourcePath, content = 'file content' } = options

    mocks.fileSystem.readFile.mockResolvedValue(content)
    mocks.fileSystem.stat.mockResolvedValue({ type: 'file' as const })
}

export function setupFileWriteScenario(
    mocks: NoteHubCoreTestMocks,
    options: FileSystemScenarioOptions
): void {
    const { targetPath } = options

    mocks.fileSystem.writeFile.mockResolvedValue(undefined)
    mocks.fileSystem.stat.mockResolvedValue({ type: 'file' as const })
}

export function setupDirectoryCreateScenario(
    mocks: NoteHubCoreTestMocks,
    options: FileSystemScenarioOptions
): void {
    const { targetPath } = options

    mocks.fileSystem.mkdir.mockResolvedValue(undefined)
    mocks.fileSystem.stat.mockResolvedValue({ type: 'directory' as const })
}

export function setupFileCopyScenario(
    mocks: NoteHubCoreTestMocks,
    options: FileSystemScenarioOptions
): void {
    const { sourcePath, targetPath } = options

    mocks.fileSystem.copyFile.mockResolvedValue(undefined)
    mocks.fileSystem.stat.mockResolvedValue({ type: 'file' as const })
}

export function setupFileDeleteScenario(
    mocks: NoteHubCoreTestMocks,
    options: FileSystemScenarioOptions
): void {
    const { targetPath } = options

    mocks.fileSystem.unlink.mockResolvedValue(undefined)
    mocks.fileSystem.stat.mockRejectedValue(new Error('File not found'))
}

export function setupFileSystemErrorScenario(
    mocks: NoteHubCoreTestMocks,
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
    mocks: NoteHubCoreTestMocks,
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
    mocks: NoteHubCoreTestMocks,
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
export class NoteHubMockBuilder {
    constructor(private mocks: NoteHubCoreTestMocks) {}

    fileRead(options: FileSystemScenarioOptions): NoteHubMockBuilder {
        setupFileReadScenario(this.mocks, options)
        return this
    }

    fileWrite(options: FileSystemScenarioOptions): NoteHubMockBuilder {
        setupFileWriteScenario(this.mocks, options)
        return this
    }

    directoryCreate(options: FileSystemScenarioOptions): NoteHubMockBuilder {
        setupDirectoryCreateScenario(this.mocks, options)
        return this
    }

    fileCopy(options: FileSystemScenarioOptions): NoteHubMockBuilder {
        setupFileCopyScenario(this.mocks, options)
        return this
    }

    fileDelete(options: FileSystemScenarioOptions): NoteHubMockBuilder {
        setupFileDeleteScenario(this.mocks, options)
        return this
    }

    fileSystemError(
        operation: 'read' | 'write' | 'copy' | 'delete' | 'mkdir',
        errorMessage: string,
        options: FileSystemScenarioOptions
    ): NoteHubMockBuilder {
        setupFileSystemErrorScenario(this.mocks, operation, errorMessage, options)
        return this
    }

    windowsPath(sourcePath: string, targetPath: string): NoteHubMockBuilder {
        setupWindowsPathScenario(this.mocks, sourcePath, targetPath)
        return this
    }

    unixPath(sourcePath: string, targetPath: string): NoteHubMockBuilder {
        setupUnixPathScenario(this.mocks, sourcePath, targetPath)
        return this
    }

    build(): NoteHubCoreTestMocks {
        return this.mocks
    }
}

export function createNoteHubMockBuilder(mocks: NoteHubCoreTestMocks): NoteHubMockBuilder {
    return new NoteHubMockBuilder(mocks)
}

