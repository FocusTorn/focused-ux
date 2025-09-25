import { vi, beforeAll, afterAll, afterEach } from 'vitest'

// Conditional import for testing only
let mockStrategy: any = null

async function getMockStrategy() {
    if (!mockStrategy) {
        // Try different import paths
        try {
            mockStrategy = await import('@fux/mock-strategy')
        } catch {
            try {
                mockStrategy = await import('../../mock-strategy/dist/index.js')
            } catch {
                // Fallback to a mock implementation for testing
                mockStrategy = {
                    setupLibTestEnvironment: vi.fn(),
                    resetLibMocks: vi.fn()
                }
            }
        }
    }
    return mockStrategy
}

// Setup library-specific test environment
beforeAll(async () => {
    const strategy = await getMockStrategy()
    strategy.setupLibTestEnvironment()
})

afterAll(async () => {
    const strategy = await getMockStrategy()
    strategy.resetLibMocks()
})

afterEach(() => {
    vi.clearAllMocks()
})

// Console output control
const ENABLE_CONSOLE_OUTPUT = process.env.ENABLE_TEST_CONSOLE === 'true'
if (!ENABLE_CONSOLE_OUTPUT) {
    console.log = vi.fn()
    console.info = vi.fn()
    console.warn = vi.fn()
    console.error = vi.fn()
}