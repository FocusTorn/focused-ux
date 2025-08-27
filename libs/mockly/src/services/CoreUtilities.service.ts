import { LogLevel } from '../_vscCore/vscEnums.js'

// Custom Error for NotImplemented
class NotImplementedError extends Error {

	constructor(message = 'Functionality not implemented') {
		super(message)
		this.name = 'NotImplementedError'
	}

}

/**
 * Provides core utility functions like logging and error creation.
 * This service centralizes common helper functionalities used across other services.
 */
export class CoreUtilitiesService {

	private currentLogLevel: LogLevel = LogLevel.Warning

	constructor() {}

	// ┌────────────────────────────────────────────────────────────────────────────┐
	// │                                                                            │
	// │                                  LOGGING                                   │
	// │                                                                            │
	// └────────────────────────────────────────────────────────────────────────────┘

	formatLogMessage(message: string | object | Error): string {
		if (message instanceof Error) {
			return message.stack || message.message
		}
		if (typeof message === 'object') {
			try {
				return JSON.stringify(message)
			}
			catch (_e) {
				return '[Object (serialization failed)]'
			}
		}
		return message
	}

	private shouldLog(level: LogLevel): boolean {
		// Log if the current level is not Off AND the message level is >= the current level
		return this.currentLogLevel !== LogLevel.Off && level >= this.currentLogLevel
	}

	log(level: LogLevel, message: string | object | Error, ...optionalParams: any[]): void {
		if (!this.shouldLog(level))
			return

		const formattedMessage = this.formatLogMessage(message)

		switch (level) {
			case LogLevel.Trace:
				console.trace(`[TRACE] ${formattedMessage}`, ...optionalParams)
				break
			case LogLevel.Debug:
				console.debug(`[DEBUG] ${formattedMessage}`, ...optionalParams)
				break
			case LogLevel.Info:
				console.info(`[INFO] ${formattedMessage}`, ...optionalParams)
				break
			case LogLevel.Warning:
				console.warn(`[WARN] ${formattedMessage}`, ...optionalParams)
				break
			case LogLevel.Error:
				console.error(`[ERROR] ${formattedMessage}`, ...optionalParams)
				break
			default:
				console.log(`[LOG] ${formattedMessage}`, ...optionalParams)
		}
	}

	info(message: string | object, ...optionalParams: any[]): void {
		this.log(LogLevel.Info, message, ...optionalParams)
	}

	warn(message: string | object, ...optionalParams: any[]): void {
		this.log(LogLevel.Warning, message, ...optionalParams)
	}

	error(message: string | Error, ...optionalParams: any[]): void {
		this.log(LogLevel.Error, message, ...optionalParams)
	}

	debug(message: string | object, ...optionalParams: any[]): void {
		this.log(LogLevel.Debug, message, ...optionalParams)
	}

	trace(message: string | object, ...optionalParams: any[]): void {
		this.log(LogLevel.Trace, message, ...optionalParams)
	}

	setLogLevel(level: LogLevel): void {
		this.currentLogLevel = level
		this.info(`Log level set to: ${LogLevel[level]}`)
	}

	getLogLevel(): LogLevel {
		return this.currentLogLevel
	}

	// ┌────────────────────────────────────────────────────────────────────────────┐
	// │                                                                            │
	// │                                 ERROR CREATION                             │
	// │                                                                            │
	// └────────────────────────────────────────────────────────────────────────────┘

	createError(message: string, code?: string): Error {
		const error = new Error(message)

		if (code) {
			(error as any).code = code
		}
		return error
	}

	createFileSystemError(code: string, path: string | any, message?: string): Error {
		const pathStr = typeof path === 'string' ? path : path?.fsPath || 'unknown'
		const errorMessage = message || `File system error: ${code} at ${pathStr}`
		const error = new Error(errorMessage)

		;(error as any).code = code
		;(error as any).path = pathStr
		return error
	}

	createNotImplementedError(featureName?: string): Error {
		const message = featureName
			? `Functionality not implemented: ${featureName}`
			: 'Functionality not implemented'

		return new NotImplementedError(message)
	}

}
