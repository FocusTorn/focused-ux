#!/usr/bin/env node

import { AssetManifestGenerator } from './asset-manifest'
import { AssetChangeDetector } from './change-detector'
import { AssetValidator } from './asset-validator'
import type { ProcessingOptions } from './asset-processor'
import { AssetProcessor } from './asset-processor'
import { StructuredLogger } from './asset-logger'
import { join, dirname } from 'path'

interface AssetProcessingConfig {
	sourceDir: string
	outputDir: string
	manifestPath: string
	skipUnchanged: boolean
	processDependencies: boolean
	validateOutput: boolean
	verbose: boolean
	silent: boolean
	logToFile: boolean
	logFilePath?: string
}

class AssetProcessingOrchestrator {

	private config: AssetProcessingConfig
	private manifestGenerator: AssetManifestGenerator
	private changeDetector: AssetChangeDetector
	private processor: AssetProcessor
	private logger: StructuredLogger

	constructor(config: AssetProcessingConfig) {
		this.config = config
		this.manifestGenerator = new AssetManifestGenerator(config.sourceDir, config.manifestPath)
		this.changeDetector = new AssetChangeDetector(config.sourceDir, config.manifestPath)
		
		// Initialize logger
		this.logger = new StructuredLogger('Asset Processing Orchestrator', {
			verbose: config.verbose,
			silent: config.silent,
			logToFile: config.logToFile,
			logFilePath: config.logFilePath,
		})
    
		const processingOptions: ProcessingOptions = {
			sourceDir: config.sourceDir,
			outputDir: config.outputDir,
			skipUnchanged: config.skipUnchanged,
			processDependencies: config.processDependencies,
			validateOutput: config.validateOutput,
			verbose: config.verbose,
			silent: config.silent,
			logToFile: config.logToFile,
			logFilePath: config.logFilePath,
		}
    
		this.processor = new AssetProcessor(processingOptions)
	}

	/**
	 * Generate asset manifest only
	 */
	async generateManifest(): Promise<void> {
		try {
			this.logger.startOperation('Asset Manifest Generation')
			this.logger.addStep('Generate manifest')
			this.logger.addStep('Save manifest')
			this.logger.addStep('Report results')

			this.logger.startStep(0)

			const manifest = await this.manifestGenerator.generateManifest()

			this.logger.completeStep()

			this.logger.startStep(1)
			await this.manifestGenerator.saveManifest(manifest)
			this.logger.completeStep()

			this.logger.startStep(2)
			this.logger.success(`Manifest generated with ${manifest.assets.length} assets`)
			this.logger.info('Manifest Categories', { categories: Object.keys(manifest.categories) })
			this.logger.info('Manifest saved', { path: this.manifestGenerator.manifestPath })
			this.logger.completeStep()

			this.logger.completeOperation('Manifest generation completed successfully')
		} catch (error) {
			this.logger.operationFailed(error as Error, { operation: 'manifest generation' })
			throw error
		}
	}

	/**
	 * Detect changes only
	 */
	async detectChanges(): Promise<void> {
		try {
			this.logger.startOperation('Asset Change Detection')
			this.logger.addStep('Analyze changes')
			this.logger.addStep('Report results')

			this.logger.startStep(0)

			const changeAnalysis = await this.changeDetector.analyzeChanges()

			this.logger.completeStep()

			this.logger.startStep(1)
			this.logChangeSummary(changeAnalysis)
			this.logger.completeStep()

			this.logger.completeOperation('Change detection completed successfully')
		} catch (error) {
			this.logger.operationFailed(error as Error, { operation: 'change detection' })
			throw error
		}
	}

