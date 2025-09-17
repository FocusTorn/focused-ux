import { describe, it, expect, beforeEach, vi } from 'vitest'
import { PositionAdapter } from '../../src/adapters/Position.adapter'
import * as vscode from 'vscode'

// Mock VSCode Position
vi.mock('vscode', () => ({
	Position: vi.fn().mockImplementation((line, character) => ({ line, character }))
}))

describe('PositionAdapter', () => {
	let adapter: PositionAdapter

	beforeEach(() => {
		vi.clearAllMocks()
		adapter = new PositionAdapter()
	})

	describe('create', () => {
		it('should create position with line and character', () => {
			// Arrange
			const line = 5
			const character = 10

			// Act
			const result = adapter.create(line, character)

			// Assert
			expect(result).toEqual({ line, character })
			expect(result.line).toBe(line)
			expect(result.character).toBe(character)
		})

		it('should create position at origin', () => {
			// Arrange
			const line = 0
			const character = 0

			// Act
			const result = adapter.create(line, character)

			// Assert
			expect(result).toEqual({ line, character })
			expect(result.line).toBe(line)
			expect(result.character).toBe(character)
		})

		it('should create position with large values', () => {
			// Arrange
			const line = 1000
			const character = 500

			// Act
			const result = adapter.create(line, character)

			// Assert
			expect(result).toEqual({ line, character })
			expect(result.line).toBe(line)
			expect(result.character).toBe(character)
		})

		it('should create multiple positions', () => {
			// Arrange
			const positions = [
				{ line: 0, character: 0 },
				{ line: 1, character: 5 },
				{ line: 10, character: 20 },
			]

			// Act
			const results = positions.map(pos => adapter.create(pos.line, pos.character))

			// Assert
			results.forEach((result, index) => {
				expect(result).toEqual(positions[index])
				expect(result.line).toBe(positions[index].line)
				expect(result.character).toBe(positions[index].character)
			})
		})
	})
})
