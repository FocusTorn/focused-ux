import { vi, beforeAll, afterAll, afterEach } from 'vitest'
import process from 'node:process'

// ┌──────────────────────────────────────────────────────────────────────────┐
// │                               GLOBAL MOCKS                               │
// └──────────────────────────────────────────────────────────────────────────┘

vi.mock('vscode', () => ({ //> Mock vscode globally (no real VSCode API calls)
    commands: {
        registerCommand: vi.fn(),
    },
    window: {
        showInformationMessage: vi.fn(),
        showWarningMessage: vi.fn(),
        showErrorMessage: vi.fn(),
        createTerminal: vi.fn(),
        activeTextEditor: null,
        activeTerminal: null,
    },
    workspace: {
        workspaceFolders: [
            { uri: { fsPath: '/test/workspace' } },
        ],
        getConfiguration: vi.fn(),
        fs: {
            readFile: vi.fn(),
            writeFile: vi.fn(),
            stat: vi.fn(),
            copy: vi.fn(),
        },
    },
    Position: vi.fn().mockImplementation((line: number, character: number) => ({ line, character })),
    Uri: {
        file: vi.fn((path: string) =>
            ({ fsPath: path })),
    },
    FileType: {
        Directory: 1,
        File: 2,
    },
    Terminal: class MockTerminal {

        constructor(public name?: string) {}
        sendText = vi.fn()
        show = vi.fn()
	
    },
    TextEditor: class MockTextEditor {

        document = {
            uri: { fsPath: '/test/file.txt' },
        }
	
    },
})) //<

beforeAll(() => { vi.useFakeTimers() }) // Use fake timers globally (no real waits)
afterAll(() => { vi.useRealTimers() }) // Restore real timers globally
afterEach(() => { vi.clearAllMocks() }) // Keep mocks clean between tests

// Set this to true to enable console output for debugging
const ENABLE_CONSOLE_OUTPUT = process.env.ENABLE_TEST_CONSOLE === 'true'

if (ENABLE_CONSOLE_OUTPUT) {
    console.log('🔍 Test console output enabled - use ENABLE_TEST_CONSOLE=true to enable')
}
else {
    // Use ENABLE_TEST_CONSOLE=true to opt-in when debugging.
    console.log = vi.fn()
    console.info = vi.fn()
    console.warn = vi.fn()
    console.error = vi.fn()
}

// Export a function to enable console output programmatically
export function enableTestConsoleOutput() {
    if (!ENABLE_CONSOLE_OUTPUT) {
        // Restore original console methods
        console.log = console.log || (() => {})
        console.info = console.info || (() => {})
        console.warn = console.warn || (() => {})
        console.error = console.error || (() => {})
        console.log('🔍 Test console output enabled programmatically')
    }
}
