import { describe, it, expect, beforeEach, vi } from 'vitest'
import { WorkspaceAdapter } from '../../src/adapters/Workspace.adapter'
import * as vscode from 'vscode'
import {
    setupTestEnvironment,
    resetAllMocks,
    setupVSCodeMocks,
    createMockConfiguration
} from '../__mocks__/helpers'

describe('WorkspaceAdapter Edge Cases', () => {
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

	describe('Configuration Section Handling', () => {
		it('should handle empty configuration section', () => {
			// Arrange
			const section = ''
			vi.mocked(vscode.workspace.getConfiguration).mockReturnValue(mockConfiguration)

			// Act
			const result = adapter.getConfiguration(section)

			// Assert
			expect(vscode.workspace.getConfiguration).toHaveBeenCalledWith(section)
			expect(result).toBe(mockConfiguration)
		})

		it('should handle null configuration section', () => {
			// Arrange
			const section = null as any
			vi.mocked(vscode.workspace.getConfiguration).mockReturnValue(mockConfiguration)

			// Act
			const result = adapter.getConfiguration(section)

			// Assert
			expect(vscode.workspace.getConfiguration).toHaveBeenCalledWith(section)
			expect(result).toBe(mockConfiguration)
		})

		it('should handle undefined configuration section', () => {
			// Arrange
			const section = undefined as any
			vi.mocked(vscode.workspace.getConfiguration).mockReturnValue(mockConfiguration)

			// Act
			const result = adapter.getConfiguration(section)

			// Assert
			expect(vscode.workspace.getConfiguration).toHaveBeenCalledWith(section)
			expect(result).toBe(mockConfiguration)
		})

		it('should handle configuration section with special characters', () => {
			// Arrange
			const section = 'config-section-with-special-chars!@#$%^&*()'
			vi.mocked(vscode.workspace.getConfiguration).mockReturnValue(mockConfiguration)

			// Act
			const result = adapter.getConfiguration(section)

			// Assert
			expect(vscode.workspace.getConfiguration).toHaveBeenCalledWith(section)
			expect(result).toBe(mockConfiguration)
		})

		it('should handle configuration section with Unicode characters', () => {
			// Arrange
			const section = '配置节-中文-🚀'
			vi.mocked(vscode.workspace.getConfiguration).mockReturnValue(mockConfiguration)

			// Act
			const result = adapter.getConfiguration(section)

			// Assert
			expect(vscode.workspace.getConfiguration).toHaveBeenCalledWith(section)
			expect(result).toBe(mockConfiguration)
		})

		it('should handle very long configuration section', () => {
			// Arrange
			const section = 'very-long-configuration-section-name-that-exceeds-normal-length-limits'
			vi.mocked(vscode.workspace.getConfiguration).mockReturnValue(mockConfiguration)

			// Act
			const result = adapter.getConfiguration(section)

			// Assert
			expect(vscode.workspace.getConfiguration).toHaveBeenCalledWith(section)
			expect(result).toBe(mockConfiguration)
		})
	})

	describe('Configuration Object Handling', () => {
		it('should handle null configuration object', () => {
			// Arrange
			const section = 'test-section'
			vi.mocked(vscode.workspace.getConfiguration).mockReturnValue(null)

			// Act
			const result = adapter.getConfiguration(section)

			// Assert
			expect(vscode.workspace.getConfiguration).toHaveBeenCalledWith(section)
			expect(result).toBeNull()
		})

		it('should handle undefined configuration object', () => {
			// Arrange
			const section = 'test-section'
			vi.mocked(vscode.workspace.getConfiguration).mockReturnValue(undefined)

			// Act
			const result = adapter.getConfiguration(section)

			// Assert
			expect(vscode.workspace.getConfiguration).toHaveBeenCalledWith(section)
			expect(result).toBeUndefined()
		})

		it('should handle configuration object with missing methods', () => {
			// Arrange
			const section = 'test-section'
			const incompleteConfig = {
				get: vi.fn()
				// Missing update, has, inspect methods
			}
			vi.mocked(vscode.workspace.getConfiguration).mockReturnValue(incompleteConfig)

			// Act
			const result = adapter.getConfiguration(section)

			// Assert
			expect(vscode.workspace.getConfiguration).toHaveBeenCalledWith(section)
			expect(result).toBe(incompleteConfig)
			expect(result.update).toBeUndefined()
			expect(result.has).toBeUndefined()
			expect(result.inspect).toBeUndefined()
		})
	})

	describe('Error Handling', () => {
		it('should handle configuration service errors', () => {
			// Arrange
			const section = 'test-section'
			const error = new Error('Configuration service unavailable')
			vi.mocked(vscode.workspace.getConfiguration).mockImplementation(() => {
				throw error
			})

			// Act & Assert
			expect(() => {
				adapter.getConfiguration(section)
			}).toThrow('Configuration service unavailable')
		})

		it('should handle configuration service timeout', () => {
			// Arrange
			const section = 'test-section'
			vi.mocked(vscode.workspace.getConfiguration).mockImplementation(() => {
				throw new Error('Configuration service timeout')
			})

			// Act & Assert
			expect(() => {
				adapter.getConfiguration(section)
			}).toThrow('Configuration service timeout')
		})

		it('should handle configuration service returning invalid object', () => {
			// Arrange
			const section = 'test-section'
			vi.mocked(vscode.workspace.getConfiguration).mockReturnValue('invalid-config-object' as any)

			// Act
			const result = adapter.getConfiguration(section)

			// Assert
			expect(vscode.workspace.getConfiguration).toHaveBeenCalledWith(section)
			expect(result).toBe('invalid-config-object')
		})
	})

	describe('Concurrent Operations', () => {
		it('should handle concurrent configuration requests', () => {
			// Arrange
			const sections = Array.from({ length: 10 }, (_, i) => `section-${i}`)
			vi.mocked(vscode.workspace.getConfiguration).mockReturnValue(mockConfiguration)

			// Act
			const results = sections.map(section => adapter.getConfiguration(section))

			// Assert
			expect(vscode.workspace.getConfiguration).toHaveBeenCalledTimes(10)
			expect(results).toHaveLength(10)
			results.forEach(result => {
				expect(result).toBe(mockConfiguration)
			})
		})

		it('should handle rapid sequential configuration requests', () => {
			// Arrange
			const section = 'test-section'
			vi.mocked(vscode.workspace.getConfiguration).mockReturnValue(mockConfiguration)

			// Act
			const results = Array.from({ length: 100 }, () => adapter.getConfiguration(section))

			// Assert
			expect(vscode.workspace.getConfiguration).toHaveBeenCalledTimes(100)
			expect(results).toHaveLength(100)
			results.forEach(result => {
				expect(result).toBe(mockConfiguration)
			})
		})
	})

	describe('Performance Scenarios', () => {
		it('should handle large number of configuration sections', () => {
			// Arrange
			const sectionCount = 1000
			const sections = Array.from({ length: sectionCount }, (_, i) => `section-${i}`)
			vi.mocked(vscode.workspace.getConfiguration).mockReturnValue(mockConfiguration)

			// Act
			const results = sections.map(section => adapter.getConfiguration(section))

			// Assert
			expect(results).toHaveLength(sectionCount)
			expect(vscode.workspace.getConfiguration).toHaveBeenCalledTimes(sectionCount)
		})

		it('should handle very long configuration section names', () => {
			// Arrange
			const longSection = 'very-long-configuration-section-name-that-exceeds-normal-length-limits-and-tests-performance'
			vi.mocked(vscode.workspace.getConfiguration).mockReturnValue(mockConfiguration)

			// Act
			const result = adapter.getConfiguration(longSection)

			// Assert
			expect(vscode.workspace.getConfiguration).toHaveBeenCalledWith(longSection)
			expect(result).toBe(mockConfiguration)
		})
	})

	describe('Integration Scenarios', () => {
		it('should handle real-world configuration sections', () => {
			// Arrange
			const realSections = [
				'fux-ghost-writer',
				'editor',
				'typescript',
				'javascript',
				'html',
				'css',
				'json',
				'git',
				'terminal',
				'workbench'
			]
			vi.mocked(vscode.workspace.getConfiguration).mockReturnValue(mockConfiguration)

			// Act
			const results = realSections.map(section => adapter.getConfiguration(section))

			// Assert
			expect(results).toHaveLength(realSections.length)
			realSections.forEach(section => {
				expect(vscode.workspace.getConfiguration).toHaveBeenCalledWith(section)
			})
		})

		it('should handle configuration with different return types', () => {
			// Arrange
			const configs = [
				{ section: 'config1', config: mockConfiguration },
				{ section: 'config2', config: null },
				{ section: 'config3', config: undefined },
				{ section: 'config4', config: { get: vi.fn() } }
			]

			configs.forEach(({ section, config }) => {
				vi.mocked(vscode.workspace.getConfiguration).mockReturnValueOnce(config)
			})

			// Act
			const results = configs.map(({ section }) => adapter.getConfiguration(section))

			// Assert
			expect(results).toHaveLength(configs.length)
			results.forEach((result, index) => {
				expect(result).toBe(configs[index].config)
			})
		})
	})

	describe('Edge Case Scenarios', () => {
		it('should handle configuration section with whitespace', () => {
			// Arrange
			const section = '  test-section  '
			vi.mocked(vscode.workspace.getConfiguration).mockReturnValue(mockConfiguration)

			// Act
			const result = adapter.getConfiguration(section)

			// Assert
			expect(vscode.workspace.getConfiguration).toHaveBeenCalledWith(section)
			expect(result).toBe(mockConfiguration)
		})

		it('should handle configuration section with newlines', () => {
			// Arrange
			const section = 'test\nsection'
			vi.mocked(vscode.workspace.getConfiguration).mockReturnValue(mockConfiguration)

			// Act
			const result = adapter.getConfiguration(section)

			// Assert
			expect(vscode.workspace.getConfiguration).toHaveBeenCalledWith(section)
			expect(result).toBe(mockConfiguration)
		})

		it('should handle configuration section with tabs', () => {
			// Arrange
			const section = 'test\tsection'
			vi.mocked(vscode.workspace.getConfiguration).mockReturnValue(mockConfiguration)

			// Act
			const result = adapter.getConfiguration(section)

			// Assert
			expect(vscode.workspace.getConfiguration).toHaveBeenCalledWith(section)
			expect(result).toBe(mockConfiguration)
		})

		it('should handle configuration section with mixed whitespace', () => {
			// Arrange
			const section = '  test\t\nsection  '
			vi.mocked(vscode.workspace.getConfiguration).mockReturnValue(mockConfiguration)

			// Act
			const result = adapter.getConfiguration(section)

			// Assert
			expect(vscode.workspace.getConfiguration).toHaveBeenCalledWith(section)
			expect(result).toBe(mockConfiguration)
		})
	})
})

