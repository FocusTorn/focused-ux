import { vi, beforeAll, afterAll, afterEach } from 'vitest'
import process from 'node:process'

// Mock external dependencies globally
vi.mock('strip-json-comments', () => ({
    default: vi.fn((content: string) => 
        content.replace(/\/\/.*$/gm, '').replace(/\/\*[\s\S]*?\*\//g, '')
    ),
}))

vi.mock('vscode', () => ({
    Uri: {
        file: vi.fn((path: string) => ({
            fsPath: path,
            scheme: 'file',
            authority: '',
            path,
            query: '',
            fragment: '',
            toString: vi.fn(() => path),
        })),
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
    console.debug = vi.fn()
}

