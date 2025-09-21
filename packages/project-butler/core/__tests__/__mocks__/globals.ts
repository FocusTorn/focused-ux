import { vi, beforeAll, afterAll, afterEach } from 'vitest'
import process from 'node:process'

// ┌──────────────────────────────────────────────────────────────────────────┐
// │                               GLOBAL MOCKS                               │
// └──────────────────────────────────────────────────────────────────────────┘

// Mock fs/promises globally (no real disk I/O)
vi.mock('node:fs/promises', () => ({ //>
    stat: vi.fn(),
    access: vi.fn(),
    copyFile: vi.fn(),
    readFile: vi.fn(),
    writeFile: vi.fn(),
    readdir: vi.fn(),
    mkdir: vi.fn(),
    rmdir: vi.fn(),
    unlink: vi.fn(),
})) //<

// Mock js-yaml globally
vi.mock('js-yaml', () => ({ //>
    load: vi.fn((content: string) => {
        // Simple mock implementation for testing
        if (!content || content.trim() === '')
            return undefined
        if (content.trim() === 'key: value')
            return { key: 'value' }
        if (content.includes('ProjectButler')) {
            return {
                ProjectButler: {
                    'packageJson-order': ['name', 'version', 'scripts'],
                },
            }
        }
        return {}
    }),
})) //<

// Mock path module globally
vi.mock('node:path', () => ({ //>
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
})) //<


// ┌──────────────────────────────────────────────────────────────────────────────────────────────┐
// │                                 BEFORE AND AFTER EXECUTIONS                                  │
// └──────────────────────────────────────────────────────────────────────────────────────────────┘
beforeAll(() => { vi.useFakeTimers() }) // Use fake timers globally (no real waits)
afterAll(() => { vi.useRealTimers() }) // Restore real timers globally
afterEach(() => { vi.clearAllMocks() }) // Keep mocks clean between tests

// ┌──────────────────────────────────────────────────────────────────────────────────────────────┐
// │                                 CONSOLE OUTPUT FOR DEBUGGING                                 │
// └──────────────────────────────────────────────────────────────────────────────────────────────┘

// Set this to true to enable console output for debugging
const ENABLE_CONSOLE_OUTPUT = process.env.ENABLE_TEST_CONSOLE === 'true'

if (ENABLE_CONSOLE_OUTPUT) { //>
    console.log('🔍 Test console output enabled - use ENABLE_TEST_CONSOLE=true to enable')
} else {
    // Use ENABLE_TEST_CONSOLE=true to opt-in when debugging.
    console.log = vi.fn()
    console.info = vi.fn()
    console.warn = vi.fn()
    console.error = vi.fn()
} //<

export function enableTestConsoleOutput() { //> // toggle console output programmatically
    if (!ENABLE_CONSOLE_OUTPUT) {
        // Restore original console methods
        console.log = console.log || (() => {})
        console.info = console.info || (() => {})
        console.warn = console.warn || (() => {})
        console.error = console.error || (() => {})
        console.log('🔍 Test console output enabled programmatically')
    }
} //<
