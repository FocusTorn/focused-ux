#!/usr/bin/env node

import { promises as fs } from 'fs'
import path from 'path'
import { assetConstants } from '../src/_config/dynamicons.constants.js'
import stripJsonComments from 'strip-json-comments'

/**
 * Error Types for Asset Generation Workflow
 */
export enum ErrorType {
	// Input Validation Errors
	INVALID_EXTERNAL_SOURCE = 'INVALID_EXTERNAL_SOURCE',
	INVALID_FILE_TYPE = 'INVALID_FILE_TYPE',
	INVALID_MODEL_FORMAT = 'INVALID_MODEL_FORMAT',
	MISSING_REQUIRED_FILES = 'MISSING_REQUIRED_FILES',
	
	// File System Errors
	FILE_NOT_FOUND = 'FILE_NOT_FOUND',
	DIRECTORY_NOT_FOUND = 'DIRECTORY_NOT_FOUND',
	PERMISSION_DENIED = 'PERMISSION_DENIED',
	DISK_SPACE_INSUFFICIENT = 'DISK_SPACE_INSUFFICIENT',
	
	// Processing Errors
	OPTIMIZATION_FAILED = 'OPTIMIZATION_FAILED',
	THEME_GENERATION_FAILED = 'THEME_GENERATION_FAILED',
	MODEL_VALIDATION_FAILED = 'MODEL_VALIDATION_FAILED',
	PREVIEW_GENERATION_FAILED = 'PREVIEW_GENERATION_FAILED',
	
	// Rollback Errors
	ROLLBACK_FAILED = 'ROLLBACK_FAILED',
	BACKUP_FAILED = 'BACKUP_FAILED',
	
	// System Errors
	MEMORY_ERROR = 'MEMORY_ERROR',
	TIMEOUT_ERROR = 'TIMEOUT_ERROR',
	UNKNOWN_ERROR = 'UNKNOWN_ERROR',
}

/**
 * Error Severity Levels
 */
export enum ErrorSeverity {
	LOW = 'LOW',
	MEDIUM = 'MEDIUM',
	HIGH = 'HIGH',
	CRITICAL = 'CRITICAL',
}

/**
 * Error Context Information
 */
export interface ErrorContext {
	operation: string
	filePath?: string
	lineNumber?: number
	timestamp: Date
	userAgent?: string
	processId: number
	workingDirectory: string
}

/**
 * Asset Generation Error Class
 */
export class AssetGenerationError extends Error {

	public readonly type: ErrorType
	public readonly severity: ErrorSeverity
	public readonly context: ErrorContext
	public readonly originalError?: Error
	public readonly recoverable: boolean

	constructor(
		message: string,
		type: ErrorType,
		severity: ErrorSeverity,
		context: ErrorContext,
		originalError?: Error,
		recoverable: boolean = false,
	) {
		super(message)
		this.name = 'AssetGenerationError'
		this.type = type
		this.severity = severity
		this.context = context
		this.originalError = originalError
		this.recoverable = recoverable
	}

	/**
	 * Format error for display
	 */
	formatForDisplay(): string {
		const severityColor = this.getSeverityColor()
		const typeColor = '\x1B[36m' // Cyan
		const reset = '\x1B[0m'
		
		return `${severityColor}❌ ${this.message}${reset}\n`
		  + `${typeColor}Type: ${this.type}${reset}\n`
		  + `${typeColor}Severity: ${this.severity}${reset}\n`
		  + `${typeColor}Operation: ${this.context.operation}${reset}\n`
		  + `${this.context.filePath ? `${typeColor}File: ${this.context.filePath}${reset}\n` : ''
		  }${this.originalError ? `${typeColor}Original: ${this.originalError.message}${reset}\n` : ''}`
	}

	private getSeverityColor(): string {
		switch (this.severity) {
			case ErrorSeverity.LOW: return '\x1B[33m' // Yellow
			case ErrorSeverity.MEDIUM: return '\x1B[35m' // Magenta
			case ErrorSeverity.HIGH: return '\x1B[31m' // Red
			case ErrorSeverity.CRITICAL: return '\x1B[41m\x1B[37m' // Red background, white text
			default: return '\x1B[31m' // Red
		}
	}

}

