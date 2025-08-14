import { describe, it, expect, vi } from 'vitest'

describe('PathUtilsAdapter logging (warn)', () => {
	it('does not rely on console.warn (behavioral outcomes only)', async () => {
		vi.resetModules()

		const { PathUtilsAdapter } = await import('../src/vscode/adapters/PathUtils.adapter.js')
		const p = new PathUtilsAdapter()

		expect(p.getDottedPath('', '/to')).toBeUndefined()
		expect(p.getDottedPath('/from', '')).toBeUndefined()
		// @ts-expect-error runtime guard
		expect(p.sanitizePath(undefined)).toBe('')
	})
})
