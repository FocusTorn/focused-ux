import { vi } from 'vitest'
import process from 'node:process'

const ENABLE_CONSOLE_OUTPUT = process.env.ENABLE_TEST_CONSOLE === 'true'

if (!ENABLE_CONSOLE_OUTPUT) {
  console.log = vi.fn()
  console.info = vi.fn()
  console.warn = vi.fn()
  console.error = vi.fn()
}

// Ensure UriAdapter uses a mock factory for tests
import { UriAdapter } from '@fux/shared'
import { MockUriFactoryService } from '@fux/mockly'

UriAdapter.setFactory(new MockUriFactoryService())