/**
 * Error Handler Class
 */
export class ErrorHandler {

	private static instance: ErrorHandler
	private errorLog: AssetGenerationError[] = []
	private backupPaths: Map<string, string> = new Map()

	private constructor() {}

	public static getInstance(): ErrorHandler {
		if (!ErrorHandler.instance) {
			ErrorHandler.instance = new ErrorHandler()
		}
		return ErrorHandler.instance
	}

	/**
	 * Create and log an error
	 */
	public createError(
		message: string,
		type: ErrorType,
		severity: ErrorSeverity,
		operation: string,
		originalError?: Error,
		recoverable: boolean = false,
		filePath?: string,
	): AssetGenerationError {
		const context: ErrorContext = {
			operation,
			filePath,
			timestamp: new Date(),
			processId: process.pid,
			workingDirectory: process.cwd(),
		}

		const error = new AssetGenerationError(
			message,
			type,
			severity,
			context,
			originalError,
			recoverable,
		)

		this.errorLog.push(error)
		return error
	}

	/**
	 * Handle an error with appropriate response
	 */
	public async handleError(error: AssetGenerationError, verbose: boolean = false): Promise<void> {
		// Log the error
		if (verbose) {
			console.error(error.formatForDisplay())
		} else {
			console.error(`❌ ${error.message}`)
		}

		// Handle based on severity
		switch (error.severity) {
			case ErrorSeverity.CRITICAL:
				await this.handleCriticalError(error)
				break
			case ErrorSeverity.HIGH:
				await this.handleHighSeverityError(error)
				break
			case ErrorSeverity.MEDIUM:
				await this.handleMediumSeverityError(error)
				break
			case ErrorSeverity.LOW:
				await this.handleLowSeverityError(error)
				break
		}
	}

	/**
	 * Handle critical errors - immediate exit
	 */
	private async handleCriticalError(_error: AssetGenerationError): Promise<void> {
		console.error('\x1B[41m\x1B[37mCRITICAL ERROR - TERMINATING PROCESS\x1B[0m')
		await this.attemptRollback()
		process.exit(1)
	}

	/**
	 * Handle high severity errors - attempt recovery
	 */
	private async handleHighSeverityError(error: AssetGenerationError): Promise<void> {
		if (error.recoverable) {
			console.error('\x1B[31mAttempting recovery...\x1B[0m')
			await this.attemptRollback()
		} else {
			console.error('\x1B[31mNon-recoverable error - terminating process\x1B[0m')
			process.exit(1)
		}
	}

	/**
	 * Handle medium severity errors - continue with warnings
	 */
	private async handleMediumSeverityError(_error: AssetGenerationError): Promise<void> {
		console.error('\x1B[35mWarning: Continuing with potential issues\x1B[0m')
		// Continue execution but log the warning
	}

	/**
	 * Handle low severity errors - log and continue
	 */
	private async handleLowSeverityError(_error: AssetGenerationError): Promise<void> {
		console.error('\x1B[33mNote: Minor issue detected, continuing\x1B[0m')
		// Continue execution normally
	}

	/**
	 * Attempt rollback of operations
	 */
	private async attemptRollback(): Promise<void> {
		console.error('\x1B[33m🔄 Attempting rollback...\x1B[0m')
		
		try {
			for (const [originalPath, backupPath] of this.backupPaths) {
				try {
					await fs.copyFile(backupPath, originalPath)
					console.error(`\x1B[32m✅ Restored: ${originalPath}\x1B[0m`)
				} catch (_restoreError) {
					console.error(`\x1B[31m❌ Failed to restore: ${originalPath}\x1B[0m`)
				}
			}
		} catch (_rollbackError) {
			console.error('\x1B[31m❌ Rollback failed\x1B[0m')
		}
	}

