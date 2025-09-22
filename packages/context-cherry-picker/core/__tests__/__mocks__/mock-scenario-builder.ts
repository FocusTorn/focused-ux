import { vi } from 'vitest'
import { CCPTestMocks } from './helpers'
import { encode } from 'gpt-tokenizer'
import * as micromatch from 'micromatch'

// Context Collection Scenarios
export interface ContextCollectionScenarioOptions {
    sourcePath: string
    content: string
    shouldExist?: boolean
    fileType?: 'file' | 'directory'
}

export function setupContextCollectionSuccessScenario(
    mocks: CCPTestMocks,
    options: ContextCollectionScenarioOptions
): void {
    const { sourcePath, content, fileType = 'file' } = options

    mocks.fileSystem.stat.mockResolvedValue({ type: fileType })
    mocks.fileSystem.readFile.mockResolvedValue(content)
    mocks.path.basename.mockReturnValue(sourcePath.split('/').pop() || '')
    mocks.path.dirname.mockReturnValue(sourcePath.split('/').slice(0, -1).join('/'))
    mocks.path.extname.mockReturnValue(sourcePath.split('.').pop() || '')
}

export function setupContextCollectionErrorScenario(
    mocks: CCPTestMocks,
    operation: 'stat' | 'read',
    errorMessage: string,
    options: ContextCollectionScenarioOptions
): void {
    const { sourcePath } = options

    mocks.path.basename.mockReturnValue(sourcePath.split('/').pop() || '')
    mocks.path.dirname.mockReturnValue(sourcePath.split('/').slice(0, -1).join('/'))

    if (operation === 'stat') {
        mocks.fileSystem.stat.mockRejectedValue(new Error(errorMessage))
    } else {
        mocks.fileSystem.stat.mockResolvedValue({ type: 'file' })
        mocks.fileSystem.readFile.mockRejectedValue(new Error(errorMessage))
    }
}

// Token Counting Scenarios
export interface TokenCountingScenarioOptions {
    text: string
    expectedTokens: number
}

export function setupTokenCountingScenario(
    mocks: CCPTestMocks,
    options: TokenCountingScenarioOptions
): void {
    const { text, expectedTokens } = options

    mocks.tokenizer.encode.mockReturnValue(Array.from({ length: expectedTokens }, (_, i) => i + 1))
    mocks.tokenizer.decode.mockReturnValue(text)
}

// File Filtering Scenarios
export interface FileFilteringScenarioOptions {
    files: string[]
    patterns: string[]
    expectedMatches: string[]
}

export function setupFileFilteringScenario(
    mocks: CCPTestMocks,
    options: FileFilteringScenarioOptions
): void {
    const { files, patterns, expectedMatches } = options

    mocks.micromatch.match.mockReturnValue(expectedMatches)
    mocks.micromatch.isMatch.mockImplementation((file: string) => 
        expectedMatches.includes(file)
    )
}

// Saved State Scenarios
export interface SavedStateScenarioOptions {
    stateId: string
    stateName: string
    stateData: any
}

export function setupSavedStateSuccessScenario(
    mocks: CCPTestMocks,
    options: SavedStateScenarioOptions
): void {
    const { stateId, stateName, stateData } = options

    mocks.fileSystem.readFile.mockResolvedValue(JSON.stringify(stateData))
    mocks.fileSystem.writeFile.mockResolvedValue(undefined)
    mocks.path.join.mockReturnValue(`/storage/${stateId}.json`)
}

export function setupSavedStateErrorScenario(
    mocks: CCPTestMocks,
    operation: 'read' | 'write',
    errorMessage: string,
    options: SavedStateScenarioOptions
): void {
    const { stateId } = options

    mocks.path.join.mockReturnValue(`/storage/${stateId}.json`)

    if (operation === 'read') {
        mocks.fileSystem.readFile.mockRejectedValue(new Error(errorMessage))
    } else {
        mocks.fileSystem.readFile.mockResolvedValue('{}')
        mocks.fileSystem.writeFile.mockRejectedValue(new Error(errorMessage))
    }
}

// Fluent Builder Pattern
export class CCPMockBuilder {
    constructor(private mocks: CCPTestMocks) {}

    contextCollection(options: ContextCollectionScenarioOptions): CCPMockBuilder {
        setupContextCollectionSuccessScenario(this.mocks, options)
        return this
    }

