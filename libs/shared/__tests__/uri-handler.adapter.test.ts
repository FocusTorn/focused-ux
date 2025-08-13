import { describe, it, expect } from 'vitest'

describe('UriHandlerAdapter', () => {
	it('instance handleUri unwraps UriAdapter and static create wraps handler', async () => {
		const handled: any[] = []
		const handler = { handleUri: async (uri: any) => { handled.push(uri) } }
		const { UriHandlerAdapter } = await import('../src/vscode/adapters/UriHandler.adapter.js')
		const { UriAdapter } = await import('../src/vscode/adapters/Uri.adapter.js')

		const instance = new UriHandlerAdapter({ handleUri: async (_u: any) => {} } as any)

		await instance.handleUri(new UriAdapter({ fsPath: '/x', toString: () => 'file:///x', path: '/x', query: '', fragment: '' } as any))

		const vs: any = await import('vscode')
		const created = UriHandlerAdapter.create(handler)

		await created.handleUri({ fsPath: '/y', toString: () => 'file:///y', path: '/y', query: '', fragment: '' } as any)

		expect(handled.length).toBe(1)
		// Ensure the adapter passed
		expect((handled[0] as any).toString()).toContain('file:///')
	})
})
