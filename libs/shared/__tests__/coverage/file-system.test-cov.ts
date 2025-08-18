import { describe, it, expect, vi, beforeEach } from 'vitest'

describe('File System Coverage Tests', () => {
	beforeEach(() => {
		vi.resetModules()
	})

	it('should handle file system directory branch', async () => {
		vi.mock('node:fs/promises', () => ({
			stat: vi.fn().mockResolvedValue({ isDirectory: () => true }),
		}))

		const { FileSystemAdapter } = await import('../../src/vscode/adapters/FileSystem.adapter.js')

		const fileSystem = new FileSystemAdapter()
		const result = await fileSystem.stat('test/path')
		expect(result.type).toBe('directory')
	})
}) 