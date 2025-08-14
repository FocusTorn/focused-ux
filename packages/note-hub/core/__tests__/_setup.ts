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

// Ensure any direct CommonJS require('vscode') from shared adapters resolves to our test adapter
vi.mock('vscode', async () => {
	const mod = await import('../../../vscode-test-adapter.ts')

	return mod as any
})
