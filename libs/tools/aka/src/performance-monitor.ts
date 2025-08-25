#!/usr/bin/env node

import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const __filename = fileURLToPath(import.meta.url)
const ROOT = path.resolve(path.dirname(__filename), '../../../../')

export interface TestPerformanceMetrics {
	project: string
	target: string
	startTime: number
	endTime: number
	duration: number
	testCount?: number
	memoryPeak?: number
	buildDependencies?: string[]
	buildTime?: number
	coverageTime?: number
	status: 'success' | 'failure' | 'timeout'
	error?: string
}

export interface PerformanceBaseline {
	project: string
	target: string
	baselineMetrics: {
		duration: number
		testCount: number
		memoryPeak: number
		buildTime: number
		coverageTime: number
	}
	thresholds: {
		duration: number // percentage increase allowed
		memoryPeak: number // percentage increase allowed
		buildTime: number // percentage increase allowed
	}
	lastUpdated: string
	version: string
}

export interface PerformanceReport {
	timestamp: string
	project: string
	target: string
	metrics: TestPerformanceMetrics
	baseline?: PerformanceBaseline
	analysis: {
		durationDeviation: number
		memoryDeviation: number
		buildTimeDeviation: number
		status: 'within_threshold' | 'regression' | 'improvement' | 'no_baseline'
		recommendations: string[]
	}
}

export class PerformanceMonitor {
	private startTime: number = 0
	private startMemory: number = 0
	private metrics: TestPerformanceMetrics | null = null

	startMonitoring(project: string, target: string): void {
		this.startTime = Date.now()
		this.startMemory = this.getMemoryUsage()
		
		this.metrics = {
			project,
			target,
			startTime: this.startTime,
			endTime: 0,
			duration: 0,
			status: 'success'
		}
	}

	endMonitoring(status: 'success' | 'failure' | 'timeout' = 'success', error?: string): TestPerformanceMetrics | null {
		if (!this.metrics) {
			return null
		}

		const endTime = Date.now()
		const endMemory = this.getMemoryUsage()
		
		this.metrics.endTime = endTime
		this.metrics.duration = endTime - this.startTime
		this.metrics.memoryPeak = endMemory - this.startMemory
		this.metrics.status = status
		this.metrics.error = error

		return this.metrics
	}

	private getMemoryUsage(): number {
		const memUsage = process.memoryUsage()
		return memUsage.heapUsed / 1024 / 1024 // Convert to MB
	}

	loadBaseline(project: string, target: string): PerformanceBaseline | null {
		const baselinePath = path.join(ROOT, 'performance-baselines', `${project}-${target}.json`)
		
		if (!fs.existsSync(baselinePath)) {
			return null
		}

		try {
			const baselineData = fs.readFileSync(baselinePath, 'utf-8')
			return JSON.parse(baselineData) as PerformanceBaseline
		} catch (error) {
			console.warn(`Failed to load baseline for ${project}-${target}:`, error)
			return null
		}
	}

	saveBaseline(baseline: PerformanceBaseline): void {
		const baselineDir = path.join(ROOT, 'performance-baselines')
		const baselinePath = path.join(baselineDir, `${baseline.project}-${baseline.target}.json`)
		
		// Ensure directory exists
		if (!fs.existsSync(baselineDir)) {
			fs.mkdirSync(baselineDir, { recursive: true })
		}

		try {
			fs.writeFileSync(baselinePath, JSON.stringify(baseline, null, 2))
		} catch (error) {
			console.error(`Failed to save baseline for ${baseline.project}-${baseline.target}:`, error)
		}
	}

	createBaselineFromMetrics(metrics: TestPerformanceMetrics): PerformanceBaseline {
		return {
			project: metrics.project,
			target: metrics.target,
			baselineMetrics: {
				duration: metrics.duration,
				testCount: metrics.testCount || 0,
				memoryPeak: metrics.memoryPeak || 0,
				buildTime: metrics.buildTime || 0,
				coverageTime: metrics.coverageTime || 0
			},
			thresholds: {
				duration: 20, // 20% increase allowed
				memoryPeak: 30, // 30% increase allowed
				buildTime: 25, // 25% increase allowed
			},
			lastUpdated: new Date().toISOString(),
			version: '1.0.0'
		}
	}

	analyzePerformance(metrics: TestPerformanceMetrics): PerformanceReport {
		const baseline = this.loadBaseline(metrics.project, metrics.target)
		
		if (!baseline) {
			return {
				timestamp: new Date().toISOString(),
				project: metrics.project,
				target: metrics.target,
				metrics,
				analysis: {
					durationDeviation: 0,
					memoryDeviation: 0,
					buildTimeDeviation: 0,
					status: 'no_baseline',
					recommendations: ['No baseline available. Run with --performance-baseline to establish baseline.']
				}
			}
		}

		const durationDeviation = this.calculateDeviation(metrics.duration, baseline.baselineMetrics.duration)
		const memoryDeviation = this.calculateDeviation(metrics.memoryPeak || 0, baseline.baselineMetrics.memoryPeak)
		const buildTimeDeviation = this.calculateDeviation(metrics.buildTime || 0, baseline.baselineMetrics.buildTime)

		const status = this.determineStatus(durationDeviation, memoryDeviation, buildTimeDeviation, baseline.thresholds)
		const recommendations = this.generateRecommendations(durationDeviation, memoryDeviation, buildTimeDeviation, baseline.thresholds)

		return {
			timestamp: new Date().toISOString(),
			project: metrics.project,
			target: metrics.target,
			metrics,
			baseline,
			analysis: {
				durationDeviation,
				memoryDeviation,
				buildTimeDeviation,
				status,
				recommendations
			}
		}
	}

