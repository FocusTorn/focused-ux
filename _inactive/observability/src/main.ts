// Library exports - always available
import process from 'node:process'

export { Logger } from './logger.js'
export { MetricsCollector } from './metrics.js'
export { ErrorTracker } from './error-tracker.js'
export { HealthChecker } from './health-checker.js'

// CLI functionality - only run if this file is executed directly
if (import.meta.url === `file://${process.argv[1]}` || process.argv[1]?.endsWith('main.js')) {
	// Use dynamic import to avoid top-level await
	import('./cli/cli.js').then(async ({ runCli }) => {
		await runCli()
	}).catch((error) => {
		console.error('Failed to run CLI:', error)
		process.exit(1)
	})
}
