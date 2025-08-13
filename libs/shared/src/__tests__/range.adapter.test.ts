import { describe, it, expect, vi, beforeEach } from 'vitest'

describe('RangeAdapter', () => {
	beforeEach(() => {
		vi.resetModules()
	})

	it('creates a range and exposes start/end creators', async () => {
		const makePos = (line: number, character: number) => ({ line, character })
		const start = makePos(1, 2)
		const end = makePos(3, 4)

		vi.mock('vscode', () => {
			class Position { constructor(public line: number, public character: number) {} }
			class Range { constructor(public start: any, public end: any) {} }
			return { Position, Range }
		})

		const { RangeAdapter } = await import('../vscode/adapters/Range.adapter.js')
		const vs = await import('vscode') as any
		const posStart: any = new vs.Position(start.line, start.character)
		const posEnd: any = new vs.Position(end.line, end.character)

		const range = RangeAdapter.create(posStart, posEnd)

		expect(range.start.create(0, 0)).toEqual(posStart)
		expect(range.end.create(0, 0)).toEqual(posEnd)
	})
})
