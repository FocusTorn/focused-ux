import { describe, it, expect, vi } from 'vitest'

describe('File System', () => {
	describe('FileSystemAdapter', () => {
		it('wraps fs/promises methods and createDirectory handles success', async () => {
			const { FileSystemAdapter } = await import('../../src/vscode/adapters/FileSystem.adapter.js')

			const fs = new FileSystemAdapter()
			const mod: any = await import('node:fs/promises')

			expect(await fs.stat('p')).toEqual({ type: 'file', size: 10 })
			await fs.access('p')
			await fs.copyFile('a', 'b')
			expect(await fs.readFile('p')).toBe('data')
			await fs.writeFile('p', new Uint8Array())
			await fs.createDirectory('d')

			expect(mod.stat).toHaveBeenCalled()
			expect(mod.access).toHaveBeenCalled()
			expect(mod.copyFile).toHaveBeenCalled()
			expect(mod.readFile).toHaveBeenCalled()
			expect(mod.writeFile).toHaveBeenCalled()
			expect(mod.mkdir).toHaveBeenCalledWith('d', { recursive: true })
		})

		it('warns on failure path (no success log expected)', async () => {
			const warnSpy2 = vi.spyOn(console, 'warn')

			const { FileSystemAdapter: FS2 } = await import('../../src/vscode/adapters/FileSystem.adapter.js')
			const fs2 = new FS2()

			await expect(fs2.createDirectory('/fail')).rejects.toThrow('boom')
			expect(warnSpy2).toHaveBeenCalled()
		})

		it('createDirectory logs and rethrows on failure; readDirectory throws', async () => {
			const spy = vi.spyOn(console, 'warn').mockImplementation(() => {})
			const { FileSystemAdapter } = await import('../../src/vscode/adapters/FileSystem.adapter.js')
			const fs = new FileSystemAdapter()

			await expect(fs.createDirectory('x')).rejects.toThrow('fail')
			expect(() => fs.readDirectory('x' as any)).toThrow(/Method not implemented/)
			spy.mockRestore()
		})
	})

	describe('FileTypeAdapter', () => {
		it('maps vscode FileType enums', async () => {
			const { FileTypeAdapter } = await import('../../src/vscode/adapters/FileType.adapter.js')
			const ft = new FileTypeAdapter()

			expect(typeof ft.Unknown).toBe('number')
			expect(typeof ft.File).toBe('number')
			expect(typeof ft.Directory).toBe('number')
			expect(typeof ft.SymbolicLink).toBe('number')
		})
	})
})
