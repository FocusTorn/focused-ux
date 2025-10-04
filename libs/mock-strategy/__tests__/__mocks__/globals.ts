import { vi, beforeAll, afterAll, afterEach } from 'vitest'
import process from 'node:process'


// ┌──────────────────────────────────────────────────────────────────────────────────────────────┐
// │                                         GLOBAL MOCKS                                         │
// └──────────────────────────────────────────────────────────────────────────────────────────────┘
// vi.mock('js-yaml', () => ({ //> Mock js-yaml globally 
//     load: vi.fn((content: string) => {
//         // Simple mock implementation for testing
//         if (!content || content.trim() === '')
//             return undefined
//         if (content.trim() === 'key: value')
//             return { key: 'value' }
//         if (content.includes('ProjectButler')) {
//             return {
//                 ProjectButler: {
//                     'packageJson-order': ['name', 'version', 'scripts'],
//                 },
//             }
//         }
//         return {}
//     }),
// })) //<

vi.mock('vscode', () => ({ //> Mock vscode globally (no real VSCode API calls)
    commands: {
        registerCommand: vi.fn(),
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
    TreeItemCheckboxState: {
        Unchecked: 0,
        Checked: 1,
    },
    TreeItemCollapsibleState: {
        None: 0,
        Collapsed: 1,
        Expanded: 2,
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
        fs: {
            readFile: vi.fn(),
            writeFile: vi.fn(),
            stat: vi.fn(),
            copy: vi.fn(),
        },
    },
    Uri: {
        file: vi.fn((path: string) => ({ fsPath: path })),
        parse: vi.fn(),
    },
    FileType: {
        Unknown: 0,
        File: 1,
        Directory: 2,
        SymbolicLink: 64,
    },
    
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

// Output status information (only once)
if (!globalThis._mockStrategyConsoleStatusShown) {
    console.log(`[Mock Strategy Library] Console output is ${ENABLE_CONSOLE_OUTPUT ? 'ENABLED' : 'DISABLED'}`)
    console.log(`[Mock Strategy Library] To toggle console output: set ENABLE_TEST_CONSOLE=true/false`)
    console.log('') // Blank line
    globalThis._mockStrategyConsoleStatusShown = true
}

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
