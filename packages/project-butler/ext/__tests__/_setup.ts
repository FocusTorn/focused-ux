import { vi, beforeAll, afterAll, afterEach } from 'vitest'
import process from 'node:process'

// 1) Mock js-yaml globally 
vi.mock('js-yaml', () => ({
	load: vi.fn((content: string) => {
		// Simple mock implementation for testing
		if (!content || content.trim() === '') return undefined
		if (content.trim() === 'key: value') return { key: 'value' }
		if (content.includes('ProjectButler')) {
			return {
				ProjectButler: {
					'packageJson-order': ['name', 'version', 'scripts']
				}
			}
		}
		return {}
	})
}))

// 2) Mock vscode globally (no real VSCode API calls)
vi.mock('vscode', () => ({
	commands: {
		registerCommand: vi.fn()
	},
	window: {
		showInformationMessage: vi.fn(),
		showWarningMessage: vi.fn(),
		showErrorMessage: vi.fn(),
		createTerminal: vi.fn(),
		activeTextEditor: null,
		activeTerminal: null
	},
	workspace: {
		workspaceFolders: [
			{ uri: { fsPath: '/test/workspace' } }
		],
		fs: {
			readFile: vi.fn(),
			writeFile: vi.fn(),
			stat: vi.fn(),
			copy: vi.fn()
		}
	},
	Uri: {
		file: vi.fn((path: string) => ({ fsPath: path }))
	},
	FileType: {
		Directory: 1,
		File: 2
	},
	Terminal: class MockTerminal {
		constructor(public name?: string) {}
		sendText = vi.fn()
		show = vi.fn()
	},
	TextEditor: class MockTextEditor {
		document = {
			uri: { fsPath: '/test/file.txt' }
		}
	}
}))

// 3) Use fake timers globally (no real waits)
beforeAll(() => {
	vi.useFakeTimers()
})

afterAll(() => {
	vi.useRealTimers()
})

// 4) Keep mocks clean between tests
afterEach(() => {
	vi.clearAllMocks()
})

// Console output configuration for tests
// Set this to true to enable console output for debugging
const ENABLE_CONSOLE_OUTPUT = process.env.ENABLE_TEST_CONSOLE === 'true'

if (ENABLE_CONSOLE_OUTPUT) {
	// Enable console output for debugging
	console.log('🔍 Test console output enabled - use ENABLE_TEST_CONSOLE=true to enable')
}
else {
	// Silence console by default to reduce noise and make assertions stable.
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