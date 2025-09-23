import { describe, it, expect, beforeEach, vi } from 'vitest'
import { ContextCherryPickerManager } from '../../src/services/CCP_Manager.service.js'
import type { IContextCherryPickerDependencies } from '../../src/_interfaces/IContextCherryPickerManager.js'

describe('CCP Manager Complex Orchestration', () => {
    let manager: ContextCherryPickerManager
    let mockDependencies: IContextCherryPickerDependencies

    beforeEach(() => {
        // Create comprehensive mock dependencies
        mockDependencies = {
            fileExplorerService: {
                getAllCheckedItems: vi.fn(),
                getCheckboxState: vi.fn(),
                refresh: vi.fn(),
                loadCheckedState: vi.fn(),
                clearAllCheckboxes: vi.fn(),
                getCoreScanIgnoreGlobs: vi.fn().mockReturnValue([]),
                getContextExplorerIgnoreGlobs: vi.fn().mockReturnValue([]),
                getContextExplorerHideChildrenGlobs: vi.fn().mockReturnValue([]),
                getProjectTreeAlwaysShowGlobs: vi.fn().mockReturnValue([]),
                getProjectTreeAlwaysHideGlobs: vi.fn().mockReturnValue([]),
                getProjectTreeShowIfSelectedGlobs: vi.fn().mockReturnValue([]),
                getFileGroupsConfig: vi.fn().mockReturnValue({})
            },
            savedStatesService: {
                refresh: vi.fn()
            },
            quickSettingsService: {
                getSettingState: vi.fn().mockResolvedValue('all')
            },
            storageService: {
                saveState: vi.fn().mockResolvedValue(undefined),
                deleteState: vi.fn().mockResolvedValue(undefined),
                loadState: vi.fn().mockResolvedValue(undefined)
            },
            contextDataCollector: {
                collectContextData: vi.fn().mockResolvedValue({
                    treeEntries: new Map(),
                    contentFileUris: new Set()
                })
            },
            fileContentProvider: {
                getFileContents: vi.fn().mockResolvedValue({
                    contentString: 'test content',
                    processedTokens: 10
                })
            },
            contextFormatter: {
                generateProjectTreeString: vi.fn().mockResolvedValue('project tree')
            },
            window: {
                showTimedInformationMessage: vi.fn().mockResolvedValue(undefined),
                showInputBox: vi.fn().mockResolvedValue('test state'),
                showWarningMessage: vi.fn().mockResolvedValue('Delete'),
                setClipboard: vi.fn().mockResolvedValue(undefined),
                setStatusBarMessage: vi.fn(),
                showDropdownMessage: vi.fn(),
                showDescriptionMessage: vi.fn()
            },
            workspace: {
                workspaceFolders: [{ uri: '/test/project' }]
            },
            path: {
                basename: vi.fn().mockReturnValue('project')
            },
            configurationService: {
                get: vi.fn().mockResolvedValue(1.5)
            },
            treeItemFactory: {
                getCheckboxStateUnchecked: vi.fn().mockReturnValue({ checked: false })
            }
        }

        manager = new ContextCherryPickerManager(mockDependencies)
    })

    describe('saveStateWithValidation', () => {
        it('should execute complete workflow: validation + state saving', async () => {
            // Arrange
            const checkedItems = ['/test/file1.ts', '/test/file2.js']
            const stateName = 'Test State'
            mockDependencies.fileExplorerService.getAllCheckedItems.mockReturnValue(checkedItems)
            mockDependencies.fileExplorerService.getCheckboxState.mockReturnValue({ checked: true })

            // Act
            const result = await manager.saveStateWithValidation(stateName)

            // Assert
            expect(result).toEqual({
                saved: true,
                stateName: 'Test State',
                itemCount: 2
            })

            // Verify validation was called
            expect(mockDependencies.fileExplorerService.getAllCheckedItems).toHaveBeenCalled()

            // Verify state was saved
            expect(mockDependencies.storageService.saveState).toHaveBeenCalledWith(
                stateName,
                expect.arrayContaining([
                    expect.objectContaining({ uriString: '/test/file1.ts' }),
                    expect.objectContaining({ uriString: '/test/file2.js' })
                ])
            )

            // Verify refresh was called
            expect(mockDependencies.savedStatesService.refresh).toHaveBeenCalled()
        })

        it('should handle validation errors gracefully', async () => {
            // Arrange
            mockDependencies.fileExplorerService.getAllCheckedItems.mockReturnValue([])

            // Act & Assert
            await expect(manager.saveStateWithValidation('test')).rejects.toThrow('No items are checked')
        })

        it('should handle invalid state name', async () => {
            // Arrange
            const checkedItems = ['/test/file1.ts']
            mockDependencies.fileExplorerService.getAllCheckedItems.mockReturnValue(checkedItems)

            // Act & Assert
            await expect(manager.saveStateWithValidation('   ')).rejects.toThrow('Invalid state name provided')
        })
    })

    describe('copyContextWithAnalysis', () => {
        it('should execute complete workflow: validation + context collection + analysis', async () => {
            // Arrange
            const checkedItems = ['/test/file1.ts', '/test/file2.js']
            mockDependencies.fileExplorerService.getAllCheckedItems.mockReturnValue(checkedItems)

            // Act
            const result = await manager.copyContextWithAnalysis()

            // Assert
            expect(result).toEqual({
                copied: true,
                tokenCount: 10,
                fileCount: 2
            })

            // Verify validation was called
            expect(mockDependencies.fileExplorerService.getAllCheckedItems).toHaveBeenCalled()

            // Verify context collection was called
            expect(mockDependencies.contextDataCollector.collectContextData).toHaveBeenCalled()

            // Verify content was processed
            expect(mockDependencies.fileContentProvider.getFileContents).toHaveBeenCalled()

            // Verify clipboard was set
            expect(mockDependencies.window.setClipboard).toHaveBeenCalledWith(
                expect.stringContaining('<context>')
            )
        })

        it('should handle no checked items gracefully', async () => {
            // Arrange
            mockDependencies.fileExplorerService.getAllCheckedItems.mockReturnValue([])

            // Act & Assert
            await expect(manager.copyContextWithAnalysis()).rejects.toThrow('No items are checked')
        })
    })

    describe('completeContextWorkflow', () => {
        it('should execute complete workflow: context copy + state save', async () => {
            // Arrange
            const checkedItems = ['/test/file1.ts']
            mockDependencies.fileExplorerService.getAllCheckedItems.mockReturnValue(checkedItems)

            // Act
            const result = await manager.completeContextWorkflow()

            // Assert
            expect(result).toEqual({
                contextCopied: true,
                stateSaved: true,
                tokenCount: 10
            })

            // Verify both operations were called
            expect(mockDependencies.contextDataCollector.collectContextData).toHaveBeenCalled()
            expect(mockDependencies.storageService.saveState).toHaveBeenCalled()
        })

        it('should handle no checked items gracefully', async () => {
            // Arrange
            mockDependencies.fileExplorerService.getAllCheckedItems.mockReturnValue([])

            // Act & Assert
            await expect(manager.completeContextWorkflow()).rejects.toThrow('No items are checked')
        })
    })
})