    contextCollectionError(
        operation: 'stat' | 'read',
        errorMessage: string,
        options: ContextCollectionScenarioOptions
    ): CCPMockBuilder {
        setupContextCollectionErrorScenario(this.mocks, operation, errorMessage, options)
        return this
    }

    tokenCounting(options: TokenCountingScenarioOptions): CCPMockBuilder {
        setupTokenCountingScenario(this.mocks, options)
        return this
    }

    fileFiltering(options: FileFilteringScenarioOptions): CCPMockBuilder {
        setupFileFilteringScenario(this.mocks, options)
        return this
    }

    savedState(options: SavedStateScenarioOptions): CCPMockBuilder {
        setupSavedStateSuccessScenario(this.mocks, options)
        return this
    }

    savedStateError(
        operation: 'read' | 'write',
        errorMessage: string,
        options: SavedStateScenarioOptions
    ): CCPMockBuilder {
        setupSavedStateErrorScenario(this.mocks, operation, errorMessage, options)
        return this
    }

    build(): CCPTestMocks {
        return this.mocks
    }
}

// CCP Manager Scenarios
export interface CCPManagerScenarioOptions {
    operation: 'saveState' | 'copyPaths' | 'refresh' | 'deleteState' | 'loadState' | 'clearAll' | 'copyContext' | 'getCheckedItems' | 'getQuickSetting' | 'showStatusMessage' | 'pruneUris'
    checkedItems?: string[]
    stateName?: string | null
    expectedItems?: any[]
    clipboardContent?: string
    stateItem?: any
    confirmed?: boolean
    loadedItems?: any[]
    prunedUris?: string[]
    projectRootUri?: string
    projectRootName?: string
    collectionResult?: any
    formattedTreeString?: string
    fileContentResult?: any
    expectedOutput?: string
    workspaceFolders?: any
    projectStructureMode?: 'all' | 'selected' | 'none'
    settingId?: string
    settingValue?: any
    message?: string
    messageType?: 'none' | 'toast' | 'bar' | 'drop' | 'desc'
    durationSeconds?: number
    uris?: string[]
    expectedPruned?: string[]
}

export function setupCCPManagerSuccessScenario(
    mocks: CCPTestMocks,
    options: CCPManagerScenarioOptions
): void {
    const { operation, checkedItems = [], stateName, expectedItems, clipboardContent, stateItem, confirmed, loadedItems, prunedUris, projectRootUri, projectRootName, collectionResult, formattedTreeString, fileContentResult, expectedOutput, workspaceFolders, projectStructureMode, settingId, settingValue, message, messageType, durationSeconds, uris, expectedPruned } = options

    switch (operation) {
        case 'saveState':
            if (checkedItems.length === 0) {
                // No items checked scenario
                return
            }
            if (stateName) {
                // Success save scenario
                mocks.fileSystem.writeFile.mockResolvedValue(undefined)
                mocks.path.join.mockReturnValue(`/storage/${stateName}.json`)
            }
            break

        case 'copyPaths':
            if (checkedItems.length === 0) {
                // No paths to copy scenario
                return
            }
            // Success copy scenario
            break

        case 'refresh':
            // Refresh scenario
            break

        case 'deleteState':
            if (!stateItem || !stateItem.id) {
                // Invalid state item scenario
                return
            }
            if (confirmed) {
                // Confirmed deletion scenario
                mocks.fileSystem.unlink.mockResolvedValue(undefined)
                mocks.path.join.mockReturnValue(`/storage/${stateItem.id}.json`)
            }
            break

        case 'loadState':
            if (!stateItem || !stateItem.id) {
                // Invalid state item scenario
                return
            }
            if (loadedItems) {
                // Success load scenario
                mocks.fileSystem.readFile.mockResolvedValue(JSON.stringify(loadedItems))
                mocks.path.join.mockReturnValue(`/storage/${stateItem.id}.json`)
            }
            break

        case 'clearAll':
            // Clear all scenario
            break

        case 'copyContext':
            if (!workspaceFolders || workspaceFolders.length === 0) {
                // No workspace scenario
                return
            }
            if (collectionResult && fileContentResult) {
                // Success context copy scenario
                mocks.fileSystem.readFile.mockResolvedValue(fileContentResult.contentString)
                mocks.path.basename.mockReturnValue(projectRootName || 'project')
            }
            break

        case 'getCheckedItems':
            // Get checked items scenario
            break

        case 'getQuickSetting':
            // Get quick setting scenario
            break

        case 'showStatusMessage':
            // Show status message scenario
            break

        case 'pruneUris':
            // Prune URIs scenario
            break
    }
}

