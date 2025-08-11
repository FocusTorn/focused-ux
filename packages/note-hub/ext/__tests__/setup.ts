// Test setup for Note Hub
import { vi } from 'vitest'
import process from 'node:process'

// Mockly handles all VSCode mocking through the vscode-test-adapter.ts
// No need to manually mock vscode APIs - Mockly provides everything we need
// This includes: workspace, window, commands, extensions, env, Uri, Position, Range, etc.

// Mock UriAdapter globally for tests to avoid VSCode dependency issues
// This will be replaced with Mockly integration once the circular dependency is resolved
vi.mock('@fux/shared', async () => {
	const actual = await vi.importActual('@fux/shared') as any

	return {
		...actual,
		UriAdapter: {
			...actual.UriAdapter,
			file: vi.fn((path: string) => ({
				uri: { fsPath: path, toString: () => `file://${path}` },
				fsPath: path,
				toString: () => `file://${path}`,
			})),
			create: vi.fn((uri: any) => ({
				uri: { fsPath: uri.fsPath || uri.path || uri, toString: () => `file://${uri.fsPath || uri.path || uri}` },
				fsPath: uri.fsPath || uri.path || uri,
				toString: () => `file://${uri.fsPath || uri.path || uri}`,
			})),
			joinPath: vi.fn((base: any, ...paths: string[]) => {
				const basePath = base.fsPath || base.path || base
				const fullPath = [basePath, ...paths].join('/').replace(/\/+/g, '/')

				return {
					uri: { fsPath: fullPath, toString: () => `file://${fullPath}` },
					fsPath: fullPath,
					toString: () => `file://${fullPath}`,
				}
			}),
		},
	}
})

// Console output configuration for tests
// Set this to true to enable console output for debugging
const ENABLE_CONSOLE_OUTPUT = process.env.ENABLE_TEST_CONSOLE === 'true'

if (ENABLE_CONSOLE_OUTPUT) {
	// Enable console output for debugging
	console.log('🔍 Test console output enabled - use ENABLE_TEST_CONSOLE=true to enable')
}
else {
	// Silence console noise in tests (and make assertions easy)
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
