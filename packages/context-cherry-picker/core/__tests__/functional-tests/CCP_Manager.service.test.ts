import { describe, it, expect, beforeEach, vi } from 'vitest'
import { ContextCherryPickerManager } from '../../src/services/CCP_Manager.service.js'
import { setupTestEnvironment, resetAllMocks, setupFileSystemMocks, setupPathMocks } from '../__mocks__/helpers'
import { 
    setupCCPManagerSuccessScenario, 
    setupCCPManagerErrorScenario, 
    createCCPMockBuilder 
} from '../__mocks__/mock-scenario-builder'

// Mock service classes
class MockFileExplorerService {
    getAllCheckedItems = vi.fn()
    getCheckboxState = vi.fn()
    refresh = vi.fn()
    loadCheckedState = vi.fn()
    clearAllCheckboxes = vi.fn()
    getCoreScanIgnoreGlobs = vi.fn()
    getContextExplorerIgnoreGlobs = vi.fn()
    getContextExplorerHideChildrenGlobs = vi.fn()
    getProjectTreeAlwaysShowGlobs = vi.fn()
    getProjectTreeAlwaysHideGlobs = vi.fn()
    getProjectTreeShowIfSelectedGlobs = vi.fn()
    getFileGroupsConfig = vi.fn()
}

class MockSavedStatesService {
    refresh = vi.fn()
}

class MockQuickSettingsService {
    getSettingState = vi.fn()
}

class MockStorageService {
    saveState = vi.fn()
    deleteState = vi.fn()
    loadState = vi.fn()
}

class MockContextDataCollectorService {
    collectContextData = vi.fn()
}

class MockFileContentProviderService {
    getFileContents = vi.fn()
}

class MockContextFormattingService {
    generateProjectTreeString = vi.fn()
}

class MockWindow {
    showTimedInformationMessage = vi.fn()
    showInputBox = vi.fn()
    showWarningMessage = vi.fn()
    setClipboard = vi.fn()
    setStatusBarMessage = vi.fn()
    showDropdownMessage = vi.fn()
    showDescriptionMessage = vi.fn()
}

class MockWorkspace {
    workspaceFolders = [{ uri: '/test/project' }]
}

class MockPath {
    basename = vi.fn()
}

class MockConfigurationService {
    get = vi.fn()
}

class MockTreeItemFactory {
    getCheckboxStateUnchecked = vi.fn()
}

