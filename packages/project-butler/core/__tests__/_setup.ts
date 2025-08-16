import { vi } from 'vitest'
import { mockly, mocklyService } from '@fux/mockly'

// Reset Mockly state between tests
beforeEach(() => {
	mocklyService.reset()
})

// Mock console output unless debugging
if (process.env.ENABLE_TEST_CONSOLE !== 'true') {
	console.log = vi.fn()
	console.info = vi.fn()
	console.warn = vi.fn()
	console.error = vi.fn()
}

// Export Mockly for use in tests
export { mockly, mocklyService }
