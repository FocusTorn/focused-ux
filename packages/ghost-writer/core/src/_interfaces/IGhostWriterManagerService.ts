import type { IConsoleLoggerService, ConsoleLoggerGenerateOptions, ConsoleLoggerResult } from './IConsoleLoggerService.js'
import type { IClipboardService, StoredFragment } from './IClipboardService.js'
import type { IImportGeneratorService } from './IImportGeneratorService.js'

export interface IGhostWriterManagerService {
	/**
	 * Generate console.log statement for selected variable
	 * @param options - Console logger generation options
	 */
	generateConsoleLog: (options: ConsoleLoggerGenerateOptions) => ConsoleLoggerResult | undefined

	/**
	 * Store code fragment in clipboard
	 * @param fragment - Code fragment to store
	 */
	storeFragment: (fragment: StoredFragment) => Promise<void>

	/**
	 * Retrieve stored code fragment from clipboard
	 */
	retrieveFragment: () => Promise<StoredFragment | undefined>

	/**
	 * Clear stored code fragment from clipboard
	 */
	clearFragment: () => Promise<void>

	/**
	 * Generate import statement for stored fragment
	 * @param currentFilePath - Current file path for relative import calculation
	 * @param fragment - Code fragment to generate import for
	 */
	generateImport: (currentFilePath: string, fragment: StoredFragment) => string | undefined

	/**
	 * Complex orchestration: Generate console log and store fragment in one operation
	 * @param options - Console logger generation options
	 */
	generateAndStoreConsoleLog: (options: ConsoleLoggerGenerateOptions) => Promise<ConsoleLoggerResult>

	/**
	 * Complex orchestration: Retrieve fragment and generate import statement
	 * @param currentFilePath - Current file path for relative import calculation
	 */
	retrieveAndGenerateImport: (currentFilePath: string) => Promise<string>

	/**
	 * Complex orchestration: Complete workflow - generate console log, store fragment, and generate import
	 * @param consoleLogOptions - Console logger generation options
	 * @param currentFilePath - Current file path for relative import calculation
	 */
	completeCodeGenerationWorkflow: (
		consoleLogOptions: ConsoleLoggerGenerateOptions,
		currentFilePath: string
	) => Promise<{ consoleLog: ConsoleLoggerResult; importStatement: string }>
}

export interface IGhostWriterDependencies {
	consoleLogger: IConsoleLoggerService
	clipboard: IClipboardService
	importGenerator: IImportGeneratorService
}

// Re-export types from other interfaces for convenience
export type { ConsoleLoggerGenerateOptions, ConsoleLoggerResult } from './IConsoleLoggerService.js'
export type { StoredFragment } from './IClipboardService.js'
