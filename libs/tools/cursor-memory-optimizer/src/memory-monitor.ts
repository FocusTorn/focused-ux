import { CursorOptimizer } from './cursor-optimizer.js'
import chalk from 'chalk'
import process from 'node:process'

export interface MonitorOptions {
	intervalSeconds?: number
	thresholdPercent?: number
	maxMemoryMB?: number
}

export interface MemoryStats {
	timestamp: Date
	memoryMB: number
	cpuPercent: number
	isHighUsage: boolean
	processCount?: number
}

export class MemoryMonitor {

	private intervalId?: NodeJS.Timeout
	private options: Required<MonitorOptions>
	private stats: MemoryStats[] = []
	private isRunning = false

	constructor(options: MonitorOptions = {}) {
		this.options = {
			intervalSeconds: options.intervalSeconds || 5,
			thresholdPercent: options.thresholdPercent || 80,
			maxMemoryMB: options.maxMemoryMB || 3072, // Changed from 4096 to 3072 (3GB)
		}
	}

	async start(): Promise<void> {
		if (this.isRunning) {
			console.log(chalk.yellow('⚠️  Monitoring is already running'))
			return
		}

		// Get configured max memory and threshold
		const status = await CursorOptimizer.getStatus()

		if (status.isOptimized && status.maxMemoryMB > 0) {
			this.options.maxMemoryMB = status.maxMemoryMB
		}
		
		if (status.isOptimized && status.gcThreshold > 0) {
			this.options.thresholdPercent = status.gcThreshold
		}

		this.isRunning = true
		console.log(chalk.blue(`📊 Starting memory monitoring (${this.options.intervalSeconds}s intervals)`))
		console.log(chalk.gray(`   Threshold: ${this.options.thresholdPercent}% of ${this.options.maxMemoryMB}MB`))

		// Set up periodic monitoring
		this.intervalId = setInterval(async () => {
			await this.checkMemoryUsage()
		}, this.options.intervalSeconds * 1000)

		// Set up graceful shutdown
		process.on('SIGINT', () => {
			this.stop()
			process.exit(0)
		})

		process.on('SIGTERM', () => {
			this.stop()
			process.exit(0)
		})

		// Initial check
		await this.checkMemoryUsage()
	}

	stop(): void {
		if (this.intervalId) {
			clearInterval(this.intervalId)
			this.intervalId = undefined
		}
		this.isRunning = false
		console.log(chalk.blue('📊 Memory monitoring stopped'))
	}

	private async checkMemoryUsage(): Promise<void> {
		try {
			const processInfo = await CursorOptimizer.getProcessInfo()
      
			if (!processInfo.isRunning) {
				console.log(chalk.gray('📊 Cursor is not running'))
				return
			}

			const memoryPercent = (processInfo.memoryMB / this.options.maxMemoryMB) * 100
			const isHighUsage = memoryPercent >= this.options.thresholdPercent

			const stats: MemoryStats = {
				timestamp: new Date(),
				memoryMB: processInfo.memoryMB,
				cpuPercent: processInfo.cpuPercent,
				isHighUsage,
				processCount: processInfo.processCount,
			}

			this.stats.push(stats)

			// Keep only last 100 entries
			if (this.stats.length > 100) {
				this.stats = this.stats.slice(-100)
			}

			// Display current status
			this.displayStatus(stats, memoryPercent)

			// Take action if memory usage is high
			if (isHighUsage) {
				await this.handleHighMemoryUsage()
			}
		}
		catch (error) {
			console.error(chalk.red('❌ Error checking memory usage:'), error)
		}
	}

