import { describe, it, expect, vi } from 'vitest'

describe('FileSystemAdapter', () => {
	it('wraps fs/promises methods and createDirectory handles success', async () => {
		vi.resetModules()
		vi.mock('node:fs/promises', () => {
			return {
				stat: vi.fn().mockResolvedValue({ isDirectory: () => false, size: 10 }),
				access: vi.fn().mockResolvedValue(undefined),
				copyFile: vi.fn().mockResolvedValue(undefined),
				readFile: vi.fn().mockResolvedValue('data'),
				writeFile: vi.fn().mockResolvedValue(undefined),
				mkdir: vi.fn().mockResolvedValue(undefined),
			}
		})

		const { FileSystemAdapter } = await import('../src/vscode/adapters/FileSystem.adapter.js')
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
})
