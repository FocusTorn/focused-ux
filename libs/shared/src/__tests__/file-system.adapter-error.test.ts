import { describe, it, expect, vi } from 'vitest'

describe('FileSystemAdapter - error branches', () => {
	it('createDirectory logs and rethrows on failure; readDirectory throws', async () => {
		vi.resetModules()

		const mkdirErr = new Error('fail')

		vi.mock('node:fs/promises', () => ({ mkdir: vi.fn().mockRejectedValue(mkdirErr) }))

		const spy = vi.spyOn(console, 'warn').mockImplementation(() => {})
		const { FileSystemAdapter } = await import('../vscode/adapters/FileSystem.adapter.js')
		const fs = new FileSystemAdapter()

		await expect(fs.createDirectory('x')).rejects.toThrow('fail')
		await expect(fs.readDirectory('x' as any)).rejects.toThrow('Method not implemented')
		spy.mockRestore()
	})
})
