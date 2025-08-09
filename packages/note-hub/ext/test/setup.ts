// Test setup for Note Hub
import { vi } from 'vitest'

// Silence console noise in tests (and make assertions easy)
console.log = vi.fn()
console.info = vi.fn()
console.warn = vi.fn()
console.error = vi.fn()
