import { describe, it, expect, vi, beforeEach } from 'vitest'
import { PathUtilsAdapter } from '../../src/vscode/adapters/PathUtils.adapter.js'

describe('Path Comprehensive Tests', () => {
	describe('PathAdapter', () => {
		it('wraps node:path _helpers', async () => {
			const { PathAdapter } = await import('../../src/vscode/adapters/Path.adapter.js')
			const p = new PathAdapter()

			expect(p.join('/a', 'b')).toContain('a')
			expect(p.basename('/a/b.txt')).toBe('b.txt')
			expect(p.parse('/a/b.txt').ext).toBe('.txt')
			expect(p.dirname('/a/b/c')).toContain('/a/b')
			expect(typeof p.relative('/a/b', '/a/b/c')).toBe('string')
		})
	})

	describe('PathUtilsAdapter', () => {
		let utils: PathUtilsAdapter

		beforeEach(() => {
			utils = new PathUtilsAdapter()
			vi.restoreAllMocks()
		})

		it('getDottedPath returns dotted relative path from dest dir to source file', () => {
			const from = '/a/b/c/src/file.ts'
			const to = '/a/b/c/dist/out.js'

			const rel = utils.getDottedPath(from, to)

			expect(rel).toBe('../src/file.ts')
		})

		it('getDottedPath normalizes separators and prefixes with ./ when needed', () => {
			const from = 'C:/proj/src/file.ts'
			const to = 'C:/proj/index.js'
			const rel = utils.getDottedPath(from, to)

			expect(rel).toBe('./src/file.ts')
		})

		it('getDottedPath returns undefined on invalid inputs', () => {
			expect(utils.getDottedPath('', '/a/b')).toBeUndefined()
			expect(utils.getDottedPath('/a/b', '')).toBeUndefined()
			// @ts-expect-error testing runtime guard
			expect(utils.getDottedPath(undefined, '/a/b')).toBeUndefined()
			// @ts-expect-error testing runtime guard
			expect(utils.getDottedPath('/a/b', null)).toBeUndefined()
		})

		it('sanitizePath replaces invalid characters and never returns empty', () => {
			expect(utils.sanitizePath('inva<li>d*na?me|.txt')).toBe('inva_li_d_na_me_.txt')
			expect(utils.sanitizePath('   ')).toBe('_')
			// @ts-expect-error testing runtime guard
			expect(utils.sanitizePath(undefined)).toBe('')
		})

			it('getDottedPath returns undefined when from/to are whitespace', async () => {
		const { PathUtilsAdapter } = await import('../../src/vscode/adapters/PathUtils.adapter.js')
		const p = new PathUtilsAdapter()

			expect(p.getDottedPath('   ', '/to')).toBeUndefined()
			expect(p.getDottedPath('/from', '  ')).toBeUndefined()
		})

			it('does not rely on console.warn (behavioral outcomes only)', async () => {
		vi.resetModules()

		const { PathUtilsAdapter } = await import('../../src/vscode/adapters/PathUtils.adapter.js')
		const p = new PathUtilsAdapter()

			expect(p.getDottedPath('', '/to')).toBeUndefined()
			expect(p.getDottedPath('/from', '')).toBeUndefined()
			// @ts-expect-error runtime guard
			expect(p.sanitizePath(undefined)).toBe('')
		})
	})
})
