import { vi, beforeAll, afterAll, afterEach } from 'vitest'
import process from 'node:process'

// Mock Node.js modules globally
vi.mock('fs/promises', () => ({
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
}))

vi.mock('path', () => ({
    default: {
        join: vi.fn((...args: string[]) => args.join('/')),
        extname: vi.fn((file: string) => {
            const lastDot = file.lastIndexOf('.')
            return lastDot === -1 ? '' : file.substring(lastDot)
        }),
        resolve: vi.fn((...args: string[]) => args.join('/')),
        dirname: vi.fn((file: string) => file.substring(0, file.lastIndexOf('/'))),
        basename: vi.fn((file: string) => file.split('/').pop() || ''),
    },
    join: vi.fn((...args: string[]) => args.join('/')),
    extname: vi.fn((file: string) => {
        const lastDot = file.lastIndexOf('.')
        return lastDot === -1 ? '' : file.substring(lastDot)
    }),
    resolve: vi.fn((...args: string[]) => args.join('/')),
    dirname: vi.fn((file: string) => file.substring(0, file.lastIndexOf('/'))),
    basename: vi.fn((file: string) => file.split('/').pop() || ''),
}))

vi.mock('node:child_process', () => ({
    exec: vi.fn(),
}))

vi.mock('node:util', () => ({
    promisify: vi.fn((fn: any) => fn),
}))

// Global timer setup
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

// Console output configuration for tests
const ENABLE_CONSOLE_OUTPUT = process.env.ENABLE_TEST_CONSOLE === 'true'

if (!ENABLE_CONSOLE_OUTPUT) {
    console.log = vi.fn()
    console.info = vi.fn()
    console.warn = vi.fn()
    console.error = vi.fn()
    console.debug = vi.fn()
}