	/**
	 * Create backup before modification
	 */
	public async createBackup(filePath: string): Promise<void> {
		try {
			const backupPath = `${filePath}.backup.${Date.now()}`

			await fs.copyFile(filePath, backupPath)
			this.backupPaths.set(filePath, backupPath)
		} catch (error) {
			const backupError = this.createError(
				`Failed to create backup for ${filePath}`,
				ErrorType.BACKUP_FAILED,
				ErrorSeverity.MEDIUM,
				'createBackup',
				error instanceof Error ? error : undefined,
				true,
				filePath,
			)

			await this.handleError(backupError)
		}
	}

	/**
	 * Validate external source
	 */
	public async validateExternalSource(): Promise<boolean> {
		try {
			await fs.access(assetConstants.externalIconSource)
			return true
		} catch (error) {
			const validationError = this.createError(
				`External source not accessible: ${assetConstants.externalIconSource}`,
				ErrorType.INVALID_EXTERNAL_SOURCE,
				ErrorSeverity.MEDIUM,
				'validateExternalSource',
				error instanceof Error ? error : undefined,
				true,
			)

			await this.handleError(validationError)
			return false
		}
	}

	/**
	 * Validate file type
	 */
	public validateFileType(filePath: string): boolean {
		const ext = path.extname(filePath).toLowerCase()
		const isValid = assetConstants.fileTypes.allowed.includes(ext as '.svg')
		
		if (!isValid) {
			const validationError = this.createError(
				`Invalid file type: ${ext}`,
				ErrorType.INVALID_FILE_TYPE,
				ErrorSeverity.LOW,
				'validateFileType',
				undefined,
				true,
				filePath,
			)

			this.handleError(validationError)
		}
		
		return isValid
	}

	/**
	 * Validate required directories exist
	 */
	public async validateRequiredDirectories(): Promise<boolean> {
		const requiredDirs = [
			assetConstants.paths.newIconsDir,
			assetConstants.paths.fileIconsDir,
			assetConstants.paths.folderIconsDir,
			assetConstants.paths.distThemesDir,
		]

		for (const dir of requiredDirs) {
			try {
				await fs.access(dir)
			} catch (error) {
				const validationError = this.createError(
					`Required directory not found: ${dir}`,
					ErrorType.DIRECTORY_NOT_FOUND,
					ErrorSeverity.HIGH,
					'validateRequiredDirectories',
					error instanceof Error ? error : undefined,
					false,
				)

				await this.handleError(validationError)
				return false
			}
		}
		
		return true
	}

	/**
	 * Check disk space
	 */
	public async checkDiskSpace(): Promise<boolean> {
		try {
			const _stats = await fs.stat(assetConstants.paths.newIconsDir)

			// This is a simplified check - in production you'd want to check actual available space
			return true
		} catch (error) {
			const diskError = this.createError(
				'Insufficient disk space',
				ErrorType.DISK_SPACE_INSUFFICIENT,
				ErrorSeverity.HIGH,
				'checkDiskSpace',
				error instanceof Error ? error : undefined,
				false,
			)

			await this.handleError(diskError)
			return false
		}
	}

	/**
	 * Get error summary
	 */
	public getErrorSummary(): {
		total: number
		bySeverity: Record<ErrorSeverity, number>
		byType: Record<ErrorType, number>
	} {
		const bySeverity: Record<ErrorSeverity, number> = {
			[ErrorSeverity.LOW]: 0,
			[ErrorSeverity.MEDIUM]: 0,
			[ErrorSeverity.HIGH]: 0,
			[ErrorSeverity.CRITICAL]: 0,
		}

		const byType: Record<ErrorType, number> = {} as Record<ErrorType, number>
		
		for (const error of this.errorLog) {
			bySeverity[error.severity]++
			byType[error.type] = (byType[error.type] || 0) + 1
		}

		return {
			total: this.errorLog.length,
			bySeverity,
			byType,
		}
	}