export function setupCCPManagerErrorScenario(
    mocks: CCPTestMocks,
    operation: 'saveState' | 'deleteState' | 'loadState' | 'copyContext',
    errorMessage: string,
    options: CCPManagerScenarioOptions
): void {
    const { stateName, stateItem, projectRootUri } = options

    switch (operation) {
        case 'saveState':
            mocks.fileSystem.writeFile.mockRejectedValue(new Error(errorMessage))
            mocks.path.join.mockReturnValue(`/storage/${stateName}.json`)
            break

        case 'deleteState':
            mocks.fileSystem.unlink.mockRejectedValue(new Error(errorMessage))
            mocks.path.join.mockReturnValue(`/storage/${stateItem?.id}.json`)
            break

        case 'loadState':
            mocks.fileSystem.readFile.mockRejectedValue(new Error(errorMessage))
            mocks.path.join.mockReturnValue(`/storage/${stateItem?.id}.json`)
            break

        case 'copyContext':
            mocks.fileSystem.readFile.mockRejectedValue(new Error(errorMessage))
            mocks.path.basename.mockReturnValue('project')
            break
    }
}


// Context Formatting Scenarios
export interface ContextFormattingScenarioOptions {
    operation: 'generateTree' | 'buildInternalTree' | 'transformToFormatterTree'
    treeEntriesMap?: Map<string, any>
    projectRootUri?: string
    projectRootName?: string
    outputFilterAlwaysShow?: string[]
    outputFilterAlwaysHide?: string[]
    outputFilterShowIfSelected?: string[]
    initialCheckedUris?: string[]
    expectedTreeString?: string
    entries?: any[]
    internalNode?: any
}

export function setupContextFormattingSuccessScenario(
    mocks: CCPTestMocks,
    options: ContextFormattingScenarioOptions
): void {
    const { operation, treeEntriesMap, projectRootUri, projectRootName, outputFilterAlwaysShow, outputFilterAlwaysHide, outputFilterShowIfSelected, initialCheckedUris, expectedTreeString, entries, internalNode } = options

    switch (operation) {
        case 'generateTree':
            // Mock micromatch behavior for tree generation
            mocks.micromatch.isMatch.mockImplementation((path: string, patterns: string[]) => {
                if (!patterns || patterns.length === 0) return true
                return patterns.some(pattern => {
                    if (pattern.includes('*')) {
                        const regex = new RegExp(pattern.replace(/\*/g, '.*'))
                        return regex.test(path)
                    }
                    return path.includes(pattern)
                })
            })
            break

        case 'buildInternalTree':
            // Mock path joining for tree building
            mocks.path.join.mockImplementation((...paths: string[]) => paths.join('/'))
            break

        case 'transformToFormatterTree':
            // Mock file size formatting
            mocks.fileSystem.stat.mockResolvedValue({ size: 1024 })
            break
    }
}

export function setupContextFormattingErrorScenario(
    mocks: CCPTestMocks,
    operation: 'generateTree' | 'buildInternalTree' | 'transformToFormatterTree',
    errorMessage: string,
    options: ContextFormattingScenarioOptions
): void {
    switch (operation) {
        case 'generateTree':
            mocks.micromatch.isMatch.mockImplementation(() => {
                throw new Error(errorMessage)
            })
            break

        case 'buildInternalTree':
            mocks.path.join.mockImplementation(() => {
                throw new Error(errorMessage)
            })
            break

        case 'transformToFormatterTree':
            mocks.fileSystem.stat.mockRejectedValue(new Error(errorMessage))
            break
    }
}

// File Content Provider Scenarios
export interface FileContentProviderScenarioOptions {
    operation: 'getFileContents' | 'estimateTokens'
    contentFileUrisSet?: Set<string>
    collectedFileSystemEntries?: Map<string, any>
    maxTokens?: number
    currentTotalTokens?: number
    fileContents?: string[]
    tokenCounts?: number[]
    expectedResult?: any
    limitReached?: boolean
    text?: string
    expectedTokens?: number
}

