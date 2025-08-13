import { describe, it, expect, vi } from 'vitest'

describe('QuickPickAdapter', () => {
	it('maps items and returns selected data', async () => {
		vi.resetModules()
		vi.mock('vscode', () => ({
			window: { showQuickPick: vi.fn(async (items: any[]) => items[1]) },
		}))

		const { QuickPickAdapter } = await import('../src/vscode/adapters/QuickPick.adapter.js')
		const a = new QuickPickAdapter()
		const items = [
			{ label: 'a', description: 'A', iconPath: undefined, value: 1 },
			{ label: 'b', description: 'B', iconPath: undefined, value: 2 },
		]
		const result = await a.showQuickPickSingle(items, { placeHolder: 'p' }, 'value')

		expect(result).toBe(2)
	})
})
