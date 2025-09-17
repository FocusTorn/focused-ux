export interface ErrorEntry {
  id: string;
  error: Error;
  timestamp: string;
  context?: Record<string, any>;
  stack?: string;
}

export interface ErrorTrackerOptions {
  maxErrors?: number;
  captureStack?: boolean;
}

export class ErrorTracker {
  private errors: ErrorEntry[] = [];
  private options: Required<ErrorTrackerOptions>;

  constructor(options: ErrorTrackerOptions = {}) {
    this.options = {
      maxErrors: options.maxErrors || 100,
      captureStack: options.captureStack !== false,
    };
  }

  capture(error: Error, context?: Record<string, any>): string {
    const errorEntry: ErrorEntry = {
      id: this.generateId(),
      error,
      timestamp: new Date().toISOString(),
      context,
      stack: this.options.captureStack ? error.stack : undefined,
    };

    this.errors.push(errorEntry);

    // Keep only the most recent errors
    if (this.errors.length > this.options.maxErrors) {
      this.errors = this.errors.slice(-this.options.maxErrors);
    }

    return errorEntry.id;
  }

  getError(id: string): ErrorEntry | undefined {
    return this.errors.find(error => error.id === id);
  }

  getErrors(): ErrorEntry[] {
    return [...this.errors];
  }

  clear(): void {
    this.errors = [];
  }

  private generateId(): string {
    return Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
  }
}
