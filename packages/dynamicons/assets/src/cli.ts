#!/usr/bin/env node

import path from 'path'
import { EnhancedAssetOrchestrator } from './orchestrators/enhanced-asset-orchestrator.js'
import { IconProcessor } from './processors/icon-processor.js'
import { ThemeProcessor } from './processors/theme-processor.js'
import { PreviewProcessor } from './processors/preview-processor.js'
import { ModelAuditProcessor } from './processors/model-audit-processor.js'
import { ThemeAuditProcessor } from './processors/theme-audit-processor.js'

function showHelp(): void {
	console.log(`
Asset Generation Orchestrator

Usage: node dist/cli.js [processor] [options]

Processors:
  icons            Process Icons (staging, organization, optimization)
  themes           Generate Themes (base and dynamicons themes)
  previews         Generate Previews (preview images)
  audit-models     Audit Models (validate model files and asset consistency)
  audit-themes     Audit Themes (validate theme files and model correlation)
  enhanced         Run orchestrator with sophisticated dependency logic
  (no processor)   Run orchestrator with sophisticated dependency logic

Options:
  --verbose, -v     Enable verbose output
  --very-verbose, -vv  Enable very verbose output (includes all processor output)
  --demo            Show demo output with mock data (audit-themes only)
  --help, -h        Show this help message

Examples:
  node dist/cli.js                    # Run orchestrator with dependency logic
  node dist/cli.js enhanced           # Run orchestrator with dependency logic
  node dist/cli.js icons              # Process icons only
  node dist/cli.js themes --verbose   # Generate themes with verbose output
  node dist/cli.js previews -vv       # Generate previews with very verbose output
  node dist/cli.js audit-models       # Audit model files and asset consistency
  node dist/cli.js audit-themes -v    # Audit theme files with verbose output
  node dist/cli.js audit-themes --demo # Show demo output with mock data
  node dist/cli.js --verbose          # Run all processors with verbose output

All processors use intelligent caching and will skip when no changes are detected.
The orchestrator provides sophisticated dependency logic and cascading skips.
`)
}

/**
 * Run a single processor
 */
async function runSingleProcessor(
	processorName: string,
	verbose: boolean,
	veryVerbose: boolean,
	demo: boolean = false,
): Promise<{ overallSuccess: boolean }> {
	const processors = {
		'icons': { name: 'Process Icons', processor: new IconProcessor() },
		'themes': { name: 'Generate Themes', processor: new ThemeProcessor() },
		'previews': { name: 'Generate Previews', processor: new PreviewProcessor() },
		'audit-models': { name: 'Audit Models', processor: new ModelAuditProcessor() },
		'audit-themes': { name: 'Audit Themes', processor: new ThemeAuditProcessor() },
	}

	const processor = processors[processorName as keyof typeof processors]
	
	if (!processor) {
		console.error(`❌ Unknown processor: ${processorName}`)
		console.error('Available processors: icons, themes, previews, audit-models, audit-themes')
		process.exit(1)
	}

	if (verbose || veryVerbose) {
		console.log(`\n🎨 [${processor.name.toUpperCase()}]`)
		console.log('═'.repeat(60))
	}

	// Change to the assets package directory for proper file resolution
	const originalCwd = process.cwd()
	const assetsDir = path.resolve(path.dirname(process.argv[1]), '..')

	process.chdir(assetsDir)

	const startTime = Date.now()
	
	try {
		const success = await processor.processor.process(verbose, demo)
		const duration = Date.now() - startTime
		
		if (success) {
			console.log(`\n${'═'.repeat(60)}`)
			console.log(`✅ ${processor.name.toUpperCase()} COMPLETED SUCCESSFULLY`)
			console.log(`⏱️  Duration: ${duration}ms`)
			console.log('═'.repeat(60))
		} else {
			console.log(`\n${'═'.repeat(60)}`)
			console.log(`❌ ${processor.name.toUpperCase()} FAILED`)
			console.log(`⏱️  Duration: ${duration}ms`)
			console.log('═'.repeat(60))
		}
		
		return { overallSuccess: success }
	} catch (error) {
		const duration = Date.now() - startTime

		console.log(`\n${'═'.repeat(60)}`)
		console.log(`❌ ${processor.name.toUpperCase()} FAILED`)
		console.log(`⏱️  Duration: ${duration}ms`)
		console.log(`Error: ${error instanceof Error ? error.message : String(error)}`)
		console.log('═'.repeat(60))
		
		return { overallSuccess: false }
	} finally {
		// Restore original working directory
		process.chdir(originalCwd)
	}
}

// CLI interface
async function main(): Promise<void> {
	const args = process.argv.slice(2)

	// Check for explicit verbose flags or Nx verbose mode
	const verbose = args.includes('--verbose') || args.includes('-v')
	  || process.env.NX_VERBOSE_LOGGING === 'true'
	  || process.argv.some(arg => arg.includes('--verbose'))
	const veryVerbose = args.includes('--very-verbose') || args.includes('-vv')
	const demo = args.includes('--demo')
	
	if (args.includes('--help') || args.includes('-h')) {
		showHelp()
		return
	}

	// Extract processor name (first non-flag argument)
	const processorName = args.find(arg => !arg.startsWith('--')
	  && !arg.startsWith('-')
	  && arg !== '--verbose'
	  && arg !== '-v'
	  && arg !== '--very-verbose'
	  && arg !== '-vv'
	  && arg !== '--demo',
	)

	let result: { overallSuccess: boolean }

	if (!processorName) {
		// Run orchestrator with sophisticated dependency logic
		const orchestrator = new EnhancedAssetOrchestrator(verbose, veryVerbose)

		result = await orchestrator.generateAssets()
	} else if (processorName === 'enhanced') {
		// Run orchestrator with sophisticated dependency logic
		const orchestrator = new EnhancedAssetOrchestrator(verbose, veryVerbose)

		result = await orchestrator.generateAssets()
	} else {
		// Run specific processor
		result = await runSingleProcessor(processorName, verbose, veryVerbose, demo)
	}
	
	// Exit with appropriate code
	process.exit(result.overallSuccess ? 0 : 1)
}

// Export functions for testing
export { showHelp, runSingleProcessor, main }

// Run if called directly
if (process.argv[1] && process.argv[1].endsWith('cli.js')) {
	main().catch((error) => {
		console.error('Asset generation failed:', error)
		process.exit(1)
	})
}
