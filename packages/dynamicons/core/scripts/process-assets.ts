#!/usr/bin/env node

import { AssetManifestGenerator } from './asset-manifest'
import { AssetChangeDetector } from './change-detector'
import type { ProcessingOptions } from './asset-processor'
import { AssetProcessor } from './asset-processor'

interface AssetProcessingConfig {
	sourceDir: string
	outputDir: string
	manifestPath: string
	skipUnchanged: boolean
	processDependencies: boolean
	validateOutput: boolean
	verbose: boolean
}

class AssetProcessingOrchestrator {

	private config: AssetProcessingConfig
	private manifestGenerator: AssetManifestGenerator
	private changeDetector: AssetChangeDetector
	private processor: AssetProcessor

	constructor(config: AssetProcessingConfig) {
		this.config = config
		this.manifestGenerator = new AssetManifestGenerator(config.sourceDir, config.manifestPath)
		this.changeDetector = new AssetChangeDetector(config.sourceDir, config.manifestPath)
    
		const processingOptions: ProcessingOptions = {
			sourceDir: config.sourceDir,
			outputDir: config.outputDir,
			skipUnchanged: config.skipUnchanged,
			processDependencies: config.processDependencies,
			validateOutput: config.validateOutput,
		}
    
		this.processor = new AssetProcessor(processingOptions)
	}

	/**
	 * Main orchestration method
	 */
	async processAssets(): Promise<void> {
		const startTime = Date.now()
    
		try {
			this.log('🚀 Starting Dynamicons asset processing...')
      
			// Step 1: Generate current asset manifest
			this.log('📋 Generating asset manifest...')

			const manifest = await this.manifestGenerator.generateManifest()

			await this.manifestGenerator.saveManifest(manifest)
			this.log(`✅ Manifest generated with ${manifest.assets.length} assets`)
      
			// Step 2: Detect changes
			this.log('🔍 Detecting asset changes...')

			const changeAnalysis = await this.changeDetector.analyzeChanges()

			this.logChangeSummary(changeAnalysis)
      
			if (!changeAnalysis.processingRequired) {
				this.log('✨ No changes detected - all assets are up to date!')
				return
			}
      
			// Step 3: Process assets
			this.log('⚙️ Processing changed assets...')

			const processingResult = await this.processor.processAssets(changeAnalysis.changes)

			this.logProcessingResult(processingResult)
      
			// Step 4: Generate new manifest
			this.log('📋 Updating asset manifest...')

			const updatedManifest = await this.manifestGenerator.generateManifest()

			await this.manifestGenerator.saveManifest(updatedManifest)
      
			// Step 5: Final statistics
			const totalTime = Date.now() - startTime

			await this.logFinalStats(totalTime)
      
			this.log('🎉 Asset processing completed successfully!')
		} catch (error) {
			this.log(`❌ Asset processing failed: ${error}`)
			throw error
		}
	}

	/**
	 * Log change summary
	 */
	private logChangeSummary(analysis: any): void {
		const { summary, affectedAssets } = analysis
    
		this.log(`📊 Change Summary:`)
		this.log(`   Total assets: ${summary.total}`)
		this.log(`   Added: ${summary.added} 🆕`)
		this.log(`   Modified: ${summary.modified} 🔄`)
		this.log(`   Deleted: ${summary.deleted} 🗑️`)
		this.log(`   Unchanged: ${summary.unchanged} ✅`)
    
		if (affectedAssets.length > 0) {
			this.log(`\n📝 Affected assets:`)
			affectedAssets.forEach(asset =>
				this.log(`   - ${asset}`))
		}
	}

	/**
	 * Log processing result
	 */
	private logProcessingResult(result: any): void {
		const { summary } = result
    
		this.log(`📊 Processing Summary:`)
		this.log(`   Total: ${summary.total}`)
		this.log(`   Processed: ${summary.processed} ✅`)
		this.log(`   Skipped: ${summary.skipped} ⏭️`)
		this.log(`   Errors: ${summary.errors} ❌`)
		this.log(`   Time: ${summary.timeMs}ms ⏱️`)
    
		if (result.errors.length > 0) {
			this.log(`\n⚠️ Processing errors:`)
			result.errors.forEach(error =>
				this.log(`   - ${error}`))
		}
	}

