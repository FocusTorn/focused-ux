import { describe, it, expect, vi } from 'vitest'

describe('EnvAdapter & ClipboardAdapter', () => {
	it('delegates read/write to vscode.env.clipboard', async () => {
		vi.resetModules()
		vi.mock('vscode', () => ({ env: { clipboard: { readText: vi.fn().mockResolvedValue('x'), writeText: vi.fn().mockResolvedValue(undefined) } } }))

		const { EnvAdapter } = await import('../src/vscode/adapters/Env.adapter.js')
		const a = new EnvAdapter()
		const clip = a.clipboard

		expect(await clip.readText()).toBe('x')
		await clip.writeText('y')

		const vs: any = await import('vscode')

		expect(vs.env.clipboard.readText).toHaveBeenCalled()
		expect(vs.env.clipboard.writeText).toHaveBeenCalledWith('y')
	})
})
