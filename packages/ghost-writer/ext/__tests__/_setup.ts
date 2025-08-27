import { vi, beforeAll, afterAll, afterEach } from 'vitest'
import process from 'node:process'

// Mock vscode globally (no real VSCode API calls)
vi.mock('vscode', () => ({
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
		fs: {
			readFile: vi.fn(),
			writeFile: vi.fn(),
			stat: vi.fn(),
			copy: vi.fn(),
		},
	},
	Uri: {
		file: vi.fn((path: string) => ({ fsPath: path })),
	},
	Position: vi.fn().mockImplementation((line: number, character: number) => ({ line, character })),
	Range: vi.fn().mockImplementation((start: any, end: any) => ({ start, end })),
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
}))

// Use fake timers globally (no real waits)
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
	// Silence console by default to reduce noise and make assertions stable
	console.log = vi.fn()
	console.info = vi.fn()
	console.warn = vi.fn()
	console.error = vi.fn()
}
