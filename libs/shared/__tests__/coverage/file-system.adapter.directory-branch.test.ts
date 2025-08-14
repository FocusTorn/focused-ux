import { describe, it, expect, vi } from 'vitest'

describe('coverage-only: FileSystemAdapter directory branch', () => {
	it('stat returns directory when isDirectory() is true', async () => {
		vi.resetModules()
		vi.mock('node:fs/promises', () => {
			return {
				stat: vi.fn().mockResolvedValue({ isDirectory: () => true, size: 5 }),
			}
		})

		const { FileSystemAdapter } = await import('../../src/vscode/adapters/FileSystem.adapter.js')
		const fs = new FileSystemAdapter()

		expect(await fs.stat('dir')).toEqual({ type: 'directory', size: 5 })
	})
})

