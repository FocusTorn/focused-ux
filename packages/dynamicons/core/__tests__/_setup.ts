import { vi, beforeAll, afterAll, afterEach } from 'vitest'

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