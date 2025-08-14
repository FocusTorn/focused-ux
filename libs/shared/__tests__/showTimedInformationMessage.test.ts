import { describe, it, expect } from 'vitest'
import { showTimedInformationMessage } from '../src/utils/showTimedInformationMessage.js'
import type { IProgressWindow } from '../src/utils/showTimedInformationMessage.js'

describe('showTimedInformationMessage', () => {
	it('invokes withProgress with provided title and waits approximately duration', async () => {
		const calls: Array<{ title: string }> = []

		const window: IProgressWindow = {
			withProgress: async (options, task) => {
				calls.push({ title: options.title })

				const result = await task({ report: (_v) => {} })

				return result
			},
		}

		const start = Date.now()

		await showTimedInformationMessage(window, 'Hello', 10)

		const elapsed = Date.now() - start

		expect(calls).toHaveLength(1)
		expect(calls[0].title).toBe('Hello')

		// Allow some jitter on CI; only assert it waited at least ~8ms
		expect(elapsed).toBeGreaterThanOrEqual(8)
	})
})
