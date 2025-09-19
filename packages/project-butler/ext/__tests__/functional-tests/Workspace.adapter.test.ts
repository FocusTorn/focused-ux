import { describe, it, expect, beforeEach, vi } from 'vitest'
import { WorkspaceAdapter } from '../../src/adapters/Workspace.adapter'
import * as vscode from 'vscode'

describe('WorkspaceAdapter', () => {
    let adapter: WorkspaceAdapter

    beforeEach(() => {
        vi.clearAllMocks()
        adapter = new WorkspaceAdapter()
    })

    describe('getWorkspaceRoot', () => {
        it('should return workspace root path', () => {
            // Act
            const result = adapter.getWorkspaceRoot()

            // Assert
            expect(result).toBe('/test/workspace')
        })

        it('should return undefined when no workspace folders', () => {
            // Arrange
            Object.defineProperty(vscode.workspace, 'workspaceFolders', {
                value: undefined,
                writable: true,
                configurable: true
            })

            // Act
            const result = adapter.getWorkspaceRoot()

            // Assert
            expect(result).toBeUndefined()
        })

        it('should return undefined when workspace folders is empty', () => {
            // Arrange
            Object.defineProperty(vscode.workspace, 'workspaceFolders', {
                value: [],
                writable: true,
                configurable: true
            })

            // Act
            const result = adapter.getWorkspaceRoot()

            // Assert
            expect(result).toBeUndefined()
        })
    })
})
