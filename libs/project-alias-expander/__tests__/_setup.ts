import { vi, beforeAll, afterAll, afterEach } from 'vitest'
import process from 'node:process'

// Mock external dependencies
vi.mock('strip-json-comments', () => ({
    default: vi.fn(),
}))

// Use fake timers globally
beforeAll(() => {
    vi.useFakeTimers()
})

afterAll(() => {
    vi.useRealTimers()
})

// Keep mocks clean between tests
afterEach(() => {
    vi.clearAllMocks()
})

// Console output configuration
const ENABLE_CONSOLE_OUTPUT = process.env.ENABLE_TEST_CONSOLE === 'true'

if (ENABLE_CONSOLE_OUTPUT) {
    console.log('🔍 Test console output enabled')
} else {
    console.log = vi.fn()
    console.info = vi.fn()
    console.warn = vi.fn()
    console.error = vi.fn()
}

// ============================================================================
// TEST HELPERS
// ============================================================================

export interface PaeTestMocks {
    stripJsonComments: ReturnType<typeof vi.fn>
    fs: {
        existsSync: ReturnType<typeof vi.fn>
        readFileSync: ReturnType<typeof vi.fn>
        writeFileSync: ReturnType<typeof vi.fn>
        mkdirSync: ReturnType<typeof vi.fn>
    }
    path: {
        join: ReturnType<typeof vi.fn>
        resolve: ReturnType<typeof vi.fn>
        dirname: ReturnType<typeof vi.fn>
    }
    process: {
        argv: string[]
        exit: ReturnType<typeof vi.fn>
        env: Record<string, string>
    }
    childProcess: {
        spawnSync: ReturnType<typeof vi.fn>
    }
}

export function setupTestEnvironment(): PaeTestMocks {
    const stripJsonComments = vi.fn()
    const fs = {
        existsSync: vi.fn(),
        readFileSync: vi.fn(),
        writeFileSync: vi.fn(),
        mkdirSync: vi.fn(),
    }
    const path = {
        join: vi.fn(),
        resolve: vi.fn(),
        dirname: vi.fn(),
    }
    const process = {
        argv: ['node', 'cli.js'],
        exit: vi.fn(),
        env: {},
    }
    const childProcess = {
        spawnSync: vi.fn(),
    }

    return {
        stripJsonComments,
        fs,
        path,
        process,
        childProcess,
    }
}

export function resetAllMocks(mocks: PaeTestMocks): void {
    mocks.stripJsonComments.mockReset()
    Object.values(mocks.fs).forEach((mock) => mock.mockReset())
    Object.values(mocks.path).forEach((mock) => mock.mockReset())
    mocks.process.exit.mockReset()
    mocks.childProcess.spawnSync.mockReset()
}

export function setupFileSystemMocks(mocks: PaeTestMocks): void {
    mocks.fs.existsSync.mockReturnValue(true)
    mocks.fs.readFileSync.mockReturnValue('{"packages": {"test": "test-package"}}')
    mocks.fs.writeFileSync.mockImplementation(() => {})
    mocks.fs.mkdirSync.mockImplementation(() => {})
}

export function setupPathMocks(mocks: PaeTestMocks): void {
    mocks.path.join.mockImplementation((...args: string[]) => args.join('/'))
    mocks.path.resolve.mockImplementation((...args: string[]) => args.join('/'))
    mocks.path.dirname.mockImplementation((path: string) => path.split('/').slice(0, -1).join('/'))
}