	/**
	 * Log final statistics
	 */
	private async logFinalStats(totalTime: number): Promise<void> {
		try {
			const stats = await this.processor.getProcessingStats()
      
			this.log(`📊 Final Statistics:`)
			this.log(`   Source assets: ${stats.sourceCount} (${this.formatBytes(stats.sourceSize)})`)
			this.log(`   Output assets: ${stats.outputCount} (${this.formatBytes(stats.outputSize)})`)
			this.log(`   Total processing time: ${totalTime}ms`)
      
			if (stats.sourceCount > 0) {
				const compressionRatio = ((stats.sourceSize - stats.outputSize) / stats.sourceSize * 100).toFixed(1)

				this.log(`   Compression ratio: ${compressionRatio}%`)
			}
		} catch (error) {
			this.log(`⚠️ Could not retrieve final statistics: ${error}`)
		}
	}

	/**
	 * Format bytes to human readable format
	 */
	private formatBytes(bytes: number): string {
		if (bytes === 0)
			return '0 B'

		const k = 1024
		const sizes = ['B', 'KB', 'MB', 'GB']
		const i = Math.floor(Math.log(bytes) / Math.log(k))

		return `${Number.parseFloat((bytes / k ** i).toFixed(2))} ${sizes[i]}`
	}

	/**
	 * Log message with optional verbose check
	 */
	private log(message: string): void {
		if (this.config.verbose) {
			console.log(message)
		} else {
			// Only log important messages in non-verbose mode
			if (message.includes('🚀') || message.includes('✅') || message.includes('❌') || message.includes('🎉')) {
				console.log(message)
			}
		}
	}

}

// CLI interface
async function main(): Promise<void> {
	const args = process.argv.slice(2)
  
	// Parse command line arguments
	const config: AssetProcessingConfig = {
		sourceDir: 'assets',
		outputDir: '../ext/dist/assets',
		manifestPath: 'asset-manifest.json',
		skipUnchanged: true,
		processDependencies: true,
		validateOutput: true,
		verbose: args.includes('--verbose') || args.includes('-v'),
	}
  
	// Override defaults with command line arguments
	for (let i = 0; i < args.length; i++) {
		const arg = args[i]
    
		switch (arg) {
			case '--source-dir':
			case '-s':
				config.sourceDir = args[++i] || config.sourceDir
				break
			case '--output-dir':
			case '-o':
				config.outputDir = args[++i] || config.outputDir
				break
			case '--manifest':
			case '-m':
				config.manifestPath = args[++i] || config.manifestPath
				break
			case '--no-skip':
				config.skipUnchanged = false
				break
			case '--no-dependencies':
				config.processDependencies = false
				break
			case '--no-validate':
				config.validateOutput = false
				break
			case '--help':
			case '-h':
				showHelp()
				return
		}
	}
  
	try {
		const orchestrator = new AssetProcessingOrchestrator(config)

		await orchestrator.processAssets()
	} catch (error) {
		console.error('❌ Asset processing failed:', error)
		process.exit(1)
	}
}

function showHelp(): void {
	console.log(`
Dynamicons Asset Processing Tool

Usage: npx tsx scripts/process-assets.ts [options]

Options:
  -s, --source-dir <dir>     Source assets directory (default: assets)
  -o, --output-dir <dir>     Output directory (default: ../ext/dist/assets)
  -m, --manifest <file>      Manifest file path (default: asset-manifest.json)
  --no-skip                   Process all assets, not just changed ones
  --no-dependencies           Don't process dependent assets
  --no-validate              Skip output validation
  -v, --verbose              Enable verbose logging
  -h, --help                 Show this help message

Examples:
  # Process assets with default settings
  npx tsx scripts/process-assets.ts
  
  # Process with verbose logging
  npx tsx scripts/process-assets.ts --verbose
  
  # Custom source and output directories
  npx tsx scripts/process-assets.ts -s custom-assets -o custom-output
  
  # Process all assets (no change detection)
  npx tsx scripts/process-assets.ts --no-skip
`)
}

// Run if called directly
if (process.argv[1] && process.argv[1].endsWith('process-assets.ts')) {
	main().catch((error) => {
		console.error('Asset processing failed:', error)
		process.exit(1)
	})
}

export { AssetProcessingOrchestrator, AssetProcessingConfig }
