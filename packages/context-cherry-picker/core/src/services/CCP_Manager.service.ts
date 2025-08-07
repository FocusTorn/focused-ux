// ESLint & Imports -->>

//= IMPLEMENTATION TYPES ======================================================================================
import type { IContextCherryPickerManager } from '../_interfaces/IContextCherryPickerManager.js'
import type { IFileExplorerService } from '../_interfaces/IFileExplorerService.js'
import type { ISavedStatesService } from '../_interfaces/ISavedStatesService.js'
import type { IStorageService } from '../_interfaces/IStorageService.js'
import type { SavedStateItem } from '../models/SavedStateItem.js'
import type { IContextDataCollectorService } from '../_interfaces/IContextDataCollectorService.js'
import type { IFileContentProviderService } from '../_interfaces/IFileContentProviderService.js'
import type { IContextFormattingService } from '../_interfaces/IContextFormattingService.js'
import { constants } from '../_config/constants.js'
import type { IWindow } from '../_interfaces/IWindow.js'
import type { IWorkspace } from '../_interfaces/IWorkspace.js'
import type { IPath } from '../_interfaces/IPath.js'
import type { IQuickSettingsService } from '../_interfaces/IQuickSettingsService.js'
import type { IConfigurationService } from '@fux/shared'
import type { ITreeItemFactory } from '../models/FileExplorerItem.js'

//--------------------------------------------------------------------------------------------------------------<<

const LOG_PREFIX = `[${constants.extension.nickName} - CCP_Manager]:`

export class ContextCherryPickerManager implements IContextCherryPickerManager {

	private projectRootUri!: string

	constructor(
		private readonly fileExplorerService: IFileExplorerService,
		private readonly savedStatesService: ISavedStatesService,
		private readonly quickSettingsService: IQuickSettingsService,
		private readonly storageService: IStorageService,
		private readonly contextDataCollector: IContextDataCollectorService,
		private readonly fileContentProvider: IFileContentProviderService,
		private readonly contextFormatter: IContextFormattingService,
		private readonly window: IWindow,
		private readonly workspace: IWorkspace,
		private readonly path: IPath,
		private readonly configurationService: IConfigurationService,
		private readonly treeItemFactory: ITreeItemFactory,
	) {}

	public async saveCurrentCheckedState(): Promise<void> {
		const checkedItems = this.getCheckedExplorerItems()

		if (checkedItems.length === 0) {
			await this.window.showTimedInformationMessage('No items are checked to save.')
			return
		}

		const stateName = await this.window.showInputBox({ prompt: 'Enter a name for this saved state' })

		if (stateName) {
			const itemsToSave = checkedItems.map(uri => ({
				uriString: uri,
				checkboxState: this.fileExplorerService.getCheckboxState(uri) || this.treeItemFactory.getCheckboxStateUnchecked(),
			}))

			await this.storageService.saveState(stateName, itemsToSave)
			this.savedStatesService.refresh()
			await this.showStatusMessage(`💾 State '${stateName}' saved.`)
		}
	}

	public async copyCheckedFilePaths(): Promise<void> {
		const checkedUris = this.getCheckedExplorerItems()

		if (checkedUris.length === 0) {
			await this.window.showTimedInformationMessage('No file paths to copy.')
			return
		}
		await this.window.setClipboard(checkedUris.join('\n'))
		await this.showStatusMessage('Checked file paths copied to clipboard.')
	}

	public async refreshExplorerView(): Promise<void> {
		await this.fileExplorerService.refresh()
	}

	public async deleteSavedState(stateItem: SavedStateItem): Promise<void> {
		if (!stateItem || !stateItem.id)
			return

		const confirm = await this.window.showWarningMessage(`Delete "${stateItem.label || stateItem.id}"?`, true, 'Delete')

		if (confirm === 'Delete') {
			await this.storageService.deleteState(stateItem.id)
			this.savedStatesService.refresh()
		}
	}

	public async loadSavedStateIntoExplorer(stateItem: SavedStateItem): Promise<void> {
		if (!stateItem || !stateItem.id)
			return

		const loadedItems = await this.storageService.loadState(stateItem.id)

		if (loadedItems) {
			this.fileExplorerService.loadCheckedState(loadedItems)
			await this.fileExplorerService.refresh()
		}
	}

	public async clearAllCheckedInExplorer(): Promise<void> {
		this.fileExplorerService.clearAllCheckboxes()
	}