	/**
	 * Process assets with change detection
	 */
	async processAssets(): Promise<void> {
		const startTime = Date.now()
    
		try {
			// Step 1: Detect changes
			const changeAnalysis = await this.changeDetector.analyzeChanges()

			// Show PNG/JPG cleanup info
			const deletedCount = changeAnalysis.summary.deleted || 0

			console.log(`${deletedCount} image files removed in external source.`)

			// Show source icon count summary
			const totalCount = changeAnalysis.summary.total || 0

			console.log(`${totalCount} SVG icons found in source directory.`)
      
			if (!changeAnalysis.processingRequired) {
				console.log('✓ All assets are up to date!')
				return
			}
      
			// Step 2: Process assets
			const totalChanges = changeAnalysis.summary.added + changeAnalysis.summary.modified

			console.log(`\n${totalChanges} of ${totalChanges} changes processed`)

			const processingResult = await this.processor.processAssets(changeAnalysis.changes)

			// Show theme file operations
			console.log('\nExisting theme files removed')
			console.log('Theme files generated and verified')

			// Step 3: Show validation results
			if (processingResult.validationResult) {
				// Show validation errors if any
				if (processingResult.validationResult.errors.length > 0) {
					console.log('\nFound validation errors')

					const errorGroups = this.groupValidationIssues(processingResult.validationResult.errors)

					Object.entries(errorGroups).forEach(([code, items]) => {
						console.log(`  └─ ${code}: ${items.length} occurrence(s)`)
						items.forEach((item, index) => {
							const isLast = index === items.length - 1
							const connector = isLast ? '└─' : '├─'
							
							// Show the main error message
							console.log(`    ${connector} ${item.message}`)
							
							// Show additional context if available
							if (item.context && item.context.svgErrors) {
								item.context.svgErrors.forEach((svgError: string, svgIndex: number) => {
									const svgIsLast = svgIndex === item.context.svgErrors.length - 1
									const svgConnector = svgIsLast ? '└─' : '├─'

									console.log(`      ${svgConnector} ${svgError}`)
								})
							}
							
							if (item.context && item.context.themeErrors) {
								item.context.themeErrors.forEach((themeError: string, themeIndex: number) => {
									const themeIsLast = themeIndex === item.context.themeErrors.length - 1
									const themeConnector = themeIsLast ? '└─' : '├─'

									console.log(`      ${themeConnector} ${themeError}`)
								})
							}
						})
					})
				}

				// Show validation warnings if any
				if (processingResult.validationResult.warnings.length > 0) {
					// Group warnings by type
					const orphanedFileIcons = processingResult.validationResult.warnings.filter(w =>
						w.code === 'ORPHANED_FILE_ICON',
					)
					const orphanedFolderIcons = processingResult.validationResult.warnings.filter(w =>
						w.code === 'ORPHANED_FOLDER_ICON',
					)
					const duplicateNames = processingResult.validationResult.warnings.filter(w =>
						w.code === 'DUPLICATE_FILE_ICON_NAME' || w.code === 'DUPLICATE_FOLDER_ICON_NAME',
					)

					// Show orphaned file icons
					if (orphanedFileIcons.length > 0) {
						console.log(`\nWARNING: Found ${orphanedFileIcons.length} orphaned file icon(s) in assets not defined in any model:`)
						orphanedFileIcons.forEach((warning, index) => {
							const isLast = index === orphanedFileIcons.length - 1
							const connector = isLast ? '└─ ' : '├─ '

							console.log(`${connector}${warning.assetPath}`)
						})
					}

					// Show orphaned folder icons
					if (orphanedFolderIcons.length > 0) {
						console.log(`\nWARNING: Found ${orphanedFolderIcons.length} orphaned folder icon(s) in assets not defined in any model:`)
						orphanedFolderIcons.forEach((warning, index) => {
							const isLast = index === orphanedFolderIcons.length - 1
							const connector = isLast ? '└─ ' : '├─ '

							console.log(`${connector}${warning.assetPath}`)
						})
					}

					// Show duplicate names
					if (duplicateNames.length > 0) {
						console.log(`\nWARNING: Duplicated icon model names (skipped after first):`)
						duplicateNames.forEach((warning, index) => {
							const isLast = index === duplicateNames.length - 1
							const connector = isLast ? '└─ ' : '├─ '

							console.log(`${connector}${warning.message.split(': ')[1]}`)
						})
					}
				}
			}

			const totalTime = Date.now() - startTime

			console.log(`\n✓ Asset processing completed in ${(totalTime / 1000).toFixed(2)}s`)
		} catch (error) {
			console.log(`✗ Asset processing failed: ${(error as Error).message}`)
			throw error
		}
	}

