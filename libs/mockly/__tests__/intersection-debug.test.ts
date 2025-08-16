import { describe, it, expect } from 'vitest'
import * as vscode from 'vscode'
import { Position as MockPosition, Range as MockRange } from '../src/_vscCore/vscClasses.js'

describe('Intersection Debug Tests', () => {
	it('should debug the specific failing intersection case', () => {
		// The specific case from our failing test
		const range1 = new vscode.Range(1, 5, 3, 10)
		const range2 = new vscode.Range(2, 3, 4, 7)
		
		console.log('VSCode Range 1:', {
			start: { line: range1.start.line, character: range1.start.character },
			end: { line: range1.end.line, character: range1.end.character }
		})
		
		console.log('VSCode Range 2:', {
			start: { line: range2.start.line, character: range2.start.character },
			end: { line: range2.end.line, character: range2.end.character }
		})
		
		const intersection = range1.intersection(range2)
		
		console.log('VSCode Intersection:', intersection ? {
			start: { line: intersection.start.line, character: intersection.start.character },
			end: { line: intersection.end.line, character: intersection.end.character }
		} : 'undefined')
		
		// Now test with Mockly
		const mockRange1 = new MockRange(1, 5, 3, 10)
		const mockRange2 = new MockRange(2, 3, 4, 7)
		
		console.log('Mockly Range 1:', {
			start: { line: mockRange1.start.line, character: mockRange1.start.character },
			end: { line: mockRange1.end.line, character: mockRange1.end.character }
		})
		
		console.log('Mockly Range 2:', {
			start: { line: mockRange2.start.line, character: mockRange2.start.character },
			end: { line: mockRange2.end.line, character: mockRange2.end.character }
		})
		
		const mockIntersection = mockRange1.intersection(mockRange2)
		
		console.log('Mockly Intersection:', mockIntersection ? {
			start: { line: mockIntersection.start.line, character: mockIntersection.start.character },
			end: { line: mockIntersection.end.line, character: mockIntersection.end.character }
		} : 'undefined')
		
		// Now compare the results
		if (intersection && mockIntersection) {
			console.log('Comparing results:')
			console.log('Start line:', mockIntersection.start.line, 'vs', intersection.start.line)
			console.log('Start character:', mockIntersection.start.character, 'vs', intersection.start.character)
			console.log('End line:', mockIntersection.end.line, 'vs', intersection.end.line)
			console.log('End character:', mockIntersection.end.character, 'vs', intersection.end.character)
			
			expect(mockIntersection.start.line).toBe(intersection.start.line)
			expect(mockIntersection.start.character).toBe(intersection.start.character)
			expect(mockIntersection.end.line).toBe(intersection.end.line)
			expect(mockIntersection.end.character).toBe(intersection.end.character)
		} else {
			expect(mockIntersection).toBe(intersection)
		}
	})
	
	it('should debug position comparison logic', () => {
		// Test the specific positions from our ranges
		const pos1 = new vscode.Position(3, 10) // end of range1
		const pos2 = new vscode.Position(4, 7)  // end of range2
		
		console.log('VSCode Position 1:', { line: pos1.line, character: pos1.character })
		console.log('VSCode Position 2:', { line: pos2.line, character: pos2.character })
		
		console.log('pos1.isBefore(pos2):', pos1.isBefore(pos2))
		console.log('pos1.isAfter(pos2):', pos1.isAfter(pos2))
		console.log('pos1.isEqual(pos2):', pos1.isEqual(pos2))
		console.log('pos1.compareTo(pos2):', pos1.compareTo(pos2))
		
		// Now test with Mockly
		const mockPos1 = new MockPosition(3, 10)
		const mockPos2 = new MockPosition(4, 7)
		
		console.log('Mockly Position 1:', { line: mockPos1.line, character: mockPos1.character })
		console.log('Mockly Position 2:', { line: mockPos2.line, character: mockPos2.character })
		
		console.log('mockPos1.isBefore(mockPos2):', mockPos1.isBefore(mockPos2))
		console.log('mockPos1.isAfter(mockPos2):', mockPos1.isAfter(mockPos2))
		console.log('mockPos1.isEqual(mockPos2):', mockPos1.isEqual(mockPos2))
		console.log('mockPos1.compareTo(mockPos2):', mockPos1.compareTo(mockPos2))
		
		// Compare results
		expect(mockPos1.isBefore(mockPos2)).toBe(pos1.isBefore(pos2))
		expect(mockPos1.isAfter(mockPos2)).toBe(pos1.isAfter(pos2))
		expect(mockPos1.isEqual(mockPos2)).toBe(pos1.isEqual(pos2))
		expect(mockPos1.compareTo(mockPos2)).toBe(pos1.compareTo(pos2))
	})
}) 