import { describe, it, expect, vi } from 'vitest'

describe('FileSystemAdapter logging (warn/error)', () => {
	it('warns on failure path (no success log expected)', async () => {
		vi.resetModules()

		const warnSpy2 = vi.spyOn(console, 'warn')

		vi.mock('node:fs/promises', async (importOriginal) => {
			const actual = await importOriginal<any>()

			return {
				...actual,
				mkdir: vi.fn(async () => { throw new Error('boom') }),
			}
		})

		const { FileSystemAdapter: FS2 } = await import('../src/vscode/adapters/FileSystem.adapter.js')
		const fs2 = new FS2()

		await expect(fs2.createDirectory('/fail')).rejects.toThrow('boom')
		expect(warnSpy2).toHaveBeenCalled()
	})
})
