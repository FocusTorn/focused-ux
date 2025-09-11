import { promises as fs } from 'fs'
import path from 'path'

export enum ErrorType {
	INVALID_EXTERNAL_SOURCE = 'INVALID_EXTERNAL_SOURCE',
	OPTIMIZATION_FAILED = 'OPTIMIZATION_FAILED',
	THEME_GENERATION_FAILED = 'THEME_GENERATION_FAILED',
	MODEL_VALIDATION_FAILED = 'MODEL_VALIDATION_FAILED',
	FILE_NOT_FOUND = 'FILE_NOT_FOUND',
	SYNC_FAILED = 'SYNC_FAILED',
}

export enum ErrorSeverity {
	LOW = 'LOW',
	MEDIUM = 'MEDIUM',
	HIGH = 'HIGH',
	CRITICAL = 'CRITICAL',
}

export interface ErrorInfo {
	id: string
	type: ErrorType
	severity: ErrorSeverity
	message: string
	context: string
	timestamp: Date
	stack?: string
	recoverable: boolean
}

export class ErrorHandler {

	private errors: ErrorInfo[] = []
	private errorCount = 0

	/**
	 * Create a new error
	 */
	createError(
		message: string,
		type: ErrorType,
		severity: ErrorSeverity,
		context: string,
		originalError?: Error,
		recoverable: boolean = true,
	): ErrorInfo {
		const error: ErrorInfo = {
			id: `ERR_${++this.errorCount}_${Date.now()}`,
			type,
			severity,
			message,
			context,
			timestamp: new Date(),
			stack: originalError?.stack,
			recoverable,
		}

		this.errors.push(error)
		return error
	}

	/**
	 * Handle an error with appropriate logging and recovery
	 */
	async handleError(error: ErrorInfo, verbose: boolean = false): Promise<void> {
		const severityIcon = this.getSeverityIcon(error.severity)
		const timestamp = error.timestamp.toISOString()
		
		if (verbose) {
			console.log(`\n${severityIcon} ERROR HANDLED`)
			console.log('─'.repeat(50))
			console.log(`ID: ${error.id}`)
			console.log(`Type: ${error.type}`)
			console.log(`Severity: ${error.severity}`)
			console.log(`Context: ${error.context}`)
			console.log(`Message: ${error.message}`)
			console.log(`Timestamp: ${timestamp}`)
			console.log(`Recoverable: ${error.recoverable}`)
			if (error.stack) {
				console.log(`Stack: ${error.stack}`)
			}
			console.log('─'.repeat(50))
		} else {
			// Use red color for HIGH and CRITICAL severity errors
			const colorCode = error.severity === ErrorSeverity.HIGH || error.severity === ErrorSeverity.CRITICAL ? '\x1b[31m' : ''
			const resetCode = error.severity === ErrorSeverity.HIGH || error.severity === ErrorSeverity.CRITICAL ? '\x1b[0m' : ''
			console.log(`${severityIcon} ${colorCode}${error.message} (${error.context})${resetCode}`)
		}

		// Log to file if critical
		if (error.severity === ErrorSeverity.CRITICAL) {
			await this.logErrorToFile(error)
		}
	}

	/**
	 * Get error summary statistics
	 */
	getErrorSummary(): {
		total: number
		bySeverity: Record<ErrorSeverity, number>
		byType: Record<ErrorType, number>
	} {
		const summary = {
			total: this.errors.length,
			bySeverity: {
				[ErrorSeverity.LOW]: 0,
				[ErrorSeverity.MEDIUM]: 0,
				[ErrorSeverity.HIGH]: 0,
				[ErrorSeverity.CRITICAL]: 0,
			},
			byType: {
				[ErrorType.INVALID_EXTERNAL_SOURCE]: 0,
				[ErrorType.OPTIMIZATION_FAILED]: 0,
				[ErrorType.THEME_GENERATION_FAILED]: 0,
				[ErrorType.MODEL_VALIDATION_FAILED]: 0,
				[ErrorType.FILE_NOT_FOUND]: 0,
				[ErrorType.SYNC_FAILED]: 0,
			},
		}

		for (const error of this.errors) {
			summary.bySeverity[error.severity]++
			summary.byType[error.type]++
		}

		return summary
	}

	/**
	 * Clear all errors
	 */
	clearErrors(): void {
		this.errors = []
		this.errorCount = 0
	}

	/**
	 * Get severity icon for display
	 */
	private getSeverityIcon(severity: ErrorSeverity): string {
		switch (severity) {
			case ErrorSeverity.LOW:
				return '🔵'
			case ErrorSeverity.MEDIUM:
				return '🟡'
			case ErrorSeverity.HIGH:
				return '❌'
			case ErrorSeverity.CRITICAL:
				return '🔴'
			default:
				return '⚪'
		}
	}

	/**
	 * Log error to file
	 */
	private async logErrorToFile(error: ErrorInfo): Promise<void> {
		try {
			const logDir = path.resolve(process.cwd(), 'logs')

			await fs.mkdir(logDir, { recursive: true })
			
			const logFile = path.join(logDir, `error-${new Date().toISOString().split('T')[0]}.log`)
			const logEntry = `${error.timestamp.toISOString()} [${error.severity}] ${error.type}: ${error.message} (${error.context})\n`
			
			await fs.appendFile(logFile, logEntry)
		} catch (logError) {
			// Don't throw if logging fails
			console.error('Failed to log error to file:', logError)
		}
	}

}
