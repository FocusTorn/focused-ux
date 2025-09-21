import { vi } from 'vitest'
import * as fs from 'node:fs/promises'
import * as path from 'node:path'

// ┌──────────────────────────────────────────────────────────────────────────┐
// │                            TEST HELPERS                                 │
// └──────────────────────────────────────────────────────────────────────────┘

// Core test environment interface
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
    yaml: {
        load: ReturnType<typeof vi.fn>
    }
}

// Environment setup
export function setupTestEnvironment(): CoreTestMocks {
    const fileSystem = {
        readFile: vi.fn(),
        writeFile: vi.fn(),
        stat: vi.fn(),
        copyFile: vi.fn(),
        access: vi.fn(),
        readdir: vi.fn(),
        mkdir: vi.fn(),
        rmdir: vi.fn(),
        unlink: vi.fn(),
    }

    const path = {
        dirname: vi.fn(),
        basename: vi.fn(),
        join: vi.fn(),
        resolve: vi.fn(),
        extname: vi.fn(),
    }

    const yaml = {
        load: vi.fn(),
    }

    return {
        fileSystem,
        path,
        yaml,
    }
}

// Mock object creators
export function createMockFileSystem(): CoreTestMocks['fileSystem'] {
    return {
        readFile: vi.fn(),
        writeFile: vi.fn(),
        stat: vi.fn(),
        copyFile: vi.fn(),
        access: vi.fn(),
        readdir: vi.fn(),
        mkdir: vi.fn(),
        rmdir: vi.fn(),
        unlink: vi.fn(),
    }
}

export function createMockPathUtils(): CoreTestMocks['path'] {
    return {
        dirname: vi.fn(),
        basename: vi.fn(),
        join: vi.fn(),
        resolve: vi.fn(),
        extname: vi.fn(),
    }
}

export function createMockYaml(): CoreTestMocks['yaml'] {
    return {
        load: vi.fn(),
    }
}

// Mock reset utilities
export function resetAllMocks(mocks: CoreTestMocks): void {
    Object.values(mocks.fileSystem).forEach(mock => mock.mockReset())
    Object.values(mocks.path).forEach(mock => mock.mockReset())
    Object.values(mocks.yaml).forEach(mock => mock.mockReset())
}

export function setupFileSystemMocks(mocks: CoreTestMocks): void {
    // Default implementations
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
    // Default implementations
    mocks.path.dirname.mockImplementation((path: string) =>
        path.split('/').slice(0, -1).join('/') || '.')
    mocks.path.basename.mockImplementation((path: string) =>
        path.split('/').pop() || '')
    mocks.path.join.mockImplementation((...paths: string[]) =>
        paths.join('/'))
    mocks.path.resolve.mockImplementation((path: string) => path)
    mocks.path.extname.mockImplementation((path: string) => {
        const lastDot = path.lastIndexOf('.')
        return lastDot === -1 ? '' : path.slice(lastDot)
    })
}

export function setupYamlMocks(mocks: CoreTestMocks): void {
    // Default implementations
    mocks.yaml.load.mockReturnValue({
        ProjectButler: {
            'packageJson-order': ['name', 'version', 'description', 'main', 'scripts', 'dependencies'],
        },
    })
}