describe('ContextCherryPickerManager', () => {
    let service: ContextCherryPickerManager
    let mockFileExplorer: MockFileExplorerService
    let mockSavedStates: MockSavedStatesService
    let mockQuickSettings: MockQuickSettingsService
    let mockStorage: MockStorageService
    let mockContextDataCollector: MockContextDataCollectorService
    let mockFileContentProvider: MockFileContentProviderService
    let mockContextFormatter: MockContextFormattingService
    let mockWindow: MockWindow
    let mockWorkspace: MockWorkspace
    let mockPath: MockPath
    let mockConfiguration: MockConfigurationService
    let mockTreeItemFactory: MockTreeItemFactory
    let mocks: ReturnType<typeof setupTestEnvironment>

    beforeEach(() => {
        mocks = setupTestEnvironment()
        setupFileSystemMocks(mocks)
        setupPathMocks(mocks)
        resetAllMocks(mocks)

        // Initialize mock services
        mockFileExplorer = new MockFileExplorerService()
        mockSavedStates = new MockSavedStatesService()
        mockQuickSettings = new MockQuickSettingsService()
        mockStorage = new MockStorageService()
        mockContextDataCollector = new MockContextDataCollectorService()
        mockFileContentProvider = new MockFileContentProviderService()
        mockContextFormatter = new MockContextFormattingService()
        mockWindow = new MockWindow()
        mockWorkspace = new MockWorkspace()
        mockPath = new MockPath()
        mockConfiguration = new MockConfigurationService()
        mockTreeItemFactory = new MockTreeItemFactory()

        // Initialize service with mocked dependencies
        service = new ContextCherryPickerManager(
            mockFileExplorer as any,
            mockSavedStates as any,
            mockQuickSettings as any,
            mockStorage as any,
            mockContextDataCollector as any,
            mockFileContentProvider as any,
            mockContextFormatter as any,
            mockWindow as any,
            mockWorkspace as any,
            mockPath as any,
            mockConfiguration as any,
            mockTreeItemFactory as any
        )
    })

    describe('saveCurrentCheckedState', () => {
        it('should save checked state successfully', async () => {
            // Arrange
            const checkedItems = ['/test/file1.ts', '/test/file2.js']
            const stateName = 'Test State'
            const expectedItems = [
                { uriString: '/test/file1.ts', checkboxState: 'checked' },
                { uriString: '/test/file2.js', checkboxState: 'checked' }
            ]

            setupCCPManagerSuccessScenario(mocks, {
                operation: 'saveState',
                checkedItems,
                stateName,
                expectedItems
            })

            mockFileExplorer.getAllCheckedItems.mockReturnValue(checkedItems)
            mockWindow.showInputBox.mockResolvedValue(stateName)
            mockFileExplorer.getCheckboxState.mockReturnValue('checked')
            mockTreeItemFactory.getCheckboxStateUnchecked.mockReturnValue('unchecked')
            mockStorage.saveState.mockResolvedValue(undefined)
            mockSavedStates.refresh.mockReturnValue(undefined)
            mockWindow.showTimedInformationMessage.mockResolvedValue(undefined)

            // Act
            await service.saveCurrentCheckedState()

            // Assert
            expect(mockFileExplorer.getAllCheckedItems).toHaveBeenCalled()
            expect(mockWindow.showInputBox).toHaveBeenCalledWith({ prompt: 'Enter a name for this saved state' })
            expect(mockStorage.saveState).toHaveBeenCalledWith(stateName, expectedItems)
            expect(mockSavedStates.refresh).toHaveBeenCalled()
            expect(mockWindow.showTimedInformationMessage).toHaveBeenCalledWith(`💾 State '${stateName}' saved.`)
        })

        it('should show message when no items are checked', async () => {
            // Arrange
            setupCCPManagerSuccessScenario(mocks, {
                operation: 'saveState',
                checkedItems: [],
                stateName: null
            })

            mockFileExplorer.getAllCheckedItems.mockReturnValue([])
            mockWindow.showTimedInformationMessage.mockResolvedValue(undefined)

            // Act
            await service.saveCurrentCheckedState()

            // Assert
            expect(mockWindow.showTimedInformationMessage).toHaveBeenCalledWith('No items are checked to save.')
            expect(mockStorage.saveState).not.toHaveBeenCalled()
        })

        it('should handle user cancellation when no state name provided', async () => {
            // Arrange
            const checkedItems = ['/test/file1.ts']
            
            setupCCPManagerSuccessScenario(mocks, {
                operation: 'saveState',
                checkedItems,
                stateName: null
            })

            mockFileExplorer.getAllCheckedItems.mockReturnValue(checkedItems)
            mockWindow.showInputBox.mockResolvedValue(null)

            // Act
            await service.saveCurrentCheckedState()

            // Assert
            expect(mockStorage.saveState).not.toHaveBeenCalled()
            expect(mockSavedStates.refresh).not.toHaveBeenCalled()
        })
    })

    describe('copyCheckedFilePaths', () => {
        it('should copy checked file paths to clipboard', async () => {
            // Arrange
            const checkedUris = ['/test/file1.ts', '/test/file2.js']
            const expectedClipboardContent = '/test/file1.ts\n/test/file2.js'

            setupCCPManagerSuccessScenario(mocks, {
                operation: 'copyPaths',
                checkedItems: checkedUris,
                clipboardContent: expectedClipboardContent
            })

            mockFileExplorer.getAllCheckedItems.mockReturnValue(checkedUris)
            mockWindow.setClipboard.mockResolvedValue(undefined)
            mockWindow.showTimedInformationMessage.mockResolvedValue(undefined)

            // Act
            await service.copyCheckedFilePaths()

            // Assert
            expect(mockWindow.setClipboard).toHaveBeenCalledWith(expectedClipboardContent)
            expect(mockWindow.showTimedInformationMessage).toHaveBeenCalledWith('Checked file paths copied to clipboard.')
        })

        it('should show message when no file paths to copy', async () => {
            // Arrange
            setupCCPManagerSuccessScenario(mocks, {
                operation: 'copyPaths',
                checkedItems: [],
                clipboardContent: ''
            })

            mockFileExplorer.getAllCheckedItems.mockReturnValue([])
            mockWindow.showTimedInformationMessage.mockResolvedValue(undefined)

            // Act
            await service.copyCheckedFilePaths()

            // Assert
            expect(mockWindow.showTimedInformationMessage).toHaveBeenCalledWith('No file paths to copy.')
            expect(mockWindow.setClipboard).not.toHaveBeenCalled()
        })
    })

    describe('refreshExplorerView', () => {
        it('should refresh explorer view', async () => {
            // Arrange
            setupCCPManagerSuccessScenario(mocks, {
                operation: 'refresh',
                checkedItems: []
            })

            mockFileExplorer.refresh.mockResolvedValue(undefined)

            // Act
            await service.refreshExplorerView()

            // Assert
            expect(mockFileExplorer.refresh).toHaveBeenCalled()
        })
    })

    describe('deleteSavedState', () => {
        it('should delete saved state with confirmation', async () => {
            // Arrange
            const stateItem = { id: 'test-state', label: 'Test State' }

            setupCCPManagerSuccessScenario(mocks, {
                operation: 'deleteState',
                stateItem,
                confirmed: true
            })

            mockWindow.showWarningMessage.mockResolvedValue('Delete')
            mockStorage.deleteState.mockResolvedValue(undefined)
            mockSavedStates.refresh.mockReturnValue(undefined)

            // Act
            await service.deleteSavedState(stateItem as any)

            // Assert
            expect(mockWindow.showWarningMessage).toHaveBeenCalledWith('Delete "Test State"?', true, 'Delete')
            expect(mockStorage.deleteState).toHaveBeenCalledWith('test-state')
            expect(mockSavedStates.refresh).toHaveBeenCalled()
        })

        it('should not delete when user cancels confirmation', async () => {
            // Arrange
            const stateItem = { id: 'test-state', label: 'Test State' }

            setupCCPManagerSuccessScenario(mocks, {
                operation: 'deleteState',
                stateItem,
                confirmed: false
            })

            mockWindow.showWarningMessage.mockResolvedValue('Cancel')

            // Act
            await service.deleteSavedState(stateItem as any)

            // Assert
            expect(mockStorage.deleteState).not.toHaveBeenCalled()
            expect(mockSavedStates.refresh).not.toHaveBeenCalled()
        })

        it('should handle invalid state item', async () => {
            // Arrange
            setupCCPManagerSuccessScenario(mocks, {
                operation: 'deleteState',
                stateItem: null,
                confirmed: false
            })

            // Act
            await service.deleteSavedState(null as any)

            // Assert
            expect(mockWindow.showWarningMessage).not.toHaveBeenCalled()
            expect(mockStorage.deleteState).not.toHaveBeenCalled()
        })
    })

    describe('loadSavedStateIntoExplorer', () => {
        it('should load saved state into explorer', async () => {
            // Arrange
            const stateItem = { id: 'test-state', label: 'Test State' }
            const loadedItems = [
                { uriString: '/test/file1.ts', checkboxState: 'checked' }
            ]

            setupCCPManagerSuccessScenario(mocks, {
                operation: 'loadState',
                stateItem,
                loadedItems
            })

            mockStorage.loadState.mockResolvedValue(loadedItems)
            mockFileExplorer.loadCheckedState.mockReturnValue(undefined)
            mockFileExplorer.refresh.mockResolvedValue(undefined)

            // Act
            await service.loadSavedStateIntoExplorer(stateItem as any)

            // Assert
            expect(mockStorage.loadState).toHaveBeenCalledWith('test-state')
            expect(mockFileExplorer.loadCheckedState).toHaveBeenCalledWith(loadedItems)
            expect(mockFileExplorer.refresh).toHaveBeenCalled()
        })

        it('should handle state item with no id', async () => {
            // Arrange
            const stateItem = { label: 'Test State' }

            setupCCPManagerSuccessScenario(mocks, {
                operation: 'loadState',
                stateItem,
                loadedItems: null
            })

            // Act
            await service.loadSavedStateIntoExplorer(stateItem as any)

            // Assert
            expect(mockStorage.loadState).not.toHaveBeenCalled()
        })

        it('should handle when no loaded items returned', async () => {
            // Arrange
            const stateItem = { id: 'test-state', label: 'Test State' }

            setupCCPManagerSuccessScenario(mocks, {
                operation: 'loadState',
                stateItem,
                loadedItems: null
            })

            mockStorage.loadState.mockResolvedValue(null)

            // Act
            await service.loadSavedStateIntoExplorer(stateItem as any)

            // Assert
            expect(mockFileExplorer.loadCheckedState).not.toHaveBeenCalled()
            expect(mockFileExplorer.refresh).not.toHaveBeenCalled()
        })
    })

    describe('clearAllCheckedInExplorer', () => {
        it('should clear all checkboxes in explorer', async () => {
            // Arrange
            setupCCPManagerSuccessScenario(mocks, {
                operation: 'clearAll',
                checkedItems: []
            })

            mockFileExplorer.clearAllCheckboxes.mockReturnValue(undefined)

            // Act
            await service.clearAllCheckedInExplorer()

            // Assert
            expect(mockFileExplorer.clearAllCheckboxes).toHaveBeenCalled()
        })
    })

    describe('copyContextOfCheckedItems', () => {
        it('should copy context of checked items successfully', async () => {
            // Arrange
            const checkedUris = ['/test/file1.ts', '/test/file2.js']
            const prunedUris = ['/test/file1.ts']
            const projectRootUri = '/test/project'
            const projectRootName = 'project'
            const collectionResult = {
                treeEntries: [{ path: '/test/file1.ts', type: 'file' }],
                contentFileUris: ['/test/file1.ts']
            }
            const formattedTreeString = 'project/\n  file1.ts'
            const fileContentResult = {
                contentString: 'export const test = "hello"',
                processedTokens: 10
            }
            const expectedOutput = '<context>\n<project_tree>\nproject/\n  file1.ts\n</project_tree>\n<project_files>\nexport const test = "hello"\n</project_files>\n</context>'

            setupCCPManagerSuccessScenario(mocks, {
                operation: 'copyContext',
                checkedItems: checkedUris,
                prunedUris,
                projectRootUri,
                projectRootName,
                collectionResult,
                formattedTreeString,
                fileContentResult,
                expectedOutput
            })

            mockFileExplorer.getAllCheckedItems.mockReturnValue(checkedUris)
            mockWorkspace.workspaceFolders = [{ uri: projectRootUri }]
            mockPath.basename.mockReturnValue(projectRootName)
            mockQuickSettings.getSettingState.mockResolvedValue('all')
            mockFileExplorer.getCoreScanIgnoreGlobs.mockReturnValue(['node_modules/**'])
            mockFileExplorer.getContextExplorerIgnoreGlobs.mockReturnValue([])
            mockFileExplorer.getContextExplorerHideChildrenGlobs.mockReturnValue([])
            mockFileExplorer.getProjectTreeAlwaysShowGlobs.mockReturnValue(['*.md'])
            mockFileExplorer.getProjectTreeAlwaysHideGlobs.mockReturnValue(['*.log'])
            mockFileExplorer.getProjectTreeShowIfSelectedGlobs.mockReturnValue(['*.test.ts'])
            mockFileExplorer.getFileGroupsConfig.mockReturnValue(null)
            mockContextDataCollector.collectContextData.mockResolvedValue(collectionResult)
            mockContextFormatter.generateProjectTreeString.mockResolvedValue(formattedTreeString)
            mockFileContentProvider.getFileContents.mockResolvedValue(fileContentResult)
            mockWindow.setClipboard.mockResolvedValue(undefined)
            mockWindow.showTimedInformationMessage.mockResolvedValue(undefined)

            // Act
            await service.copyContextOfCheckedItems()

            // Assert
            expect(mockContextDataCollector.collectContextData).toHaveBeenCalledWith(
                'all',
                prunedUris,
                projectRootUri,
                ['node_modules/**'],
                [],
                []
            )
            expect(mockContextFormatter.generateProjectTreeString).toHaveBeenCalledWith(
                collectionResult.treeEntries,
                projectRootUri,
                projectRootName,
                ['*.md'],
                ['*.log'],
                ['*.test.ts'],
                prunedUris
            )
            expect(mockFileContentProvider.getFileContents).toHaveBeenCalledWith(
                collectionResult.contentFileUris,
                collectionResult.treeEntries,
                500000,
                0
            )
            expect(mockWindow.setClipboard).toHaveBeenCalledWith(expectedOutput)
            expect(mockWindow.showTimedInformationMessage).toHaveBeenCalledWith('📋 Context copied (~10 tokens)')
        })

        it('should handle no workspace folder open', async () => {
            // Arrange
            setupCCPManagerSuccessScenario(mocks, {
                operation: 'copyContext',
                checkedItems: ['/test/file1.ts'],
                workspaceFolders: null
            })

            mockFileExplorer.getAllCheckedItems.mockReturnValue(['/test/file1.ts'])
            mockWorkspace.workspaceFolders = null
            mockWindow.showTimedInformationMessage.mockResolvedValue(undefined)

            // Act
            await service.copyContextOfCheckedItems()

            // Assert
            expect(mockWindow.showTimedInformationMessage).toHaveBeenCalledWith('No workspace folder open.')
            expect(mockContextDataCollector.collectContextData).not.toHaveBeenCalled()
        })

        it('should handle project structure mode set to none', async () => {
            // Arrange
            const checkedUris = ['/test/file1.ts']
            const projectRootUri = '/test/project'
            const collectionResult = {
                treeEntries: [],
                contentFileUris: ['/test/file1.ts']
            }
            const fileContentResult = {
                contentString: 'export const test = "hello"',
                processedTokens: 10
            }
            const expectedOutput = '<context>\n<project_files>\nexport const test = "hello"\n</project_files>\n</context>'

            setupCCPManagerSuccessScenario(mocks, {
                operation: 'copyContext',
                checkedItems: checkedUris,
                projectRootUri,
                collectionResult,
                fileContentResult,
                expectedOutput,
                projectStructureMode: 'none'
            })

            mockFileExplorer.getAllCheckedItems.mockReturnValue(checkedUris)
            mockWorkspace.workspaceFolders = [{ uri: projectRootUri }]
            mockPath.basename.mockReturnValue('project')
            mockQuickSettings.getSettingState.mockResolvedValue('none')
            mockFileExplorer.getCoreScanIgnoreGlobs.mockReturnValue([])
            mockFileExplorer.getContextExplorerIgnoreGlobs.mockReturnValue([])
            mockFileExplorer.getContextExplorerHideChildrenGlobs.mockReturnValue([])
            mockFileExplorer.getFileGroupsConfig.mockReturnValue(null)
            mockContextDataCollector.collectContextData.mockResolvedValue(collectionResult)
            mockFileContentProvider.getFileContents.mockResolvedValue(fileContentResult)
            mockWindow.setClipboard.mockResolvedValue(undefined)
            mockWindow.showTimedInformationMessage.mockResolvedValue(undefined)

            // Act
            await service.copyContextOfCheckedItems()

            // Assert
            expect(mockContextFormatter.generateProjectTreeString).not.toHaveBeenCalled()
            expect(mockWindow.setClipboard).toHaveBeenCalledWith(expectedOutput)
        })
    })

    describe('getCheckedExplorerItems', () => {
        it('should return checked explorer items', () => {
            // Arrange
            const checkedItems = ['/test/file1.ts', '/test/file2.js']

            setupCCPManagerSuccessScenario(mocks, {
                operation: 'getCheckedItems',
                checkedItems
            })

            mockFileExplorer.getAllCheckedItems.mockReturnValue(checkedItems)

            // Act
            const result = service.getCheckedExplorerItems()

            // Assert
            expect(result).toEqual(checkedItems)
            expect(mockFileExplorer.getAllCheckedItems).toHaveBeenCalled()
        })
    })

    describe('getQuickSettingState', () => {
        it('should return quick setting state', async () => {
            // Arrange
            const settingId = 'test.setting'
            const settingValue = 'test-value'

            setupCCPManagerSuccessScenario(mocks, {
                operation: 'getQuickSetting',
                settingId,
                settingValue
            })

            mockQuickSettings.getSettingState.mockResolvedValue(settingValue)

            // Act
            const result = await service.getQuickSettingState(settingId)

            // Assert
            expect(result).toBe(settingValue)
            expect(mockQuickSettings.getSettingState).toHaveBeenCalledWith(settingId)
        })
    })

    describe('showStatusMessage', () => {
        it('should show toast message', async () => {
            // Arrange
            const message = 'Test message'
            const messageType = 'toast'
            const durationSeconds = 2

            setupCCPManagerSuccessScenario(mocks, {
                operation: 'showStatusMessage',
                message,
                messageType,
                durationSeconds
            })

            mockQuickSettings.getSettingState.mockResolvedValue(messageType)
            mockConfiguration.get.mockResolvedValue(durationSeconds)
            mockWindow.showTimedInformationMessage.mockResolvedValue(undefined)

            // Act
            await service.showStatusMessage(message)

            // Assert
            expect(mockQuickSettings.getSettingState).toHaveBeenCalled()
            expect(mockConfiguration.get).toHaveBeenCalledWith('ContextCherryPicker.settings.message_show_seconds', 1.5)
            expect(mockWindow.showTimedInformationMessage).toHaveBeenCalledWith(message, 2000)
        })

        it('should show status bar message', async () => {
            // Arrange
            const message = 'Test message'
            const messageType = 'bar'
            const durationSeconds = 1.5

            setupCCPManagerSuccessScenario(mocks, {
                operation: 'showStatusMessage',
                message,
                messageType,
                durationSeconds
            })

            mockQuickSettings.getSettingState.mockResolvedValue(messageType)
            mockConfiguration.get.mockResolvedValue(durationSeconds)
            mockWindow.setStatusBarMessage.mockReturnValue(undefined)

            // Act
            await service.showStatusMessage(message)

            // Assert
            expect(mockWindow.setStatusBarMessage).toHaveBeenCalledWith(message, 1500)
        })

        it('should show dropdown message', async () => {
            // Arrange
            const message = 'Test message'
            const messageType = 'drop'
            const durationSeconds = 1

            setupCCPManagerSuccessScenario(mocks, {
                operation: 'showStatusMessage',
                message,
                messageType,
                durationSeconds
            })

            mockQuickSettings.getSettingState.mockResolvedValue(messageType)
            mockConfiguration.get.mockResolvedValue(durationSeconds)
            mockWindow.showDropdownMessage.mockReturnValue(undefined)

            // Act
            await service.showStatusMessage(message)

            // Assert
            expect(mockWindow.showDropdownMessage).toHaveBeenCalledWith(message, 1000)
        })

        it('should show description message', async () => {
            // Arrange
            const message = 'Test message'
            const messageType = 'desc'
            const durationSeconds = 0.5

            setupCCPManagerSuccessScenario(mocks, {
                operation: 'showStatusMessage',
                message,
                messageType,
                durationSeconds
            })

            mockQuickSettings.getSettingState.mockResolvedValue(messageType)
            mockConfiguration.get.mockResolvedValue(durationSeconds)
            mockWindow.showDescriptionMessage.mockReturnValue(undefined)

            // Act
            await service.showStatusMessage(message)

            // Assert
            expect(mockWindow.showDescriptionMessage).toHaveBeenCalledWith(message, 500)
        })

        it('should not show message when type is none', async () => {
            // Arrange
            const message = 'Test message'
            const messageType = 'none'

            setupCCPManagerSuccessScenario(mocks, {
                operation: 'showStatusMessage',
                message,
                messageType
            })

            mockQuickSettings.getSettingState.mockResolvedValue(messageType)
            mockConfiguration.get.mockResolvedValue(1.5)

            // Act
            await service.showStatusMessage(message)

            // Assert
            expect(mockWindow.showTimedInformationMessage).not.toHaveBeenCalled()
            expect(mockWindow.setStatusBarMessage).not.toHaveBeenCalled()
            expect(mockWindow.showDropdownMessage).not.toHaveBeenCalled()
            expect(mockWindow.showDescriptionMessage).not.toHaveBeenCalled()
        })
    })

    describe('_pruneRedundantUris', () => {
        it('should prune redundant URIs correctly', () => {
            // Arrange
            const uris = [
                '/test/project',
                '/test/project/src',
                '/test/project/src/file1.ts',
                '/test/project/src/file2.ts',
                '/test/project/docs',
                '/test/project/docs/readme.md'
            ]

            setupCCPManagerSuccessScenario(mocks, {
                operation: 'pruneUris',
                uris,
                expectedPruned: ['/test/project/src/file1.ts', '/test/project/src/file2.ts', '/test/project/docs/readme.md']
            })

            // Act - Access private method through any cast
            const result = (service as any)._pruneRedundantUris(uris)

            // Assert
            expect(result).toEqual(['/test/project/src/file1.ts', '/test/project/src/file2.ts', '/test/project/docs/readme.md'])
        })

        it('should return single URI unchanged', () => {
            // Arrange
            const uris = ['/test/project/file.ts']

            setupCCPManagerSuccessScenario(mocks, {
                operation: 'pruneUris',
                uris,
                expectedPruned: ['/test/project/file.ts']
            })

            // Act
            const result = (service as any)._pruneRedundantUris(uris)

            // Assert
            expect(result).toEqual(['/test/project/file.ts'])
        })

        it('should return empty array unchanged', () => {
            // Arrange
            const uris: string[] = []

            setupCCPManagerSuccessScenario(mocks, {
                operation: 'pruneUris',
                uris,
                expectedPruned: []
            })

            // Act
            const result = (service as any)._pruneRedundantUris(uris)

            // Assert
            expect(result).toEqual([])
        })

        it('should handle Windows-style paths', () => {
            // Arrange
            const uris = [
                'C:\\test\\project',
                'C:\\test\\project\\src',
                'C:\\test\\project\\src\\file1.ts'
            ]

            setupCCPManagerSuccessScenario(mocks, {
                operation: 'pruneUris',
                uris,
                expectedPruned: ['C:\\test\\project\\src\\file1.ts']
            })

            // Act
            const result = (service as any)._pruneRedundantUris(uris)

            // Assert
            expect(result).toEqual(['C:\\test\\project\\src\\file1.ts'])
        })
    })
})

