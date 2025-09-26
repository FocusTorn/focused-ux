import { vi } from 'vitest'
import { 
    setupLibTestEnvironment, 
    resetLibMocks, 
    setupLibFileSystemMocks,
    setupLibPathMocks,
    setupLibProcessMocks,
    setupLibChildProcessMocks,
    LibTestMocks 
} from '@fux/mock-strategy/lib'

// Add package-specific mock helpers for PAE-specific functionality
export interface PaeTestMocks extends LibTestMocks {
    stripJsonComments: ReturnType<typeof vi.fn>
    url: {
        fileURLToPath: ReturnType<typeof vi.fn>
    }
    fs: {
        existsSync: ReturnType<typeof vi.fn>
        readFileSync: ReturnType<typeof vi.fn>
        writeFileSync: ReturnType<typeof vi.fn>
        mkdirSync: ReturnType<typeof vi.fn>
    }
}

export function setupPaeTestEnvironment(): PaeTestMocks {
    const baseMocks = setupLibTestEnvironment()
    
    return {
        ...baseMocks,
        stripJsonComments: vi.fn(),
        url: {
            fileURLToPath: vi.fn(),
        },
        fs: {
            existsSync: vi.fn(),
            readFileSync: vi.fn(),
            writeFileSync: vi.fn(),
            mkdirSync: vi.fn(),
        },
    }
}

export function resetPaeMocks(mocks: PaeTestMocks): void {
    resetLibMocks(mocks)
    mocks.stripJsonComments.mockReset()
    mocks.url.fileURLToPath.mockReset()
    mocks.fs.existsSync.mockReset()
    mocks.fs.readFileSync.mockReset()
    mocks.fs.writeFileSync.mockReset()
    mocks.fs.mkdirSync.mockReset()
}

export function setupPaeFileSystemMocks(mocks: PaeTestMocks): void {
    setupLibFileSystemMocks(mocks)
}

export function setupPaePathMocks(mocks: PaeTestMocks): void {
    setupLibPathMocks(mocks)
}

export function setupPaeProcessMocks(mocks: PaeTestMocks): void {
    setupLibProcessMocks(mocks)
}

export function setupPaeChildProcessMocks(mocks: PaeTestMocks): void {
    setupLibChildProcessMocks(mocks)
}

export function setupPaeUrlMocks(mocks: PaeTestMocks): void {
    mocks.url.fileURLToPath.mockImplementation((url: string) => url.replace('file://', ''))
}

export function setupPaeStripJsonCommentsMocks(mocks: PaeTestMocks): void {
    mocks.stripJsonComments.mockImplementation((content: string) => {
        try {
            return JSON.parse(content)
        } catch {
            return {}
        }
    })
}