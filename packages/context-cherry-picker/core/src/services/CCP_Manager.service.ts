// ESLint & Imports -->>

//= IMPLEMENTATION TYPES ======================================================================================
import type { IContextCherryPickerManager, IContextCherryPickerDependencies } from '../_interfaces/IContextCherryPickerManager.js'
import type { SavedStateItem } from '../models/SavedStateItem.js'
import { constants } from '../_config/constants.js'

//--------------------------------------------------------------------------------------------------------------<<

const _LOG_PREFIX = `[${constants.extension.nickName} - CCP_Manager]:`

export class ContextCherryPickerManager implements IContextCherryPickerManager {

    private projectRootUri!: string

    constructor(private readonly dependencies: IContextCherryPickerDependencies) {}

    public async saveCurrentCheckedState(): Promise<void> {
        try {
            // Validate input parameters
            this.validateCheckedItemsExist()
            
            const checkedItems = this.getCheckedExplorerItems()

            if (checkedItems.length === 0) {
                await this.dependencies.window.showTimedInformationMessage('No items are checked to save.')
                return
            }

            const stateName = await this.dependencies.window.showInputBox({ prompt: 'Enter a name for this saved state' })

            if (stateName) {
                const itemsToSave = checkedItems.map(uri => ({
                    uriString: uri,
                    checkboxState: this.dependencies.fileExplorerService.getCheckboxState(uri) || this.dependencies.treeItemFactory.getCheckboxStateUnchecked(),
                }))

                await this.dependencies.storageService.saveState(stateName, itemsToSave)
                this.dependencies.savedStatesService.refresh()
                await this.showStatusMessage(`💾 State '${stateName}' saved.`)
            }
        } catch (error: unknown) {
            const errorMessage = error instanceof Error ? error.message : 'Unknown error'

            throw new Error(`${constants.errorMessages.STATE_SAVE_FAILED}: ${errorMessage}`)
        }
    }

    public async copyCheckedFilePaths(): Promise<void> {
        try {
            // Validate input parameters
            this.validateCheckedItemsExist()
            
            const checkedUris = this.getCheckedExplorerItems()

            if (checkedUris.length === 0) {
                await this.dependencies.window.showTimedInformationMessage('No file paths to copy.')
                return
            }
            await this.dependencies.window.setClipboard(checkedUris.join('\n'))
            await this.showStatusMessage('Checked file paths copied to clipboard.')
        } catch (error: unknown) {
            const errorMessage = error instanceof Error ? error.message : 'Unknown error'

            throw new Error(`Copy file paths failed: ${errorMessage}`)
        }
    }

    public async refreshExplorerView(): Promise<void> {
        try {
            await this.dependencies.fileExplorerService.refresh()
        } catch (error: unknown) {
            const errorMessage = error instanceof Error ? error.message : 'Unknown error'

            throw new Error(`Refresh explorer view failed: ${errorMessage}`)
        }
    }

    public async deleteSavedState(stateItem: SavedStateItem): Promise<void> {
        try {
            // Validate input parameters
            this.validateSavedStateItem(stateItem)
            
            if (!stateItem || !stateItem.id)
                return

            const confirm = await this.dependencies.window.showWarningMessage(`Delete "${stateItem.label || stateItem.id}"?`, true, 'Delete')

            if (confirm === 'Delete') {
                await this.dependencies.storageService.deleteState(stateItem.id)
                this.dependencies.savedStatesService.refresh()
            }
        } catch (error: unknown) {
            const errorMessage = error instanceof Error ? error.message : 'Unknown error'

            throw new Error(`Delete saved state failed: ${errorMessage}`)
        }
    }

    public async loadSavedStateIntoExplorer(stateItem: SavedStateItem): Promise<void> {
        try {
            // Validate input parameters
            this.validateSavedStateItem(stateItem)
            
            if (!stateItem || !stateItem.id)
                return

            const loadedItems = await this.dependencies.storageService.loadState(stateItem.id)

            if (loadedItems) {
                this.dependencies.fileExplorerService.loadCheckedState(loadedItems)
                await this.dependencies.fileExplorerService.refresh()
            }
        } catch (error: unknown) {
            const errorMessage = error instanceof Error ? error.message : 'Unknown error'

            throw new Error(`Load saved state failed: ${errorMessage}`)
        }
    }

