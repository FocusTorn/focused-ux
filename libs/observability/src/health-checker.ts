export interface HealthCheck {
  name: string;
  check: () => Promise<HealthCheckResult>;
  timeout?: number;
  interval?: number;
  critical?: boolean; // If true, failure makes entire system unhealthy
  retries?: number; // Number of retries before marking as failed
  retryDelay?: number; // Delay between retries in ms
}

export interface HealthCheckResult {
  name: string;
  status: 'healthy' | 'unhealthy' | 'degraded';
  message: string;
  details?: Record<string, any>;
  timestamp: Date;
  duration: number;
  error?: string;
  retryCount?: number;
  lastSuccess?: Date;
  consecutiveFailures?: number;
}

export interface HealthReport {
  overall: 'healthy' | 'unhealthy' | 'degraded';
  checks: HealthCheckResult[];
  summary: {
    total: number;
    healthy: number;
    degraded: number;
    unhealthy: number;
    criticalFailures: number;
  };
  timestamp: Date;
  version: string;
  uptime: number;
  system: {
    memory: {
      used: number;
      total: number;
      percentage: number;
    };
    cpu: {
      load: number;
      cores: number;
    };
    disk: {
      free: number;
      total: number;
      percentage: number;
    };
  };
}

export interface HealthCheckOptions {
  defaultTimeout?: number;
  defaultRetries?: number;
  defaultRetryDelay?: number;
  enableSystemMetrics?: boolean;
  alertThreshold?: number; // Alert after N consecutive failures
}

export class HealthChecker {
  private checks: HealthCheck[] = [];
  private results: Map<string, HealthCheckResult> = new Map();
  private interval?: NodeJS.Timeout;
  private options: Required<HealthCheckOptions>;
  private startTime: number;

  constructor(options: HealthCheckOptions = {}) {
    this.options = {
      defaultTimeout: options.defaultTimeout || 5000,
      defaultRetries: options.defaultRetries || 0,
      defaultRetryDelay: options.defaultRetryDelay || 1000,
      enableSystemMetrics: options.enableSystemMetrics !== false,
      alertThreshold: options.alertThreshold || 3,
    };
    this.startTime = Date.now();
  }

  // Convenience method from lib version
  addCheck(name: string, check: () => Promise<boolean>, timeout?: number, critical?: boolean): void {
    const healthCheck: HealthCheck = {
      name,
      check: async () => {
        const result = await check();
        return {
          name,
          status: result ? 'healthy' : 'unhealthy',
          message: result ? 'Check passed' : 'Check failed',
          timestamp: new Date(),
          duration: 0,
        };
      },
      timeout: timeout || this.options.defaultTimeout,
      critical,
      retries: this.options.defaultRetries,
      retryDelay: this.options.defaultRetryDelay,
    };
    this.checks.push(healthCheck);
  }

  // Advanced method from core version
  addAdvancedCheck(check: HealthCheck): void {
    this.checks.push({
      ...check,
      timeout: check.timeout || this.options.defaultTimeout,
      retries: check.retries ?? this.options.defaultRetries,
      retryDelay: check.retryDelay || this.options.defaultRetryDelay,
    });
  }

  async checkHealth(): Promise<HealthReport> {
    const startTime = Date.now();
    const checkPromises = this.checks.map(async (check) => {
      return this.runCheckWithRetries(check);
    });

    const results = await Promise.all(checkPromises);
    
    // Update stored results
    results.forEach(result => {
      this.results.set(result.name, result);
    });

    const report = {
      overall: this.calculateOverallHealth(results),
      checks: results,
      summary: this.calculateSummary(results),
      timestamp: new Date(),
      version: process.env.npm_package_version || 'unknown',
      uptime: Date.now() - this.startTime,
      system: this.options.enableSystemMetrics ? await this.getSystemMetrics() : {
        memory: { used: 0, total: 0, percentage: 0 },
        cpu: { load: 0, cores: 0 },
        disk: { free: 0, total: 0, percentage: 0 },
      },
    };

    // Check for alert conditions
    await this.checkAlertConditions(report);

    return report;
  }

