import { describe, it, expect } from 'vitest'

describe('UriAdapter instance accessors', () => {
	it('exposes path/query/fsPath/toString', async () => {
		const mock = {
			path: '/p',
			query: '?q=1',
			fsPath: 'D:/p',
			toString: () => 'uri://p',
		}
		const { UriAdapter } = await import('../vscode/adapters/Uri.adapter.js')
		const a = new UriAdapter(mock as any)

		expect(a.path).toBe('/p')
		expect(a.query).toBe('?q=1')
		expect(a.fsPath).toBe('D:/p')
		expect(a.toString()).toBe('uri://p')
	})
})
