export interface Metric {
  name: string;
  value: number;
  timestamp: string;
  tags?: Record<string, string>;
}

export interface MetricsCollectorOptions {
  flushInterval?: number;
  maxBufferSize?: number;
}

export class MetricsCollector {
  private metrics: Metric[] = [];
  private options: Required<MetricsCollectorOptions>;

  constructor(options: MetricsCollectorOptions = {}) {
    this.options = {
      flushInterval: options.flushInterval || 60000, // 1 minute
      maxBufferSize: options.maxBufferSize || 1000,
    };
  }

  increment(name: string, value: number = 1, tags?: Record<string, string>): void {
    this.record(name, value, tags);
  }

  gauge(name: string, value: number, tags?: Record<string, string>): void {
    this.record(name, value, tags);
  }

  timing(name: string, value: number, tags?: Record<string, string>): void {
    this.record(name, value, tags);
  }

  private record(name: string, value: number, tags?: Record<string, string>): void {
    const metric: Metric = {
      name,
      value,
      timestamp: new Date().toISOString(),
      tags,
    };

    this.metrics.push(metric);

    if (this.metrics.length >= this.options.maxBufferSize) {
      this.flush();
    }
  }

  flush(): Metric[] {
    const metrics = [...this.metrics];
    this.metrics = [];
    return metrics;
  }

  getMetrics(): Metric[] {
    return [...this.metrics];
  }
}
