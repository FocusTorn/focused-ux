import { describe, it, expect, vi } from 'vitest'

describe('coverage-only: PathUtilsAdapter remaining branches', () => {
	it('getDottedPath returns undefined when relative() returns empty string', async () => {
		vi.resetModules()
		vi.mock('node:path', async (importOriginal) => {
			const actual = await importOriginal<any>()

			return { ...actual, dirname: (p: string) => p, relative: () => '' }
		})

		const { PathUtilsAdapter } = await import('../../src/vscode/adapters/PathUtils.adapter.js')
		const utils = new PathUtilsAdapter()

		expect(utils.getDottedPath('/a/b', '/a/b')).toBeUndefined()
	})
})

