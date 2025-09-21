import { vi } from 'vitest'
import { CCPTestMocks } from './helpers'

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

// Enhanced CCP Mock Builder
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

    ccpManager(options: CCPManagerScenarioOptions): CCPMockBuilder {
        setupCCPManagerSuccessScenario(this.mocks, options)
        return this
    }

    ccpManagerError(
        operation: 'saveState' | 'deleteState' | 'loadState' | 'copyContext',
        errorMessage: string,
        options: CCPManagerScenarioOptions
    ): CCPMockBuilder {
        setupCCPManagerErrorScenario(this.mocks, operation, errorMessage, options)
        return this
    }

    contextFormatting(options: ContextFormattingScenarioOptions): CCPMockBuilder {
        setupContextFormattingSuccessScenario(this.mocks, options)
        return this
    }

    contextFormattingError(
        operation: 'generateTree' | 'buildInternalTree' | 'transformToFormatterTree',
        errorMessage: string,
        options: ContextFormattingScenarioOptions
    ): CCPMockBuilder {
        setupContextFormattingErrorScenario(this.mocks, operation, errorMessage, options)
        return this
    }

    fileContentProvider(options: FileContentProviderScenarioOptions): CCPMockBuilder {
        setupFileContentProviderSuccessScenario(this.mocks, options)
        return this
    }

    fileContentProviderError(
        operation: 'readFile' | 'calculateTokens' | 'estimateTokens',
        errorMessage: string,
        options: FileContentProviderScenarioOptions
    ): CCPMockBuilder {
        setupFileContentProviderErrorScenario(this.mocks, operation, errorMessage, options)
        return this
    }

    tokenizer(options: TokenizerScenarioOptions): CCPMockBuilder {
        setupTokenizerSuccessScenario(this.mocks, options)
        return this
    }

    tokenizerError(
        operation: 'encode',
        errorMessage: string,
        options: TokenizerScenarioOptions
    ): CCPMockBuilder {
        setupTokenizerErrorScenario(this.mocks, operation, errorMessage, options)
        return this
    }

    build(): CCPTestMocks {
        return this.mocks
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

export function createCCPMockBuilder(mocks: CCPTestMocks): CCPMockBuilder {
    return new CCPMockBuilder(mocks)
}
