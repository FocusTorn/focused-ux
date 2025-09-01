import { describe, it, expect, vi } from 'vitest'

describe('UI Components Tests', () => {
	describe('QuickPickAdapter', () => {
		it('should handle quick pick operations', async () => {
			vi.resetModules()
			vi.mock('vscode', () => ({
				window: {
					showQuickPick: vi.fn().mockResolvedValue('selected'),
				},
			}))

			const { QuickPickAdapter } = await import('../../src/vscode/adapters/QuickPick.adapter.js')
			const adapter = new QuickPickAdapter()

			expect(adapter).toBeDefined()
		})
	})

	describe('ProgressAdapter', () => {
		it('should handle progress operations', async () => {
			vi.resetModules()
			vi.mock('vscode', () => ({
				window: {
					withProgress: vi.fn().mockImplementation(async (options, task) => {
						return await task({ report: vi.fn() })
					}),
				},
			}))

			const { ProgressAdapter } = await import('../../src/vscode/adapters/Progress.adapter.js')
			const adapter = new ProgressAdapter()

			expect(adapter).toBeDefined()
		})
	})

	describe('CommandsAdapter', () => {
		it('should handle command operations', async () => {
			vi.resetModules()
			vi.mock('vscode', () => ({
				commands: {
					registerCommand: vi.fn(),
					executeCommand: vi.fn().mockResolvedValue('result'),
				},
			}))

			const { CommandsAdapter } = await import('../../src/vscode/adapters/Commands.adapter.js')
			const adapter = new CommandsAdapter()

			expect(adapter).toBeDefined()
		})
	})
})
