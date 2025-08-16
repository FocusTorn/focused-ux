import { describe, it, expect, beforeEach } from 'vitest'
import { Position, Range, Disposable, EventEmitter } from '../src/_vscCore/vscClasses.js'

describe('VSCode Core Classes', () => {
	describe('Position', () => {
		describe('constructor', () => {
			it('should create position with line and character', () => {
				const pos = new Position(5, 10)

				expect(pos.line).toBe(5)
				expect(pos.character).toBe(10)
			})

			it('should handle zero values', () => {
				const pos = new Position(0, 0)

				expect(pos.line).toBe(0)
				expect(pos.character).toBe(0)
			})

			it('should handle negative values', () => {
				const pos = new Position(-1, -5)

				expect(pos.line).toBe(-1)
				expect(pos.character).toBe(-5)
			})
		})

		describe('isBefore', () => {
			it('should return true when position is before other', () => {
				const pos1 = new Position(1, 5)
				const pos2 = new Position(2, 0)

				expect(pos1.isBefore(pos2)).toBe(true)
			})

			it('should return false when position is after other', () => {
				const pos1 = new Position(2, 5)
				const pos2 = new Position(1, 10)

				expect(pos1.isBefore(pos2)).toBe(false)
			})

			it('should return false when positions are equal', () => {
				const pos1 = new Position(1, 5)
				const pos2 = new Position(1, 5)

				expect(pos1.isBefore(pos2)).toBe(false)
			})

			it('should handle same line different character', () => {
				const pos1 = new Position(1, 3)
				const pos2 = new Position(1, 7)

				expect(pos1.isBefore(pos2)).toBe(true)
			})
		})

		describe('isBeforeOrEqual', () => {
			it('should return true when position is before other', () => {
				const pos1 = new Position(1, 5)
				const pos2 = new Position(2, 0)

				expect(pos1.isBeforeOrEqual(pos2)).toBe(true)
			})

			it('should return true when positions are equal', () => {
				const pos1 = new Position(1, 5)
				const pos2 = new Position(1, 5)

				expect(pos1.isBeforeOrEqual(pos2)).toBe(true)
			})

			it('should return false when position is after other', () => {
				const pos1 = new Position(2, 5)
				const pos2 = new Position(1, 10)

				expect(pos1.isBeforeOrEqual(pos2)).toBe(false)
			})
		})

		describe('isAfter', () => {
			it('should return true when position is after other', () => {
				const pos1 = new Position(2, 5)
				const pos2 = new Position(1, 10)

				expect(pos1.isAfter(pos2)).toBe(true)
			})

			it('should return false when position is before other', () => {
				const pos1 = new Position(1, 5)
				const pos2 = new Position(2, 0)

				expect(pos1.isAfter(pos2)).toBe(false)
			})

			it('should return false when positions are equal', () => {
				const pos1 = new Position(1, 5)
				const pos2 = new Position(1, 5)

				expect(pos1.isAfter(pos2)).toBe(false)
			})
		})

		describe('isAfterOrEqual', () => {
			it('should return true when position is after other', () => {
				const pos1 = new Position(2, 5)
				const pos2 = new Position(1, 10)

				expect(pos1.isAfterOrEqual(pos2)).toBe(true)
			})

			it('should return true when positions are equal', () => {
				const pos1 = new Position(1, 5)
				const pos2 = new Position(1, 5)

				expect(pos1.isAfterOrEqual(pos2)).toBe(true)
			})

			it('should return false when position is before other', () => {
				const pos1 = new Position(1, 5)
				const pos2 = new Position(2, 0)

				expect(pos1.isAfterOrEqual(pos2)).toBe(false)
			})
		})

		describe('isEqual', () => {
			it('should return true when positions are equal', () => {
				const pos1 = new Position(1, 5)
				const pos2 = new Position(1, 5)

				expect(pos1.isEqual(pos2)).toBe(true)
			})

			it('should return false when line numbers differ', () => {
				const pos1 = new Position(1, 5)
				const pos2 = new Position(2, 5)

				expect(pos1.isEqual(pos2)).toBe(false)
			})

			it('should return false when character positions differ', () => {
				const pos1 = new Position(1, 5)
				const pos2 = new Position(1, 6)

				expect(pos1.isEqual(pos2)).toBe(false)
			})
		})

		describe('compareTo', () => {
			it('should return negative when position is before other', () => {
				const pos1 = new Position(1, 5)
				const pos2 = new Position(2, 0)

				expect(pos1.compareTo(pos2)).toBeLessThan(0)
			})

			it('should return positive when position is after other', () => {
				const pos1 = new Position(2, 5)
				const pos2 = new Position(1, 10)

				expect(pos1.compareTo(pos2)).toBeGreaterThan(0)
			})

			it('should return zero when positions are equal', () => {
				const pos1 = new Position(1, 5)
				const pos2 = new Position(1, 5)

				expect(pos1.compareTo(pos2)).toBe(0)
			})
		})

		describe('translate', () => {
			it('should translate position by delta line and character', () => {
				const pos = new Position(1, 5)
				const translated = pos.translate(2, 3)

				expect(translated.line).toBe(3)
				expect(translated.character).toBe(8)
			})

			it('should translate by line only', () => {
				const pos = new Position(1, 5)
				const translated = pos.translate(2)

				expect(translated.line).toBe(3)
				expect(translated.character).toBe(5)
			})

			it('should handle negative deltas', () => {
				const pos = new Position(5, 10)
				const translated = pos.translate(-2, -3)

				expect(translated.line).toBe(3)
				expect(translated.character).toBe(7)
			})

			it('should return new instance', () => {
				const pos = new Position(1, 5)
				const translated = pos.translate(1, 1)

				expect(translated).not.toBe(pos)
			})
		})

		describe('with', () => {
			it('should create new position with modified line', () => {
				const pos = new Position(1, 5)
				const modified = pos.with({ line: 3 })

				expect(modified.line).toBe(3)
				expect(modified.character).toBe(5)
				expect(modified).not.toBe(pos)
			})

			it('should create new position with modified character', () => {
				const pos = new Position(1, 5)
				const modified = pos.with({ character: 10 })

				expect(modified.line).toBe(1)
				expect(modified.character).toBe(10)
				expect(modified).not.toBe(pos)
			})

			it('should create new position with both modified', () => {
				const pos = new Position(1, 5)
				const modified = pos.with({ line: 3, character: 10 })

				expect(modified.line).toBe(3)
				expect(modified.character).toBe(10)
				expect(modified).not.toBe(pos)
			})
		})
	})

	describe('Range', () => {
		describe('constructor', () => {
			it('should create range with start and end positions', () => {
				const start = new Position(1, 5)
				const end = new Position(2, 10)
				const range = new Range(start, end)

				expect(range.start).toBe(start)
				expect(range.end).toBe(end)
			})

			it('should create range with line and character numbers', () => {
				const range = new Range(1, 5, 2, 10)

				expect(range.start.line).toBe(1)
				expect(range.start.character).toBe(5)
				expect(range.end.line).toBe(2)
				expect(range.end.character).toBe(10)
			})

			it('should handle single position range', () => {
				const pos = new Position(1, 5)
				const range = new Range(pos, pos)

				expect(range.start).toBe(pos)
				expect(range.end).toBe(pos)
			})
		})

		describe('isEmpty', () => {
			it('should return true when start equals end', () => {
				const pos = new Position(1, 5)
				const range = new Range(pos, pos)

				expect(range.isEmpty).toBe(true)
			})

			it('should return false when start differs from end', () => {
				const start = new Position(1, 5)
				const end = new Position(1, 10)
				const range = new Range(start, end)

				expect(range.isEmpty).toBe(false)
			})

			it('should return false when lines differ', () => {
				const start = new Position(1, 5)
				const end = new Position(2, 5)
				const range = new Range(start, end)

				expect(range.isEmpty).toBe(false)
			})
		})

		describe('isSingleLine', () => {
			it('should return true when start and end are on same line', () => {
				const start = new Position(1, 5)
				const end = new Position(1, 10)
				const range = new Range(start, end)

				expect(range.isSingleLine).toBe(true)
			})

			it('should return false when start and end are on different lines', () => {
				const start = new Position(1, 5)
				const end = new Position(2, 5)
				const range = new Range(start, end)

				expect(range.isSingleLine).toBe(false)
			})

			it('should return true for empty range', () => {
				const pos = new Position(1, 5)
				const range = new Range(pos, pos)

				expect(range.isSingleLine).toBe(true)
			})
		})

		describe('contains', () => {
			it('should return true when position is within range', () => {
				const start = new Position(1, 5)
				const end = new Position(3, 10)
				const range = new Range(start, end)
				const pos = new Position(2, 7)

				expect(range.contains(pos)).toBe(true)
			})

			it('should return true when position is at start', () => {
				const start = new Position(1, 5)
				const end = new Position(3, 10)
				const range = new Range(start, end)

				expect(range.contains(start)).toBe(true)
			})

			it('should return true when position is at end (inclusive)', () => {
				const start = new Position(1, 5)
				const end = new Position(3, 10)
				const range = new Range(start, end)

				expect(range.contains(end)).toBe(true) // Range.contains is inclusive of end
			})

			it('should return false when position is before range', () => {
				const start = new Position(1, 5)
				const end = new Position(3, 10)
				const range = new Range(start, end)
				const pos = new Position(0, 10)

				expect(range.contains(pos)).toBe(false)
			})

			it('should return false when position is after range', () => {
				const start = new Position(1, 5)
				const end = new Position(3, 10)
				const range = new Range(start, end)
				const pos = new Position(4, 5)

				expect(range.contains(pos)).toBe(false)
			})
		})

		describe('intersection', () => {
			it('should return intersection of overlapping ranges', () => {
				const range1 = new Range(1, 5, 3, 10)
				const range2 = new Range(2, 3, 4, 7)
				const intersection = range1.intersection(range2)

				expect(intersection?.start.line).toBe(2)
				expect(intersection?.start.character).toBe(3)
				expect(intersection?.end.line).toBe(3)
				expect(intersection?.end.character).toBe(10)
			})

			it('should return undefined for non-overlapping ranges', () => {
				const range1 = new Range(1, 5, 2, 10)
				const range2 = new Range(3, 5, 4, 10)
				const intersection = range1.intersection(range2)

				expect(intersection).toBeUndefined()
			})

			it('should return intersection for adjacent ranges', () => {
				const range1 = new Range(1, 5, 2, 10)
				const range2 = new Range(2, 10, 3, 15)
				const intersection = range1.intersection(range2)

				expect(intersection).toBeDefined()
				expect(intersection?.start.line).toBe(2)
				expect(intersection?.start.character).toBe(10)
				expect(intersection?.end.line).toBe(2)
				expect(intersection?.end.character).toBe(10)
			})
		})

		describe('union', () => {
			it('should return union of overlapping ranges', () => {
				const range1 = new Range(1, 5, 3, 10)
				const range2 = new Range(2, 3, 4, 7)
				const union = range1.union(range2)

				expect(union.start.line).toBe(1)
				expect(union.start.character).toBe(5)
				expect(union.end.line).toBe(4)
				expect(union.end.character).toBe(7)
			})

			it('should return union of adjacent ranges', () => {
				const range1 = new Range(1, 5, 2, 10)
				const range2 = new Range(2, 10, 3, 15)
				const union = range1.union(range2)

				expect(union.start.line).toBe(1)
				expect(union.start.character).toBe(5)
				expect(union.end.line).toBe(3)
				expect(union.end.character).toBe(15)
			})

			it('should return union of non-overlapping ranges', () => {
				const range1 = new Range(1, 5, 2, 10)
				const range2 = new Range(4, 5, 5, 10)
				const union = range1.union(range2)

				expect(union.start.line).toBe(1)
				expect(union.start.character).toBe(5)
				expect(union.end.line).toBe(5)
				expect(union.end.character).toBe(10)
			})
		})

		describe('with', () => {
			it('should create new range with modified start', () => {
				const range = new Range(1, 5, 3, 10)
				const newStart = new Position(0, 0)
				const modified = range.with({ start: newStart })

				expect(modified.start).toBe(newStart)
				expect(modified.end).toBe(range.end)
				expect(modified).not.toBe(range)
			})

			it('should create new range with modified end', () => {
				const range = new Range(1, 5, 3, 10)
				const newEnd = new Position(5, 15)
				const modified = range.with({ end: newEnd })

				expect(modified.start).toBe(range.start)
				expect(modified.end).toBe(newEnd)
				expect(modified).not.toBe(range)
			})
		})
	})

	describe('Disposable', () => {
		it('should create disposable with dispose function', () => {
			let disposed = false
			const disposable = new Disposable(() => {
				disposed = true
			})
			
			expect(disposable).toBeInstanceOf(Disposable)
			expect(typeof disposable.dispose).toBe('function')
		})

		it('should call dispose function when dispose is called', () => {
			let disposed = false
			const disposable = new Disposable(() => {
				disposed = true
			})
			
			disposable.dispose()
			expect(disposed).toBe(true)
		})

		it('should handle dispose function that throws gracefully', () => {
			const disposable = new Disposable(() => {
				throw new Error('Dispose error')
			})
			
			// The implementation catches errors and logs them, so it shouldn't throw
			expect(() => disposable.dispose()).not.toThrow()
		})

		it('should handle undefined dispose function', () => {
			const disposable = new Disposable(undefined)

			expect(() => disposable.dispose()).not.toThrow()
		})
	})

	describe('EventEmitter', () => {
		let eventEmitter: EventEmitter<string>

		beforeEach(() => {
			eventEmitter = new EventEmitter<string>()
		})

		describe('constructor', () => {
			it('should create event emitter instance', () => {
				expect(eventEmitter).toBeInstanceOf(EventEmitter)
			})
		})

		describe('event property', () => {
			it('should provide event property for subscription', () => {
				expect(typeof eventEmitter.event).toBe('function')
			})
		})

		describe('fire method', () => {
			it('should fire event to listeners', () => {
				let receivedData: string | undefined
				const listener = (data: string) => {
					receivedData = data
				}
				
				eventEmitter.event(listener)
				eventEmitter.fire('test data')
				
				expect(receivedData).toBe('test data')
			})

			it('should fire event to multiple listeners', () => {
				const receivedData: string[] = []
				const listener1 = (data: string) => receivedData.push(`1: ${data}`)
				const listener2 = (data: string) => receivedData.push(`2: ${data}`)
				
				eventEmitter.event(listener1)
				eventEmitter.event(listener2)
				eventEmitter.fire('test data')
				
				expect(receivedData).toContain('1: test data')
				expect(receivedData).toContain('2: test data')
			})

			it('should handle listeners that throw gracefully', () => {
				const listener = () => {
					throw new Error('Listener error')
				}
			
				eventEmitter.event(listener)
				// The implementation catches errors and logs them, so it shouldn't throw
				expect(() => eventEmitter.fire('test')).not.toThrow()
			})
		})

		describe('dispose method', () => {
			it('should dispose event emitter', () => {
				expect(() => eventEmitter.dispose()).not.toThrow()
			})

			it('should prevent firing after disposal', () => {
				let receivedData: string | undefined
				const listener = (data: string) => {
					receivedData = data
				}
				
				eventEmitter.event(listener)
				eventEmitter.dispose()
				eventEmitter.fire('test data')
				
				expect(receivedData).toBeUndefined()
			})
		})
	})
})
