import { describe, it, expect, vi } from 'vitest'

describe('FileTypeAdapter', () => {
	it('maps vscode FileType enums', async () => {
		vi.resetModules()
		vi.mock('vscode', () => ({
			default: { FileType: { Unknown: 0, File: 1, Directory: 2, SymbolicLink: 64 } },
			FileType: { Unknown: 0, File: 1, Directory: 2, SymbolicLink: 64 },
		}))

		const { FileTypeAdapter } = await import('../src/vscode/adapters/FileType.adapter.js')
		const ft = new FileTypeAdapter()

		expect(typeof ft.Unknown).toBe('number')
		expect(typeof ft.File).toBe('number')
		expect(typeof ft.Directory).toBe('number')
		expect(typeof ft.SymbolicLink).toBe('number')
	})
})