	/**
	 * Run comprehensive validation
	 */
	async runValidation(): Promise<void> {
		try {
			this.logger.startOperation('Asset Validation')
			this.logger.addStep('Generate manifest')
			this.logger.addStep('Run validation')
			this.logger.addStep('Report results')

			// Step 1: Generate manifest
			this.logger.startStep(0)

			const manifest = await this.manifestGenerator.generateManifest()

			this.logger.completeStep()

			// Step 2: Run validation
			this.logger.startStep(1)

			const validator = new AssetValidator(
				this.config.sourceDir,
				'src/models',
				'assets/themes',
				manifest,
			)
			const validationResult = await validator.validateAssets(this.config.verbose)

			this.logger.completeStep()

			// Step 3: Report results
			this.logger.startStep(2)
			this.logValidationReport(validationResult)
			this.logger.completeStep()

			if (validationResult.valid) {
				this.logger.completeOperation('Asset validation completed successfully')
			} else {
				this.logger.operationFailed(
					new Error(`${validationResult.errors.length} validation errors found`),
					{ validationResult },
				)
			}
		} catch (error) {
			this.logger.operationFailed(error as Error, { operation: 'validation' })
			throw error
		}
	}

	/**
	 * Log change summary with structured output
	 */
	private logChangeSummary(changeAnalysis: any): void {
		this.logger.info('Change Analysis Summary', {
			total: changeAnalysis.summary.total,
			added: changeAnalysis.summary.added,
			modified: changeAnalysis.summary.modified,
			deleted: changeAnalysis.summary.deleted,
			unchanged: changeAnalysis.summary.unchanged,
			processingRequired: changeAnalysis.processingRequired,
		})

		if (changeAnalysis.affectedAssets.length > 0) {
			this.logger.info('Affected Assets', { count: changeAnalysis.affectedAssets.length })
			changeAnalysis.affectedAssets.forEach((asset: string, index: number) => {
				const isLast = index === changeAnalysis.affectedAssets.length - 1

				this.logger.logHierarchy('  ', asset, isLast)
			})
		}
	}

	/**
	 * Log processing result with structured output
	 */
	private logProcessingResult(processingResult: any): void {
		this.logger.info('Processing Results', {
			processed: processingResult.processed.length,
			skipped: processingResult.skipped.length,
			errors: processingResult.errors.length,
			timeMs: processingResult.summary.timeMs,
		})

		if (processingResult.processed.length > 0) {
			this.logger.success('Processed Assets', { count: processingResult.processed.length })
			processingResult.processed.forEach((asset: string, index: number) => {
				const isLast = index === processingResult.processed.length - 1

				this.logger.logHierarchySuccess('  ', asset, isLast)
			})
		}

		if (processingResult.skipped.length > 0) {
			this.logger.info('Skipped Assets', { count: processingResult.skipped.length })
			processingResult.skipped.forEach((asset: string, index: number) => {
				const isLast = index === processingResult.skipped.length - 1

				this.logger.logHierarchy('  ', asset, isLast)
			})
		}

		if (processingResult.errors.length > 0) {
			this.logger.error('Processing Errors', { count: processingResult.errors.length })
			processingResult.errors.forEach((error: string, index: number) => {
				const isLast = index === processingResult.errors.length - 1

				this.logger.logHierarchyError('  ', error, isLast)
			})
		}
	}