export function setupFileContentProviderSuccessScenario(
    mocks: CCPTestMocks,
    options: FileContentProviderScenarioOptions
): void {
    const { operation, contentFileUrisSet, collectedFileSystemEntries, maxTokens, currentTotalTokens, fileContents, tokenCounts, expectedResult, limitReached, text, expectedTokens } = options

    switch (operation) {
        case 'getFileContents':
            // Mock file system read operations
            if (fileContents) {
                fileContents.forEach((content, index) => {
                    mocks.fileSystem.readFile.mockResolvedValueOnce(content)
                })
            }
            
            // Mock tokenizer calculations
            if (tokenCounts) {
                tokenCounts.forEach((count, index) => {
                    mocks.tokenizer.encode.mockReturnValueOnce(Array.from({ length: count }, (_, i) => i + 1))
                })
            }
            break

        case 'estimateTokens':
            // Mock tokenizer for token estimation
            if (expectedTokens) {
                mocks.tokenizer.encode.mockReturnValue(Array.from({ length: expectedTokens }, (_, i) => i + 1))
            }
            break
    }
}

export function setupFileContentProviderErrorScenario(
    mocks: CCPTestMocks,
    operation: 'readFile' | 'calculateTokens' | 'estimateTokens',
    errorMessage: string,
    options: FileContentProviderScenarioOptions
): void {
    switch (operation) {
        case 'readFile':
            mocks.fileSystem.readFile.mockRejectedValue(new Error(errorMessage))
            break

        case 'calculateTokens':
        case 'estimateTokens':
            mocks.tokenizer.encode.mockImplementation(() => {
                throw new Error(errorMessage)
            })
            break
    }
}

// Tokenizer Scenarios
export interface TokenizerScenarioOptions {
    operation: 'calculateTokens'
    text?: string | null | undefined
    expectedTokens?: number
    texts?: string[]
    expectedTokensArray?: number[]
}

export function setupTokenizerSuccessScenario(
    mocks: CCPTestMocks,
    options: TokenizerScenarioOptions
): void {
    const { operation, text, expectedTokens, texts, expectedTokensArray } = options

    switch (operation) {
        case 'calculateTokens':
            // Mock tokenizer encode for successful token calculation
            if (text !== null && text !== undefined && text !== '') {
                if (expectedTokens) {
                    mocks.tokenizer.encode.mockReturnValue(Array.from({ length: expectedTokens }, (_, i) => i + 1))
                }
            }
            
            // Handle multiple texts scenario
            if (texts && expectedTokensArray) {
                texts.forEach((_, index) => {
                    mocks.tokenizer.encode.mockReturnValueOnce(
                        Array.from({ length: expectedTokensArray[index] }, (_, i) => i + 1)
                    )
                })
            }
            break
    }
}

export function setupTokenizerErrorScenario(
    mocks: CCPTestMocks,
    operation: 'encode',
    errorMessage: string,
    options: TokenizerScenarioOptions
): void {
    switch (operation) {
        case 'encode':
            mocks.tokenizer.encode.mockImplementation(() => {
                throw new Error(errorMessage)
            })
            break
    }
}

// File Explorer Scenarios
export interface FileExplorerScenarioOptions {
    operation: 'getChildren' | 'getTreeItem' | 'refresh' | 'clearAllCheckboxes' | 'updateCheckboxState' | 'getCheckboxState' | 'getAllCheckedItems' | 'loadCheckedState' | 'getCoreScanIgnoreGlobs' | 'getContextExplorerIgnoreGlobs' | 'getContextExplorerHideChildrenGlobs' | 'getProjectTreeAlwaysShowGlobs' | 'getProjectTreeAlwaysHideGlobs' | 'getProjectTreeShowIfSelectedGlobs' | 'getFileGroupsConfig' | 'calculateTokenCount' | 'formatTokenCount' | 'loadConfigurationPatterns' | 'dispose'
    workspaceFolders?: any
    expectedChildren?: any[]
    entries?: any[]
    element?: any
    ignorePatterns?: string[]
    hideChildrenPatterns?: string[]
    checkboxState?: number
    tokenCount?: number
    isHidden?: boolean
    initialStates?: Map<string, number>
    uri?: string
    state?: number
    checkedItems?: string[]
    itemsToLoad?: any[]
    ignoreGlobs?: string[]
    alwaysShowGlobs?: string[]
    alwaysHideGlobs?: string[]
    showIfSelectedGlobs?: string[]
    fileGroupsConfig?: any
    content?: string
    expectedTokens?: number
    count?: number
    expected?: string
    yamlContent?: string | null
    expectedConfig?: any
    vscodeSettings?: any
    configFileExists?: boolean
}

