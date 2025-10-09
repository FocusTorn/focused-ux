import { vi } from 'vitest'
import * as fs from 'node:fs/promises'
import * as path from 'node:path'
import { 
    setupCoreTestEnvironment, 
    resetCoreMocks, 
    type CoreTestMocks as GlobalCoreTestMocks 
} from '@ms-core'
import { 
    setupFileSystemMocks as setupGlobalFileSystemMocks,
    setupPathMocks as setupGlobalPathMocks
} from '@ms-gen'

// ┌──────────────────────────────────────────────────────────────────────────┐
// │                            TEST HELPERS                                 │
// └──────────────────────────────────────────────────────────────────────────┘

// Extended Core test environment interface that adds project-specific mocks
export interface CoreTestMocks extends GlobalCoreTestMocks {
    // Additional project-specific mocks can be added here if needed
}

// Environment setup - extends global CoreTestMocks
export function setupTestEnvironment(): CoreTestMocks {
    // Start with global core test environment
    const globalMocks = setupCoreTestEnvironment()
    
    // Add project-specific yaml mocking
    const yaml = {
        load: vi.fn(),
    }

    return {
        ...globalMocks,
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

// Mock reset utilities - extends global resetCoreMocks
export function resetAllMocks(mocks: CoreTestMocks): void {
    // Use global core reset function
    resetCoreMocks(mocks)
    // Reset project-specific yaml mocks
    if (mocks.yaml) {
        Object.values(mocks.yaml).forEach(mock => mock.mockReset())
    }
}

export function setupFileSystemMocks(mocks: CoreTestMocks): void {
    // Use global core file system setup
    setupGlobalFileSystemMocks(mocks)
}

export function setupPathMocks(mocks: CoreTestMocks): void {
    // Use global core path setup
    setupGlobalPathMocks(mocks)
}

export function setupYamlMocks(mocks: CoreTestMocks): void {

    // Default implementations
    mocks.yaml.load.mockReturnValue({
        ProjectButler: {
            'packageJson-order': ['name', 'version', 'description', 'main', 'scripts', 'dependencies'],
        },
    })

}
