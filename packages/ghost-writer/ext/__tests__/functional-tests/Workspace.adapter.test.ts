import { describe, it, expect, beforeEach, vi } from 'vitest'
import { WorkspaceAdapter } from '../../src/adapters/Workspace.adapter'
import * as vscode from 'vscode'
import {
    setupTestEnvironment,
    resetAllMocks,
    setupVSCodeMocks,
    createMockConfiguration
} from '../__mocks__/helpers'

describe('WorkspaceAdapter', () => {
	let mocks: ReturnType<typeof setupTestEnvironment>
	let adapter: WorkspaceAdapter
	let mockConfiguration: any

	beforeEach(() => {
		mocks = setupTestEnvironment()
		setupVSCodeMocks(mocks)
		resetAllMocks(mocks)
		
		adapter = new WorkspaceAdapter()
		mockConfiguration = createMockConfiguration()
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