export function setupFileExplorerSuccessScenario(
    mocks: CCPTestMocks,
    options: FileExplorerScenarioOptions
): void {
    const { 
        operation, 
        entries, 
        content, 
        expectedTokens, 
        count, 
        expected, 
        yamlContent, 
        expectedConfig, 
        vscodeSettings, 
        configFileExists,
        ignoreGlobs,
        alwaysShowGlobs,
        alwaysHideGlobs,
        showIfSelectedGlobs,
        hideChildrenGlobs,
        fileGroupsConfig
    } = options

    switch (operation) {
        case 'getChildren':
            if (entries) {
                mocks.fileSystem.readDirectory.mockResolvedValue(entries)
            }
            // Mock configuration loading that happens on first getChildren call
            mocks.fileSystem.readFile.mockResolvedValue('')
            mocks.yaml.load.mockReturnValue({})
            // Mock global micromatch for filtering
            vi.mocked(micromatch.isMatch).mockReturnValue(false)
            break

        case 'getTreeItem':
            // Mock token calculation
            if (expectedTokens) {
                mocks.tokenizer.calculateTokens.mockResolvedValue(expectedTokens)
            }
            // Mock global micromatch for filtering
            vi.mocked(micromatch.isMatch).mockReturnValue(false)
            break

        case 'refresh':
            if (yamlContent) {
                mocks.fileSystem.readFile.mockResolvedValue(yamlContent)
                mocks.yaml.load.mockReturnValue(expectedConfig)
            } else if (configFileExists === false) {
                mocks.fileSystem.readFile.mockRejectedValue(new Error('File not found'))
            }
            break

        case 'calculateTokenCount':
            if (content) {
                mocks.fileSystem.readFile.mockResolvedValue(content)
                // Use global gpt-tokenizer mock
                vi.mocked(encode).mockReturnValue(Array.from({ length: expectedTokens || 0 }, (_, i) => i + 1))
            } else {
                // For directory calculation
                mocks.fileSystem.stat.mockResolvedValue({ type: 'directory' })
                mocks.fileSystem.readDirectory.mockResolvedValue(entries || [])
                vi.mocked(encode).mockReturnValue(Array.from({ length: 100 }, (_, i) => i + 1)) // Default token count per file
            }
            break

        case 'formatTokenCount':
            // No specific mocking needed for formatting
            break

        case 'loadConfigurationPatterns':
            if (yamlContent) {
                mocks.fileSystem.readFile.mockResolvedValue(yamlContent)
                mocks.yaml.load.mockReturnValue(expectedConfig)
            } else if (vscodeSettings) {
                mocks.fileSystem.readFile.mockRejectedValue(new Error('File not found'))
            }
            break

        case 'getCoreScanIgnoreGlobs':
            // Mock the configuration data
            if (ignoreGlobs) {
                // This would need to be set up in the service's internal state
                // For now, we'll mock the file system to return the expected config
                mocks.fileSystem.readFile.mockResolvedValue(`
ContextCherryPicker:
  ignore: ${JSON.stringify(ignoreGlobs)}
`)
                mocks.yaml.load.mockReturnValue({
                    ContextCherryPicker: {
                        ignore: ignoreGlobs
                    }
                })
            }
            break

        case 'getContextExplorerIgnoreGlobs':
            if (ignoreGlobs) {
                mocks.fileSystem.readFile.mockResolvedValue(`
ContextCherryPicker:
  context_explorer:
    ignore: ${JSON.stringify(ignoreGlobs)}
`)
                mocks.yaml.load.mockReturnValue({
                    ContextCherryPicker: {
                        context_explorer: {
                            ignore: ignoreGlobs
                        }
                    }
                })
            }
            break

        case 'getContextExplorerHideChildrenGlobs':
            if (hideChildrenGlobs) {
                mocks.fileSystem.readFile.mockResolvedValue(`
ContextCherryPicker:
  context_explorer:
    hide_children: ${JSON.stringify(hideChildrenGlobs)}
`)
                mocks.yaml.load.mockReturnValue({
                    ContextCherryPicker: {
                        context_explorer: {
                            hide_children: hideChildrenGlobs
                        }
                    }
                })
            }
            break

        case 'getProjectTreeAlwaysShowGlobs':
            if (alwaysShowGlobs) {
                mocks.fileSystem.readFile.mockResolvedValue(`
ContextCherryPicker:
  project_tree:
    always_show: ${JSON.stringify(alwaysShowGlobs)}
`)
                mocks.yaml.load.mockReturnValue({
                    ContextCherryPicker: {
                        project_tree: {
                            always_show: alwaysShowGlobs
                        }
                    }
                })
            }
            break

        case 'getProjectTreeAlwaysHideGlobs':
            if (alwaysHideGlobs) {
                mocks.fileSystem.readFile.mockResolvedValue(`
ContextCherryPicker:
  project_tree:
    always_hide: ${JSON.stringify(alwaysHideGlobs)}
`)
                mocks.yaml.load.mockReturnValue({
                    ContextCherryPicker: {
                        project_tree: {
                            always_hide: alwaysHideGlobs
                        }
                    }
                })
            }
            break

        case 'getProjectTreeShowIfSelectedGlobs':
            if (showIfSelectedGlobs) {
                mocks.fileSystem.readFile.mockResolvedValue(`
ContextCherryPicker:
  project_tree:
    show_if_selected: ${JSON.stringify(showIfSelectedGlobs)}
`)
                mocks.yaml.load.mockReturnValue({
                    ContextCherryPicker: {
                        project_tree: {
                            show_if_selected: showIfSelectedGlobs
                        }
                    }
                })
            }
            break

        case 'getFileGroupsConfig':
            if (fileGroupsConfig) {
                mocks.fileSystem.readFile.mockResolvedValue(`
ContextCherryPicker:
  file_groups: ${JSON.stringify(fileGroupsConfig)}
`)
                mocks.yaml.load.mockReturnValue({
                    ContextCherryPicker: {
                        file_groups: fileGroupsConfig
                    }
                })
            }
            break
    }
}

