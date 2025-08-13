import { describe, it, expect, vi } from 'vitest'

describe('RelativePatternAdapter', () => {
	it('exposes base and pattern; static create wraps instance', async () => {
		vi.resetModules()
		class RP { constructor(public base: string, public pattern: string) {} }
		vi.mock('vscode', () => ({ RelativePattern: RP }))

		const { RelativePatternAdapter } = await import('../vscode/adapters/RelativePattern.adapter.js')
		const inst = new RelativePatternAdapter(new RP('/b', '**/*.ts') as any)

		expect(inst.base).toBe('/b')
		expect(inst.pattern).toBe('**/*.ts')

		const created = RelativePatternAdapter.create('/x', '*.md')

		expect((created as any).relativePattern.base).toBe('/x')
		expect((created as any).relativePattern.pattern).toBe('*.md')
	})
})