    public async clearAllCheckedInExplorer(): Promise<void> {
        try {
            this.dependencies.fileExplorerService.clearAllCheckboxes()
        } catch (error: unknown) {
            const errorMessage = error instanceof Error ? error.message : 'Unknown error'

            throw new Error(`Clear all checked items failed: ${errorMessage}`)
        }
    }

    public async copyContextOfCheckedItems(): Promise<void> {
        try {
            // Validate input parameters
            this.validateCheckedItemsExist()
            this.validateWorkspaceFolder()
            
            // console.log(`${LOG_PREFIX} copyContextOfCheckedItems called.`)

            const allCheckedUris = this.getCheckedExplorerItems()
            const initialCheckedUris = this._pruneRedundantUris(allCheckedUris)

            // console.log(`${LOG_PREFIX} Total checked items: ${allCheckedUris.length}, after pruning: ${initialCheckedUris.length}`)

            const workspaceFolders = this.dependencies.workspace.workspaceFolders

            if (!workspaceFolders || workspaceFolders.length === 0) {
                await this.dependencies.window.showTimedInformationMessage('No workspace folder open.')
                return
            }
            this.projectRootUri = workspaceFolders[0].uri

            const projectRootName = this.dependencies.path.basename(this.projectRootUri) || 'ProjectRoot'

            let totalTokens = 0
            const maxTokens = 500000

            const projectStructureQuickSettingMode = await this.getQuickSettingState(constants.quickSettingIDs.projectStructureContents.id) as 'all' | 'selected' | 'none'

            // console.log(`${LOG_PREFIX} Project Structure Quick Setting Mode:`, projectStructureQuickSettingMode)

            const staticCoreIgnores = this.dependencies.fileExplorerService.getCoreScanIgnoreGlobs()
            const contextExplorerIgnoreGlobs = this.dependencies.fileExplorerService.getContextExplorerIgnoreGlobs()
            const contextExplorerHideChildrenGlobs = this.dependencies.fileExplorerService.getContextExplorerHideChildrenGlobs()
            const outputFilterAlwaysShow = this.dependencies.fileExplorerService.getProjectTreeAlwaysShowGlobs()
            const outputFilterAlwaysHide = this.dependencies.fileExplorerService.getProjectTreeAlwaysHideGlobs()
            const outputFilterShowIfSelected = this.dependencies.fileExplorerService.getProjectTreeShowIfSelectedGlobs()

            const dynamicIgnoreGlobs: string[] = []
            const fileGroups = this.dependencies.fileExplorerService.getFileGroupsConfig()

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
            const collectionResult = await this.dependencies.contextDataCollector.collectContextData(
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
                formattedTreeString = await this.dependencies.contextFormatter.generateProjectTreeString(
                    treeEntries,
                    this.projectRootUri,
                    projectRootName,
                    outputFilterAlwaysShow,
                    outputFilterAlwaysHide,
                    outputFilterShowIfSelected,
                    initialCheckedUris,
                )
            }

            const fileContentResult = await this.dependencies.fileContentProvider.getFileContents(
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

            // console.log(`${LOG_PREFIX} Total tokens for final output (estimate): ${totalTokens}`)

            await this.dependencies.window.setClipboard(finalOutput)
            await this.showStatusMessage(`📋 Context copied (~${totalTokens} tokens)`)
        } catch (error: unknown) {
            const errorMessage = error instanceof Error ? error.message : 'Unknown error'

            throw new Error(`${constants.errorMessages.CONTEXT_COLLECTION_FAILED}: ${errorMessage}`)
        }
    }

    public getCheckedExplorerItems(): string[] {
        return this.dependencies.fileExplorerService.getAllCheckedItems()
    }

    public getQuickSettingState(settingId: string): Promise<unknown> {
        return this.dependencies.quickSettingsService.getSettingState(settingId)
    }

    public async showStatusMessage(message: string): Promise<void> {
        try {
            const messageType = await this.getQuickSettingState(constants.quickSettingIDs.defaultStatusMessage.id) as 'none' | 'toast' | 'bar' | 'drop' | 'desc'
            const durationSeconds = await this.dependencies.configurationService.get<number>('ContextCherryPicker.settings.message_show_seconds', 1.5)
            const durationMs = durationSeconds * 1000

            // console.log(`[${LOG_PREFIX}] Status Message (type: ${messageType}): ${message}`)

            switch (messageType) {
                case 'toast':
                    await this.dependencies.window.showTimedInformationMessage(message, durationMs)
                    break
                case 'bar':
                    this.dependencies.window.setStatusBarMessage(message, durationMs)
                    break
                case 'drop':
                    this.dependencies.window.showDropdownMessage(message, durationMs)
                    break
                case 'desc':
                    this.dependencies.window.showDescriptionMessage(message, durationMs)
                    break
            }
        } catch (error: unknown) {
            const errorMessage = error instanceof Error ? error.message : 'Unknown error'

            throw new Error(`Show status message failed: ${errorMessage}`)
        }
    }

    // Complex orchestration methods
    public async saveStateWithValidation(stateName?: string): Promise<{ saved: boolean; stateName?: string; itemCount: number }> {
        try {
            // Step 1: Validate input parameters
            this.validateCheckedItemsExist()
            
            const checkedItems = this.getCheckedExplorerItems()
            const itemCount = checkedItems.length

            if (itemCount === 0) {
                await this.dependencies.window.showTimedInformationMessage('No items are checked to save.')
                return { saved: false, itemCount: 0 }
            }

            // Step 2: Get state name if not provided
            let finalStateName = stateName

            if (!finalStateName) {
                finalStateName = await this.dependencies.window.showInputBox({ prompt: 'Enter a name for this saved state' })
            }

            if (!finalStateName) {
                return { saved: false, itemCount }
            }

            // Step 3: Validate state name
            this.validateStateName(finalStateName)

            // Step 4: Save state
            const itemsToSave = checkedItems.map(uri => ({
                uriString: uri,
                checkboxState: this.dependencies.fileExplorerService.getCheckboxState(uri) || this.dependencies.treeItemFactory.getCheckboxStateUnchecked(),
            }))

            await this.dependencies.storageService.saveState(finalStateName, itemsToSave)
            this.dependencies.savedStatesService.refresh()
            await this.showStatusMessage(`💾 State '${finalStateName}' saved.`)

            return { saved: true, stateName: finalStateName, itemCount }
        } catch (error: unknown) {
            const errorMessage = error instanceof Error ? error.message : 'Unknown error'

            throw new Error(`Save state with validation failed: ${errorMessage}`)
        }
    }

    public async copyContextWithAnalysis(): Promise<{ copied: boolean; tokenCount: number; fileCount: number }> {
        try {
            // Step 1: Validate input parameters
            this.validateCheckedItemsExist()
            this.validateWorkspaceFolder()
            
            const allCheckedUris = this.getCheckedExplorerItems()
            const initialCheckedUris = this._pruneRedundantUris(allCheckedUris)
            const fileCount = initialCheckedUris.length

            if (fileCount === 0) {
                await this.dependencies.window.showTimedInformationMessage('No items are checked to copy.')
                return { copied: false, tokenCount: 0, fileCount: 0 }
            }

            // Step 2: Collect context data
            const workspaceFolders = this.dependencies.workspace.workspaceFolders

            this.projectRootUri = workspaceFolders![0].uri

            const projectRootName = this.dependencies.path.basename(this.projectRootUri) || 'ProjectRoot'

            let totalTokens = 0
            const maxTokens = 500000

            const projectStructureQuickSettingMode = await this.getQuickSettingState(constants.quickSettingIDs.projectStructureContents.id) as 'all' | 'selected' | 'none'

            const staticCoreIgnores = this.dependencies.fileExplorerService.getCoreScanIgnoreGlobs()
            const contextExplorerIgnoreGlobs = this.dependencies.fileExplorerService.getContextExplorerIgnoreGlobs()
            const contextExplorerHideChildrenGlobs = this.dependencies.fileExplorerService.getContextExplorerHideChildrenGlobs()
            const outputFilterAlwaysShow = this.dependencies.fileExplorerService.getProjectTreeAlwaysShowGlobs()
            const outputFilterAlwaysHide = this.dependencies.fileExplorerService.getProjectTreeAlwaysHideGlobs()
            const outputFilterShowIfSelected = this.dependencies.fileExplorerService.getProjectTreeShowIfSelectedGlobs()

            const dynamicIgnoreGlobs: string[] = []
            const fileGroups = this.dependencies.fileExplorerService.getFileGroupsConfig()

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
            const collectionResult = await this.dependencies.contextDataCollector.collectContextData(
                projectStructureQuickSettingMode,
                initialCheckedUris,
                this.projectRootUri,
                finalCoreScanIgnores,
                contextExplorerIgnoreGlobs,
                contextExplorerHideChildrenGlobs,
            )
            const { treeEntries, contentFileUris } = collectionResult

            // Step 3: Generate formatted output
            let formattedTreeString = ''

            if (projectStructureQuickSettingMode !== 'none') {
                formattedTreeString = await this.dependencies.contextFormatter.generateProjectTreeString(
                    treeEntries,
                    this.projectRootUri,
                    projectRootName,
                    outputFilterAlwaysShow,
                    outputFilterAlwaysHide,
                    outputFilterShowIfSelected,
                    initialCheckedUris,
                )
            }

            const fileContentResult = await this.dependencies.fileContentProvider.getFileContents(
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

            // Step 4: Copy to clipboard
            await this.dependencies.window.setClipboard(finalOutput)
            await this.showStatusMessage(`📋 Context copied (~${totalTokens} tokens)`)

            return { copied: true, tokenCount: totalTokens, fileCount }
        } catch (error: unknown) {
            const errorMessage = error instanceof Error ? error.message : 'Unknown error'

            throw new Error(`Copy context with analysis failed: ${errorMessage}`)
        }
    }

    public async completeContextWorkflow(_includeProjectStructure?: boolean): Promise<{ contextCopied: boolean; stateSaved: boolean; tokenCount: number }> {
        try {
            // Step 1: Validate input parameters
            this.validateCheckedItemsExist()
            this.validateWorkspaceFolder()
            
            const checkedItems = this.getCheckedExplorerItems()

            if (checkedItems.length === 0) {
                await this.dependencies.window.showTimedInformationMessage('No items are checked.')
                return { contextCopied: false, stateSaved: false, tokenCount: 0 }
            }

            // Step 2: Copy context with analysis
            const contextResult = await this.copyContextWithAnalysis()
            
            // Step 3: Save state with validation
            const stateResult = await this.saveStateWithValidation()

            return {
                contextCopied: contextResult.copied,
                stateSaved: stateResult.saved,
                tokenCount: contextResult.tokenCount
            }
        } catch (error: unknown) {
            const errorMessage = error instanceof Error ? error.message : 'Unknown error'

            throw new Error(`Complete context workflow failed: ${errorMessage}`)
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

    // Private validation methods
    private validateCheckedItemsExist(): void {
        const checkedItems = this.getCheckedExplorerItems()

        if (checkedItems.length === 0) {
            throw new Error(constants.errorMessages.NO_CHECKED_ITEMS)
        }
    }

    private validateWorkspaceFolder(): void {
        const workspaceFolders = this.dependencies.workspace.workspaceFolders

        if (!workspaceFolders || workspaceFolders.length === 0) {
            throw new Error(constants.errorMessages.NO_WORKSPACE_FOLDER)
        }
    }

    private validateSavedStateItem(stateItem: SavedStateItem): void {
        if (!stateItem) {
            throw new Error(constants.errorMessages.MISSING_REQUIRED_PARAMETER)
        }
        if (!stateItem.id) {
            throw new Error(constants.errorMessages.INVALID_INPUT)
        }
    }

    private validateStateName(stateName: string): void {
        if (!stateName || !stateName.trim()) {
            throw new Error(constants.errorMessages.INVALID_STATE_NAME)
        }
        if (stateName.trim().length < 1) {
            throw new Error(constants.errorMessages.INVALID_STATE_NAME)
        }
    }

}
