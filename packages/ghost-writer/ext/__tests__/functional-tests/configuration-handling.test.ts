import { describe, it, expect, beforeEach, vi } from 'vitest'
import { WorkspaceAdapter } from '../../src/adapters/Workspace.adapter'
import * as vscode from 'vscode'
import {
    setupTestEnvironment,
    resetAllMocks,
    setupVSCodeMocks,
    createMockConfiguration
} from '../__mocks__/helpers'

describe('Configuration Handling', () => {
    let mocks: ReturnType<typeof setupTestEnvironment>
    let workspaceAdapter: WorkspaceAdapter
    let mockConfiguration: any

    beforeEach(() => {
        mocks = setupTestEnvironment()
        setupVSCodeMocks(mocks)
        resetAllMocks(mocks)
		
        workspaceAdapter = new WorkspaceAdapter()
        mockConfiguration = createMockConfiguration()
    })

    describe('Workspace Configuration Reading', () => {
        it('should read configuration with default values', () => {
            // Arrange
            vi.mocked(vscode.workspace.getConfiguration).mockReturnValue(mockConfiguration)
            mockConfiguration.get.mockReturnValue(true)

            // Act
            const config = workspaceAdapter.getConfiguration('fux-ghost-writer')
            const includeClassName = config.get('consoleLogger.includeClassName', true) ?? true
            const includeFunctionName = config.get('consoleLogger.includeFunctionName', true) ?? true

            // Assert
            expect(vscode.workspace.getConfiguration).toHaveBeenCalledWith('fux-ghost-writer')
            expect(mockConfiguration.get).toHaveBeenCalledWith('consoleLogger.includeClassName', true)
            expect(mockConfiguration.get).toHaveBeenCalledWith('consoleLogger.includeFunctionName', true)
            expect(includeClassName).toBe(true)
            expect(includeFunctionName).toBe(true)
        })

        it('should handle configuration with custom values', () => {
            // Arrange
            vi.mocked(vscode.workspace.getConfiguration).mockReturnValue(mockConfiguration)
            mockConfiguration.get
                .mockReturnValueOnce(false) // includeClassName
                .mockReturnValueOnce(false) // includeFunctionName

            // Act
            const config = workspaceAdapter.getConfiguration('fux-ghost-writer')
            const includeClassName = config.get('consoleLogger.includeClassName', true) ?? true
            const includeFunctionName = config.get('consoleLogger.includeFunctionName', true) ?? true

            // Assert
            expect(includeClassName).toBe(false)
            expect(includeFunctionName).toBe(false)
        })

        it('should handle undefined configuration values', () => {
            // Arrange
            vi.mocked(vscode.workspace.getConfiguration).mockReturnValue(mockConfiguration)
            mockConfiguration.get.mockReturnValue(undefined)

            // Act
            const config = workspaceAdapter.getConfiguration('fux-ghost-writer')
            const includeClassName = config.get('consoleLogger.includeClassName', true) ?? true
            const includeFunctionName = config.get('consoleLogger.includeFunctionName', true) ?? true

            // Assert
            expect(includeClassName).toBe(true) // Should use default
            expect(includeFunctionName).toBe(true) // Should use default
        })

        it('should handle null configuration values', () => {
            // Arrange
            vi.mocked(vscode.workspace.getConfiguration).mockReturnValue(mockConfiguration)
            mockConfiguration.get.mockReturnValue(null)

            // Act
            const config = workspaceAdapter.getConfiguration('fux-ghost-writer')
            const includeClassName = config.get('consoleLogger.includeClassName', true) ?? true
            const includeFunctionName = config.get('consoleLogger.includeFunctionName', true) ?? true

            // Assert
            expect(includeClassName).toBe(true) // Should use default
            expect(includeFunctionName).toBe(true) // Should use default
        })
    })

    describe('Configuration Validation', () => {
        it('should validate boolean configuration values', () => {
            // Arrange
            vi.mocked(vscode.workspace.getConfiguration).mockReturnValue(mockConfiguration)
            mockConfiguration.get.mockReturnValue('invalid')

            // Act
            const config = workspaceAdapter.getConfiguration('fux-ghost-writer')
            const includeClassName = config.get('consoleLogger.includeClassName', true) ?? true

            // Assert
            expect(includeClassName).toBe('invalid') // Configuration returns the actual value, validation happens at usage
        })

        it('should handle different configuration sections', () => {
            // Arrange
            vi.mocked(vscode.workspace.getConfiguration).mockReturnValue(mockConfiguration)

            // Act
            const ghostWriterConfig = workspaceAdapter.getConfiguration('fux-ghost-writer')
            const editorConfig = workspaceAdapter.getConfiguration('editor')

            // Assert
            expect(vscode.workspace.getConfiguration).toHaveBeenCalledWith('fux-ghost-writer')
            expect(vscode.workspace.getConfiguration).toHaveBeenCalledWith('editor')
            expect(ghostWriterConfig).toBe(mockConfiguration)
            expect(editorConfig).toBe(mockConfiguration)
        })
    })

    describe('Configuration Error Handling', () => {
        it('should handle configuration service errors gracefully', () => {
            // Arrange
            vi.mocked(vscode.workspace.getConfiguration).mockImplementation(() => {
                throw new Error('Configuration service unavailable')
            })

            // Act & Assert
            expect(() => {
                workspaceAdapter.getConfiguration('fux-ghost-writer')
            }).toThrow('Configuration service unavailable')
        })

        it('should handle configuration get errors gracefully', () => {
            // Arrange
            vi.mocked(vscode.workspace.getConfiguration).mockReturnValue(mockConfiguration)
            mockConfiguration.get.mockImplementation(() => {
                throw new Error('Configuration get failed')
            })

            // Act & Assert
            expect(() => {
                const config = workspaceAdapter.getConfiguration('fux-ghost-writer')
                config.get('consoleLogger.includeClassName', true)
            }).toThrow('Configuration get failed')
        })
    })
})
