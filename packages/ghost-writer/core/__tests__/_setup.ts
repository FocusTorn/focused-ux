import { beforeEach, afterEach, vi } from 'vitest'
import type { IStorageService } from '../../src/_interfaces/IStorageService.js'
import type { IPathUtilsService, ICommonUtilsService } from '../../src/_interfaces/IUtilServices.js'
import type { StoredFragment } from '../../src/_interfaces/IClipboardService.js'

// Global test setup for ghost-writer core package
beforeEach(() => {
	// Clear any test state
})

afterEach(() => {
	// Cleanup after each test
})

// ============================================================================
// Ghost Writer Core Mock Scenarios
// ============================================================================

/**
 * Enhanced mock strategy for Ghost Writer Core package
 * Provides reusable mock scenarios for common testing patterns
 */

export interface TestMocks {
	storage: IStorageService
	pathUtils: IPathUtilsService
	commonUtils: ICommonUtilsService
}

export interface StorageScenarioOptions {
	key: string
	value?: any
	shouldSucceed?: boolean
	errorMessage?: string
}

export interface PathUtilsScenarioOptions {
	fromPath: string
	toPath: string
	expectedPath?: string
	shouldSucceed?: boolean
}

export interface ClipboardScenarioOptions {
	fragment: StoredFragment
	shouldExist?: boolean
}

export interface ImportGeneratorScenarioOptions {
	currentFilePath: string
	fragment: StoredFragment
	expectedImport?: string
	shouldSucceed?: boolean
}

export interface ConsoleLoggerScenarioOptions {
	documentContent: string
	fileName: string
	selectedVar: string
	selectionLine: number
	includeClassName?: boolean
	includeFunctionName?: boolean
	expectedLogStatement?: string
	expectedInsertLine?: number
}

// Storage Service Scenarios
export function setupStorageSuccessScenario(mocks: TestMocks, options: StorageScenarioOptions): void {
	const { key, value } = options
	
	mocks.storage.update = vi.fn().mockResolvedValue(undefined)
	mocks.storage.get = vi.fn().mockResolvedValue(value)
}

export function setupStorageErrorScenario(mocks: TestMocks, options: StorageScenarioOptions): void {
	const { errorMessage = 'Storage error' } = options
	
	mocks.storage.update = vi.fn().mockRejectedValue(new Error(errorMessage))
	mocks.storage.get = vi.fn().mockRejectedValue(new Error(errorMessage))
}

// Path Utils Scenarios
export function setupPathUtilsSuccessScenario(mocks: TestMocks, options: PathUtilsScenarioOptions): void {
	const { fromPath, toPath, expectedPath } = options
	
	mocks.pathUtils.getDottedPath = vi.fn().mockReturnValue(expectedPath)
}

export function setupPathUtilsFailureScenario(mocks: TestMocks, options: PathUtilsScenarioOptions): void {
	const { fromPath, toPath } = options
	
	mocks.pathUtils.getDottedPath = vi.fn().mockReturnValue(undefined)
}

// Common Utils Scenarios
export function setupCommonUtilsScenario(mocks: TestMocks): void {
	mocks.commonUtils.errMsg = vi.fn()
}

// Clipboard Service Scenarios
export function setupClipboardStoreScenario(mocks: TestMocks, options: ClipboardScenarioOptions): void {
	const { fragment } = options
	
	setupStorageSuccessScenario(mocks, { key: 'fux-ghost-writer.clipboard', value: fragment })
}

export function setupClipboardRetrieveScenario(mocks: TestMocks, options: ClipboardScenarioOptions): void {
	const { fragment, shouldExist = true } = options
	
	setupStorageSuccessScenario(mocks, { 
		key: 'fux-ghost-writer.clipboard', 
		value: shouldExist ? fragment : undefined 
	})
}

export function setupClipboardClearScenario(mocks: TestMocks): void {
	setupStorageSuccessScenario(mocks, { key: 'fux-ghost-writer.clipboard', value: undefined })
}

// Import Generator Scenarios
export function setupImportGeneratorSuccessScenario(mocks: TestMocks, options: ImportGeneratorScenarioOptions): void {
	const { currentFilePath, fragment, expectedImport } = options
	const { sourceFilePath } = fragment
	
	// Setup path utils to return a valid path
	const relativePath = expectedImport ? expectedImport.replace(/import \{ .* \} from '(.+)\.js'\n/, '$1') : './component'
	setupPathUtilsSuccessScenario(mocks, { 
		fromPath: sourceFilePath, 
		toPath: currentFilePath, 
		expectedPath: relativePath 
	})
	setupCommonUtilsScenario(mocks)
}

