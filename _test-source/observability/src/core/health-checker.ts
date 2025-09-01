interface HealthCheck {
  name: string;
  check: () => Promise<HealthCheckResult>;
  timeout?: number;
  interval?: number;
}

interface HealthCheckResult {
  status: 'healthy' | 'unhealthy' | 'degraded';
  message: string;
  details?: Record<string, any>;
  timestamp: Date;
  duration: number;
}

interface HealthReport {
  overall: 'healthy' | 'unhealthy' | 'degraded';
  checks: HealthCheckResult[];
  timestamp: Date;
  version: string;
  uptime: number;
}

export class HealthChecker {
  private checks: HealthCheck[] = [];
  private results: Map<string, HealthCheckResult> = new Map();
  private interval?: NodeJS.Timeout;

  addCheck(check: HealthCheck): void {
    this.checks.push(check);
  }

  async runChecks(): Promise<HealthReport> {
    const startTime = Date.now();
    const checkPromises = this.checks.map(async (check) => {
      const checkStart = performance.now();
      
      try {
        const result = await Promise.race([
          check.check(),
          new Promise<HealthCheckResult>((_, reject) =>
            setTimeout(() => reject(new Error('Health check timeout')), check.timeout || 5000)
          )
        ]);
        
        result.duration = performance.now() - checkStart;
        result.timestamp = new Date();
        
        this.results.set(check.name, result);
        return result;
      } catch (error) {
        const result: HealthCheckResult = {
          status: 'unhealthy',
          message: `Health check failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
          timestamp: new Date(),
          duration: performance.now() - checkStart
        };
        
        this.results.set(check.name, result);
        return result;
      }
    });

    const results = await Promise.all(checkPromises);
    
    return {
      overall: this.calculateOverallHealth(results),
      checks: results,
      timestamp: new Date(),
      version: process.env.npm_package_version || 'unknown',
      uptime: Date.now() - startTime
    };
  }

  startPeriodicChecks(intervalMs: number = 30000): void {
    this.interval = setInterval(async () => {
      const report = await this.runChecks();
      
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

  private calculateOverallHealth(results: HealthCheckResult[]): HealthReport['overall'] {
    const unhealthyCount = results.filter(r => r.status === 'unhealthy').length;
    const degradedCount = results.filter(r => r.status === 'degraded').length;
    
    if (unhealthyCount > 0) return 'unhealthy';
    if (degradedCount > 0) return 'degraded';
    return 'healthy';
  }

  private async triggerHealthAlert(report: HealthReport): Promise<void> {
    console.warn('🚨 HEALTH CHECK FAILED:', {
      overall: report.overall,
      failedChecks: report.checks.filter(c => c.status !== 'healthy').map(c => c.name),
      timestamp: report.timestamp
    });
  }
}
