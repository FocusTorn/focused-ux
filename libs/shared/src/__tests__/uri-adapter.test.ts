import { describe, it, expect } from 'vitest'
import { UriAdapter } from '@fux/shared'

describe('UriAdapter factory override', () => {
	it('creates file URIs via MockUriFactoryService', () => {
		const uri = UriAdapter.file('/tmp/test.md')

		expect(uri.fsPath.replace(/\\/g, '/')).toBe('/tmp/test.md')
		expect(uri.toString()).toContain('file:///')
	})

	it('joinPath composes paths consistently', () => {
		const base = UriAdapter.file('/root')
		const child = UriAdapter.joinPath(base, 'a', 'b', 'c.txt')

		expect(child.fsPath.replace(/\\/g, '/')).toBe('/root/a/b/c.txt')
	})

	it('dirname returns parent folder', () => {
		const leaf = UriAdapter.file('/root/a/b/c.txt')
		const dir = UriAdapter.dirname(leaf)

		expect(dir.fsPath.replace(/\\/g, '/')).toBe('/root/a/b')
	})
})
