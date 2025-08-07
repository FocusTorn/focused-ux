import { describe, it, expect, vi, beforeEach } from 'vitest'
import { ContextCherryPickerManager } from '@fux/context-cherry-picker-core'
import { TreeItemCheckboxState } from '@fux/mockly'

describe('ContextCherryPickerManager - Core Functionality', () => {
	let ccpManager: ContextCherryPickerManager
	let mockFileExplorerService: any
	let mockSavedStatesService: any
	let mockQuickSettingsService: any
	let mockStorageService: any
	let mockContextDataCollector: any
	let mockFileContentProvider: any
	let mockContextFormatter: any
	let mockWindow: any
	let mockWorkspace: any
	let mockPath: any
	let mockConfigurationService: any

	beforeEach(() => {
		// Create mock dependencies with all required methods
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

	describe('Basic Operations', () => {
		it('should refresh explorer view', async () => {
			await ccpManager.refreshExplorerView()

			expect(mockFileExplorerService.refresh).toHaveBeenCalled()
		})

		it('should clear all checked items', async () => {
			await ccpManager.clearAllCheckedInExplorer()

			expect(mockFileExplorerService.clearAllCheckboxes).toHaveBeenCalled()
		})

		it('should get checked explorer items', () => {
			const expectedItems = ['file:///test/file1.ts', 'file:///test/file2.ts']

			mockFileExplorerService.getAllCheckedItems = vi.fn().mockReturnValue(expectedItems)

			const result = ccpManager.getCheckedExplorerItems()

			expect(result).toEqual(expectedItems)
			expect(mockFileExplorerService.getAllCheckedItems).toHaveBeenCalled()
		})

		it('should get quick setting state', async () => {
			const settingId = 'test-setting'
			const expectedState = { enabled: true }

			mockQuickSettingsService.getSettingState = vi.fn().mockResolvedValue(expectedState)

			const result = await ccpManager.getQuickSettingState(settingId)

			expect(result).toEqual(expectedState)
			expect(mockQuickSettingsService.getSettingState).toHaveBeenCalledWith(settingId)
		})
	})

	describe('State Management', () => {
		it('should save current checked state', async () => {
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
	})

	describe('File Operations', () => {
		it('should copy checked file paths to clipboard', async () => {
			const checkedUris = ['file:///test/file1.ts', 'file:///test/file2.ts']

			vi.spyOn(ccpManager, 'getCheckedExplorerItems').mockReturnValue(checkedUris)
			mockQuickSettingsService.getSettingState = vi.fn().mockResolvedValue('toast')
			mockConfigurationService.get = vi.fn().mockReturnValue(1.5)

			await ccpManager.copyCheckedFilePaths()

			expect(mockWindow.setClipboard).toHaveBeenCalledWith(
				'file:///test/file1.ts\nfile:///test/file2.ts',
			)
			expect(mockWindow.showTimedInformationMessage).toHaveBeenCalledWith(
				'Checked file paths copied to clipboard.',
				1500,
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
})
