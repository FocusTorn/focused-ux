import { describe, it, expect, vi } from 'vitest'
import { EventEmitterAdapter } from '../../src/vscode/adapters/EventEmitter.adapter.js'
import { StorageService } from '../../src/services/Storage.service.js'

describe('Event and Storage Tests', () => {
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

		it('handles multiple listeners correctly', () => {
			const emitter = new EventEmitterAdapter<string>()
			const handler1 = vi.fn()
			const handler2 = vi.fn()
			
			const sub1 = emitter.event(handler1)
			const sub2 = emitter.event(handler2)

			emitter.fire('test')
			expect(handler1).toHaveBeenCalledWith('test')
			expect(handler2).toHaveBeenCalledWith('test')

			sub1.dispose()
			sub2.dispose()
			emitter.dispose()
		})

		it('handles listener errors gracefully', () => {
			const emitter = new EventEmitterAdapter<string>()
			const errorHandler = vi.fn().mockImplementation(() => {
				throw new Error('Listener error')
			})
			const normalHandler = vi.fn()
			
			emitter.event(errorHandler)
			emitter.event(normalHandler)

			// Should not throw, should continue with other listeners
			expect(() => emitter.fire('test')).not.toThrow()
			expect(normalHandler).toHaveBeenCalledWith('test')

			emitter.dispose()
		})

		it('handles disposed state correctly', () => {
			const emitter = new EventEmitterAdapter<string>()
			const handler = vi.fn()
			
			emitter.dispose()
			
			// After dispose, should return empty disposable
			const sub = emitter.event(handler)

			expect(sub).toBeDefined()
			
			// Firing should not call listeners after dispose
			emitter.fire('test')
			expect(handler).not.toHaveBeenCalled()

			sub.dispose() // Should not throw
		})

		it('supports thisArgs binding', () => {
			const emitter = new EventEmitterAdapter<string>()
			const context = { value: 'test' }
			const handler = vi.fn(function (this: any) {
				expect(this).toBe(context)
			})
			
			const sub = emitter.event(handler, context)

			emitter.fire('hello')
			
			expect(handler).toHaveBeenCalledWith('hello')
			sub.dispose()
			emitter.dispose()
		})

		it('handles multiple fire calls correctly', () => {
			const emitter = new EventEmitterAdapter<number>()
			const handler = vi.fn()
			
			emitter.event(handler)
			
			emitter.fire(1)
			emitter.fire(2)
			emitter.fire(3)
			
			expect(handler).toHaveBeenCalledTimes(3)
			expect(handler).toHaveBeenNthCalledWith(1, 1)
			expect(handler).toHaveBeenNthCalledWith(2, 2)
			expect(handler).toHaveBeenNthCalledWith(3, 3)

			emitter.dispose()
		})

		it('handles empty listener list', () => {
			const emitter = new EventEmitterAdapter<string>()
			
			// Fire without any listeners
			expect(() => emitter.fire('test')).not.toThrow()
			
			emitter.dispose()
		})

		it('handles dispose multiple times safely', () => {
			const emitter = new EventEmitterAdapter<string>()
			
			emitter.dispose()
			expect(() => emitter.dispose()).not.toThrow()
			expect(() => emitter.dispose()).not.toThrow()
		})
	})

	describe('StorageService', () => {
		let storageService: StorageService

		beforeEach(() => {
			storageService = new StorageService()
		})

		describe('update', () => {
			it('should store values correctly', async () => {
				await storageService.update('test-key', 'test-value')

				const result = await storageService.get('test-key')

				expect(result).toBe('test-value')
			})

			it('should overwrite existing values', async () => {
				await storageService.update('test-key', 'initial-value')
				await storageService.update('test-key', 'updated-value')
				
				const result = await storageService.get('test-key')

				expect(result).toBe('updated-value')
			})

			it('should handle different value types', async () => {
				const testObject = { name: 'test', value: 123 }
				const testArray = [1, 2, 3]
				const testNumber = 42
				const testBoolean = true

				await storageService.update('object-key', testObject)
				await storageService.update('array-key', testArray)
				await storageService.update('number-key', testNumber)
				await storageService.update('boolean-key', testBoolean)

				expect(await storageService.get('object-key')).toEqual(testObject)
				expect(await storageService.get('array-key')).toEqual(testArray)
				expect(await storageService.get('number-key')).toBe(testNumber)
				expect(await storageService.get('boolean-key')).toBe(testBoolean)
			})

			it('should handle null and undefined values', async () => {
				await storageService.update('null-key', null)
				await storageService.update('undefined-key', undefined)

				expect(await storageService.get('null-key')).toBeNull()
				expect(await storageService.get('undefined-key')).toBeUndefined()
			})
		})

		describe('get', () => {
			it('should return undefined for non-existent keys', async () => {
				const result = await storageService.get('non-existent-key')

				expect(result).toBeUndefined()
			})

			it('should return correct types for stored values', async () => {
				await storageService.update('string-key', 'hello')
				await storageService.update('number-key', 42)

				const stringResult = await storageService.get<string>('string-key')
				const numberResult = await storageService.get<number>('number-key')

				expect(typeof stringResult).toBe('string')
				expect(typeof numberResult).toBe('number')
				expect(stringResult).toBe('hello')
				expect(numberResult).toBe(42)
			})

			it('should handle complex nested objects', async () => {
				const complexObject = {
					nested: {
						array: [1, 2, 3],
						object: { key: 'value' },
					},
				}

				await storageService.update('complex-key', complexObject)

				const result = await storageService.get('complex-key')

				expect(result).toEqual(complexObject)
				expect(result.nested.array).toEqual([1, 2, 3])
				expect(result.nested.object.key).toBe('value')
			})
		})

		describe('integration', () => {
			it('should maintain separate storage instances', async () => {
				const service1 = new StorageService()
				const service2 = new StorageService()

				await service1.update('key', 'value1')
				await service2.update('key', 'value2')

				expect(await service1.get('key')).toBe('value1')
				expect(await service2.get('key')).toBe('value2')
			})

			it('should handle concurrent operations', async () => {
				const promises = []

				for (let i = 0; i < 10; i++) {
					promises.push(storageService.update(`key${i}`, `value${i}`))
				}

				await Promise.all(promises)

				for (let i = 0; i < 10; i++) {
					const result = await storageService.get(`key${i}`)

					expect(result).toBe(`value${i}`)
				}
			})
		})
	})
})
