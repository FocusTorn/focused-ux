import process from 'node:process'

export interface MetricValue {
  name: string
  value: number
  unit: string
  timestamp: Date
  tags: Record<string, string>
  metadata?: Record<string, any>
}

export interface MetricDefinition {
  name: string
  type: 'counter' | 'gauge' | 'histogram' | 'summary' | 'rate'
  description: string
  unit: string
  tags: string[]
  aggregation?: 'sum' | 'avg' | 'min' | 'max' | 'count'
}

export interface MetricsCollectorOptions {
  flushInterval?: number
  maxBufferSize?: number
  enableAggregation?: boolean
  enableSystemMetrics?: boolean
  aggregationWindow?: number
}

export interface MetricsExporter {
  export(metrics: MetricValue[]): Promise<void>
}

export interface AggregatedMetric {
  name: string
  type: string
  value: number
  count: number
  min: number
  max: number
  avg: number
  sum: number
  timestamp: Date
  tags: Record<string, string>
}

export class ConsoleExporter implements MetricsExporter {
  async export(metrics: MetricValue[]): Promise<void> {
    console.log(`[METRICS] Exporting ${metrics.length} metrics to console`)
    metrics.forEach(metric => {
      console.log(`  ${metric.name}: ${metric.value}${metric.unit}`, {
        timestamp: metric.timestamp,
        tags: metric.tags,
        ...metric.metadata
      })
    })
  }
}

export class PrometheusExporter implements MetricsExporter {
  async export(metrics: MetricValue[]): Promise<void> {
    // TODO: Implement Prometheus format export
    console.log(`[METRICS] Exporting ${metrics.length} metrics to Prometheus`)
  }
}

export class InfluxDBExporter implements MetricsExporter {
  async export(metrics: MetricValue[]): Promise<void> {
    // TODO: Implement InfluxDB format export
    console.log(`[METRICS] Exporting ${metrics.length} metrics to InfluxDB`)
  }
}

export class MetricsCollector {
  private metrics: Map<string, MetricDefinition> = new Map()
  private values: MetricValue[] = []
  private exporters: MetricsExporter[] = []
  private options: Required<MetricsCollectorOptions>
  private aggregationBuffer: Map<string, number[]> = new Map()
  private lastFlush: number = Date.now()
  private flushTimer?: NodeJS.Timeout

  constructor(options: MetricsCollectorOptions = {}) {
    this.options = {
      flushInterval: options.flushInterval || 60000, // 1 minute
      maxBufferSize: options.maxBufferSize || 1000,
      enableAggregation: options.enableAggregation || false,
      enableSystemMetrics: options.enableSystemMetrics || false,
      aggregationWindow: options.aggregationWindow || 5000 // 5 seconds
    }

    this.exporters = [
      new ConsoleExporter(),
      new PrometheusExporter(),
      new InfluxDBExporter()
    ]

    // Only start timers if explicitly enabled
    if (this.options.enableSystemMetrics) {
      this.setupSystemMetrics()
    }

    if (this.options.flushInterval > 0) {
      this.startFlushTimer()
    }
  }

  // Metric definition and recording
  defineMetric(definition: MetricDefinition): void {
    this.metrics.set(definition.name, definition)
  }

  recordMetric(name: string, value: number, tags: Record<string, string> = {}, metadata?: Record<string, any>): void {
    const definition = this.metrics.get(name)
    if (!definition) {
      // Auto-create definition if not defined
      this.defineMetric({
        name,
        type: 'gauge',
        description: `Auto-generated metric: ${name}`,
        unit: 'count',
        tags: Object.keys(tags)
      })
    }

    const metricValue: MetricValue = {
      name,
      value,
      unit: definition?.unit || 'count',
      timestamp: new Date(),
      tags,
      metadata
    }

    this.values.push(metricValue)

    if (this.options.enableAggregation) {
      this.addToAggregationBuffer(name, value, tags)
    }

    if (this.values.length >= this.options.maxBufferSize) {
      this.flush()
    }
  }

  // Convenience methods for different metric types
  increment(name: string, value: number = 1, tags: Record<string, string> = {}): void {
    this.recordMetric(name, value, tags)
  }

  gauge(name: string, value: number, tags: Record<string, string> = {}): void {
    this.recordMetric(name, value, tags)
  }

  timing(name: string, value: number, tags: Record<string, string> = {}): void {
    this.recordMetric(name, value, { ...tags, unit: 'ms' })
  }

  histogram(name: string, value: number, tags: Record<string, string> = {}): void {
    this.recordMetric(name, value, { ...tags, type: 'histogram' })
  }

  // Advanced metric methods
  recordHistogram(name: string, values: number[], tags: Record<string, string> = {}): void {
    if (values.length === 0) return

    const stats = this.calculateHistogramStats(values)
    this.recordMetric(`${name}_count`, values.length, tags)
    this.recordMetric(`${name}_sum`, stats.sum, tags)
    this.recordMetric(`${name}_min`, stats.min, tags)
    this.recordMetric(`${name}_max`, stats.max, tags)
    this.recordMetric(`${name}_avg`, stats.avg, tags)
    this.recordMetric(`${name}_p50`, stats.p50, tags)
    this.recordMetric(`${name}_p95`, stats.p95, tags)
    this.recordMetric(`${name}_p99`, stats.p99, tags)
  }

