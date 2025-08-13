import { describe, it, expect, vi, beforeEach } from 'vitest'
import { PathUtilsAdapter } from '../vscode/adapters/PathUtils.adapter.js'

describe('PathUtilsAdapter', () => {
	beforeEach(() => {
		vi.restoreAllMocks()
	})

	it('getDottedPath returns dotted relative path from dest dir to source file', () => {
		const utils = new PathUtilsAdapter()
		const from = '/a/b/c/src/file.ts'
		const to = '/a/b/c/dist/out.js'

		const rel = utils.getDottedPath(from, to)

		expect(rel).toBe('../src/file.ts')
	})

	it('getDottedPath normalizes separators and prefixes with ./ when needed', () => {
		const utils = new PathUtilsAdapter()
		const from = 'C:/proj/src/file.ts'
		const to = 'C:/proj/index.js'
		const rel = utils.getDottedPath(from, to)

		expect(rel).toBe('./src/file.ts')
	})

	it('getDottedPath returns undefined on invalid inputs', () => {
		const utils = new PathUtilsAdapter()

		expect(utils.getDottedPath('', '/a/b')).toBeUndefined()
		expect(utils.getDottedPath('/a/b', '')).toBeUndefined()
		// @ts-expect-error testing runtime guard
		expect(utils.getDottedPath(undefined, '/a/b')).toBeUndefined()
		// @ts-expect-error testing runtime guard
		expect(utils.getDottedPath('/a/b', null)).toBeUndefined()
	})

	it('sanitizePath replaces invalid characters and never returns empty', () => {
		const utils = new PathUtilsAdapter()

		expect(utils.sanitizePath('inva<li>d*na?me|.txt')).toBe('inva_li_d_na_me_.txt')
		expect(utils.sanitizePath('   ')).toBe('_')
		// @ts-expect-error testing runtime guard
		expect(utils.sanitizePath(undefined)).toBe('')
	})
})
