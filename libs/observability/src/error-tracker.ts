import process from 'node:process'

export interface ErrorContext {
  packageName?: string
  operation?: string
  userId?: string
  sessionId?: string
  correlationId?: string
  source?: string
  metadata?: Record<string, any>
  stack?: string
  tags?: Record<string, string>
}

export interface ErrorEntry {
  id: string
  timestamp: Date
  error: Error
  context: ErrorContext
  severity: 'low' | 'medium' | 'high' | 'critical'
  frequency: number
  firstSeen: Date
  lastSeen: Date
  tags?: Record<string, string>
  performance?: {
    memoryUsage: number
    cpuUsage?: number
  }
}

export interface ErrorReport {
  id: string
  timestamp: Date
  error: Error
  context: ErrorContext
  severity: ErrorEntry['severity']
  frequency: number
  firstSeen: Date
  lastSeen: Date
  tags?: Record<string, string>
  performance?: ErrorEntry['performance']
}

export interface ErrorTrackerOptions {
  maxErrors?: number
  captureStack?: boolean
  enableGrouping?: boolean
  enablePerformanceTracking?: boolean
  alertThresholds?: {
    critical?: number
    high?: number
    medium?: number
    low?: number
  }
  retentionPeriod?: number // in milliseconds
}

export interface ErrorReporter {
  report(report: ErrorReport): Promise<void>
}

export interface ErrorGroup {
  signature: string
  count: number
  firstSeen: Date
  lastSeen: Date
  severity: ErrorEntry['severity']
  examples: ErrorEntry[]
  tags: Record<string, string>
}

export class ConsoleErrorReporter implements ErrorReporter {
  async report(report: ErrorReport): Promise<void> {
    console.error('🚨 ERROR REPORT:', {
      id: report.id,
      message: report.error.message,
      severity: report.severity,
      frequency: report.frequency,
      package: report.context.packageName,
      operation: report.context.operation,
      firstSeen: report.firstSeen,
      lastSeen: report.lastSeen,
      tags: report.tags
    })
  }
}

export class SentryErrorReporter implements ErrorReporter {
  async report(report: ErrorReport): Promise<void> {
    // TODO: Implement Sentry error reporting
    console.log(`[SENTRY] Reporting error ${report.id} to Sentry`)
  }
}

export class CustomErrorReporter implements ErrorReporter {
  async report(report: ErrorReport): Promise<void> {
    // TODO: Implement custom error reporting
    console.log(`[CUSTOM] Reporting error ${report.id} to custom service`)
  }
}

export class ErrorTracker {
  private errors: Map<string, ErrorEntry> = new Map()
  private reporters: ErrorReporter[] = []
  private options: Required<ErrorTrackerOptions>
  private errorGroups: Map<string, ErrorGroup> = new Map()
  private performanceStartTimes: Map<string, number> = new Map()

  constructor(options: ErrorTrackerOptions = {}) {
    this.options = {
      maxErrors: options.maxErrors || 1000,
      captureStack: options.captureStack !== false,
      enableGrouping: options.enableGrouping || false,
      enablePerformanceTracking: options.enablePerformanceTracking || false,
      alertThresholds: {
        critical: options.alertThresholds?.critical || 5,
        high: options.alertThresholds?.high || 10,
        medium: options.alertThresholds?.medium || 20,
        low: options.alertThresholds?.low || 50
      },
      retentionPeriod: options.retentionPeriod || 24 * 60 * 60 * 1000 // 24 hours
    }

    this.reporters = [
      new ConsoleErrorReporter(),
      new SentryErrorReporter(),
      new CustomErrorReporter()
    ]

    // Start cleanup timer
    this.startCleanupTimer()
  }

  // Core error tracking methods
  async trackError(error: Error, context: ErrorContext = {}): Promise<string> {
    const errorId = this.generateErrorId(error, context)
    const now = new Date()
    
    let entry = this.errors.get(errorId)
    
    if (entry) {
      // Update existing error
      entry.frequency++
      entry.lastSeen = now
      entry.context = { ...entry.context, ...context }
      entry.tags = { ...entry.tags, ...context.tags }
    } else {
      // Create new error entry
      entry = {
        id: errorId,
        timestamp: now,
        error,
        context: {
          ...context,
          correlationId: context.correlationId || this.generateCorrelationId()
        },
        severity: this.calculateSeverity(error, context),
        frequency: 1,
        firstSeen: now,
        lastSeen: now,
        tags: context.tags || {},
        performance: this.capturePerformance()
      }
      
      this.errors.set(errorId, entry)
      
      // Enforce max errors limit
      if (this.errors.size > this.options.maxErrors) {
        this.enforceMaxErrors()
      }
    }

    // Group errors if enabled
    if (this.options.enableGrouping) {
      this.addToErrorGroup(entry)
    }

    // Report to all reporters
    await this.reportError(entry)

    // Check alert thresholds
    await this.checkAlertThresholds(entry)

    return errorId
  }

