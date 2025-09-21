import { describe, it, expect, vi, beforeEach } from 'vitest'

describe('RangeAdapter', () => {
	beforeEach(() => {
		vi.resetModules()
	})

	it('creates a range and exposes start/end creators', async () => {
		const { RangeAdapter } = await import('../../src/vscode/adapters/Range.adapter.js')
		
		// Create simple position objects that match what Mockly expects
		const start = { line: 1, character: 2 }
		const end = { line: 3, character: 4 }

		const range = RangeAdapter.create(start, end)

		// The adapter should return the Mockly Position objects when create is called
		// Mockly creates Position objects, so we need to check their properties
		expect(range.start.create(0, 0).line).toBe(1)
		expect(range.start.create(0, 0).character).toBe(2)
		expect(range.end.create(0, 0).line).toBe(3)
		expect(range.end.create(0, 0).character).toBe(4)
	})
})
