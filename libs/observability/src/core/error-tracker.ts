interface ErrorContext {
  packageName: string;
  operation: string;
  userId?: string;
  sessionId?: string;
  correlationId?: string;
  metadata?: Record<string, any>;
  stack?: string;
}

interface ErrorReport {
  id: string;
  timestamp: Date;
  error: Error;
  context: ErrorContext;
  severity: 'low' | 'medium' | 'high' | 'critical';
  frequency: number;
  firstSeen: Date;
  lastSeen: Date;
}

interface ErrorReporter {
  report(report: ErrorReport): Promise<void>;
}

class ConsoleErrorReporter implements ErrorReporter {
  async report(report: ErrorReport): Promise<void> {
    console.error('Error Report:', {
      id: report.id,
      message: report.error.message,
      severity: report.severity,
      frequency: report.frequency,
      package: report.context.packageName,
      operation: report.context.operation,
      firstSeen: report.firstSeen,
      lastSeen: report.lastSeen
    });
  }
}

class SentryErrorReporter implements ErrorReporter {
  async report(report: ErrorReport): Promise<void> {
    // Implementation for Sentry error reporting
    console.log('Reporting error to Sentry:', report.id);
  }
}

class CustomErrorReporter implements ErrorReporter {
  async report(report: ErrorReport): Promise<void> {
    // Implementation for custom error reporting
    console.log('Reporting error to custom service:', report.id);
  }
}

export class ErrorTracker {
  private errors: Map<string, ErrorReport> = new Map();
  private reporters: ErrorReporter[] = [];

  constructor() {
    this.reporters = [
      new ConsoleErrorReporter(),
      new SentryErrorReporter(),
      new CustomErrorReporter()
    ];
  }

  async trackError(error: Error, context: ErrorContext): Promise<void> {
    const errorId = this.generateErrorId(error, context);
    const now = new Date();
    
    let report = this.errors.get(errorId);
    
    if (report) {
      report.frequency++;
      report.lastSeen = now;
    } else {
      report = {
        id: errorId,
        timestamp: now,
        error,
        context,
        severity: this.calculateSeverity(error, context),
        frequency: 1,
        firstSeen: now,
        lastSeen: now
      };
      this.errors.set(errorId, report);
    }

    await Promise.all(
      this.reporters.map(reporter => reporter.report(report!))
    );

    if (report.severity === 'critical' || report.severity === 'high') {
      await this.triggerErrorAlert(report);
    }
  }

  private generateErrorId(error: Error, context: ErrorContext): string {
    const errorSignature = `${error.name}:${error.message}:${context.packageName}:${context.operation}`;
    return `err_${Buffer.from(errorSignature).toString('base64').substring(0, 16)}`;
  }

  private calculateSeverity(error: Error, context: ErrorContext): ErrorReport['severity'] {
    if (error.name === 'ValidationError') return 'low';
    if (error.name === 'NetworkError') return 'medium';
    if (error.name === 'DatabaseError') return 'high';
    if (error.name === 'SecurityError') return 'critical';
    return 'medium';
  }

  private async triggerErrorAlert(report: ErrorReport): Promise<void> {
    console.error(`🚨 CRITICAL ERROR: ${report.error.message}`, {
      package: report.context.packageName,
      operation: report.context.operation,
      frequency: report.frequency,
      firstSeen: report.firstSeen,
      lastSeen: report.lastSeen
    });
  }
}
