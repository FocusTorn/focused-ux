import { describe, it, expect, vi } from 'vitest'

describe('TreeDataProviderAdapter', () => {
	it('wires events, getTreeItem and getChildren', async () => {
		vi.resetModules()


		vi.mock('vscode', () => {
			const fakeEmitter = { fire: vi.fn(), dispose: vi.fn(), event: Symbol('event') }
			class EventEmitter { fire = fakeEmitter.fire; dispose = fakeEmitter.dispose; get event() { return fakeEmitter.event } }
			return { EventEmitter }
		})

		const { TreeDataProviderAdapter } = await import('../vscode/adapters/TreeDataProvider.adapter.js')
		const service = {
			onDidChangeTreeData: (listener: any) => ({ dispose: vi.fn(() => listener(undefined)) }),
			getChildren: vi.fn().mockResolvedValue([1, 2, 3]),
		}
		const factory = vi.fn((x: number) => ({ label: String(x) }))
		const a = new TreeDataProviderAdapter<number>(service as any, factory as any)

		await a.getChildren()
		expect(service.getChildren).toHaveBeenCalled()
		expect(a.getTreeItem(7)).toEqual({ label: '7' })
		a.dispose()
	})
})
