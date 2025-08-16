import { vi } from 'vitest'

// Console output configuration for tests
// Set this to true to enable console output for debugging
const ENABLE_CONSOLE_OUTPUT = process.env.ENABLE_TEST_CONSOLE === 'true'

if (ENABLE_CONSOLE_OUTPUT) {
	// Enable console output for debugging
	console.log('🔍 Test console output enabled - use ENABLE_TEST_CONSOLE=true to enable')
}
else {
	// Non-Mockly: Console is not a VSCode API and Mockly does not shim it.
	// We silence console by default to reduce noise and make assertions stable.
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

// Mock VSCode extension context
vi.mock('vscode', () => ({
	ExtensionContext: vi.fn().mockImplementation(() => ({
		subscriptions: [],
		workspaceState: {
			get: vi.fn(),
			update: vi.fn(),
		},
		globalState: {
			get: vi.fn(),
			update: vi.fn(),
		},
		extensionPath: '/test/extension/path',
		extensionUri: { fsPath: '/test/extension/path' },
		environmentVariableCollection: {
			replace: vi.fn(),
			append: vi.fn(),
			prepend: vi.fn(),
			delete: vi.fn(),
		},
	})),
	Uri: {
		file: vi.fn((path: string) => ({ fsPath: path, scheme: 'file' })),
		parse: vi.fn((uri: string) => ({ fsPath: uri, scheme: 'file' })),
	},
	Disposable: {
		from: vi.fn((...disposables: any[]) => ({
			dispose: () => disposables.forEach(d => d?.dispose?.()),
		})),
	},
}))
