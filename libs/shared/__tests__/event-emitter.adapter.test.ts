import { describe, it, expect, vi } from 'vitest'
import { EventEmitterAdapter } from '../src/vscode/adapters/EventEmitter.adapter.js'

describe('EventEmitterAdapter', () => {
	it('fires events and disposes without error', () => {
		const emitter = new EventEmitterAdapter<string>()
		const handler = vi.fn()
		const sub = emitter.event(handler)

		emitter.fire('hello')
		expect(handler).toHaveBeenCalledWith('hello')

		sub.dispose()
		emitter.dispose()
		// No explicit assertions post-dispose; ensures no throw
	})
})
