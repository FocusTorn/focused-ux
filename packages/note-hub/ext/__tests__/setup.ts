// Test setup for Note Hub
import { vi } from 'vitest'
import process from 'node:process'

// Mockly handles all VSCode mocking through the vscode-test-adapter.ts
// No need to manually mock vscode APIs - Mockly provides everything we need
// This includes: workspace, window, commands, extensions, env, Uri, Position, Range, etc.

// Use injectable factory for URIs (replaces manual vi.mock)
import { UriAdapter } from '@fux/shared'
import { MockUriFactoryService } from '@fux/mockly'

UriAdapter.setFactory(new MockUriFactoryService())

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
	// Use ENABLE_TEST_CONSOLE=true or enableTestConsoleOutput() to opt-in when debugging.
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