	public async copyContextOfCheckedItems(): Promise<void> {
		console.log(`${LOG_PREFIX} copyContextOfCheckedItems called.`)

		const allCheckedUris = this.getCheckedExplorerItems()
		const initialCheckedUris = this._pruneRedundantUris(allCheckedUris)

		console.log(`${LOG_PREFIX} Total checked items: ${allCheckedUris.length}, after pruning: ${initialCheckedUris.length}`)

		const workspaceFolders = this.workspace.workspaceFolders

		if (!workspaceFolders || workspaceFolders.length === 0) {
			await this.window.showTimedInformationMessage('No workspace folder open.')
			return
		}
		this.projectRootUri = workspaceFolders[0].uri

		const projectRootName = this.path.basename(this.projectRootUri) || 'ProjectRoot'

		let totalTokens = 0
		const maxTokens = 500000

		const projectStructureQuickSettingMode = await this.getQuickSettingState(constants.quickSettingIDs.projectStructureContents.id) as 'all' | 'selected' | 'none'

		console.log(`${LOG_PREFIX} Project Structure Quick Setting Mode:`, projectStructureQuickSettingMode)

		const staticCoreIgnores = this.fileExplorerService.getCoreScanIgnoreGlobs()
		const contextExplorerIgnoreGlobs = this.fileExplorerService.getContextExplorerIgnoreGlobs()
		const contextExplorerHideChildrenGlobs = this.fileExplorerService.getContextExplorerHideChildrenGlobs()
		const outputFilterAlwaysShow = this.fileExplorerService.getProjectTreeAlwaysShowGlobs()
		const outputFilterAlwaysHide = this.fileExplorerService.getProjectTreeAlwaysHideGlobs()
		const outputFilterShowIfSelected = this.fileExplorerService.getProjectTreeShowIfSelectedGlobs()

		const dynamicIgnoreGlobs: string[] = []
		const fileGroups = this.fileExplorerService.getFileGroupsConfig()

		if (fileGroups) {
			for (const groupName in fileGroups) {
				const settingId = `${constants.quickSettingIDs.fileGroupVisibility.idPrefix}.${groupName}`
				const isVisible = await this.getQuickSettingState(settingId)

				if (isVisible === false) {
					dynamicIgnoreGlobs.push(...(fileGroups[groupName].items || []))
				}
			}
		}

		const finalCoreScanIgnores = [...staticCoreIgnores, ...dynamicIgnoreGlobs]
		const collectionResult = await this.contextDataCollector.collectContextData(
			projectStructureQuickSettingMode,
			initialCheckedUris,
			this.projectRootUri,
			finalCoreScanIgnores,
			contextExplorerIgnoreGlobs,
			contextExplorerHideChildrenGlobs,
		)
		const { treeEntries, contentFileUris } = collectionResult

		let formattedTreeString = ''

		if (projectStructureQuickSettingMode !== 'none') {
			formattedTreeString = await this.contextFormatter.generateProjectTreeString(
				treeEntries,
				this.projectRootUri,
				projectRootName,
				outputFilterAlwaysShow,
				outputFilterAlwaysHide,
				outputFilterShowIfSelected,
				initialCheckedUris,
			)
		}

		const fileContentResult = await this.fileContentProvider.getFileContents(
			contentFileUris,
			treeEntries,
			maxTokens,
			totalTokens,
		)
		const filesContentOutputString = fileContentResult.contentString

		totalTokens += fileContentResult.processedTokens

		let finalOutput = '<context>\n'

		if (projectStructureQuickSettingMode !== 'none') {
			finalOutput += '<project_tree>'
			if (formattedTreeString && formattedTreeString.trim() !== '') {
				finalOutput += `\n${formattedTreeString.trim()}\n`
			}
			finalOutput += '</project_tree>\n'
		}
		finalOutput += `<project_files>\n${filesContentOutputString || '\n'}</project_files>\n`
		finalOutput += '</context>'

		console.log(`${LOG_PREFIX} Total tokens for final output (estimate): ${totalTokens}`)

		await this.window.setClipboard(finalOutput)
		await this.showStatusMessage(`📋 Context copied (~${totalTokens} tokens)`)
	}

	public getCheckedExplorerItems(): string[] {
		return this.fileExplorerService.getAllCheckedItems()
	}

	public getQuickSettingState(settingId: string): Promise<any> {
		return this.quickSettingsService.getSettingState(settingId)
	}

	public async showStatusMessage(message: string): Promise<void> {
		const messageType = await this.getQuickSettingState(constants.quickSettingIDs.defaultStatusMessage.id) as 'none' | 'toast' | 'bar' | 'drop' | 'desc'
		const durationSeconds = await this.configurationService.get<number>('ContextCherryPicker.settings.message_show_seconds', 1.5)
		const durationMs = durationSeconds * 1000

		console.log(`[${LOG_PREFIX}] Status Message (type: ${messageType}): ${message}`)

		switch (messageType) {
			case 'toast':
				await this.window.showTimedInformationMessage(message, durationMs)
				break
			case 'bar':
				this.window.setStatusBarMessage(message, durationMs)
				break
			case 'drop':
				this.window.showDropdownMessage(message, durationMs)
				break
			case 'desc':
				this.window.showDescriptionMessage(message, durationMs)
				break
		}
	}

	private _pruneRedundantUris(uris: string[]): string[] {
		if (uris.length <= 1)
			return uris

		const paths = uris.map(u => u.replace(/\\/g, '/'))
		const uriMap = new Map(paths.map((p, i) => [p, uris[i]]))

		const prunedPaths = paths.filter((pathA) => {
			return !paths.some((pathB) => {
				if (pathA === pathB)
					return false
				return pathA.startsWith(`${pathB}/`)
			})
		})

		return prunedPaths.map(p => uriMap.get(p)!)
	}

}