export function setupFileExplorerErrorScenario(
    mocks: CCPTestMocks,
    operation: 'readDirectory' | 'calculateTokenCount',
    errorMessage: string,
    options: FileExplorerScenarioOptions
): void {
    switch (operation) {
        case 'readDirectory':
            mocks.fileSystem.readDirectory.mockRejectedValue(new Error(errorMessage))
            break

        case 'calculateTokenCount':
            mocks.fileSystem.stat.mockRejectedValue(new Error(errorMessage))
            break
    }
}

// File Utils Scenarios
export interface FileUtilsScenarioOptions {
    operation: 'formatFileSize'
    bytes: number
    expected: string
}

export function setupFileUtilsSuccessScenario(
    mocks: CCPTestMocks,
    options: FileUtilsScenarioOptions
): void {
    const { operation, bytes, expected } = options

    switch (operation) {
        case 'formatFileSize':
            // No specific mocking needed for file size formatting
            // This is a pure function that doesn't depend on external services
            break
    }
}

// Storage Scenarios
export interface StorageScenarioOptions {
    operation: 'saveState' | 'loadState' | 'loadAllSavedStates' | 'deleteState' | 'initializeStorage' | 'concurrentSave' | 'concurrentRead' | 'dataIntegrity'
    name?: string
    checkedItems?: any[]
    expectedStorageData?: any
    stateId?: string
    expectedItems?: any[]
    storageData?: any
    expectedStates?: any[]
    shouldDelete?: boolean
    needsInitialization?: boolean
    states?: any[]
}