  // Backward compatibility method
  capture(error: Error, context?: Record<string, any>): string {
    // For backward compatibility, we'll use a synchronous approach
    const errorId = this.generateErrorId(error, context as ErrorContext)
    const now = new Date()
    
    const entry: ErrorEntry = {
      id: errorId,
      timestamp: now,
      error,
      context: {
        ...context as ErrorContext,
        correlationId: (context as ErrorContext)?.correlationId || this.generateCorrelationId()
      },
      severity: this.calculateSeverity(error, context as ErrorContext),
      frequency: 1,
      firstSeen: now,
      lastSeen: now,
      tags: (context as ErrorContext)?.tags || {},
      performance: this.capturePerformance()
    }
    
    this.errors.set(errorId, entry)
    
    // Report asynchronously
    this.reportError(entry).catch(console.error)
    
    return errorId
  }

  // Error grouping methods
  private addToErrorGroup(entry: ErrorEntry): void {
    const signature = this.generateErrorSignature(entry.error, entry.context)
    
    if (!this.errorGroups.has(signature)) {
      this.errorGroups.set(signature, {
        signature,
        count: 0,
        firstSeen: entry.firstSeen,
        lastSeen: entry.lastSeen,
        severity: entry.severity,
        examples: [],
        tags: { ...entry.tags }
      })
    }
    
    const group = this.errorGroups.get(signature)!
    group.count++
    group.lastSeen = entry.lastSeen
    group.examples.push(entry)
    
    // Keep only recent examples
    if (group.examples.length > 10) {
      group.examples = group.examples.slice(-10)
    }
  }

  private generateErrorSignature(error: Error, context: ErrorContext): string {
    const parts = [
      error.name,
      error.message,
      context.packageName || 'unknown',
      context.operation || 'unknown'
    ]
    return parts.join('::')
  }

  // Performance tracking methods
  startTimer(operation: string): void {
    if (this.options.enablePerformanceTracking) {
      this.performanceStartTimes.set(operation, Date.now())
    }
  }

  endTimer(operation: string): number | undefined {
    if (!this.options.enablePerformanceTracking) return undefined
    
    const startTime = this.performanceStartTimes.get(operation)
    if (startTime) {
      const duration = Date.now() - startTime
      this.performanceStartTimes.delete(operation)
      return duration
    }
    return undefined
  }

  // Error analysis methods
  getErrorGroups(): ErrorGroup[] {
    return Array.from(this.errorGroups.values())
  }

  getErrorsBySeverity(severity: ErrorEntry['severity']): ErrorEntry[] {
    return Array.from(this.errors.values()).filter(entry => entry.severity === severity)
  }

  getErrorsByPackage(packageName: string): ErrorEntry[] {
    return Array.from(this.errors.values()).filter(entry => entry.context.packageName === packageName)
  }

  getErrorsByOperation(operation: string): ErrorEntry[] {
    return Array.from(this.errors.values()).filter(entry => entry.context.operation === operation)
  }

  getErrorsByTimeRange(startTime: Date, endTime: Date): ErrorEntry[] {
    return Array.from(this.errors.values()).filter(entry => 
      entry.timestamp >= startTime && entry.timestamp <= endTime
    )
  }

  // Error statistics
  getErrorStats(): {
    total: number
    bySeverity: Record<ErrorEntry['severity'], number>
    byPackage: Record<string, number>
    byOperation: Record<string, number>
    topErrors: Array<{ signature: string; count: number; severity: ErrorEntry['severity'] }>
  } {
    const bySeverity: Record<ErrorEntry['severity'], number> = { low: 0, medium: 0, high: 0, critical: 0 }
    const byPackage: Record<string, number> = {}
    const byOperation: Record<string, number> = {}
    const errorCounts = new Map<string, number>()

    for (const entry of this.errors.values()) {
      bySeverity[entry.severity]++
      
      const packageName = entry.context.packageName || 'unknown'
      byPackage[packageName] = (byPackage[packageName] || 0) + 1
      
      const operation = entry.context.operation || 'unknown'
      byOperation[operation] = (byOperation[operation] || 0) + 1
      
      const signature = this.generateErrorSignature(entry.error, entry.context)
      errorCounts.set(signature, (errorCounts.get(signature) || 0) + 1)
    }

    const topErrors = Array.from(errorCounts.entries())
      .map(([signature, count]) => {
        const entry = Array.from(this.errors.values()).find(e => 
          this.generateErrorSignature(e.error, e.context) === signature
        )
        return {
          signature,
          count,
          severity: entry?.severity || 'medium'
        }
      })
      .sort((a, b) => b.count - a.count)
      .slice(0, 10)

    return {
      total: this.errors.size,
      bySeverity,
      byPackage,
      byOperation,
      topErrors
    }
  }