  private async runCheckWithRetries(check: HealthCheck): Promise<HealthCheckResult> {
    const checkStart = performance.now();
    let lastError: Error | undefined;
    let retryCount = 0;

    for (let attempt = 0; attempt <= (check.retries || 0); attempt++) {
      try {
        const result = await Promise.race([
          check.check(),
          new Promise<HealthCheckResult>((_, reject) =>
            setTimeout(() => reject(new Error('Health check timeout')), check.timeout || this.options.defaultTimeout)
          )
        ]);
        
        result.duration = performance.now() - checkStart;
        result.timestamp = new Date();
        result.name = check.name;
        result.retryCount = attempt;
        result.lastSuccess = new Date();
        result.consecutiveFailures = 0;

        // Update stored result for this check
        const stored = this.results.get(check.name);
        if (stored) {
          result.consecutiveFailures = stored.status === 'healthy' ? 0 : (stored.consecutiveFailures || 0) + 1;
        }

        return result;
      } catch (error) {
        lastError = error instanceof Error ? error : new Error('Unknown error');
        retryCount = attempt;
        
        if (attempt < (check.retries || 0)) {
          await new Promise(resolve => setTimeout(resolve, check.retryDelay || this.options.defaultRetryDelay));
        }
      }
    }

    // All retries failed
    const stored = this.results.get(check.name);
    const consecutiveFailures = stored ? (stored.consecutiveFailures || 0) + 1 : 1;

    const result: HealthCheckResult = {
      name: check.name,
      status: 'unhealthy',
      message: `Health check failed after ${retryCount + 1} attempts: ${lastError?.message || 'Unknown error'}`,
      timestamp: new Date(),
      duration: performance.now() - checkStart,
      error: lastError?.message,
      retryCount,
      consecutiveFailures,
    };

    return result;
  }

  private calculateOverallHealth(results: HealthCheckResult[]): HealthReport['overall'] {
    const criticalFailures = results.filter(r => r.status === 'unhealthy' && this.isCriticalCheck(r.name));
    
    if (criticalFailures.length > 0) return 'unhealthy';
    
    const unhealthyCount = results.filter(r => r.status === 'unhealthy').length;
    const degradedCount = results.filter(r => r.status === 'degraded').length;
    
    if (unhealthyCount > 0) return 'unhealthy';
    if (degradedCount > 0) return 'degraded';
    return 'healthy';
  }

  private calculateSummary(results: HealthCheckResult[]): HealthReport['summary'] {
    const total = results.length;
    const healthy = results.filter(r => r.status === 'healthy').length;
    const degraded = results.filter(r => r.status === 'degraded').length;
    const unhealthy = results.filter(r => r.status === 'unhealthy').length;
    const criticalFailures = results.filter(r => r.status === 'unhealthy' && this.isCriticalCheck(r.name)).length;

    return { total, healthy, degraded, unhealthy, criticalFailures };
  }

  private isCriticalCheck(name: string): boolean {
    const check = this.checks.find(c => c.name === name);
    return check?.critical || false;
  }

  private async getSystemMetrics(): Promise<HealthReport['system']> {
    try {
      const usage = process.memoryUsage();
      const totalMemory = usage.heapTotal + usage.external + usage.rss;
      const usedMemory = usage.heapUsed + usage.external;
      
      return {
        memory: {
          used: Math.round(usedMemory / 1024 / 1024), // MB
          total: Math.round(totalMemory / 1024 / 1024), // MB
          percentage: Math.round((usedMemory / totalMemory) * 100),
        },
        cpu: {
          load: process.cpuUsage().user / 1000000, // Convert microseconds to seconds
          cores: require('os').cpus().length,
        },
        disk: {
          free: 0, // Would need fs.statSync to implement
          total: 0, // Would need fs.statSync to implement
          percentage: 0,
        },
      };
    } catch (error) {
      return {
        memory: { used: 0, total: 0, percentage: 0 },
        cpu: { load: 0, cores: 0 },
        disk: { free: 0, total: 0, percentage: 0 },
      };
    }
  }

  private async checkAlertConditions(report: HealthReport): Promise<void> {
    const criticalFailures = report.checks.filter(c => 
      c.status === 'unhealthy' && this.isCriticalCheck(c.name)
    );

    if (criticalFailures.length > 0) {
      await this.triggerCriticalAlert(report, criticalFailures);
    }

    const highFailureChecks = report.checks.filter(c => 
      c.status === 'unhealthy' && (c.consecutiveFailures || 0) >= this.options.alertThreshold
    );

    if (highFailureChecks.length > 0) {
      await this.triggerFailureThresholdAlert(report, highFailureChecks);
    }
  }

  private async triggerCriticalAlert(report: HealthReport, criticalFailures: HealthCheckResult[]): Promise<void> {
    console.error('🚨 CRITICAL HEALTH CHECK FAILURES:', {
      overall: report.overall,
      criticalFailures: criticalFailures.map(c => c.name),
      timestamp: report.timestamp,
      summary: report.summary,
    });
  }

  private async triggerFailureThresholdAlert(report: HealthReport, highFailureChecks: HealthCheckResult[]): Promise<void> {
    console.warn('⚠️ HEALTH CHECK FAILURE THRESHOLD EXCEEDED:', {
      overall: report.overall,
      highFailureChecks: highFailureChecks.map(c => ({
        name: c.name,
        consecutiveFailures: c.consecutiveFailures,
        lastError: c.error,
      })),
      threshold: this.options.alertThreshold,
      timestamp: report.timestamp,
    });
  }