	/**
	 * Log validation report with structured output
	 */
	private logValidationReport(validationResult: any): void {
		if (validationResult.valid) {
			this.logger.success('Asset validation completed successfully')
		} else {
			this.logger.warning('Asset validation completed with issues')
		}

		// Log summary
		this.logger.info('Validation Summary', {
			totalAssets: validationResult.summary.totalAssets,
			validAssets: validationResult.summary.validAssets,
			invalidAssets: validationResult.summary.invalidAssets,
			orphanedAssets: validationResult.summary.orphanedAssets,
			duplicateNames: validationResult.summary.duplicateNames,
			missingReferences: validationResult.summary.missingReferences,
		})

		// Use concise output by default, detailed output for verbose mode
		if (this.config.verbose) {
			this.logDetailedValidationReport(validationResult)
		} else {
			this.logConciseValidationReport(validationResult)
		}
	}

	/**
	 * Log concise validation report (default mode)
	 */
	private logConciseValidationReport(validationResult: any): void {
		// Log errors summary
		if (validationResult.errors.length > 0) {
			console.log(`ERROR: Found ${validationResult.errors.length} validation error(s)`)
			
			// Group errors by type and show examples
			const errorGroups = this.groupValidationIssues(validationResult.errors)

			Object.entries(errorGroups).forEach(([code, items]) => {
				console.log(`  ${code}: ${items.length} occurrence(s)`)
				items.slice(0, 3).forEach((item, index) => {
					const prefix = index === items.length - 1 ? '└─' : '├─'
					const display = item.assetPath ? `${item.message} (${item.assetPath})` : item.message

					console.log(`    ${prefix} ${display}`)
				})
			})
		}

		// Log warnings summary
		if (validationResult.warnings.length > 0) {
			console.log(`WARNING: Found ${validationResult.warnings.length} validation warning(s)`)
			
			// Group warnings by type and show examples
			const warningGroups = this.groupValidationIssues(validationResult.warnings)

			Object.entries(warningGroups).forEach(([code, items]) => {
				console.log(`  ${code}: ${items.length} occurrence(s)`)
				items.slice(0, 3).forEach((item, index) => {
					const prefix = index === items.length - 1 ? '└─' : '├─'
					const display = item.assetPath ? `${item.message} (${item.assetPath})` : item.message

					console.log(`    ${prefix} ${display}`)
				})
			})
		}
	}

	/**
	 * Log detailed validation report (verbose mode)
	 */
	private logDetailedValidationReport(validationResult: any): void {
		// Log errors
		if (validationResult.errors.length > 0) {
			this.logger.error(`Found ${validationResult.errors.length} validation errors`)
			validationResult.errors.forEach((error: any, index: number) => {
				const isLast = index === validationResult.errors.length - 1

				this.logger.logHierarchyError('  ', `${error.code}: ${error.message}`, isLast)
				if (error.assetPath) {
					this.logger.logHierarchy('    ', `Asset: ${error.assetPath}`, true)
				}
			})
		}

		// Log warnings
		if (validationResult.warnings.length > 0) {
			this.logger.warning(`Found ${validationResult.warnings.length} validation warnings`)
			validationResult.warnings.forEach((warning: any, index: number) => {
				const isLast = index === validationResult.warnings.length - 1

				this.logger.logHierarchyWarning('  ', `${warning.code}: ${warning.message}`, isLast)
				if (warning.assetPath) {
					this.logger.logHierarchy('    ', `Asset: ${warning.assetPath}`, true)
				}
			})
		}
	}

	/**
	 * Generate final processing report
	 */
	private async generateFinalReport(processingResult: any, startTime: number): Promise<void> {
		const totalTime = Date.now() - startTime
		const manifest = await this.manifestGenerator.generateManifest()

		this.logger.info('Final Processing Report', {
			totalTime: `${(totalTime / 1000).toFixed(2)}s`,
			totalAssets: manifest.assets.length,
			processedAssets: processingResult.processed.length,
			skippedAssets: processingResult.skipped.length,
			errorCount: processingResult.errors.length,
			successRate: `${((processingResult.processed.length / manifest.assets.length) * 100).toFixed(1)}%`,
		})

		// Export logs if file logging is enabled
		if (this.config.logToFile && this.config.logFilePath) {
			const logExportPath = join(dirname(this.config.logFilePath), `asset-processing-${Date.now()}.json`)

			this.logger.exportLogs(logExportPath)
			this.logger.info('Logs exported', { path: logExportPath })
		}
	}

