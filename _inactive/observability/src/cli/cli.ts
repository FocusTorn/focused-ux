#!/usr/bin/env node

import { Logger } from '../logger.js'
import { MetricsCollector } from '../metrics.js'
import { ErrorTracker } from '../error-tracker.js'
import { HealthChecker } from '../health-checker.js'
import process from 'node:process'

interface CliOptions {
	command: string
	level?: 'debug' | 'info' | 'warn' | 'error'
	message?: string
	metric?: string
	value?: number
	tags?: string
	check?: string
	timeout?: number
}

export async function runCli(): Promise<void> {
	const args = process.argv.slice(2)
  
	if (args.length === 0) {
		showHelp()
		return
	}

	const options = parseArgs(args)
  
	try {
		await executeCommand(options)
	}
	catch (error) {
		console.error('Error:', error instanceof Error ? error.message : 'Unknown error')
		process.exit(1)
	}
}

function parseArgs(args: string[]): CliOptions {
	const options: CliOptions = {
		command: args[0],
	}

	for (let i = 1; i < args.length; i += 2) {
		const flag = args[i]
		const value = args[i + 1]

		switch (flag) {
			case '--level':
				options.level = value as CliOptions['level']
				break
			case '--message':
				options.message = value
				break
			case '--metric':
				options.metric = value
				break
			case '--value':
				options.value = Number.parseFloat(value)
				break
			case '--tags':
				options.tags = value
				break
			case '--check':
				options.check = value
				break
			case '--timeout':
				options.timeout = Number.parseInt(value)
				break
		}
	}

	return options
}

async function executeCommand(options: CliOptions): Promise<void> {
	switch (options.command) {
		case 'log':
			await handleLogCommand(options)
			break
		case 'metric':
			await handleMetricCommand(options)
			break
		case 'error':
			await handleErrorCommand(options)
			break
		case 'health':
			await handleHealthCommand(options)
			break
		case 'help':
			showHelp()
			break
		default:
			console.error(`Unknown command: ${options.command}`)
			showHelp()
			process.exit(1)
	}
}

async function handleLogCommand(options: CliOptions): Promise<void> {
	if (!options.message) {
		console.error('Error: --message is required for log command')
		process.exit(1)
	}

	const logger = new Logger({ level: options.level || 'info' })

	await logger[options.level || 'info'](options.message, {
		source: 'cli',
	})
}

async function handleMetricCommand(options: CliOptions): Promise<void> {
	if (!options.metric || options.value === undefined) {
		console.error('Error: --metric and --value are required for metric command')
		process.exit(1)
	}

	// Use a simple collector without timers for CLI
	const collector = new MetricsCollector({
		flushInterval: 0, // Disable auto-flush
		enableSystemMetrics: false, // Disable system metrics
		enableAggregation: false, // Disable aggregation
	})
	
	const tags = options.tags ? parseTags(options.tags) : undefined
  
	collector.gauge(options.metric, options.value, tags)
	
	// Get metrics without flushing to avoid async issues
	const metrics = collector.getMetrics()

	console.log(`Recorded metric: ${options.metric} = ${options.value}`)
	console.log(`Total metrics in buffer: ${metrics.length}`)
}

async function handleErrorCommand(options: CliOptions): Promise<void> {
	if (!options.message) {
		console.error('Error: --message is required for error command')
		process.exit(1)
	}

	const tracker = new ErrorTracker()
	const error = new Error(options.message)
	const id = tracker.capture(error, {
		source: 'cli',
		timestamp: new Date().toISOString(),
	})
  
	console.log(`Error captured with ID: ${id}`)
}

async function handleHealthCommand(options: CliOptions): Promise<void> {
	const checker = new HealthChecker()
  
	if (options.check) {
		// Add a custom health check
		checker.addCheck(options.check, async () => {
			// Simple health check that always passes
			return true
		}, options.timeout || 5000)
	}

	const status = await checker.checkHealth()

	console.log(JSON.stringify(status, null, 2))
}

function parseTags(tagsString: string): Record<string, string> {
	const tags: Record<string, string> = {}
	const pairs = tagsString.split(',')
  
	for (const pair of pairs) {
		const [key, value] = pair.split('=')

		if (key && value) {
			tags[key.trim()] = value.trim()
		}
	}
  
	return tags
}

function showHelp(): void {
	console.log(`
@fux/observability CLI

Usage: observability <command> [options]

Commands:
  log       Log a message
  metric    Record a metric
  error     Capture an error
  health    Check health status
  help      Show this help

Options:
  --level <level>     Log level (debug, info, warn, error)
  --message <msg>     Message to log or error message
  --metric <name>     Metric name
  --value <number>    Metric value
  --tags <tags>       Comma-separated key=value pairs
  --check <name>      Health check name
  --timeout <ms>      Health check timeout in milliseconds

Examples:
  observability log --level info --message "Application started"
  observability metric --metric cpu_usage --value 75.5 --tags "host=server1,env=prod"
  observability error --message "Database connection failed"
  observability health --check database --timeout 3000
`)
}
