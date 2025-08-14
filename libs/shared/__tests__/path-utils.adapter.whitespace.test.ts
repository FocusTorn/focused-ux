import { describe, it, expect } from 'vitest'

describe('PathUtilsAdapter whitespace-only inputs', () => {
	it('getDottedPath returns undefined when from/to are whitespace', async () => {
		const { PathUtilsAdapter } = await import('../src/vscode/adapters/PathUtils.adapter.js')
		const p = new PathUtilsAdapter()

		expect(p.getDottedPath('   ', '/to')).toBeUndefined()
		expect(p.getDottedPath('/from', '  ')).toBeUndefined()
	})
})
