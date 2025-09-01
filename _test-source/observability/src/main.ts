import { runCli } from './cli/cli.js';

// Check if running as CLI or imported as module
if (import.meta.url === `file://${process.argv[1]}`) {
  // Running as CLI
  await runCli();
} else {
  // Imported as module - export observability components
  export { StructuredLogger } from './core/logger.js';
  export { MetricsCollector } from './core/metrics.js';
  export { ErrorTracker } from './core/error-tracker.js';
  export { HealthChecker } from './core/health-checker.js';
  export { createPackageLogger, trackBusinessLogic } from './integrations/package-integration.js';
  export { trackExtensionCommand } from './integrations/extension-integration.js';
}
