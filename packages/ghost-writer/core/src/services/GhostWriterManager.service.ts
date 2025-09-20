import type {
    IGhostWriterManagerService,
    IGhostWriterDependencies,
    ConsoleLoggerGenerateOptions,
    ConsoleLoggerResult,
    StoredFragment
} from '../_interfaces/IGhostWriterManagerService.js'
import { ERROR_MESSAGES, SUCCESS_MESSAGES } from '../_config/constants.js'

export class GhostWriterManagerService implements IGhostWriterManagerService {

    constructor(private readonly dependencies: IGhostWriterDependencies) {}

    generateConsoleLog(options: ConsoleLoggerGenerateOptions): ConsoleLoggerResult | undefined {
        try {
            // Validate input parameters
            this.validateConsoleLogOptions(options)
			
            // Generate console log statement
            const result = this.dependencies.consoleLogger.generate(options)
			
            if (!result) {
                throw new Error(ERROR_MESSAGES.CONSOLE_LOG_GENERATION_FAILED)
            }
			
            return result
        } catch (error: any) {
            throw new Error(`${ERROR_MESSAGES.CONSOLE_LOG_GENERATION_FAILED}: ${error.message}`)
        }
    }

    async storeFragment(fragment: StoredFragment): Promise<void> {
        try {
            // Validate fragment data
            this.validateStoredFragment(fragment)
			
            // Store fragment with error handling
            await this.dependencies.clipboard.store(fragment)
        } catch (error: any) {
            throw new Error(`${ERROR_MESSAGES.STORAGE_OPERATION_FAILED}: ${error.message}`)
        }
    }

    async retrieveFragment(): Promise<StoredFragment | undefined> {
        try {
            const fragment = await this.dependencies.clipboard.retrieve()

            return fragment
        } catch (error: any) {
            throw new Error(`${ERROR_MESSAGES.STORAGE_OPERATION_FAILED}: ${error.message}`)
        }
    }

    async clearFragment(): Promise<void> {
        try {
            await this.dependencies.clipboard.clear()
        } catch (error: any) {
            throw new Error(`${ERROR_MESSAGES.STORAGE_OPERATION_FAILED}: ${error.message}`)
        }
    }

    generateImport(currentFilePath: string, fragment: StoredFragment): string | undefined {
        try {
            // Validate input parameters
            this.validateImportParameters(currentFilePath, fragment)
			
            // Generate import statement
            const importStatement = this.dependencies.importGenerator.generate(currentFilePath, fragment)
			
            if (!importStatement) {
                throw new Error(ERROR_MESSAGES.IMPORT_GENERATION_FAILED)
            }
			
            return importStatement
        } catch (error: any) {
            throw new Error(`${ERROR_MESSAGES.IMPORT_GENERATION_FAILED}: ${error.message}`)
        }
    }

    /**
	 * Complex orchestration: Generate console log and store fragment in one operation
	 */
    async generateAndStoreConsoleLog(options: ConsoleLoggerGenerateOptions): Promise<ConsoleLoggerResult> {
        try {
            // Step 1: Generate console log statement
            const consoleLogResult = this.generateConsoleLog(options)
			
            if (!consoleLogResult) {
                throw new Error(ERROR_MESSAGES.CONSOLE_LOG_GENERATION_FAILED)
            }
			
            // Step 2: Create fragment from console log result
            const fragment: StoredFragment = {
                text: options.selectedVar,
                sourceFilePath: options.fileName,
                timestamp: new Date().toISOString(),
                metadata: {
                    lineNumber: options.selectionLine,
                    includeClassName: options.includeClassName,
                    includeFunctionName: options.includeFunctionName,
                    logStatement: consoleLogResult.logStatement,
                    insertLine: consoleLogResult.insertLine
                }
            }
			
            // Step 3: Store fragment for future import generation
            await this.storeFragment(fragment)
			
            return consoleLogResult
        } catch (error: any) {
            throw new Error(`Failed to generate and store console log: ${error.message}`)
        }
    }

    /**
	 * Complex orchestration: Retrieve fragment and generate import statement
	 */
    async retrieveAndGenerateImport(currentFilePath: string): Promise<string> {
        try {
            // Step 1: Retrieve stored fragment
            const fragment = await this.retrieveFragment()
			
            if (!fragment) {
                throw new Error(ERROR_MESSAGES.FRAGMENT_NOT_FOUND)
            }
			
            // Step 2: Generate import statement
            const importStatement = this.generateImport(currentFilePath, fragment)
			
            if (!importStatement) {
                throw new Error(ERROR_MESSAGES.IMPORT_GENERATION_FAILED)
            }
			
            return importStatement
        } catch (error: any) {
            throw new Error(`Failed to retrieve and generate import: ${error.message}`)
        }
    }

    /**
	 * Complex orchestration: Complete workflow - generate console log, store fragment, and generate import
	 */
    async completeCodeGenerationWorkflow(
        consoleLogOptions: ConsoleLoggerGenerateOptions,
        currentFilePath: string
    ): Promise<{ consoleLog: ConsoleLoggerResult; importStatement: string }> {
        try {
            // Step 1: Generate and store console log
            const consoleLogResult = await this.generateAndStoreConsoleLog(consoleLogOptions)
			
            // Step 2: Generate import statement from stored fragment
            const importStatement = await this.retrieveAndGenerateImport(currentFilePath)
			
            return {
                consoleLog: consoleLogResult,
                importStatement
            }
        } catch (error: any) {
            throw new Error(`Complete code generation workflow failed: ${error.message}`)
        }
    }

    // Private validation methods
    private validateConsoleLogOptions(options: ConsoleLoggerGenerateOptions): void {
        if (!options) {
            throw new Error(ERROR_MESSAGES.MISSING_REQUIRED_PARAMETER)
        }
		
        if (!options.selectedVar?.trim()) {
            throw new Error(ERROR_MESSAGES.INVALID_INPUT)
        }
		
        if (!options.fileName?.trim()) {
            throw new Error(ERROR_MESSAGES.INVALID_FILE_PATH)
        }
		
        if (typeof options.selectionLine !== 'number' || options.selectionLine < 0) {
            throw new Error(ERROR_MESSAGES.INVALID_INPUT)
        }
    }

    private validateStoredFragment(fragment: StoredFragment): void {
        if (!fragment) {
            throw new Error(ERROR_MESSAGES.MISSING_REQUIRED_PARAMETER)
        }
		
        if (!fragment.text?.trim()) {
            throw new Error(ERROR_MESSAGES.INVALID_INPUT)
        }
		
        if (!fragment.sourceFilePath?.trim()) {
            throw new Error(ERROR_MESSAGES.INVALID_FILE_PATH)
        }
    }

    private validateImportParameters(currentFilePath: string, fragment: StoredFragment): void {
        if (!currentFilePath?.trim()) {
            throw new Error(ERROR_MESSAGES.INVALID_FILE_PATH)
        }
		
        this.validateStoredFragment(fragment)
    }

}
