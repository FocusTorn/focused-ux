interface LogContext {
  packageName: string;
  operation: string;
  userId?: string;
  sessionId?: string;
  correlationId?: string;
  metadata?: Record<string, any>;
}

interface LogEntry {
  timestamp: Date;
  level: 'debug' | 'info' | 'warn' | 'error' | 'fatal';
  message: string;
  context: LogContext;
  error?: Error;
  performance?: {
    duration: number;
    memoryUsage: number;
  };
}

interface LogWriter {
  write(entry: LogEntry): Promise<void>;
}

class ConsoleLogWriter implements LogWriter {
  async write(entry: LogEntry): Promise<void> {
    const timestamp = entry.timestamp.toISOString();
    const level = entry.level.toUpperCase();
    const message = entry.message;
    const context = entry.context;
    
    console.log(`[${timestamp}] ${level}: ${message}`, {
      package: context.packageName,
      operation: context.operation,
      correlationId: context.correlationId,
      metadata: context.metadata,
      ...(entry.error && { error: entry.error.message }),
      ...(entry.performance && { performance: entry.performance })
    });
  }
}

class FileLogWriter implements LogWriter {
  async write(entry: LogEntry): Promise<void> {
    // Implementation for file logging
    // This would write to a log file
  }
}

class RemoteLogWriter implements LogWriter {
  async write(entry: LogEntry): Promise<void> {
    // Implementation for remote logging
    // This would send logs to a remote service
  }
}

export class StructuredLogger {
  private logWriters: LogWriter[];
  private correlationId: string;

  constructor() {
    this.logWriters = [
      new ConsoleLogWriter(),
      new FileLogWriter(),
      new RemoteLogWriter()
    ];
    this.correlationId = this.generateCorrelationId();
  }

  async log(level: LogEntry['level'], message: string, context: LogContext, error?: Error): Promise<void> {
    const entry: LogEntry = {
      timestamp: new Date(),
      level,
      message,
      context: {
        ...context,
        correlationId: this.correlationId
      },
      error,
      performance: this.capturePerformance()
    };

    await Promise.all(this.logWriters.map(writer => writer.write(entry)));
  }

  // Convenience methods
  async debug(message: string, context: LogContext): Promise<void> {
    await this.log('debug', message, context);
  }

  async info(message: string, context: LogContext): Promise<void> {
    await this.log('info', message, context);
  }

  async warn(message: string, context: LogContext): Promise<void> {
    await this.log('warn', message, context);
  }

  async error(message: string, context: LogContext, error?: Error): Promise<void> {
    await this.log('error', message, context, error);
  }

  async fatal(message: string, context: LogContext, error?: Error): Promise<void> {
    await this.log('fatal', message, context, error);
  }

  private generateCorrelationId(): string {
    return `corr_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  private capturePerformance() {
    const usage = process.memoryUsage();
    return {
      duration: 0, // Would be calculated by tracking
      memoryUsage: usage.heapUsed
    };
  }
}
