import process from 'node:process'

export interface LogLevel {
  debug: 0
  info: 1
  warn: 2
  error: 3
  fatal: 4
}

export interface LogContext {
  packageName?: string
  operation?: string
  userId?: string
  sessionId?: string
  correlationId?: string
  source?: string
  metadata?: Record<string, any>
  tags?: Record<string, string>
  enableStructuredOutput?: boolean
  performance?: Record<string, any>
}

export interface LogEntry {
  timestamp: string
  level: keyof LogLevel
  message: string
  context?: LogContext
  error?: Error
  performance?: {
    duration?: number
    memoryUsage: number
    cpuUsage?: number
  }
  tags?: Record<string, string>
}

export interface LogWriter {
  write(entry: LogEntry): Promise<void>
}

export interface LoggerOptions {
  level?: keyof LogLevel
  correlationId?: string
  packageName?: string
  enablePerformanceTracking?: boolean
  enableStructuredOutput?: boolean
  writers?: LogWriter[]
}

export class ConsoleLogWriter implements LogWriter {
  async write(entry: LogEntry): Promise<void> {
    const timestamp = entry.timestamp
    const level = entry.level.toUpperCase()
    const message = entry.message
    
    if (entry.context?.enableStructuredOutput) {
      console.log(JSON.stringify(entry))
    } else {
      const contextInfo = entry.context ? {
        package: entry.context.packageName,
        operation: entry.context.operation,
        correlationId: entry.context.correlationId,
        ...entry.context.metadata
      } : {}
      
      console.log(`[${timestamp}] ${level}: ${message}`, {
        ...contextInfo,
        ...(entry.error && { error: entry.error.message, stack: entry.error.stack }),
        ...(entry.performance && { performance: entry.performance })
      })
    }
  }
}

export class FileLogWriter implements LogWriter {
  async write(entry: LogEntry): Promise<void> {
    // TODO: Implement file logging
    // This would write to a log file with rotation
    console.log(`[FILE] ${entry.timestamp} ${entry.level.toUpperCase()}: ${entry.message}`)
  }
}

export class RemoteLogWriter implements LogWriter {
  async write(entry: LogEntry): Promise<void> {
    // TODO: Implement remote logging
    // This would send logs to a remote service like ELK, DataDog, etc.
    console.log(`[REMOTE] ${entry.timestamp} ${entry.level.toUpperCase()}: ${entry.message}`)
  }
}

export class Logger {
  private level: keyof LogLevel = 'info'
  private levels: LogLevel = { debug: 0, info: 1, warn: 2, error: 3, fatal: 4 }
  private correlationId: string
  private packageName?: string
  private enablePerformanceTracking: boolean
  private enableStructuredOutput: boolean
  private writers: LogWriter[]
  private performanceStartTimes: Map<string, number> = new Map()

  constructor(options: LoggerOptions = {}) {
    this.level = options.level || 'info'
    this.correlationId = options.correlationId || this.generateCorrelationId()
    this.packageName = options.packageName
    this.enablePerformanceTracking = options.enablePerformanceTracking || false
    this.enableStructuredOutput = options.enableStructuredOutput || false
    
    this.writers = options.writers || [
      new ConsoleLogWriter(),
      new FileLogWriter(),
      new RemoteLogWriter()
    ]
  }

  private shouldLog(level: keyof LogLevel): boolean {
    return this.levels[level] >= this.levels[this.level]
  }

  private formatEntry(level: keyof LogLevel, message: string, context?: LogContext, error?: Error): LogEntry {
    const entry: LogEntry = {
      timestamp: new Date().toISOString(),
      level,
      message,
      context: {
        ...context,
        correlationId: context?.correlationId || this.correlationId,
        packageName: context?.packageName || this.packageName
      },
      error,
      performance: this.capturePerformance(),
      tags: {
        level,
        correlationId: this.correlationId,
        ...context?.tags
      }
    }

    if (context?.enableStructuredOutput) {
      entry.context!.enableStructuredOutput = true
    }

    return entry
  }

