export interface LogLevel {
  debug: 0;
  info: 1;
  warn: 2;
  error: 3;
}

export interface LogEntry {
  timestamp: string;
  level: keyof LogLevel;
  message: string;
  context?: Record<string, any>;
}

export class Logger {
  private level: keyof LogLevel = 'info';
  private levels: LogLevel = { debug: 0, info: 1, warn: 2, error: 3 };

  constructor(level: keyof LogLevel = 'info') {
    this.level = level;
  }

  private shouldLog(level: keyof LogLevel): boolean {
    return this.levels[level] >= this.levels[this.level];
  }

  private formatEntry(level: keyof LogLevel, message: string, context?: Record<string, any>): LogEntry {
    return {
      timestamp: new Date().toISOString(),
      level,
      message,
      context,
    };
  }

  debug(message: string, context?: Record<string, any>): void {
    if (this.shouldLog('debug')) {
      console.log(JSON.stringify(this.formatEntry('debug', message, context)));
    }
  }

  info(message: string, context?: Record<string, any>): void {
    if (this.shouldLog('info')) {
      console.log(JSON.stringify(this.formatEntry('info', message, context)));
    }
  }

  warn(message: string, context?: Record<string, any>): void {
    if (this.shouldLog('warn')) {
      console.warn(JSON.stringify(this.formatEntry('warn', message, context)));
    }
  }

  error(message: string, context?: Record<string, any>): void {
    if (this.shouldLog('error')) {
      console.error(JSON.stringify(this.formatEntry('error', message, context)));
    }
  }
}
