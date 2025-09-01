export interface HealthCheck {
  name: string;
  check: () => Promise<boolean>;
  timeout?: number;
}

export interface HealthStatus {
  status: 'healthy' | 'unhealthy';
  timestamp: string;
  checks: Record<string, { status: 'healthy' | 'unhealthy'; duration: number; error?: string }>;
}

export class HealthChecker {
  private checks: HealthCheck[] = [];

  addCheck(name: string, check: () => Promise<boolean>, timeout: number = 5000): void {
    this.checks.push({ name, check, timeout });
  }

  async checkHealth(): Promise<HealthStatus> {
    const startTime = Date.now();
    const checkResults: Record<string, { status: 'healthy' | 'unhealthy'; duration: number; error?: string }> = {};

    for (const healthCheck of this.checks) {
      const checkStartTime = Date.now();
      let status: 'healthy' | 'unhealthy' = 'healthy';
      let error: string | undefined;

      try {
        const result = await Promise.race([
          healthCheck.check(),
          new Promise<never>((_, reject) =>
            setTimeout(() => reject(new Error('Health check timeout')), healthCheck.timeout)
          ),
        ]);

        if (!result) {
          status = 'unhealthy';
          error = 'Health check returned false';
        }
      } catch (err) {
        status = 'unhealthy';
        error = err instanceof Error ? err.message : 'Unknown error';
      }

      const duration = Date.now() - checkStartTime;
      checkResults[healthCheck.name] = { status, duration, error };
    }

    const overallStatus: 'healthy' | 'unhealthy' = Object.values(checkResults).every(
      check => check.status === 'healthy'
    ) ? 'healthy' : 'unhealthy';

    return {
      status: overallStatus,
      timestamp: new Date().toISOString(),
      checks: checkResults,
    };
  }

  getChecks(): HealthCheck[] {
    return [...this.checks];
  }
}
