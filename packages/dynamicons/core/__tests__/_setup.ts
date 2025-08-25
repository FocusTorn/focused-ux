import { vi, beforeAll, afterAll, afterEach } from 'vitest'
import process from 'node:process'

// Mock external dependencies
vi.mock('strip-json-comments', () => ({
	default: vi.fn(),
}))

// Use fake timers globally
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
// Set this to true to enable console output for debugging
const ENABLE_CONSOLE_OUTPUT = process.env.ENABLE_TEST_CONSOLE === 'true'

if (!ENABLE_CONSOLE_OUTPUT) {
	// Silence console by default to reduce noise and make assertions stable
	console.log = vi.fn()
	console.info = vi.fn()
	console.warn = vi.fn()
	console.error = vi.fn()
	console.debug = vi.fn()
}