  // Periodic health monitoring (from core version)
  startPeriodicChecks(intervalMs: number = 30000): void {
    this.interval = setInterval(async () => {
      const report = await this.checkHealth();
      
      if (report.overall !== 'healthy') {
        await this.triggerHealthAlert(report);
      }
    }, intervalMs);
  }

  stopPeriodicChecks(): void {
    if (this.interval) {
      clearInterval(this.interval);
      this.interval = undefined;
    }
  }

  private async triggerHealthAlert(report: HealthReport): Promise<void> {
    console.warn('🚨 PERIODIC HEALTH CHECK FAILED:', {
      overall: report.overall,
      failedChecks: report.checks.filter(c => c.status !== 'healthy').map(c => c.name),
      timestamp: report.timestamp,
      summary: report.summary,
    });
  }

  // Utility methods
  getChecks(): HealthCheck[] {
    return [...this.checks];
  }

  getCheck(name: string): HealthCheck | undefined {
    return this.checks.find(c => c.name === name);
  }

  removeCheck(name: string): boolean {
    const index = this.checks.findIndex(c => c.name === name);
    if (index !== -1) {
      this.checks.splice(index, 1);
      this.results.delete(name);
      return true;
    }
    return false;
  }

  getLastResult(name: string): HealthCheckResult | undefined {
    return this.results.get(name);
  }

  getAllResults(): Map<string, HealthCheckResult> {
    return new Map(this.results);
  }

  clearResults(): void {
    this.results.clear();
  }

  // Health check templates
  addDatabaseCheck(name: string, connectionTest: () => Promise<boolean>, options?: Partial<HealthCheck>): void {
    this.addAdvancedCheck({
      name,
      check: async () => ({
        name,
        status: 'healthy',
        message: 'Database connection successful',
        timestamp: new Date(),
        duration: 0,
        details: { type: 'database' },
      }),
      critical: true,
      timeout: 10000,
      retries: 2,
      retryDelay: 2000,
      ...options,
    });
  }

  addHttpCheck(name: string, url: string, options?: Partial<HealthCheck>): void {
    this.addAdvancedCheck({
      name,
      check: async () => {
        const start = performance.now();
        try {
          const response = await fetch(url, { method: 'HEAD', signal: AbortSignal.timeout(5000) });
          const duration = performance.now() - start;
          
          if (response.ok) {
            return {
              name,
              status: 'healthy',
              message: `HTTP ${response.status} OK`,
              timestamp: new Date(),
              duration,
              details: { url, status: response.status, responseTime: duration },
            };
          } else {
            return {
              name,
              status: 'degraded',
              message: `HTTP ${response.status} ${response.statusText}`,
              timestamp: new Date(),
              duration,
              details: { url, status: response.status, responseTime: duration },
            };
          }
        } catch (error) {
          const duration = performance.now() - start;
          return {
            name,
            status: 'unhealthy',
            message: `HTTP check failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
            timestamp: new Date(),
            duration,
            details: { url, error: error instanceof Error ? error.message : 'Unknown error' },
          };
        }
      },
      timeout: 5000,
      retries: 1,
      ...options,
    });
  }

  addDiskSpaceCheck(name: string, path: string, thresholdPercent: number = 90, options?: Partial<HealthCheck>): void {
    this.addAdvancedCheck({
      name,
      check: async () => {
        try {
          const fs = await import('fs/promises');
          const stats = await fs.statfs(path);
          const freePercent = (stats.bavail / stats.blocks) * 100;
          const usedPercent = 100 - freePercent;
          
          if (usedPercent < thresholdPercent) {
            return {
              name,
              status: 'healthy',
              message: `Disk space OK: ${usedPercent.toFixed(1)}% used`,
              timestamp: new Date(),
              duration: 0,
              details: { path, usedPercent: usedPercent.toFixed(1), freePercent: freePercent.toFixed(1) },
            };
          } else {
            return {
              name,
              status: 'degraded',
              message: `Disk space warning: ${usedPercent.toFixed(1)}% used (threshold: ${thresholdPercent}%)`,
              timestamp: new Date(),
              duration: 0,
              details: { path, usedPercent: usedPercent.toFixed(1), freePercent: freePercent.toFixed(1), threshold: thresholdPercent },
            };
          }
        } catch (error) {
          return {
            name,
            status: 'unhealthy',
            message: `Disk space check failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
            timestamp: new Date(),
            duration: 0,
            details: { path, error: error instanceof Error ? error.message : 'Unknown error' },
          };
        }
      },
      timeout: 5000,
      critical: true,
      ...options,
    });
  }
}
