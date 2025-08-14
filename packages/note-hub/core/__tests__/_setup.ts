import { vi } from 'vitest'
import process from 'node:process'

// Keep test output quiet by default; enable via ENABLE_TEST_CONSOLE=true
const ENABLE_CONSOLE_OUTPUT = process.env.ENABLE_TEST_CONSOLE === 'true'

if (!ENABLE_CONSOLE_OUTPUT) {
	console.log = vi.fn()
	console.info = vi.fn()
	console.warn = vi.fn()
	console.error = vi.fn()
}

// Note: We do NOT mock the 'vscode' module here
// Instead, tests should use the DI container with Mockly implementations
// This provides proper dependency injection while keeping packages decoupled

// Mock the @fux/shared module to prevent VSCode import issues
// Tests will use the DI container with Mockly implementations instead
vi.mock('@fux/shared', () => ({
	// Mock adapters that return Mockly implementations
	WindowAdapter: vi.fn(),
	WorkspaceAdapter: vi.fn(),
	CommandsAdapter: vi.fn(),
	UriAdapter: {
		file: vi.fn(),
		create: vi.fn(),
	},
	TreeItemAdapter: {
		create: vi.fn(),
	},
	ThemeIconAdapter: {
		create: vi.fn(),
	},
	ThemeColorAdapter: {
		create: vi.fn(),
	},
	TreeItemCollapsibleStateAdapter: vi.fn().mockImplementation(() => ({
		None: 0,
		Collapsed: 1,
		Expanded: 2,
	})),
	EventEmitterAdapter: vi.fn(),
	// Add other adapters as needed
}))
