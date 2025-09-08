#!/usr/bin/env node

import { AssetOrchestrator } from './orchestrators/asset-orchestrator.js'

function showHelp(): void {
	console.log(`
Asset Generation Orchestrator

Usage: node dist/cli.js [options]

Options:
  --verbose, -v     Enable verbose output
  --very-verbose, -vv  Enable very verbose output (includes all processor output)
  --help, -h        Show this help message

Examples:
  node dist/cli.js
  node dist/cli.js --verbose
  node dist/cli.js --very-verbose

This orchestrator manages the complete asset generation workflow:
1. Process Icons (staging, organization, optimization)
2. Generate Themes (base and dynamicons themes)  
3. Generate Previews (preview images)

All processors use intelligent caching and will skip when no changes are detected.
`)
}

// CLI interface
async function main(): Promise<void> {
	const args = process.argv.slice(2)

	// Check for explicit verbose flags or Nx verbose mode
	const verbose = args.includes('--verbose') || args.includes('-v')
	  || process.env.NX_VERBOSE_LOGGING === 'true'
	  || process.argv.some(arg => arg.includes('--verbose'))
	const veryVerbose = args.includes('--very-verbose') || args.includes('-vv')
	
	if (args.includes('--help') || args.includes('-h')) {
		showHelp()
		return
	}

	const orchestrator = new AssetOrchestrator(verbose, veryVerbose)
	const result = await orchestrator.generateAssets()
	
	// Exit with appropriate code
	process.exit(result.overallSuccess ? 0 : 1)
}

// Run if called directly
if (process.argv[1] && process.argv[1].endsWith('cli.js')) {
	main().catch((error) => {
		console.error('Asset generation failed:', error)
		process.exit(1)
	})
}