  // Utility methods
  private generateErrorId(error: Error, context: ErrorContext): string {
    const errorSignature = `${error.name}:${error.message}:${context.packageName || 'unknown'}:${context.operation || 'unknown'}`
    return `err_${Buffer.from(errorSignature).toString('base64').substring(0, 16)}`
  }

  private generateCorrelationId(): string {
    return `corr_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
  }

  private calculateSeverity(error: Error, context: ErrorContext): ErrorEntry['severity'] {
    // Enhanced severity calculation
    if (error.name === 'ValidationError' || error.name === 'TypeError') return 'low'
    if (error.name === 'NetworkError' || error.name === 'TimeoutError') return 'medium'
    if (error.name === 'DatabaseError' || error.name === 'AuthenticationError') return 'high'
    if (error.name === 'SecurityError' || error.name === 'FatalError') return 'critical'
    
    // Check context for severity hints
    if (context.metadata?.severity) {
      return context.metadata.severity as ErrorEntry['severity']
    }
    
    // Default based on error message patterns
    const message = error.message.toLowerCase()
    if (message.includes('critical') || message.includes('fatal')) return 'critical'
    if (message.includes('warning') || message.includes('deprecated')) return 'low'
    
    return 'medium'
  }

  private capturePerformance(): ErrorEntry['performance'] {
    if (!this.options.enablePerformanceTracking) return undefined
    
    const usage = process.memoryUsage()
    return {
      memoryUsage: usage.heapUsed,
      cpuUsage: process.cpuUsage?.()?.user
    }
  }

  private async reportError(entry: ErrorEntry): Promise<void> {
    const report: ErrorReport = {
      id: entry.id,
      timestamp: entry.timestamp,
      error: entry.error,
      context: entry.context,
      severity: entry.severity,
      frequency: entry.frequency,
      firstSeen: entry.firstSeen,
      lastSeen: entry.lastSeen,
      tags: entry.tags,
      performance: entry.performance
    }

    await Promise.all(this.reporters.map(reporter => reporter.report(report)))
  }

  private async checkAlertThresholds(entry: ErrorEntry): Promise<void> {
    const threshold = this.options.alertThresholds[entry.severity]
    if (threshold && entry.frequency >= threshold) {
      await this.triggerErrorAlert(entry)
    }
  }

  private async triggerErrorAlert(entry: ErrorEntry): Promise<void> {
    console.error(`🚨 ALERT: ${entry.severity.toUpperCase()} ERROR THRESHOLD EXCEEDED`, {
      error: entry.error.message,
      package: entry.context.packageName,
      operation: entry.context.operation,
      frequency: entry.frequency,
      threshold: this.options.alertThresholds[entry.severity],
      firstSeen: entry.firstSeen,
      lastSeen: entry.lastSeen
    })
  }

  private enforceMaxErrors(): void {
    const entries = Array.from(this.errors.entries())
    entries.sort((a, b) => a[1].lastSeen.getTime() - b[1].lastSeen.getTime())
    
    const toRemove = entries.slice(0, entries.length - this.options.maxErrors)
    toRemove.forEach(([id]) => this.errors.delete(id))
  }

  private startCleanupTimer(): void {
    setInterval(() => {
      this.cleanupOldErrors()
    }, 60000) // Every minute
  }

  private cleanupOldErrors(): void {
    const cutoff = new Date(Date.now() - this.options.retentionPeriod)
    const toRemove: string[] = []
    
    for (const [id, entry] of this.errors.entries()) {
      if (entry.lastSeen < cutoff) {
        toRemove.push(id)
      }
    }
    
    toRemove.forEach(id => this.errors.delete(id))
  }

  // Public API methods
  getError(id: string): ErrorEntry | undefined {
    return this.errors.get(id)
  }

  getErrors(): ErrorEntry[] {
    return Array.from(this.errors.values())
  }

  clear(): void {
    this.errors.clear()
    this.errorGroups.clear()
  }

  addReporter(reporter: ErrorReporter): void {
    this.reporters.push(reporter)
  }

  removeReporter(reporter: ErrorReporter): void {
    const index = this.reporters.indexOf(reporter)
    if (index > -1) {
      this.reporters.splice(index, 1)
    }
  }

  // Error context helpers
  withContext(context: ErrorContext): ErrorTracker {
    const newTracker = new ErrorTracker({
      ...this.options,
      maxErrors: this.options.maxErrors
    })
    
    // Copy existing errors with new context
    for (const entry of this.errors.values()) {
      newTracker.trackError(entry.error, { ...entry.context, ...context })
    }
    
    return newTracker
  }
}
