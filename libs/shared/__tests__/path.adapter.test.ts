import { describe, it, expect } from 'vitest'

describe('PathAdapter', () => {
	it('wraps node:path helpers', async () => {
		const { PathAdapter } = await import('../src/vscode/adapters/Path.adapter.js')
		const p = new PathAdapter()

		expect(p.join('/a', 'b')).toContain('a')
		expect(p.basename('/a/b.txt')).toBe('b.txt')
		expect(p.parse('/a/b.txt').ext).toBe('.txt')
		expect(p.dirname('/a/b/c')).toContain('/a/b')
		expect(typeof p.relative('/a/b', '/a/b/c')).toBe('string')
	})
})
