import { describe, it, expect, vi } from 'vitest'

describe('UriAdapter factory methods', () => {
	it('exercises setFactory/getFactory and static methods', async () => {
		vi.resetModules()
		vi.mock('vscode', () => ({ Uri: { file: (p: string) => ({ fsPath: p, path: p, toString: () => `file://${p}` }) } }))

		const { UriAdapter } = await import('../src/vscode/adapters/Uri.adapter.js')
		const factory = {
			file: (p: string) => new UriAdapter({ fsPath: p, path: p, toString: () => `file://${p}` } as any),
			create: (u: any) => new UriAdapter(u as any),
			joinPath: (b: any, ...segs: string[]) => new UriAdapter({ fsPath: [b.uri.fsPath, ...segs].join('/'), path: [b.uri.path, ...segs].join('/') } as any),
			dirname: (u: any) => new UriAdapter({ fsPath: `${u.uri.fsPath}/..`, path: `${u.uri.path}/..` } as any),
		}

		UriAdapter.setFactory(factory as any)
		expect(UriAdapter.getFactory()).toBe(factory)

		const f = UriAdapter.file('/p') as any

		expect(f.fsPath ?? f.uri?.fsPath).toContain('/p')

		const c = UriAdapter.create({ fsPath: '/x', path: '/x' } as any) as any

		expect(c.fsPath ?? c.uri?.fsPath).toContain('/x')

		const j = UriAdapter.joinPath(c as any, 'a') as any

		expect((j.fsPath ?? j.uri?.fsPath)).toContain('/x/a')

		const d = UriAdapter.dirname(c as any) as any

		expect((d.fsPath ?? d.uri?.fsPath)).toContain('/x/..')
	})
})