  recordSummary(name: string, value: number, tags: Record<string, string> = {}): void {
    this.recordMetric(name, value, { ...tags, type: 'summary' })
  }

  // Rate calculation
  recordRate(name: string, count: number, interval: number, tags: Record<string, string> = {}): void {
    const rate = count / (interval / 1000) // per second
    this.recordMetric(name, rate, { ...tags, unit: 'per_second' })
  }

  // System metrics
  private setupSystemMetrics(): void {
    setInterval(() => {
      const usage = process.memoryUsage()
      const cpuUsage = process.cpuUsage()
      
      this.recordMetric('system.memory.heap_used', usage.heapUsed, {}, { source: 'system' })
      this.recordMetric('system.memory.heap_total', usage.heapTotal, {}, { source: 'system' })
      this.recordMetric('system.memory.external', usage.external, {}, { source: 'system' })
      this.recordMetric('system.cpu.user', cpuUsage.user, {}, { source: 'system' })
      this.recordMetric('system.cpu.system', cpuUsage.system, {}, { source: 'system' })
      this.recordMetric('system.uptime', process.uptime(), {}, { source: 'system' })
    }, 10000) // Every 10 seconds
  }

  // Aggregation methods
  private addToAggregationBuffer(name: string, value: number, tags: Record<string, string>): void {
    const key = this.getAggregationKey(name, tags)
    if (!this.aggregationBuffer.has(key)) {
      this.aggregationBuffer.set(key, [])
    }
    this.aggregationBuffer.get(key)!.push(value)
  }

  private getAggregationKey(name: string, tags: Record<string, string>): string {
    const sortedTags = Object.entries(tags)
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([k, v]) => `${k}=${v}`)
      .join(',')
    return `${name}:${sortedTags}`
  }

  private calculateHistogramStats(values: number[]): {
    sum: number
    min: number
    max: number
    avg: number
    p50: number
    p95: number
    p99: number
  } {
    const sorted = [...values].sort((a, b) => a - b)
    const sum = values.reduce((a, b) => a + b, 0)
    const min = sorted[0]
    const max = sorted[sorted.length - 1]
    const avg = sum / values.length
    const p50 = sorted[Math.floor(sorted.length * 0.5)]
    const p95 = sorted[Math.floor(sorted.length * 0.95)]
    const p99 = sorted[Math.floor(sorted.length * 0.99)]

    return { sum, min, max, avg, p50, p95, p99 }
  }

  // Export and flush methods
  private startFlushTimer(): void {
    this.flushTimer = setInterval(() => {
      this.flush()
    }, this.options.flushInterval)
  }

  async flush(): Promise<MetricValue[]> {
    const metricsToExport = [...this.values]
    this.values = []
    
    if (this.options.enableAggregation) {
      const aggregated = this.getAggregatedMetrics()
      metricsToExport.push(...aggregated)
    }

    if (metricsToExport.length > 0) {
      await this.exportMetrics(metricsToExport)
      this.lastFlush = Date.now()
    }

    return metricsToExport
  }

  private getAggregatedMetrics(): MetricValue[] {
    const aggregated: MetricValue[] = []
    
    for (const [key, values] of this.aggregationBuffer.entries()) {
      if (values.length === 0) continue
      
      const [name, tagsStr] = key.split(':', 2)
      const tags = this.parseTagsString(tagsStr)
      const stats = this.calculateHistogramStats(values)
      
      aggregated.push({
        name: `${name}_aggregated`,
        value: stats.avg,
        unit: 'aggregated',
        timestamp: new Date(),
        tags: { ...tags, aggregation: 'avg' },
        metadata: { count: values.length, min: stats.min, max: stats.max, sum: stats.sum }
      })
    }
    
    this.aggregationBuffer.clear()
    return aggregated
  }

  private parseTagsString(tagsStr: string): Record<string, string> {
    if (!tagsStr) return {}
    
    const tags: Record<string, string> = {}
    tagsStr.split(',').forEach(pair => {
      const [key, value] = pair.split('=')
      if (key && value) {
        tags[key.trim()] = value.trim()
      }
    })
    return tags
  }

  private async exportMetrics(metrics: MetricValue[]): Promise<void> {
    await Promise.all(this.exporters.map(exporter => exporter.export(metrics)))
  }

  // Public API methods
  getMetrics(): MetricValue[] {
    return [...this.values]
  }

  getMetricDefinitions(): Map<string, MetricDefinition> {
    return new Map(this.metrics)
  }

  addExporter(exporter: MetricsExporter): void {
    this.exporters.push(exporter)
  }

  removeExporter(exporter: MetricsExporter): void {
    const index = this.exporters.indexOf(exporter)
    if (index > -1) {
      this.exporters.splice(index, 1)
    }
  }

  // Cleanup
  destroy(): void {
    if (this.flushTimer) {
      clearInterval(this.flushTimer)
    }
    this.flush()
  }
}
