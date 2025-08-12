import { vi } from 'vitest'
import process from 'node:process'

// Use Mockly's Uri factory for tests to avoid real vscode imports
import { UriAdapter } from '@fux/shared'
import { MockUriFactoryService } from '@fux/mockly'

// Align with Note Hub strategy: allow enabling console for debugging
const ENABLE_CONSOLE_OUTPUT = process.env.ENABLE_TEST_CONSOLE === 'true'

if (!ENABLE_CONSOLE_OUTPUT) {
	console.log = vi.fn()
	console.info = vi.fn()
	console.warn = vi.fn()
	console.error = vi.fn()
}

UriAdapter.setFactory(new MockUriFactoryService())

export function enableTestConsoleOutput() {
	if (!ENABLE_CONSOLE_OUTPUT) {
		// Restore defaults if needed (vitest may have stubs)
		// eslint-disable-next-line no-self-assign
		console.log = console.log
		// eslint-disable-next-line no-self-assign
		console.info = console.info
		// eslint-disable-next-line no-self-assign
		console.warn = console.warn
		// eslint-disable-next-line no-self-assign
		console.error = console.error
	}
}
