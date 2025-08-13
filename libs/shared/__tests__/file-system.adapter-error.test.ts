import { describe, it, expect, vi } from 'vitest'

describe('FileSystemAdapter - error branches', () => {
	it('createDirectory logs and rethrows on failure; readDirectory throws', async () => {
		vi.resetModules()

		vi.mock('node:fs/promises', () => ({ mkdir: vi.fn().mockRejectedValue(new Error('fail')) }))

		const spy = vi.spyOn(console, 'warn').mockImplementation(() => {})
		const { FileSystemAdapter } = await import('../src/vscode/adapters/FileSystem.adapter.js')
		const fs = new FileSystemAdapter()

		await expect(fs.createDirectory('x')).rejects.toThrow('fail')
		expect(() => fs.readDirectory('x' as any)).toThrow(/Method not implemented/)
		spy.mockRestore()
	})
})
