import { describe, it, expect, vi } from 'vitest'

describe('PathUtilsAdapter extra branches', () => {
	it('returns undefined for empty/invalid inputs and catches path.relative errors', async () => {
		vi.resetModules()

		const { PathUtilsAdapter } = await import('../src/vscode/adapters/PathUtils.adapter.js')
		const p = new PathUtilsAdapter()

		expect(p.getDottedPath('', '/to')).toBeUndefined()
		expect(p.getDottedPath('/from', '')).toBeUndefined()
		expect(p.getDottedPath(undefined as any, '/to')).toBeUndefined()

		vi.mock('node:path', async (importOriginal) => {
			const actual = await importOriginal<any>()

			return {
				...actual,
				relative: () => { throw new Error('boom') },
			}
		})

		const { PathUtilsAdapter: P2 } = await import('../src/vscode/adapters/PathUtils.adapter.js')
		const p2 = new P2()

		expect(p2.getDottedPath('/from', '/to')).toBeUndefined()
	})
})
