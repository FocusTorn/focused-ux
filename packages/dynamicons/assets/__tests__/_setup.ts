import { vi, beforeAll, afterAll, afterEach } from 'vitest'

// Mock file system operations
vi.mock('fs/promises', () => ({
	readdir: vi.fn(),
	readFile: vi.fn(),
	writeFile: vi.fn(),
	mkdir: vi.fn(),
	access: vi.fn(),
	stat: vi.fn(),
	rename: vi.fn(),
	copyFile: vi.fn(),
	unlink: vi.fn(),
	appendFile: vi.fn(),
}))

// Mock path module
vi.mock('path', () => ({
	default: {
		join: vi.fn((...args: string[]) => args.join('/')),
		extname: vi.fn((file: string) => {
			const lastDot = file.lastIndexOf('.')
			return lastDot === -1 ? '' : file.substring(lastDot)
		}),
		resolve: vi.fn((...args: string[]) => args.join('/')),
		dirname: vi.fn((file: string) => file.substring(0, file.lastIndexOf('/'))),
	},
	join: vi.fn((...args: string[]) => args.join('/')),
	extname: vi.fn((file: string) => {
		const lastDot = file.lastIndexOf('.')
		return lastDot === -1 ? '' : file.substring(lastDot)
	}),
	resolve: vi.fn((...args: string[]) => args.join('/')),
	dirname: vi.fn((file: string) => file.substring(0, file.lastIndexOf('/'))),
}))

// Mock child_process for SVGO optimization
vi.mock('node:child_process', () => ({
	exec: vi.fn(),
}))

// Mock util for promisify
vi.mock('node:util', () => ({
	promisify: vi.fn((fn: any) => fn),
}))

// Mock console methods to capture output
const originalConsoleLog = console.log
const originalConsoleError = console.error

beforeAll(() => {
	// Set up any global test configuration
	vi.useFakeTimers()
})

afterAll(() => {
	// Clean up global test configuration
	vi.useRealTimers()
})

afterEach(() => {
	// Clear all mocks after each test
	vi.clearAllMocks()
	
	// Restore console methods
	console.log = originalConsoleLog
	console.error = originalConsoleError
})
