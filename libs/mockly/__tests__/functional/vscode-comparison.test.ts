import { describe, it, expect } from 'vitest'
import * as vscode from 'vscode'
import { Position as MockPosition, Range as MockRange } from '../../src/_vscCore/vscClasses.js'

describe('VSCode vs Mockly Comparison Tests', () => {
	describe('Position', () => {
		it('should behave identically to VSCode Position', () => {
			// Test constructor
			const vscPos = new vscode.Position(5, 10)
			const mockPos = new MockPosition(5, 10)
			
			expect(mockPos.line).toBe(vscPos.line)
			expect(mockPos.character).toBe(vscPos.character)
			
			// Test comparison methods
			const vscPos2 = new vscode.Position(2, 3)
			const mockPos2 = new MockPosition(2, 3)
			
			expect(mockPos.isBefore(mockPos2)).toBe(vscPos.isBefore(vscPos2))
			expect(mockPos.isAfter(mockPos2)).toBe(vscPos.isAfter(vscPos2))
			expect(mockPos.isEqual(mockPos2)).toBe(vscPos.isEqual(vscPos2))
			expect(mockPos.compareTo(mockPos2)).toBe(vscPos.compareTo(vscPos2))
			
			// Test translation
			const vscTranslated = vscPos.translate(2, 3)
			const mockTranslated = mockPos.translate(2, 3)
			
			expect(mockTranslated.line).toBe(vscTranslated.line)
			expect(mockTranslated.character).toBe(vscTranslated.character)
			
			// Test with method
			const vscModified = vscPos.with({ line: 3, character: 15 })
			const mockModified = mockPos.with({ line: 3, character: 15 })
			
			expect(mockModified.line).toBe(vscModified.line)
			expect(mockModified.character).toBe(vscModified.character)
		})
	})

	describe('Range', () => {
		it('should behave identically to VSCode Range', () => {
			// Test constructor
			const vscRange = new vscode.Range(1, 5, 3, 10)
			const mockRange = new MockRange(1, 5, 3, 10)
			
			expect(mockRange.start.line).toBe(vscRange.start.line)
			expect(mockRange.start.character).toBe(vscRange.start.character)
			expect(mockRange.end.line).toBe(vscRange.end.line)
			expect(mockRange.end.character).toBe(vscRange.end.character)
			
			// Test properties
			expect(mockRange.isEmpty).toBe(vscRange.isEmpty)
			expect(mockRange.isSingleLine).toBe(vscRange.isSingleLine)
			
			// Test contains
			const vscPos = new vscode.Position(2, 7)
			const mockPos = new MockPosition(2, 7)
			
			expect(mockRange.contains(mockPos)).toBe(vscRange.contains(vscPos))
			
			// Test intersection
			const vscRange2 = new vscode.Range(2, 3, 4, 7)
			const mockRange2 = new MockRange(2, 3, 4, 7)
			
			const vscIntersection = vscRange.intersection(vscRange2)
			const mockIntersection = mockRange.intersection(mockRange2)
			
			if (vscIntersection && mockIntersection) {
				expect(mockIntersection.start.line).toBe(vscIntersection.start.line)
				expect(mockIntersection.start.character).toBe(vscIntersection.start.character)
				expect(mockIntersection.end.line).toBe(vscIntersection.end.line)
				expect(mockIntersection.end.character).toBe(vscIntersection.end.character)
			}
			else {
				expect(mockIntersection).toBe(vscIntersection) // Both should be undefined
			}
			
			// Test union
			const vscUnion = vscRange.union(vscRange2)
			const mockUnion = mockRange.union(mockRange2)
			
			expect(mockUnion.start.line).toBe(vscUnion.start.line)
			expect(mockUnion.start.character).toBe(vscUnion.start.character)
			expect(mockUnion.end.line).toBe(vscUnion.end.line)
			expect(mockUnion.end.character).toBe(vscUnion.end.character)
		})
		
		it('should handle edge cases identically to VSCode', () => {
			// Test empty ranges
			const vscEmpty = new vscode.Range(1, 5, 1, 5)
			const mockEmpty = new MockRange(1, 5, 1, 5)
			
			expect(mockEmpty.isEmpty).toBe(vscEmpty.isEmpty)
			expect(mockEmpty.isSingleLine).toBe(vscEmpty.isSingleLine)
			
			// Test single line ranges
			const vscSingle = new vscode.Range(1, 5, 1, 10)
			const mockSingle = new MockRange(1, 5, 1, 10)
			
			expect(mockSingle.isSingleLine).toBe(vscSingle.isSingleLine)
			
			// Test with method
			const vscModified = vscSingle.with({ start: new vscode.Position(0, 0) })
			const mockModified = mockSingle.with({ start: new MockPosition(0, 0) })
			
			expect(mockModified.start.line).toBe(vscModified.start.line)
			expect(mockModified.start.character).toBe(vscModified.start.character)
		})
	})
	
	describe('Complex Scenarios', () => {
		it('should handle complex range operations identically', () => {
			// Create multiple overlapping ranges
			const vscRanges = [
				new vscode.Range(1, 0, 3, 10),
				new vscode.Range(2, 5, 4, 15),
				new vscode.Range(0, 0, 2, 5),
			]
			
			const mockRanges = [
				new MockRange(1, 0, 3, 10),
				new MockRange(2, 5, 4, 15),
				new MockRange(0, 0, 2, 5),
			]
			
			// Test intersections
			for (let i = 0; i < vscRanges.length; i++) {
				for (let j = i + 1; j < vscRanges.length; j++) {
					const vscIntersection = vscRanges[i].intersection(vscRanges[j])
					const mockIntersection = mockRanges[i].intersection(mockRanges[j])
					
					if (vscIntersection && mockIntersection) {
						expect(mockIntersection.start.line).toBe(vscIntersection.start.line)
						expect(mockIntersection.start.character).toBe(vscIntersection.start.character)
						expect(mockIntersection.end.line).toBe(vscIntersection.end.line)
						expect(mockIntersection.end.character).toBe(vscIntersection.end.character)
					}
					else {
						expect(mockIntersection).toBe(vscIntersection)
					}
				}
			}
			
			// Test unions
			for (let i = 0; i < vscRanges.length; i++) {
				for (let j = i + 1; j < vscRanges.length; j++) {
					const vscUnion = vscRanges[i].union(vscRanges[j])
					const mockUnion = mockRanges[i].union(mockRanges[j])
					
					expect(mockUnion.start.line).toBe(vscUnion.start.line)
					expect(mockUnion.start.character).toBe(vscUnion.start.character)
					expect(mockUnion.end.line).toBe(vscUnion.end.line)
					expect(mockUnion.end.character).toBe(vscUnion.end.character)
				}
			}
		})
		
		it('should handle position containment identically', () => {
			const vscRange = new vscode.Range(1, 5, 3, 10)
			const mockRange = new MockRange(1, 5, 3, 10)
			
			// Test various positions
			const testPositions = [
				{ line: 0, character: 0 }, // Before
				{ line: 1, character: 4 }, // Before start
				{ line: 1, character: 5 }, // At start
				{ line: 1, character: 7 }, // Within first line
				{ line: 2, character: 0 }, // Within middle line
				{ line: 3, character: 5 }, // Within last line
				{ line: 3, character: 10 }, // At end
				{ line: 3, character: 15 }, // After end
				{ line: 4, character: 0 }, // After
			]
			
			testPositions.forEach((pos) => {
				const vscPos = new vscode.Position(pos.line, pos.character)
				const mockPos = new MockPosition(pos.line, pos.character)
				
				expect(mockRange.contains(mockPos)).toBe(vscRange.contains(vscPos))
			})
		})
	})
})