  private async writeToAllWriters(entry: LogEntry): Promise<void> {
    await Promise.all(this.writers.map(writer => writer.write(entry)))
  }

  private generateCorrelationId(): string {
    return `corr_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
  }

  private capturePerformance() {
    if (!this.enablePerformanceTracking) return undefined
    
    const usage = process.memoryUsage()
    return {
      memoryUsage: usage.heapUsed,
      cpuUsage: process.cpuUsage?.()?.user
    }
  }

  // Performance tracking methods
  startTimer(operation: string): void {
    if (this.enablePerformanceTracking) {
      this.performanceStartTimes.set(operation, Date.now())
    }
  }

  endTimer(operation: string): number | undefined {
    if (!this.enablePerformanceTracking) return undefined
    
    const startTime = this.performanceStartTimes.get(operation)
    if (startTime) {
      const duration = Date.now() - startTime
      this.performanceStartTimes.delete(operation)
      return duration
    }
    return undefined
  }

  // Core logging methods
  async debug(message: string, context?: LogContext): Promise<void> {
    if (this.shouldLog('debug')) {
      const entry = this.formatEntry('debug', message, context)
      await this.writeToAllWriters(entry)
    }
  }

  async info(message: string, context?: LogContext): Promise<void> {
    if (this.shouldLog('info')) {
      const entry = this.formatEntry('info', message, context)
      await this.writeToAllWriters(entry)
    }
  }

  async warn(message: string, context?: LogContext): Promise<void> {
    if (this.shouldLog('warn')) {
      const entry = this.formatEntry('warn', message, context)
      await this.writeToAllWriters(entry)
    }
  }

  async error(message: string, context?: LogContext, error?: Error): Promise<void> {
    if (this.shouldLog('error')) {
      const entry = this.formatEntry('error', message, context, error)
      await this.writeToAllWriters(entry)
    }
  }

  async fatal(message: string, context?: LogContext, error?: Error): Promise<void> {
    if (this.shouldLog('fatal')) {
      const entry = this.formatEntry('fatal', message, context, error)
      await this.writeToAllWriters(entry)
    }
  }

  // Convenience methods for backward compatibility (synchronous versions)
  debugSync(message: string, context?: Record<string, any>): void {
    this.debug(message, context as LogContext).catch(console.error)
  }

  infoSync(message: string, context?: Record<string, any>): void {
    this.info(message, context as LogContext).catch(console.error)
  }

  warnSync(message: string, context?: Record<string, any>): void {
    this.warn(message, context as LogContext).catch(console.error)
  }

  errorSync(message: string, context?: Record<string, any>): void {
    this.error(message, context as LogContext).catch(console.error)
  }

  // Utility methods
  setLevel(level: keyof LogLevel): void {
    this.level = level
  }

  getLevel(): keyof LogLevel {
    return this.level
  }

  getCorrelationId(): string {
    return this.correlationId
  }

  addWriter(writer: LogWriter): void {
    this.writers.push(writer)
  }

  removeWriter(writer: LogWriter): void {
    const index = this.writers.indexOf(writer)
    if (index > -1) {
      this.writers.splice(index, 1)
    }
  }

  // Structured logging helpers
  withContext(context: LogContext): Logger {
    const newLogger = new Logger({
      level: this.level,
      correlationId: this.correlationId,
      packageName: this.packageName,
      enablePerformanceTracking: this.enablePerformanceTracking,
      enableStructuredOutput: this.enableStructuredOutput,
      writers: [...this.writers]
    })
    
    // Merge context
    if (context) {
      newLogger.correlationId = context.correlationId || this.correlationId
      newLogger.packageName = context.packageName || this.packageName
    }
    
    return newLogger
  }

  // Performance logging
  async logPerformance(operation: string, context?: LogContext): Promise<void> {
    if (this.enablePerformanceTracking) {
      const duration = this.endTimer(operation)
      if (duration !== undefined) {
        await this.info(`Operation '${operation}' completed in ${duration}ms`, {
          ...context,
          performance: { duration }
        })
      }
    }
  }
}



