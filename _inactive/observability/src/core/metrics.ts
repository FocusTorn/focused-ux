interface MetricValue {
  name: string;
  value: number;
  unit: string;
  timestamp: Date;
  tags: Record<string, string>;
}

interface MetricDefinition {
  name: string;
  type: 'counter' | 'gauge' | 'histogram' | 'summary';
  description: string;
  unit: string;
  tags: string[];
}

interface MetricsExporter {
  export(metrics: MetricValue[]): Promise<void>;
}

class PrometheusExporter implements MetricsExporter {
  async export(metrics: MetricValue[]): Promise<void> {
    // Implementation for Prometheus export
    console.log('Exporting metrics to Prometheus:', metrics.length);
  }
}

class InfluxDBExporter implements MetricsExporter {
  async export(metrics: MetricValue[]): Promise<void> {
    // Implementation for InfluxDB export
    console.log('Exporting metrics to InfluxDB:', metrics.length);
  }
}

class ConsoleExporter implements MetricsExporter {
  async export(metrics: MetricValue[]): Promise<void> {
    // Implementation for console export
    console.log('Exporting metrics to console:', metrics.length);
  }
}

export class MetricsCollector {
  private metrics: Map<string, MetricDefinition> = new Map();
  private values: MetricValue[] = [];
  private exporters: MetricsExporter[] = [];

  constructor() {
    this.exporters = [
      new PrometheusExporter(),
      new InfluxDBExporter(),
      new ConsoleExporter()
    ];
  }

  defineMetric(definition: MetricDefinition): void {
    this.metrics.set(definition.name, definition);
  }

  recordMetric(name: string, value: number, tags: Record<string, string> = {}): void {
    const definition = this.metrics.get(name);
    if (!definition) {
      throw new Error(`Metric '${name}' not defined`);
    }

    const metricValue: MetricValue = {
      name,
      value,
      unit: definition.unit,
      timestamp: new Date(),
      tags
    };

    this.values.push(metricValue);
    this.exportMetrics();
  }

  incrementCounter(name: string, tags: Record<string, string> = {}): void {
    this.recordMetric(name, 1, tags);
  }

  setGauge(name: string, value: number, tags: Record<string, string> = {}): void {
    this.recordMetric(name, value, tags);
  }

  recordHistogram(name: string, value: number, tags: Record<string, string> = {}): void {
    this.recordMetric(name, value, tags);
  }

  getMetrics(): MetricValue[] {
    return [...this.values];
  }

  private async exportMetrics(): Promise<void> {
    const metricsToExport = this.values.splice(0);
    
    await Promise.all(
      this.exporters.map(exporter => exporter.export(metricsToExport))
    );
  }
}
