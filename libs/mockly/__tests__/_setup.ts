import { vi, beforeAll, afterAll, afterEach } from 'vitest'
import { mockly, mocklyService } from '@fux/mockly'
import process from 'node:process'

// 1) Mock fs/promises globally (no real disk I/O)
// This is needed for the Node.js adapters to work properly in tests
vi.mock('node:fs/promises', () => ({
	stat: vi.fn(),
	access: vi.fn(),
	copyFile: vi.fn(),
	readFile: vi.fn(),
	writeFile: vi.fn(),
	readdir: vi.fn(),
	mkdir: vi.fn(),
	rmdir: vi.fn(),
	unlink: vi.fn(),
}))

// 2) Use fake timers globally (no real waits)
beforeAll(() => {
	vi.useFakeTimers()
})

afterAll(() => {
	vi.useRealTimers()
})

// 3) Keep mocks clean between tests
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

// Export Mockly for use in tests
export { mockly, mocklyService }