export function setupImportGeneratorFailureScenario(mocks: TestMocks, options: ImportGeneratorScenarioOptions): void {
	const { currentFilePath, fragment } = options
	const { sourceFilePath } = fragment
	
	// Setup path utils to fail
	setupPathUtilsFailureScenario(mocks, { 
		fromPath: sourceFilePath, 
		toPath: currentFilePath 
	})
	setupCommonUtilsScenario(mocks)
}

// Console Logger Scenarios
export function setupConsoleLoggerScenario(mocks: TestMocks, options: ConsoleLoggerScenarioOptions): void {
	// Console logger doesn't use external dependencies, so we just need the options
	// The actual testing will be done on the service directly
}

// Error Scenarios
export function setupStorageErrorByTypeScenario(mocks: TestMocks, errorType: 'update' | 'get' | 'both', errorMessage: string): void {
	switch (errorType) {
		case 'update':
			mocks.storage.update = vi.fn().mockRejectedValue(new Error(errorMessage))
			break
		case 'get':
			mocks.storage.get = vi.fn().mockRejectedValue(new Error(errorMessage))
			break
		case 'both':
			mocks.storage.update = vi.fn().mockRejectedValue(new Error(errorMessage))
			mocks.storage.get = vi.fn().mockRejectedValue(new Error(errorMessage))
			break
	}
}

// ============================================================================
// Ghost Writer Core Mock Builder Pattern
// ============================================================================

export class GhostWriterMockBuilder {
	constructor(private mocks: TestMocks) {}

	storage(options: StorageScenarioOptions): GhostWriterMockBuilder {
		if (options.shouldSucceed !== false) {
			setupStorageSuccessScenario(this.mocks, options)
		} else {
			setupStorageErrorScenario(this.mocks, options)
		}
		return this
	}

	pathUtils(options: PathUtilsScenarioOptions): GhostWriterMockBuilder {
		if (options.shouldSucceed !== false) {
			setupPathUtilsSuccessScenario(this.mocks, options)
		} else {
			setupPathUtilsFailureScenario(this.mocks, options)
		}
		return this
	}

	commonUtils(): GhostWriterMockBuilder {
		setupCommonUtilsScenario(this.mocks)
		return this
	}

	clipboardStore(options: ClipboardScenarioOptions): GhostWriterMockBuilder {
		setupClipboardStoreScenario(this.mocks, options)
		return this
	}

	clipboardRetrieve(options: ClipboardScenarioOptions): GhostWriterMockBuilder {
		setupClipboardRetrieveScenario(this.mocks, options)
		return this
	}

	clipboardClear(): GhostWriterMockBuilder {
		setupClipboardClearScenario(this.mocks)
		return this
	}

	importGenerator(options: ImportGeneratorScenarioOptions): GhostWriterMockBuilder {
		if (options.shouldSucceed !== false) {
			setupImportGeneratorSuccessScenario(this.mocks, options)
		} else {
			setupImportGeneratorFailureScenario(this.mocks, options)
		}
		return this
	}

	consoleLogger(options: ConsoleLoggerScenarioOptions): GhostWriterMockBuilder {
		setupConsoleLoggerScenario(this.mocks, options)
		return this
	}

	error(errorType: 'storage' | 'pathUtils', errorMessage: string): GhostWriterMockBuilder {
		if (errorType === 'storage') {
			setupStorageErrorByTypeScenario(this.mocks, 'both', errorMessage)
		}
		return this
	}

	build(): TestMocks {
		return this.mocks
	}
}

export function createGhostWriterMockBuilder(mocks: TestMocks): GhostWriterMockBuilder {
	return new GhostWriterMockBuilder(mocks)
}

// ============================================================================
// Mock Factory Functions
// ============================================================================

export function createMockStorageService(): IStorageService {
	return {
		update: vi.fn().mockResolvedValue(undefined),
		get: vi.fn().mockResolvedValue(undefined),
	}
}

export function createMockPathUtilsService(): IPathUtilsService {
	return {
		getDottedPath: vi.fn().mockReturnValue('./component'),
	}
}

export function createMockCommonUtilsService(): ICommonUtilsService {
	return {
		errMsg: vi.fn(),
	}
}

export function createMockTestEnvironment(): TestMocks {
	return {
		storage: createMockStorageService(),
		pathUtils: createMockPathUtilsService(),
		commonUtils: createMockCommonUtilsService(),
	}
}

export function resetAllMocks(mocks: TestMocks): void {
	vi.clearAllMocks()
	mocks.storage.update.mockReset()
	mocks.storage.get.mockReset()
	mocks.pathUtils.getDottedPath.mockReset()
	mocks.commonUtils.errMsg.mockReset()
}