	private calculateDeviation(current: number, baseline: number): number {
		if (baseline === 0) return 0
		return ((current - baseline) / baseline) * 100
	}

	private determineStatus(
		durationDeviation: number,
		memoryDeviation: number,
		buildTimeDeviation: number,
		thresholds: PerformanceBaseline['thresholds']
	): PerformanceReport['analysis']['status'] {
		const isRegression = 
			durationDeviation > thresholds.duration ||
			memoryDeviation > thresholds.memoryPeak ||
			buildTimeDeviation > thresholds.buildTime

		const isImprovement = 
			durationDeviation < -10 ||
			memoryDeviation < -15 ||
			buildTimeDeviation < -10

		if (isRegression) return 'regression'
		if (isImprovement) return 'improvement'
		return 'within_threshold'
	}

	private generateRecommendations(
		durationDeviation: number,
		memoryDeviation: number,
		buildTimeDeviation: number,
		thresholds: PerformanceBaseline['thresholds']
	): string[] {
		const recommendations: string[] = []

		if (durationDeviation > thresholds.duration) {
			recommendations.push(`Test execution time increased by ${durationDeviation.toFixed(1)}% (threshold: ${thresholds.duration}%). Consider splitting large test files or optimizing test setup.`)
		}

		if (memoryDeviation > thresholds.memoryPeak) {
			recommendations.push(`Memory usage increased by ${memoryDeviation.toFixed(1)}% (threshold: ${thresholds.memoryPeak}%). Check for memory leaks in test setup or cleanup.`)
		}

		if (buildTimeDeviation > thresholds.buildTime) {
			recommendations.push(`Build time increased by ${buildTimeDeviation.toFixed(1)}% (threshold: ${thresholds.buildTime}%). Review build dependencies and optimization opportunities.`)
		}

		if (durationDeviation < -10) {
			recommendations.push(`Test execution time improved by ${Math.abs(durationDeviation).toFixed(1)}%. Consider updating baseline with --performance-baseline.`)
		}

		if (recommendations.length === 0) {
			recommendations.push('Performance is within acceptable thresholds.')
		}

		return recommendations
	}

	saveReport(report: PerformanceReport): void {
		const reportsDir = path.join(ROOT, 'performance-reports')
		const reportPath = path.join(reportsDir, `${report.project}-${report.target}-${Date.now()}.json`)
		
		// Ensure directory exists
		if (!fs.existsSync(reportsDir)) {
			fs.mkdirSync(reportsDir, { recursive: true })
		}

		try {
			fs.writeFileSync(reportPath, JSON.stringify(report, null, 2))
		} catch (error) {
			console.error(`Failed to save performance report:`, error)
		}
	}

	printReport(report: PerformanceReport): void {
		console.log('\n📊 Performance Report')
		console.log('='.repeat(50))
		console.log(`Project: ${report.project}`)
		console.log(`Target: ${report.target}`)
		console.log(`Timestamp: ${report.timestamp}`)
		console.log('')
		
		console.log('📈 Metrics:')
		console.log(`  Duration: ${report.metrics.duration}ms`)
		if (report.metrics.memoryPeak) {
			console.log(`  Memory Peak: ${report.metrics.memoryPeak.toFixed(2)}MB`)
		}
		if (report.metrics.testCount) {
			console.log(`  Test Count: ${report.metrics.testCount}`)
		}
		console.log('')
		
		if (report.baseline) {
			console.log('📊 Analysis:')
			console.log(`  Duration Deviation: ${report.analysis.durationDeviation.toFixed(1)}%`)
			console.log(`  Memory Deviation: ${report.analysis.memoryDeviation.toFixed(1)}%`)
			console.log(`  Build Time Deviation: ${report.analysis.buildTimeDeviation.toFixed(1)}%`)
			console.log(`  Status: ${this.getStatusEmoji(report.analysis.status)} ${report.analysis.status}`)
			console.log('')
		}
		
		console.log('💡 Recommendations:')
		report.analysis.recommendations.forEach(rec => {
			console.log(`  • ${rec}`)
		})
		console.log('')
	}

	private getStatusEmoji(status: PerformanceReport['analysis']['status']): string {
		switch (status) {
			case 'within_threshold': return '✅'
			case 'regression': return '⚠️'
			case 'improvement': return '🚀'
			case 'no_baseline': return '❓'
			default: return '❓'
		}
	}
}