	/**
	 * Log message with optional verbose check
	 */
	private log(message: string, ...args: any[]): void {
		if (this.config.verbose) {
			console.log(message, ...args)
		}
	}

	/**
	 * Group validation issues by code for concise display
	 */
	private groupValidationIssues(issues: any[]): Record<string, any[]> {
		const groups: Record<string, any[]> = {}
		
		issues.forEach((issue) => {
			const code = issue.code || 'UNKNOWN'

			if (!groups[code]) {
				groups[code] = []
			}
			groups[code].push(issue)
		})
		
		return groups
	}

}

// CLI interface
async function main(): Promise<void> {
	const args = process.argv.slice(2)
	const command = args[0]
	
	// Default configuration
	const config: AssetProcessingConfig = {
		sourceDir: 'assets',
		outputDir: 'dist/assets',
		manifestPath: 'asset-manifest.json',
		skipUnchanged: true,
		processDependencies: true,
		validateOutput: true,
		verbose: false,
		silent: false,
		logToFile: false,
	}

	// Parse command line arguments
	for (let i = 1; i < args.length; i++) {
		const arg = args[i]
		
		switch (arg) {
			case '--source-dir':
				config.sourceDir = args[++i] || 'assets'
				break
			case '--output-dir':
				config.outputDir = args[++i] || 'dist/assets'
				break
			case '--manifest-path':
				config.manifestPath = args[++i] || 'asset-manifest.json'
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
			case '--verbose':
			case '-v':
				config.verbose = true
				break
			case '--silent':
			case '-s':
				config.silent = true
				break
			case '--log-to-file':
				config.logToFile = true
				config.logFilePath = join(process.cwd(), 'logs', 'asset-processing.log')
				break
			case '--help':
			case '-h':
				showHelp()
				return
			default:
				console.warn(`Unknown argument: ${arg}`)
				break
		}
	}

	const orchestrator = new AssetProcessingOrchestrator(config)

	try {
		switch (command) {
			case 'manifest':
				await orchestrator.generateManifest()
				break
			case 'detect':
				await orchestrator.detectChanges()
				break
			case 'process':
				await orchestrator.processAssets()
				break
			case 'validate':
				await orchestrator.runValidation()
				break
			default:
				console.error(`Unknown command: ${command}`)
				showHelp()
				process.exit(1)
		}
	} catch (error) {
		console.error('Operation failed:', error)
		process.exit(1)
	}
}

function showHelp(): void {
	console.log(`
Asset Processing Orchestrator

Usage: tsx asset-orchestrator.ts <command> [options]

Commands:
  manifest     Generate asset manifest only
  detect       Detect changes only
  process      Process assets with change detection
  validate     Run comprehensive validation

Options:
  --source-dir <path>      Source directory (default: assets)
  --output-dir <path>      Output directory (default: dist/assets)
  --manifest-path <path>   Manifest file path (default: asset-manifest.json)
  --no-skip               Process all assets (don't skip unchanged)
  --no-dependencies       Don't process dependencies
  --no-validate          Skip output validation
  --verbose, -v          Enable verbose logging
  --silent, -s           Suppress all output
  --log-to-file          Enable file logging
  --help, -h             Show this help message

Examples:
  tsx asset-orchestrator.ts process --verbose
  tsx asset-orchestrator.ts validate --log-to-file
  tsx asset-orchestrator.ts detect --source-dir src/assets
`)
}

// Run if called directly
if (process.argv[1] && process.argv[1].endsWith('asset-orchestrator.ts')) {
	main().catch((error) => {
		console.error('Fatal error:', error)
		process.exit(1)
	})
}
