import { vi, beforeAll, afterAll, afterEach } from 'vitest'
import process from 'node:process'

// Mock Node.js modules globally
vi.mock('node:fs/promises', () => ({
    stat: vi.fn(),
    access: vi.fn(),
    copyFile: vi.fn(),
    readFile: vi.fn(),
    writeFile: vi.fn(),
    readdir: vi.fn(),
    mkdir: vi.fn(),
    rmdir: vi.fn(),
    unlink: vi.fn(),
}))

vi.mock('node:path', () => ({
    default: {
        dirname: vi.fn(),
        basename: vi.fn(),
        join: vi.fn(),
        resolve: vi.fn(),
        extname: vi.fn(),
        sep: '/',
    },
    dirname: vi.fn(),
    basename: vi.fn(),
    join: vi.fn(),
    resolve: vi.fn(),
    extname: vi.fn(),
    sep: '/',
}))

vi.mock('node:buffer', () => ({
    Buffer: {
        from: vi.fn(),
    },
}))

// Global timer setup
beforeAll(() => {
    vi.useFakeTimers()
})

afterAll(() => {
    vi.useRealTimers()
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