export function setupStorageSuccessScenario(
    mocks: CCPTestMocks,
    options: StorageScenarioOptions
): void {
    const { operation, storageData, expectedStorageData, needsInitialization } = options

    switch (operation) {
        case 'saveState':
            if (expectedStorageData) {
                mocks.fileSystem.writeFile.mockResolvedValue(undefined)
            }
            break

        case 'loadState':
        case 'loadAllSavedStates':
            if (storageData) {
                mocks.fileSystem.readFile.mockResolvedValue(JSON.stringify(storageData))
            }
            break

        case 'deleteState':
            if (storageData) {
                mocks.fileSystem.readFile.mockResolvedValue(JSON.stringify(storageData))
                mocks.fileSystem.writeFile.mockResolvedValue(undefined)
            }
            break

        case 'initializeStorage':
            if (needsInitialization) {
                mocks.fileSystem.stat.mockRejectedValue(new Error('File not found'))
                mocks.fileSystem.createDirectory.mockResolvedValue(undefined)
                mocks.fileSystem.writeFile.mockResolvedValue(undefined)
            } else {
                mocks.fileSystem.stat.mockResolvedValue({ type: 'file' })
            }
            break

        case 'concurrentSave':
        case 'concurrentRead':
        case 'dataIntegrity':
            // Setup for concurrent operations
            mocks.fileSystem.readFile.mockResolvedValue('{}')
            mocks.fileSystem.writeFile.mockResolvedValue(undefined)
            break
    }
}

export function setupStorageErrorScenario(
    mocks: CCPTestMocks,
    operation: 'readFile' | 'writeFile' | 'initializeStorage',
    errorMessage: string,
    options: StorageScenarioOptions
): void {
    switch (operation) {
        case 'readFile':
            mocks.fileSystem.readFile.mockRejectedValue(new Error(errorMessage))
            break

        case 'writeFile':
            mocks.fileSystem.writeFile.mockRejectedValue(new Error(errorMessage))
            break

        case 'initializeStorage':
            mocks.fileSystem.stat.mockRejectedValue(new Error(errorMessage))
            mocks.fileSystem.createDirectory.mockRejectedValue(new Error(errorMessage))
            break
    }
}

// Tree Formatter Scenarios
export interface TreeFormatterScenarioOptions {
    operation: 'formatTree' | 'generateTreeString'
    rootNode?: any
    node?: any
    prefix?: string
    expectedOutput?: string
}

export function setupTreeFormatterSuccessScenario(
    mocks: CCPTestMocks,
    options: TreeFormatterScenarioOptions
): void {
    const { operation, rootNode, node, prefix, expectedOutput } = options

    switch (operation) {
        case 'formatTree':
        case 'generateTreeString':
            // No specific mocking needed for tree formatting
            // This is a pure function that doesn't depend on external services
            break
    }
}

// Quick Settings Scenarios
export interface QuickSettingsScenarioOptions {
    operation: 'initialize' | 'getSettingState' | 'updateSettingState' | 'refresh' | 'getHtml' | 'concurrentUpdates'
    configFileExists?: boolean
    configData?: any
    expectedSettings?: any
    settingId?: string
    expectedValue?: any
    newValue?: any
    shouldWriteToConfig?: boolean
    shouldFireEvent?: boolean
    initialConfig?: any
    updatedConfig?: any
    htmlTemplate?: string
    cspSource?: string
    nonce?: string
    hasWorkspaceFolders?: boolean
    settings?: any[]
}

export function setupQuickSettingsSuccessScenario(
    mocks: CCPTestMocks,
    options: QuickSettingsScenarioOptions
): void {
    const { operation, configData, htmlTemplate, hasWorkspaceFolders } = options

    switch (operation) {
        case 'initialize':
            if (configData) {
                mocks.fileSystem.readFile.mockResolvedValue('yaml content')
                mocks.yaml.load.mockReturnValue(configData)
            } else {
                mocks.fileSystem.readFile.mockRejectedValue(new Error('File not found'))
            }
            break

        case 'getSettingState':
            // No specific mocking needed for getting setting state
            break

        case 'updateSettingState':
            mocks.fileSystem.readFile.mockResolvedValue('{}')
            mocks.yaml.load.mockReturnValue({})
            mocks.yaml.dump.mockReturnValue('updated yaml')
            mocks.fileSystem.writeFile.mockResolvedValue(undefined)
            break

        case 'refresh':
            mocks.fileSystem.readFile.mockResolvedValue('yaml content')
            mocks.yaml.load.mockReturnValue(configData || {})
            break

        case 'getHtml':
            if (htmlTemplate) {
                mocks.fileSystem.readFile.mockResolvedValue(htmlTemplate)
            }
            mocks.yaml.load.mockReturnValue(configData || {})
            break

        case 'concurrentUpdates':
            mocks.fileSystem.readFile.mockResolvedValue('{}')
            mocks.yaml.load.mockReturnValue({})
            mocks.yaml.dump.mockReturnValue('updated yaml')
            mocks.fileSystem.writeFile.mockResolvedValue(undefined)
            break
    }
}

