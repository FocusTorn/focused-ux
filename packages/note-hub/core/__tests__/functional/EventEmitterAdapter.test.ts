import { describe, it, expect, vi, beforeEach } from 'vitest'
import { EventEmitterAdapter } from '../../src/adapters/EventEmitterAdapter.js'

describe('EventEmitterAdapter', () => {
	let adapter: EventEmitterAdapter<string>

	beforeEach(() => {
		adapter = new EventEmitterAdapter<string>()
	})

	describe('event subscription', () => {
		it('should allow subscribing to events', () => {
			const listener = vi.fn()
			const disposable = adapter.event(listener)

			expect(disposable).toBeDefined()
			expect(typeof disposable.dispose).toBe('function')
		})

		it('should call listener when event is fired', () => {
			const listener = vi.fn()

			adapter.event(listener)

			adapter.fire('test event')

			expect(listener).toHaveBeenCalledWith('test event')
		})

		it('should call multiple listeners when event is fired', () => {
			const listener1 = vi.fn()
			const listener2 = vi.fn()
			const listener3 = vi.fn()

			adapter.event(listener1)
			adapter.event(listener2)
			adapter.event(listener3)

			adapter.fire('test event')

			expect(listener1).toHaveBeenCalledWith('test event')
			expect(listener2).toHaveBeenCalledWith('test event')
			expect(listener3).toHaveBeenCalledWith('test event')
		})

		it('should not call disposed listeners', () => {
			const listener = vi.fn()
			const disposable = adapter.event(listener)

			disposable.dispose()
			adapter.fire('test event')

			expect(listener).not.toHaveBeenCalled()
		})

		it('should handle multiple disposals of same listener', () => {
			const listener = vi.fn()
			const disposable = adapter.event(listener)

			disposable.dispose()
			disposable.dispose() // Should not throw

			adapter.fire('test event')
			expect(listener).not.toHaveBeenCalled()
		})
	})

	describe('event firing', () => {
		it('should fire events with correct data', () => {
			const listener = vi.fn()

			adapter.event(listener)

			adapter.fire('event 1')
			adapter.fire('event 2')
			adapter.fire('event 3')

			expect(listener).toHaveBeenCalledTimes(3)
			expect(listener).toHaveBeenNthCalledWith(1, 'event 1')
			expect(listener).toHaveBeenNthCalledWith(2, 'event 2')
			expect(listener).toHaveBeenNthCalledWith(3, 'event 3')
		})

		it('should handle firing events with no listeners', () => {
			expect(() => adapter.fire('test event')).not.toThrow()
		})

		it('should handle firing events after all listeners disposed', () => {
			const listener1 = vi.fn()
			const listener2 = vi.fn()

			const disposable1 = adapter.event(listener1)
			const disposable2 = adapter.event(listener2)

			disposable1.dispose()
			disposable2.dispose()

			expect(() => adapter.fire('test event')).not.toThrow()
			expect(listener1).not.toHaveBeenCalled()
			expect(listener2).not.toHaveBeenCalled()
		})
	})

	describe('dispose', () => {
		it('should clear all listeners when disposed', () => {
			const listener1 = vi.fn()
			const listener2 = vi.fn()

			adapter.event(listener1)
			adapter.event(listener2)

			adapter.dispose()
			adapter.fire('test event')

			expect(listener1).not.toHaveBeenCalled()
			expect(listener2).not.toHaveBeenCalled()
		})

		it('should allow new subscriptions after dispose', () => {
			const listener1 = vi.fn()

			adapter.event(listener1)

			adapter.dispose()
			adapter.fire('test event')
			expect(listener1).not.toHaveBeenCalled()

			const listener2 = vi.fn()

			adapter.event(listener2)
			adapter.fire('new event')

			expect(listener2).toHaveBeenCalledWith('new event')
		})
	})

	describe('complex scenarios', () => {
		it('should handle listener that throws error', () => {
			const errorListener = vi.fn().mockImplementation(() => {
				throw new Error('Listener error')
			})
			const normalListener = vi.fn()

			adapter.event(errorListener)
			adapter.event(normalListener)

			expect(() => adapter.fire('test event')).toThrow('Listener error')
			// The current implementation stops at the first error, so normalListener won't be called
			expect(normalListener).not.toHaveBeenCalled()
		})

		it('should handle listener that disposes itself', () => {
			let disposable: any = null
			const selfDisposingListener = vi.fn().mockImplementation(() => {
				if (disposable) {
					disposable.dispose()
				}
			})

			disposable = adapter.event(selfDisposingListener)
			adapter.event(vi.fn()) // Add another listener

			adapter.fire('test event')

			expect(selfDisposingListener).toHaveBeenCalledTimes(1)
		})

		it('should handle multiple events of different types', () => {
			const stringAdapter = new EventEmitterAdapter<string>()
			const numberAdapter = new EventEmitterAdapter<number>()

			const stringListener = vi.fn()
			const numberListener = vi.fn()

			stringAdapter.event(stringListener)
			numberAdapter.event(numberListener)

			stringAdapter.fire('string event')
			numberAdapter.fire(42)

			expect(stringListener).toHaveBeenCalledWith('string event')
			expect(numberListener).toHaveBeenCalledWith(42)
		})
	})
})
