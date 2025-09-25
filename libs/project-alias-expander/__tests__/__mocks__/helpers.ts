import { vi } from 'vitest'

// Conditional import for testing only
let mockStrategy: any = null

async function getMockStrategy() {
    if (!mockStrategy) {
        try {
            mockStrategy = await import('../../../mock-strategy/dist/index.js')
        } catch (_error) {
            console.log('\x1b[31m❌ Import failed. mock-strategy/dist/index.js\x1b[0m')
        }
    
        // } catch {
        //     // Fallback to a mock implementation for testing
        //     mockStrategy = {
        //         setupLibTestEnvironment: () => ({
        //             fileSystem: { stat: vi.fn(), readFile: vi.fn(), writeFile: vi.fn() },
        //             path: { join: vi.fn(), resolve: vi.fn() },
        //             process: { cwd: vi.fn(), exit: vi.fn(), argv: [], env: {} },
        //             childProcess: { spawn: vi.fn(), exec: vi.fn() }
        //         }),
        //         resetLibMocks: vi.fn(),
        //         setupLibFileSystemMocks: vi.fn(),
        //         setupLibPathMocks: vi.fn(),
        //         setupLibProcessMocks: vi.fn(),
        //         setupLibChildProcessMocks: vi.fn()
        //     }
        // }
    }
    return mockStrategy
}

// Add package-specific mock helpers for PAE-specific functionality
export interface PaeTestMocks {
    fileSystem: any
    path: any
    process: any
    childProcess: any
    stripJsonComments: ReturnType<typeof vi.fn>
    url: {
        fileURLToPath: ReturnType<typeof vi.fn>
    }
}

export async function setupPaeTestEnvironment(): Promise<PaeTestMocks> {
    const strategy = await getMockStrategy()
    const baseMocks = strategy.setupLibTestEnvironment()
    
    return {
        ...baseMocks,
        stripJsonComments: vi.fn(),
        url: {
            fileURLToPath: vi.fn(),
        },
    }
}

export async function resetPaeMocks(mocks: PaeTestMocks): Promise<void> {
    const strategy = await getMockStrategy()
    strategy.resetLibMocks(mocks)
    mocks.stripJsonComments.mockReset()
    mocks.url.fileURLToPath.mockReset()
}

export async function setupPaeFileSystemMocks(mocks: PaeTestMocks): Promise<void> {
    const strategy = await getMockStrategy()
    strategy.setupLibFileSystemMocks(mocks)
}

export async function setupPaePathMocks(mocks: PaeTestMocks): Promise<void> {
    const strategy = await getMockStrategy()
    strategy.setupLibPathMocks(mocks)
}

export async function setupPaeProcessMocks(mocks: PaeTestMocks): Promise<void> {
    const strategy = await getMockStrategy()
    strategy.setupLibProcessMocks(mocks)
}

export async function setupPaeChildProcessMocks(mocks: PaeTestMocks): Promise<void> {
    const strategy = await getMockStrategy()
    strategy.setupLibChildProcessMocks(mocks)
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