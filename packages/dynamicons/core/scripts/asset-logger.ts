import { writeFileSync, existsSync, mkdirSync } from 'fs'
import { dirname } from 'path'

export interface LogLevel {
	name: string
	color: string
	priority: number
}

export interface LogEntry {
	timestamp: string
	level: string
	message: string
	context?: Record<string, any>
	assetPath?: string
}

export interface ProgressTracker {
	total: number
	completed: number
	current: string
	startTime: number
}

export class AssetLogger {

	private readonly logLevels: Record<string, LogLevel> = {
		debug: { name: 'DEBUG', color: '\x1B[38;5;240m', priority: 0 },
		info: { name: 'INFO', color: '\x1B[38;5;153m', priority: 1 },
		success: { name: 'SUCCESS', color: '\x1B[38;5;35m', priority: 2 },
		warning: { name: 'WARNING', color: '\x1B[38;5;179m', priority: 3 },
		error: { name: 'ERROR', color: '\x1B[38;5;9m', priority: 4 },
		critical: { name: 'CRITICAL', color: '\x1B[38;5;196m', priority: 5 },
	}

	private readonly resetColor = '\x1B[0m'
	private readonly bold = '\x1B[1m'
	private readonly logEntries: LogEntry[] = []
	private readonly logFilePath?: string
	protected readonly verbose: boolean
	protected readonly silent: boolean

	constructor(options: {
		logToFile?: boolean
		logFilePath?: string
		verbose?: boolean
		silent?: boolean
	} = {}) {
		this.verbose = options.verbose ?? false
		this.silent = options.silent ?? false
		
		if (options.logToFile && options.logFilePath) {
			this.logFilePath = options.logFilePath
			this.ensureLogDirectory()
		}
	}

	/**
	 * Log a debug message
	 */
	debug(message: string, context?: Record<string, any>, assetPath?: string): void {
		this.log('debug', message, context, assetPath)
	}

	/**
	 * Log an info message
	 */
	info(message: string, context?: Record<string, any>, assetPath?: string): void {
		this.log('info', message, context, assetPath)
	}

	/**
	 * Log a success message
	 */
	success(message: string, context?: Record<string, any>, assetPath?: string): void {
		this.log('success', message, context, assetPath)
	}

	/**
	 * Log a warning message
	 */
	warning(message: string, context?: Record<string, any>, assetPath?: string): void {
		this.log('warning', message, context, assetPath)
	}

	/**
	 * Log an error message
	 */
	error(message: string, context?: Record<string, any>, assetPath?: string): void {
		this.log('error', message, context, assetPath)
	}

	/**
	 * Log a critical message
	 */
	critical(message: string, context?: Record<string, any>, assetPath?: string): void {
		this.log('critical', message, context, assetPath)
	}

	/**
	 * Log a message with the specified level
	 */
	private log(
		level: keyof typeof this.logLevels,
		message: string,
		context?: Record<string, any>,
		assetPath?: string,
	): void {
		const logLevel = this.logLevels[level]
		
		// Skip debug messages if not verbose
		if (level === 'debug' && !this.verbose) {
			return
		}

		// Skip all messages if silent
		if (this.silent) {
			return
		}

		const timestamp = new Date().toISOString()
		const logEntry: LogEntry = {
			timestamp,
			level: logLevel.name,
			message,
			context,
			assetPath,
		}

		// Store log entry
		this.logEntries.push(logEntry)

		// Format console output
		const formattedMessage = this.formatConsoleMessage(logLevel, message, assetPath)

		console.log(formattedMessage)

		// Log context if present and verbose
		if (context && this.verbose && Object.keys(context).length > 0) {
			const contextMessage = this.formatContext(context)

			console.log(contextMessage)
		}

		// Write to log file if enabled
		if (this.logFilePath) {
			this.writeToLogFile(logEntry)
		}
	}

	/**
	 * Format message for console output
	 */
	private formatConsoleMessage(level: LogLevel, message: string, assetPath?: string): string {
		const levelText = `${level.color}${level.name}${this.resetColor}`
		
		// Only show timestamps in verbose mode
		if (this.verbose) {
			const timestamp = new Date().toLocaleTimeString()
			const timeText = `[${timestamp}]`
			
			if (assetPath) {
				return `${timeText} ${levelText}: ${message} (${assetPath})`
			}
			
			return `${timeText} ${levelText}: ${message}`
		} else {
			// Concise mode: no timestamps, no level prefixes
			if (assetPath) {
				return `${message} (${assetPath})`
			}
			
			return `${message}`
		}
	}

