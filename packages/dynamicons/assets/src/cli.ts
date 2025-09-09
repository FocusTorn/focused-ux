#!/usr/bin/env node

import path from 'path'
import { AssetOrchestrator } from './orchestrators/asset-orchestrator.js'
import { EnhancedAssetOrchestrator } from './orchestrators/enhanced-asset-orchestrator.js'
import { IconProcessor } from './processors/icon-processor.js'
import { ThemeProcessor } from './processors/theme-processor.js'
import { PreviewProcessor } from './processors/preview-processor.js'

function showHelp(): void {
	console.log(`
Asset Generation Orchestrator

Usage: node dist/cli.js [processor] [options]

Processors:
  icons            Process Icons (staging, organization, optimization)
  themes           Generate Themes (base and dynamicons themes)
  previews         Generate Previews (preview images)
  enhanced         Run enhanced orchestrator with sophisticated dependency logic
  (no processor)   Run all processors in sequence (basic orchestrator)

Options:
  --verbose, -v     Enable verbose output
  --very-verbose, -vv  Enable very verbose output (includes all processor output)
  --help, -h        Show this help message

Examples:
  node dist/cli.js                    # Run all processors (basic)
  node dist/cli.js enhanced           # Run enhanced orchestrator with dependency logic
  node dist/cli.js icons              # Process icons only
  node dist/cli.js themes --verbose   # Generate themes with verbose output
  node dist/cli.js previews -vv       # Generate previews with very verbose output
  node dist/cli.js --verbose          # Run all processors with verbose output

All processors use intelligent caching and will skip when no changes are detected.
The enhanced orchestrator provides sophisticated dependency logic and cascading skips.
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

	// Extract processor name (first non-flag argument)
	const processorName = args.find(arg => !arg.startsWith('--')
	  && !arg.startsWith('-')
	  && arg !== '--verbose'
	  && arg !== '-v'
	  && arg !== '--very-verbose'
	  && arg !== '-vv',
	)

	let result: { overallSuccess: boolean }

	if (!processorName) {
		// Run all processors (basic orchestrator)
		const orchestrator = new AssetOrchestrator(verbose, veryVerbose)

		result = await orchestrator.generateAssets()
	} else if (processorName === 'enhanced') {
		// Run enhanced orchestrator with sophisticated dependency logic
		const orchestrator = new EnhancedAssetOrchestrator(verbose, veryVerbose)

		result = await orchestrator.generateAssets()
	} else {
		// Run specific processor
		result = await runSingleProcessor(processorName, verbose, veryVerbose)
	}
	
	// Exit with appropriate code
	process.exit(result.overallSuccess ? 0 : 1)
}

/**
 * Run a single processor
 */
async function runSingleProcessor(
	processorName: string,
	verbose: boolean,
	veryVerbose: boolean,
): Promise<{ overallSuccess: boolean }> {
	const processors = {
		icons: { name: 'Process Icons', processor: new IconProcessor() },
		themes: { name: 'Generate Themes', processor: new ThemeProcessor() },
		previews: { name: 'Generate Previews', processor: new PreviewProcessor() },
	}

	const processor = processors[processorName as keyof typeof processors]
	
	if (!processor) {
		console.error(`❌ Unknown processor: ${processorName}`)
		console.error('Available processors: icons, themes, previews')
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
		const success = await processor.processor.process(verbose)
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

// Run if called directly
if (process.argv[1] && process.argv[1].endsWith('cli.js')) {
	main().catch((error) => {
		console.error('Asset generation failed:', error)
		process.exit(1)
	})
}