	private displayStatus(stats: MemoryStats, memoryPercent: number): void {
		const timeStr = stats.timestamp.toLocaleTimeString()
		const memoryStr = `${stats.memoryMB.toFixed(1)}MB`
		const percentStr = `${memoryPercent.toFixed(1)}%`
		const cpuStr = stats.cpuPercent > 0 ? `CPU: ${stats.cpuPercent.toFixed(1)}%` : ''
		const processStr = stats.processCount && stats.processCount > 1 ? `(${stats.processCount} processes)` : ''

		if (stats.isHighUsage) {
			console.log(chalk.red(`⚠️  [${timeStr}] High memory usage: ${memoryStr} (${percentStr}) ${cpuStr} ${processStr}`))
		}
		else if (memoryPercent > 60) {
			console.log(chalk.yellow(`📊 [${timeStr}] Memory: ${memoryStr} (${percentStr}) ${cpuStr} ${processStr}`))
		}
		else {
			console.log(chalk.green(`📊 [${timeStr}] Memory: ${memoryStr} (${percentStr}) ${cpuStr} ${processStr}`))
		}
	}

	private async handleHighMemoryUsage(): Promise<void> {
		console.log(chalk.red('🚨 High memory usage detected! Taking action...'))

		try {
			// Trigger garbage collection
			await CursorOptimizer.triggerGarbageCollection()

			// Wait a moment and check again
			setTimeout(async () => {
				const newStats = await CursorOptimizer.getProcessInfo()
				const newPercent = (newStats.memoryMB / this.options.maxMemoryMB) * 100
        
				if (newPercent < this.options.thresholdPercent) {
					console.log(chalk.green('✅ Memory usage improved after garbage collection'))
				}
				else {
					console.log(chalk.red('⚠️  Memory usage still high after garbage collection'))
					this.showRecommendations()
				}
			}, 2000)
		}
		catch (error) {
			console.error(chalk.red('❌ Error handling high memory usage:'), error)
		}
	}

	private showRecommendations(): void {
		console.log(chalk.yellow('\n💡 Recommendations to reduce memory usage:'))
		console.log(chalk.gray('   1. Close unused tabs and windows'))
		console.log(chalk.gray('   2. Disable AI extensions temporarily'))
		console.log(chalk.gray('   3. Restart Cursor'))
		console.log(chalk.gray('   4. Check for memory leaks in extensions'))
		console.log(chalk.gray('   5. Increase system swap/virtual memory'))
	}

	getStats(): MemoryStats[] {
		return [...this.stats]
	}

	getAverageMemoryUsage(): number {
		if (this.stats.length === 0)
			return 0

		const total = this.stats.reduce((sum, stat) => sum + stat.memoryMB, 0)

		return total / this.stats.length
	}

	getPeakMemoryUsage(): number {
		if (this.stats.length === 0)
			return 0
		return Math.max(...this.stats.map(stat => stat.memoryMB))
	}

	getHighUsageCount(): number {
		return this.stats.filter(stat => stat.isHighUsage).length
	}

	generateReport(): string {
		const avgUsage = this.getAverageMemoryUsage()
		const peakUsage = this.getPeakMemoryUsage()
		const highUsageCount = this.getHighUsageCount()
		const totalChecks = this.stats.length

		return `
Memory Monitoring Report
=======================
Total checks: ${totalChecks}
Average memory usage: ${avgUsage.toFixed(1)}MB
Peak memory usage: ${peakUsage.toFixed(1)}MB
High usage events: ${highUsageCount} (${((highUsageCount / totalChecks) * 100).toFixed(1)}%)
Monitoring duration: ${this.getMonitoringDuration()}
    `.trim()
	}

	private getMonitoringDuration(): string {
		if (this.stats.length < 2)
			return '0s'
    
		const start = this.stats[0].timestamp
		const end = this.stats[this.stats.length - 1].timestamp
		const durationMs = end.getTime() - start.getTime()
		const durationSec = Math.floor(durationMs / 1000)
    
		if (durationSec < 60)
			return `${durationSec}s`
		if (durationSec < 3600)
			return `${Math.floor(durationSec / 60)}m ${durationSec % 60}s`
		return `${Math.floor(durationSec / 3600)}h ${Math.floor((durationSec % 3600) / 60)}m`
	}

}
