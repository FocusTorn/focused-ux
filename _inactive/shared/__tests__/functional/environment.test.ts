import { describe, it, expect } from 'vitest'

describe('Environment Tests', () => {
	describe('EnvAdapter', () => {
		it('should handle environment variables', async () => {
			const { EnvAdapter } = await import('../../src/vscode/adapters/Env.adapter.js')
			const adapter = new EnvAdapter()

			expect(adapter.clipboard).toBeDefined()
			expect(adapter.clipboard.readText).toBeDefined()
			expect(adapter.clipboard.writeText).toBeDefined()
		})
	})

	describe('ProcessAdapter', () => {
		it('should handle process operations', async () => {
			const { ProcessAdapter } = await import('../../src/vscode/adapters/Process.adapter.js')
			const mockWorkspace = { workspaceFolders: [] }
			const adapter = new ProcessAdapter(mockWorkspace as any)

			expect(adapter).toBeDefined()
		})
	})

	describe('ExtensionsAdapter', () => {
		it('should handle extension operations', async () => {
			const { ExtensionsAdapter } = await import('../../src/vscode/adapters/Extensions.adapter.js')
			const adapter = new ExtensionsAdapter()

			expect(adapter).toBeDefined()
		})
	})
})
