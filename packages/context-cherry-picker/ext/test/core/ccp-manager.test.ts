import { describe, it, expect, vi, beforeEach } from 'vitest'
import { ContextCherryPickerManager } from '@fux/context-cherry-picker-core'
import { TreeItemCheckboxState } from '@fux/mockly'
import type {
	IFileExplorerService,
	ISavedStatesService,
	IQuickSettingsService,
	IStorageService,
	IContextDataCollectorService,
	IFileContentProviderService,
	IContextFormattingService,
	IWindow,
	IWorkspace,
	IPath,
	IConfigurationService,
} from '@fux/context-cherry-picker-core'

describe('ContextCherryPickerManager', () => {
	let ccpManager: ContextCherryPickerManager
	let mockFileExplorerService: IFileExplorerService
	let mockSavedStatesService: ISavedStatesService
	let mockQuickSettingsService: IQuickSettingsService
	let mockStorageService: IStorageService
	let mockContextDataCollector: IContextDataCollectorService
	let mockFileContentProvider: IFileContentProviderService
	let mockContextFormatter: IContextFormattingService
	let mockWindow: IWindow
	let mockWorkspace: IWorkspace
	let mockPath: IPath
	let mockConfigurationService: IConfigurationService

	beforeEach(() => {
		// Create mock dependencies
		mockFileExplorerService = {
			getCheckboxState: vi.fn(),
			refresh: vi.fn(),
			loadCheckedState: vi.fn(),
			getCheckedItems: vi.fn(),
			getAllCheckedItems: vi.fn(),
			clearAllCheckboxes: vi.fn(),
		}

		mockSavedStatesService = {
			refresh: vi.fn(),
		}

		mockQuickSettingsService = {
			getSetting: vi.fn(),
			setSetting: vi.fn(),
			getSettingState: vi.fn(),
		}

		mockStorageService = {
			saveState: vi.fn(),
			loadState: vi.fn(),
			deleteState: vi.fn(),
			getAllStates: vi.fn(),
		}

		mockContextDataCollector = {
			collectContextData: vi.fn(),
		}

		mockFileContentProvider = {
			getFileContent: vi.fn(),
		}

		mockContextFormatter = {
			formatContext: vi.fn(),
		}

		mockWindow = {
			showTimedInformationMessage: vi.fn(),
			showInputBox: vi.fn(),
			showWarningMessage: vi.fn(),
			setClipboard: vi.fn(),
			showErrorMessage: vi.fn(),
		}

		mockWorkspace = {
			getWorkspaceFolders: vi.fn(),
			getConfiguration: vi.fn(),
		}

		mockPath = {
			join: vi.fn(),
			dirname: vi.fn(),
			basename: vi.fn(),
			extname: vi.fn(),
			isAbsolute: vi.fn(),
			relative: vi.fn(),
			resolve: vi.fn(),
		}

		mockConfigurationService = {
			get: vi.fn(),
			update: vi.fn(),
			inspect: vi.fn(),
		}

		// Create service instance
		ccpManager = new ContextCherryPickerManager(
			mockFileExplorerService,
			mockSavedStatesService,
			mockQuickSettingsService,
			mockStorageService,
			mockContextDataCollector,
			mockFileContentProvider,
			mockContextFormatter,
			mockWindow,
			mockWorkspace,
			mockPath,
			mockConfigurationService,
		)
	})

	describe('saveCurrentCheckedState', () => {
		it('should save checked state when items are checked', async () => {
			const checkedUris = ['file:///test/file1.ts', 'file:///test/file2.ts']
			const stateName = 'Test State'
			
			// Mock getCheckedExplorerItems to return checked URIs
			vi.spyOn(ccpManager, 'getCheckedExplorerItems').mockReturnValue(checkedUris)
			mockFileExplorerService.getCheckboxState = vi.fn()
				.mockReturnValueOnce(TreeItemCheckboxState.Checked)
				.mockReturnValueOnce(TreeItemCheckboxState.Checked)
			mockWindow.showInputBox = vi.fn().mockResolvedValue(stateName)
			mockStorageService.saveState = vi.fn().mockResolvedValue(undefined)

			await ccpManager.saveCurrentCheckedState()

			expect(mockStorageService.saveState).toHaveBeenCalledWith(stateName, [
				{ uriString: 'file:///test/file1.ts', checkboxState: TreeItemCheckboxState.Checked },
				{ uriString: 'file:///test/file2.ts', checkboxState: TreeItemCheckboxState.Checked },
			])
			expect(mockSavedStatesService.refresh).toHaveBeenCalled()
		})

		it('should show message when no items are checked', async () => {
			vi.spyOn(ccpManager, 'getCheckedExplorerItems').mockReturnValue([])

			await ccpManager.saveCurrentCheckedState()

			expect(mockWindow.showTimedInformationMessage).toHaveBeenCalledWith(
				'No items are checked to save.',
			)
			expect(mockStorageService.saveState).not.toHaveBeenCalled()
		})

		it('should not save when user cancels input', async () => {
			const checkedUris = ['file:///test/file1.ts']

			vi.spyOn(ccpManager, 'getCheckedExplorerItems').mockReturnValue(checkedUris)
			mockWindow.showInputBox = vi.fn().mockResolvedValue(undefined)

			await ccpManager.saveCurrentCheckedState()

			expect(mockStorageService.saveState).not.toHaveBeenCalled()
		})
	})

	describe('copyCheckedFilePaths', () => {
		it('should copy checked file paths to clipboard', async () => {
			const checkedUris = ['file:///test/file1.ts', 'file:///test/file2.ts']

			vi.spyOn(ccpManager, 'getCheckedExplorerItems').mockReturnValue(checkedUris)
			mockQuickSettingsService.getSettingState = vi.fn().mockResolvedValue('toast')

			await ccpManager.copyCheckedFilePaths()

			expect(mockWindow.setClipboard).toHaveBeenCalledWith(
				'file:///test/file1.ts\nfile:///test/file2.ts',
			)
			expect(mockWindow.showTimedInformationMessage).toHaveBeenCalledWith(
				'Checked file paths copied to clipboard.',
				expect.any(Number),
			)
		})

		it('should show message when no file paths to copy', async () => {
			vi.spyOn(ccpManager, 'getCheckedExplorerItems').mockReturnValue([])

			await ccpManager.copyCheckedFilePaths()

			expect(mockWindow.showTimedInformationMessage).toHaveBeenCalledWith(
				'No file paths to copy.',
			)
			expect(mockWindow.setClipboard).not.toHaveBeenCalled()
		})
	})

	describe('refreshExplorerView', () => {
		it('should refresh the file explorer view', async () => {
			await ccpManager.refreshExplorerView()

			expect(mockFileExplorerService.refresh).toHaveBeenCalled()
		})
	})

	describe('deleteSavedState', () => {
		it('should delete saved state when confirmed', async () => {
			const stateItem = { id: 'test-state', label: 'Test State' }

			mockWindow.showWarningMessage = vi.fn().mockResolvedValue('Delete')

			await ccpManager.deleteSavedState(stateItem)

			expect(mockWindow.showWarningMessage).toHaveBeenCalledWith(
				'Delete "Test State"?',
				true,
				'Delete',
			)
			expect(mockStorageService.deleteState).toHaveBeenCalledWith('test-state')
			expect(mockSavedStatesService.refresh).toHaveBeenCalled()
		})

		it('should not delete when user cancels', async () => {
			const stateItem = { id: 'test-state', label: 'Test State' }

			mockWindow.showWarningMessage = vi.fn().mockResolvedValue(undefined)

			await ccpManager.deleteSavedState(stateItem)

			expect(mockStorageService.deleteState).not.toHaveBeenCalled()
		})

		it('should not delete when state item is invalid', async () => {
			await ccpManager.deleteSavedState({} as any)

			expect(mockWindow.showWarningMessage).not.toHaveBeenCalled()
			expect(mockStorageService.deleteState).not.toHaveBeenCalled()
		})
	})

	describe('loadSavedStateIntoExplorer', () => {
		it('should load saved state into explorer', async () => {
			const stateItem = { id: 'test-state', label: 'Test State' }
			const loadedItems = [
				{ uriString: 'file:///test/file1.ts', checkboxState: TreeItemCheckboxState.Checked },
				{ uriString: 'file:///test/file2.ts', checkboxState: TreeItemCheckboxState.Unchecked },
			]

			mockStorageService.loadState = vi.fn().mockResolvedValue(loadedItems)

			await ccpManager.loadSavedStateIntoExplorer(stateItem)

			expect(mockStorageService.loadState).toHaveBeenCalledWith('test-state')
			expect(mockFileExplorerService.loadCheckedState).toHaveBeenCalledWith(loadedItems)
			expect(mockFileExplorerService.refresh).toHaveBeenCalled()
		})

		it('should not load when state item is invalid', async () => {
			await ccpManager.loadSavedStateIntoExplorer({} as any)

			expect(mockStorageService.loadState).not.toHaveBeenCalled()
		})

		it('should not load when state is not found', async () => {
			const stateItem = { id: 'test-state', label: 'Test State' }

			mockStorageService.loadState = vi.fn().mockResolvedValue(undefined)

			await ccpManager.loadSavedStateIntoExplorer(stateItem)

			expect(mockFileExplorerService.loadCheckedState).not.toHaveBeenCalled()
		})
	})

	describe('clearAllCheckedInExplorer', () => {
		it('should clear all checked items in explorer', async () => {
			await ccpManager.clearAllCheckedInExplorer()

			expect(mockFileExplorerService.clearAllCheckboxes).toHaveBeenCalled()
		})
	})

	describe('copyContextOfCheckedItems', () => {
		it('should copy context of checked items', async () => {
			const checkedUris = ['file:///test/file1.ts', 'file:///test/file2.ts']
			
			vi.spyOn(ccpManager, 'getCheckedExplorerItems').mockReturnValue(checkedUris)
			mockWorkspace.workspaceFolders = [{ uri: 'file:///test/workspace', name: 'test-workspace' }]
			mockPath.basename = vi.fn().mockReturnValue('test-workspace')
			mockQuickSettingsService.getSettingState = vi.fn().mockResolvedValue('selected')
			mockFileExplorerService.getCoreScanIgnoreGlobs = vi.fn().mockReturnValue([])
			mockFileExplorerService.getContextExplorerIgnoreGlobs = vi.fn().mockReturnValue([])
			mockFileExplorerService.getContextExplorerHideChildrenGlobs = vi.fn().mockReturnValue([])
			mockFileExplorerService.getProjectTreeAlwaysShowGlobs = vi.fn().mockReturnValue([])
			mockFileExplorerService.getProjectTreeAlwaysHideGlobs = vi.fn().mockReturnValue([])
			mockFileExplorerService.getProjectTreeShowIfSelectedGlobs = vi.fn().mockReturnValue([])
			mockFileExplorerService.getFileGroupsConfig = vi.fn().mockReturnValue(undefined)
			mockContextDataCollector.collectContextData = vi.fn().mockResolvedValue({
				treeEntries: new Map(),
				contentFileUris: new Set(),
			})
			mockContextFormatter.generateProjectTreeString = vi.fn().mockResolvedValue('')
			mockFileContentProvider.getFileContents = vi.fn().mockResolvedValue({
				contentString: '',
				processedTokens: 0,
			})

			await ccpManager.copyContextOfCheckedItems()

			expect(mockContextDataCollector.collectContextData).toHaveBeenCalled()
			expect(mockWindow.setClipboard).toHaveBeenCalled()
		})

		it('should show error when context collection fails', async () => {
			const checkedUris = ['file:///test/file1.ts']

			vi.spyOn(ccpManager, 'getCheckedExplorerItems').mockReturnValue(checkedUris)
			mockWorkspace.workspaceFolders = [{ uri: 'file:///test/workspace', name: 'test-workspace' }]
			mockPath.basename = vi.fn().mockReturnValue('test-workspace')
			mockQuickSettingsService.getSettingState = vi.fn().mockResolvedValue('selected')
			mockFileExplorerService.getCoreScanIgnoreGlobs = vi.fn().mockReturnValue([])
			mockFileExplorerService.getContextExplorerIgnoreGlobs = vi.fn().mockReturnValue([])
			mockFileExplorerService.getContextExplorerHideChildrenGlobs = vi.fn().mockReturnValue([])
			mockFileExplorerService.getProjectTreeAlwaysShowGlobs = vi.fn().mockReturnValue([])
			mockFileExplorerService.getProjectTreeAlwaysHideGlobs = vi.fn().mockReturnValue([])
			mockFileExplorerService.getProjectTreeShowIfSelectedGlobs = vi.fn().mockReturnValue([])
			mockFileExplorerService.getFileGroupsConfig = vi.fn().mockReturnValue(undefined)
			mockContextDataCollector.collectContextData = vi.fn().mockRejectedValue(new Error('Collection failed'))

			await expect(ccpManager.copyContextOfCheckedItems()).rejects.toThrow('Collection failed')
		})
	})

	describe('getCheckedExplorerItems', () => {
		it('should return checked explorer items', () => {
			const expectedItems = ['file:///test/file1.ts', 'file:///test/file2.ts']

			mockFileExplorerService.getAllCheckedItems = vi.fn().mockReturnValue(expectedItems)

			const result = ccpManager.getCheckedExplorerItems()

			expect(result).toEqual(expectedItems)
			expect(mockFileExplorerService.getAllCheckedItems).toHaveBeenCalled()
		})
	})

	describe('getQuickSettingState', () => {
		it('should return quick setting state', async () => {
			const settingId = 'test-setting'
			const expectedState = { enabled: true }

			mockQuickSettingsService.getSettingState = vi.fn().mockResolvedValue(expectedState)

			const result = await ccpManager.getQuickSettingState(settingId)

			expect(result).toEqual(expectedState)
			expect(mockQuickSettingsService.getSettingState).toHaveBeenCalledWith(settingId)
		})
	})

	describe('showStatusMessage', () => {
		it('should show status message', async () => {
			const message = 'Test status message'

			mockQuickSettingsService.getSettingState = vi.fn().mockResolvedValue('toast')

			await ccpManager.showStatusMessage(message)

			expect(mockWindow.showTimedInformationMessage).toHaveBeenCalledWith(message, expect.any(Number))
		})
	})
})
