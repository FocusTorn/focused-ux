import { vi, beforeAll, afterAll, afterEach } from 'vitest'
import { setupLibTestEnvironment, resetLibMocks, LibTestMocks } from '@fux/mock-strategy/lib'

// Global mock state
let globalMocks: LibTestMocks | null = null

// Setup library-specific test environment
beforeAll(() => {
    globalMocks = setupLibTestEnvironment()
})

afterAll(() => {
    if (globalMocks) {
        resetLibMocks(globalMocks)
    }
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

// Set environment variable to control PowerShell/Bash output
if (!ENABLE_CONSOLE_OUTPUT) {
    process.env.ENABLE_TEST_CONSOLE = 'false'
}

// Global child_process mock
vi.mock('node:child_process', () => ({
    spawnSync: vi.fn().mockReturnValue({
        status: 0,
        signal: null,
        output: [''],
        pid: 123,
        stdout: Buffer.from(''),
        stderr: Buffer.from(''),
        error: undefined
    }),
    execSync: vi.fn().mockReturnValue(Buffer.from('success'))
}))