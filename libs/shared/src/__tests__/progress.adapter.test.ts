import { describe, it, expect, vi } from 'vitest'

describe('ProgressAdapter', () => {
	it('delegates to vscode.window.withProgress', async () => {
		vi.resetModules()
		vi.mock('vscode', () => ({ window: { withProgress: vi.fn((_o: any, task: any) => task({})) } }))

		const { ProgressAdapter } = await import('../vscode/adapters/Progress.adapter.js')
		const result = await ProgressAdapter.withProgress({} as any, async () => 'done')

		expect(result).toBe('done')
	})
})