export function setupQuickSettingsErrorScenario(
    mocks: CCPTestMocks,
    operation: 'readFile' | 'writeFile' | 'yamlLoad',
    errorMessage: string,
    options: QuickSettingsScenarioOptions
): void {
    switch (operation) {
        case 'readFile':
            mocks.fileSystem.readFile.mockRejectedValue(new Error(errorMessage))
            break

        case 'writeFile':
            mocks.fileSystem.writeFile.mockRejectedValue(new Error(errorMessage))
            break

        case 'yamlLoad':
            mocks.yaml.load.mockImplementation(() => {
                throw new Error(errorMessage)
            })
            break
    }
}

// Saved States Scenarios
export interface SavedStatesScenarioOptions {
    operation: 'getTreeItem' | 'getChildren' | 'refresh' | 'dispose' | 'concurrentGetChildren'
    element?: any
    expectedChildren?: any[]
    savedStatesData?: any[]
    shouldFireEvent?: boolean
}

export function setupSavedStatesSuccessScenario(
    mocks: CCPTestMocks,
    options: SavedStatesScenarioOptions
): void {
    const { operation, savedStatesData } = options

    switch (operation) {
        case 'getTreeItem':
            // No specific mocking needed for getTreeItem
            break

        case 'getChildren':
        case 'concurrentGetChildren':
            if (savedStatesData) {
                // Mock the storage service loadAllSavedStates method
                // This would be set up in the test itself
            }
            break

        case 'refresh':
        case 'dispose':
            // No specific mocking needed for refresh/dispose
            break
    }
}

export function setupSavedStatesErrorScenario(
    mocks: CCPTestMocks,
    operation: 'loadAllSavedStates',
    errorMessage: string,
    options: SavedStatesScenarioOptions
): void {
    switch (operation) {
        case 'loadAllSavedStates':
            // Mock the storage service to throw error
            // This would be set up in the test itself
            break
    }
}

// Google GenAI Scenarios
export interface GoogleGenAiScenarioOptions {
    operation: 'countTokens' | 'concurrentCountTokens'
    text?: string
    texts?: string[]
    apiKey?: string
    apiKeyPath?: string
    expectedTokens?: number
    expectedTokensArray?: number[]
    errorResponse?: any
    invalidResponse?: any
    networkError?: Error
    rateLimitError?: any
    quotaError?: any
}

export function setupGoogleGenAiSuccessScenario(
    mocks: CCPTestMocks,
    options: GoogleGenAiScenarioOptions
): void {
    const { operation, text, apiKey, expectedTokens } = options

    switch (operation) {
        case 'countTokens':
            // Mock successful API response
            if (apiKey && expectedTokens !== undefined) {
                // This would be handled by the fetch mock in the test
            }
            break

        case 'concurrentCountTokens':
            // Mock multiple successful API responses
            // This would be handled by the fetch mock in the test
            break
    }
}

export function setupGoogleGenAiErrorScenario(
    mocks: CCPTestMocks,
    operation: 'missingApiKey' | 'apiError' | 'invalidResponse' | 'networkError' | 'timeout' | 'rateLimit' | 'quotaExceeded' | 'invalidInput',
    errorMessage: string,
    options: GoogleGenAiScenarioOptions
): void {
    switch (operation) {
        case 'missingApiKey':
            // Mock workspace.get to return null/undefined
            break

        case 'apiError':
        case 'invalidResponse':
        case 'networkError':
        case 'timeout':
        case 'rateLimit':
        case 'quotaExceeded':
        case 'invalidInput':
            // Mock fetch to reject or return error response
            break
    }
}

export function createCCPMockBuilder(mocks: CCPTestMocks): CCPMockBuilder {
    return new CCPMockBuilder(mocks)
}