	/**
	 * Format context for console output
	 */
	private formatContext(context: Record<string, any>): string {
		const contextLines = Object.entries(context).map(([key, value]) => {
			const formattedValue = typeof value === 'object'
				? JSON.stringify(value, null, 2)
				: String(value)

			return `    ${key}: ${formattedValue}`
		})
		
		return contextLines.join('\n')
	}

	/**
	 * Write log entry to file
	 */
	private writeToLogFile(entry: LogEntry): void {
		try {
			const logLine = `${JSON.stringify(entry)}\n`

			writeFileSync(this.logFilePath!, logLine, { flag: 'a' })
		} catch (error) {
			// Don't log file writing errors to avoid infinite loops
			console.error('Failed to write to log file:', error)
		}
	}

	/**
	 * Ensure log directory exists
	 */
	private ensureLogDirectory(): void {
		if (this.logFilePath) {
			const logDir = dirname(this.logFilePath)

			if (!existsSync(logDir)) {
				mkdirSync(logDir, { recursive: true })
			}
		}
	}

	/**
	 * Get all log entries
	 */
	getLogEntries(): LogEntry[] {
		return [...this.logEntries]
	}

	/**
	 * Get log entries by level
	 */
	getLogEntriesByLevel(level: string): LogEntry[] {
		return this.logEntries.filter(entry =>
			entry.level === level)
	}

	/**
	 * Get log entries for a specific asset
	 */
	getLogEntriesForAsset(assetPath: string): LogEntry[] {
		return this.logEntries.filter(entry =>
			entry.assetPath === assetPath)
	}

	/**
	 * Get log summary
	 */
	getLogSummary(): Record<string, number> {
		const summary: Record<string, number> = {}
		
		for (const level of Object.values(this.logLevels)) {
			summary[level.name] = 0
		}
		
		for (const entry of this.logEntries) {
			summary[entry.level]++
		}
		
		return summary
	}

	/**
	 * Clear log entries
	 */
	clearLogs(): void {
		this.logEntries.length = 0
	}

	/**
	 * Export logs to JSON file
	 */
	exportLogs(filePath: string): void {
		try {
			const exportData = {
				exportedAt: new Date().toISOString(),
				summary: this.getLogSummary(),
				entries: this.logEntries,
			}
			
			writeFileSync(filePath, JSON.stringify(exportData, null, 2))
		} catch (error) {
			console.error('Failed to export logs:', error)
		}
	}

}

export class ProgressTracker {

	private readonly logger: AssetLogger
	private readonly operation: string
	private total: number
	private completed: number
	private current: string
	private startTime: number
	private lastUpdateTime: number
	private updateInterval: number

	constructor(
		logger: AssetLogger,
		operation: string,
		total: number,
		updateInterval: number = 1000,
	) {
		this.logger = logger
		this.operation = operation
		this.total = total
		this.completed = 0
		this.current = ''
		this.startTime = Date.now()
		this.lastUpdateTime = 0
		this.updateInterval = updateInterval
	}

	/**
	 * Update progress
	 */
	update(completed: number, current: string = ''): void {
		this.completed = completed
		this.current = current

		const now = Date.now()

		if (now - this.lastUpdateTime >= this.updateInterval) {
			this.logProgress()
			this.lastUpdateTime = now
		}
	}

	/**
	 * Increment progress
	 */
	increment(current: string = ''): void {
		this.update(this.completed + 1, current)
	}

	/**
	 * Complete the operation
	 */
	complete(): void {
		this.completed = this.total
		this.logProgress()
		this.logger.success(`${this.operation} completed successfully`)
	}

	/**
	 * Log current progress
	 */
	private logProgress(): void {
		const percentage = Math.round((this.completed / this.total) * 100)
		const elapsed = Date.now() - this.startTime
		const estimatedTotal = this.total > 0 ? (elapsed / this.completed) * this.total : 0
		const remaining = Math.max(0, estimatedTotal - elapsed)

		let progressMessage = `${this.operation}: ${this.completed}/${this.total} (${percentage}%)`
		
		if (this.current) {
			progressMessage += ` - Current: ${this.current}`
		}

		if (remaining > 0) {
			const remainingSeconds = Math.round(remaining / 1000)

			progressMessage += ` - ETA: ${remainingSeconds}s`
		}

		this.logger.info(progressMessage)
	}

	/**
	 * Get progress statistics
	 */
	getStats(): {
		completed: number
		total: number
		percentage: number
		elapsed: number
		estimatedRemaining: number
	} {
		const percentage = this.total > 0 ? (this.completed / this.total) * 100 : 0
		const elapsed = Date.now() - this.startTime
		const estimatedRemaining = this.total > 0 ? (elapsed / this.completed) * this.total - elapsed : 0

		return {
			completed: this.completed,
			total: this.total,
			percentage: Math.round(percentage),
			elapsed,
			estimatedRemaining: Math.max(0, estimatedRemaining),
		}
	}

}

