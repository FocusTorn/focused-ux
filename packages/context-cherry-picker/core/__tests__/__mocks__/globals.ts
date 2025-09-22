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
    readDirectory: vi.fn(),
    mkdir: vi.fn(),
    createDirectory: vi.fn(),
    rmdir: vi.fn(),
    unlink: vi.fn(),
}))

vi.mock('js-yaml', () => ({
    load: vi.fn((content: string) => {
        if (!content || content.trim() === '') return undefined
        if (content.includes('ContextCherryPicker')) {
            return {
                ContextCherryPicker: {
                    'projectTreeDisplay': {
                        'alwaysShowGlobs': ['*.md', '*.json'],
                        'alwaysHideGlobs': ['node_modules/**', '.git/**'],
                        'showIfSelectedGlobs': ['*.test.ts', '*.spec.ts'],
                    },
                },
            }
        }
        return {}
    }),
    dump: vi.fn((obj: any) => JSON.stringify(obj, null, 2)),
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

vi.mock('gpt-tokenizer', () => ({
    encode: vi.fn((text: string) => {
        // Simple mock: return array of numbers based on text length
        // Can be overridden by individual tests
        return Array.from({ length: Math.ceil(text.length / 4) }, (_, i) => i + 1)
    }),
    decode: vi.fn((tokens: number[]) => {
        // Simple mock: return text based on token count
        return 'mock decoded text'
    }),
}))

vi.mock('micromatch', () => ({
    default: {
        isMatch: vi.fn((file: string, patterns: string | string[]) => {
            // Simple mock: return true for common file patterns
            const commonPatterns = ['*.md', '*.json', '*.ts', '*.js']
            return commonPatterns.some(pattern => file.includes(pattern.replace('*', '')))
        }),
        match: vi.fn((files: string[], patterns: string | string[]) => {
            // Simple mock: return files that match patterns
            return files.filter(file => 
                Array.isArray(patterns) 
                    ? patterns.some(pattern => file.includes(pattern.replace('*', '')))
                    : file.includes(patterns.replace('*', ''))
            )
        }),
    },
    isMatch: vi.fn(),
    match: vi.fn(),
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

// Global mock variables for tests
declare global {
    var mockYaml: any
    var mockMicromatch: any
}

// Make mocks available globally
globalThis.mockYaml = {
    load: vi.fn(),
    dump: vi.fn(),
}

globalThis.mockMicromatch = {
    isMatch: vi.fn(),
    match: vi.fn(),
}

// Console output control
const ENABLE_CONSOLE_OUTPUT = process.env.ENABLE_TEST_CONSOLE === 'true'
if (!ENABLE_CONSOLE_OUTPUT) {
    console.log = vi.fn()
    console.info = vi.fn()
    console.warn = vi.fn()
    console.error = vi.fn()
}
