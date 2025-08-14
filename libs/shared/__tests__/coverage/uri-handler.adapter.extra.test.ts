import { describe, it, expect, vi } from 'vitest'

describe('coverage-only: UriHandlerAdapter extra coverage', () => {
	it('static create wraps to call handler with UriAdapter', async () => {
		vi.resetModules()

		const handler = { handleUri: vi.fn(async (_u: any) => undefined) }
		const { UriHandlerAdapter } = await import('../../src/vscode/adapters/UriHandler.adapter.js')
		const vsHandler = UriHandlerAdapter.create(handler as any)

		await vsHandler.handleUri({ fsPath: '/x', path: '/x' } as any)
		expect(handler.handleUri).toHaveBeenCalled()
	})
})