export class StructuredLogger extends AssetLogger {

	private readonly operation: string
	private startTime: number
	private readonly steps: string[] = []
	private currentStep: number = 0

	constructor(
		operation: string,
		options: {
			logToFile?: boolean
			logFilePath?: string
			verbose?: boolean
			silent?: boolean
		} = {},
	) {
		super(options)
		this.operation = operation
		this.startTime = Date.now()
	}

	/**
	 * Start a new operation
	 */
	startOperation(description: string): void {
		if (this.verbose) {
			this.info(`Starting ${this.operation}: ${description}`)
		}
		this.startTime = Date.now()
	}

	/**
	 * Add a step to the operation
	 */
	addStep(step: string): void {
		this.steps.push(step)
	}

	/**
	 * Start a specific step
	 */
	startStep(stepIndex: number): void {
		if (stepIndex < this.steps.length) {
			this.currentStep = stepIndex
			this.info(`Step ${stepIndex + 1}/${this.steps.length}: ${this.steps[stepIndex]}`)
		}
	}

	/**
	 * Complete the current step
	 */
	completeStep(): void {
		if (this.currentStep < this.steps.length) {
			this.success(`Step ${this.currentStep + 1}/${this.steps.length} completed: ${this.steps[this.currentStep]}`)
		}
	}

	/**
	 * Complete the operation
	 */
	completeOperation(description?: string): void {
		const elapsed = Date.now() - this.startTime
		const elapsedSeconds = (elapsed / 1000).toFixed(2)
		
		const message = description
			? `${this.operation} completed: ${description}`
			: `${this.operation} completed successfully`
		
		this.success(`${message} (${elapsedSeconds}s)`)
	}

	/**
	 * Log operation failure
	 */
	operationFailed(error: Error, context?: Record<string, any>): void {
		const elapsed = Date.now() - this.startTime
		const elapsedSeconds = (elapsed / 1000).toFixed(2)
		
		this.error(`${this.operation} failed after ${elapsedSeconds}s: ${error.message}`, context)
	}

	/**
	 * Create a progress tracker for the current step
	 */
	createProgressTracker(total: number, updateInterval?: number): ProgressTracker {
		const stepDescription = this.currentStep < this.steps.length ? this.steps[this.currentStep] : 'Unknown step'

		return new ProgressTracker(this, stepDescription, total, updateInterval)
	}

	/**
	 * Log hierarchical information
	 */
	logHierarchy(prefix: string, message: string, isLast: boolean = false): void {
		const connector = isLast ? '└─ ' : '├─ '

		this.info(`${prefix}${connector}${message}`)
	}

	/**
	 * Log hierarchical success
	 */
	logHierarchySuccess(prefix: string, message: string, isLast: boolean = false): void {
		const connector = isLast ? '└─ ' : '├─ '

		this.success(`${prefix}${connector}${message}`)
	}

	/**
	 * Log hierarchical warning
	 */
	logHierarchyWarning(prefix: string, message: string, isLast: boolean = false): void {
		const connector = isLast ? '└─ ' : '├─ '

		this.warning(`${prefix}${connector}${message}`)
	}

	/**
	 * Log hierarchical error
	 */
	logHierarchyError(prefix: string, message: string, isLast: boolean = false): void {
		const connector = isLast ? '└─ ' : '├─ '

		this.error(`${prefix}${connector}${message}`)
	}

}

// CLI interface for standalone usage
if (process.argv[1] && process.argv[1].endsWith('asset-logger.ts')) {
	const logger = new StructuredLogger('Asset Logger Test')
	
	logger.startOperation('Testing logging functionality')
	logger.addStep('Initialize components')
	logger.addStep('Process assets')
	logger.addStep('Validate output')
	
	logger.startStep(0)
	logger.info('Testing info logging')
	logger.success('Testing success logging')
	logger.warning('Testing warning logging')
	logger.error('Testing error logging')
	logger.completeStep()
	
	logger.startStep(1)

	const progress = logger.createProgressTracker(10)

	for (let i = 0; i < 10; i++) {
		progress.increment(`Item ${i + 1}`)
		// Simulate work
		await new Promise(resolve =>
			setTimeout(resolve, 100))
	}
	progress.complete()
	logger.completeStep()
	
	logger.startStep(2)
	logger.info('Validation completed')
	logger.completeStep()
	
	logger.completeOperation('All tests passed')
	
	console.log('\nLog Summary:')
	console.log(logger.getLogSummary())
}