	/**
	 * Clear error log
	 */
	public clearErrorLog(): void {
		this.errorLog = []
		this.backupPaths.clear()
	}

	/**
	 * Export error log for debugging
	 */
	public exportErrorLog(): string {
		return JSON.stringify({
			timestamp: new Date().toISOString(),
			errors: this.errorLog.map(error => ({
				message: error.message,
				type: error.type,
				severity: error.severity,
				context: error.context,
				recoverable: error.recoverable,
			})),
		}, null, 2)
	}

}

/**
 * Input Validator Class
 */
export class InputValidator {

	private errorHandler: ErrorHandler

	constructor() {
		this.errorHandler = ErrorHandler.getInstance()
	}

	/**
	 * Validate all inputs before processing
	 */
	public async validateAllInputs(): Promise<boolean> {
		const validations = [
			this.validateExternalSource(),
			this.validateRequiredDirectories(),
			this.checkDiskSpace(),
		]

		const results = await Promise.all(validations)

		return results.every(result => result === true)
	}

	/**
	 * Validate external source
	 */
	private async validateExternalSource(): Promise<boolean> {
		return await this.errorHandler.validateExternalSource()
	}

	/**
	 * Validate required directories
	 */
	private async validateRequiredDirectories(): Promise<boolean> {
		return await this.errorHandler.validateRequiredDirectories()
	}

	/**
	 * Check disk space
	 */
	private async checkDiskSpace(): Promise<boolean> {
		return await this.errorHandler.checkDiskSpace()
	}

	/**
	 * Validate model files
	 */
	public async validateModelFiles(): Promise<boolean> {
		const modelFiles = [
			'file_icons.model.json',
			'folder_icons.model.json',
			'language_icons.model.json',
		]

		for (const modelFile of modelFiles) {
			const modelPath = path.join(assetConstants.paths.modelsDir, modelFile)

			try {
				await fs.access(modelPath)

				const content = await fs.readFile(modelPath, 'utf-8')
				const strippedContent = stripJsonComments(content)

				JSON.parse(strippedContent) // Validate JSON format
			} catch (error) {
				const validationError = this.errorHandler.createError(
					`Invalid model file: ${modelFile}`,
					ErrorType.INVALID_MODEL_FORMAT,
					ErrorSeverity.HIGH,
					'validateModelFiles',
					error instanceof Error ? error : undefined,
					false,
					modelPath,
				)

				await this.errorHandler.handleError(validationError)
				return false
			}
		}

		return true
	}

}

/**
 * Rollback Manager Class
 */
export class RollbackManager {

	private errorHandler: ErrorHandler
	private operations: Array<{
		operation: string
		rollbackFn: () => Promise<void>
		description: string
	}> = []

	constructor() {
		this.errorHandler = ErrorHandler.getInstance()
	}

	/**
	 * Register an operation with rollback function
	 */
	public registerOperation(
		operation: string,
		rollbackFn: () => Promise<void>,
		description: string,
	): void {
		this.operations.push({ operation, rollbackFn, description })
	}

	/**
	 * Execute rollback for all registered operations
	 */
	public async executeRollback(): Promise<void> {
		console.error('\x1B[33m🔄 Executing rollback operations...\x1B[0m')
		
		for (const op of this.operations.reverse()) {
			try {
				await op.rollbackFn()
				console.error(`\x1B[32m✅ Rollback completed: ${op.description}\x1B[0m`)
			} catch (error) {
				const rollbackError = this.errorHandler.createError(
					`Rollback failed for: ${op.description}`,
					ErrorType.ROLLBACK_FAILED,
					ErrorSeverity.HIGH,
					'executeRollback',
					error instanceof Error ? error : undefined,
					false,
				)

				await this.errorHandler.handleError(rollbackError)
			}
		}
	}

	/**
	 * Clear registered operations
	 */
	public clearOperations(): void {
		this.operations = []
	}

}

// Export singleton instances
export const errorHandler = ErrorHandler.getInstance()
export const inputValidator = new InputValidator()
export const rollbackManager = new RollbackManager()
