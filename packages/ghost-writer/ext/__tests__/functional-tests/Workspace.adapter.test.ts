import { describe, it, expect, beforeEach, vi } from 'vitest'
import { WorkspaceAdapter } from '../../src/adapters/Workspace.adapter'
import * as vscode from 'vscode'

// Mock VSCode workspace
vi.mock('vscode', () => ({
	workspace: {
		getConfiguration: vi.fn()
	}
}))

describe('WorkspaceAdapter', () => {
	let adapter: WorkspaceAdapter
	let mockConfiguration: any

	beforeEach(() => {
		vi.clearAllMocks()
		adapter = new WorkspaceAdapter()
		mockConfiguration = {
			get: vi.fn(),
			update: vi.fn(),
			has: vi.fn(),
			inspect: vi.fn(),
		}
	})

	describe('getConfiguration', () => {
		it('should return workspace configuration', () => {
			// Arrange
			const section = 'ghost-writer'
			vi.mocked(vscode.workspace.getConfiguration).mockReturnValue(mockConfiguration)

			// Act
			const result = adapter.getConfiguration(section)

			// Assert
			expect(vscode.workspace.getConfiguration).toHaveBeenCalledWith(section)
			expect(result).toBe(mockConfiguration)
		})

		it('should return configuration for different sections', () => {
			// Arrange
			const section1 = 'ghost-writer'
			const section2 = 'editor'
			vi.mocked(vscode.workspace.getConfiguration).mockReturnValue(mockConfiguration)

			// Act
			const result1 = adapter.getConfiguration(section1)
			const result2 = adapter.getConfiguration(section2)

			// Assert
			expect(vscode.workspace.getConfiguration).toHaveBeenCalledWith(section1)
			expect(vscode.workspace.getConfiguration).toHaveBeenCalledWith(section2)
			expect(result1).toBe(mockConfiguration)
			expect(result2).toBe(mockConfiguration)
		})
	})
})
