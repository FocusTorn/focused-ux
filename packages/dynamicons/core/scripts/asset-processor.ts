import type { AssetChange } from './change-detector'
import type { AssetManifest } from './asset-manifest'
import type { ValidationResult } from './asset-validator'
import { AssetManifestGenerator } from './asset-manifest'
import { AssetValidator } from './asset-validator'
import { StructuredLogger } from './asset-logger'
import { copyFile, mkdir, stat } from 'fs/promises'
import { join, dirname } from 'path'
import { existsSync } from 'fs'

export interface ProcessingOptions {
	sourceDir: string
	outputDir: string
	skipUnchanged: boolean
	processDependencies: boolean
	validateOutput: boolean
	verbose?: boolean
	silent?: boolean
	logToFile?: boolean
	logFilePath?: string
}

export interface ProcessingResult {
	processed: string[]
	skipped: string[]
	errors: string[]
	validationResult?: ValidationResult
	summary: {
		total: number
		processed: number
		skipped: number
		errors: number
		timeMs: number
	}
}

export class AssetProcessor {

	private readonly options: ProcessingOptions
	private readonly manifestGenerator: AssetManifestGenerator
	private validator: AssetValidator
	private readonly logger: StructuredLogger

	constructor(options: ProcessingOptions) {
		this.options = options
		this.manifestGenerator = new AssetManifestGenerator(options.sourceDir)
		
		// Initialize logger
		this.logger = new StructuredLogger('Asset Processing', {
			verbose: options.verbose,
			silent: options.silent,
			logToFile: options.logToFile,
			logFilePath: options.logFilePath,
		})

		// Initialize validator (will be set after manifest generation)
		this.validator = new AssetValidator(options.sourceDir, 'src/models', 'assets/themes', { assets: [], categories: {}, dependencies: {}, version: '', generatedAt: 0 })
	}

	/**
	 * Process assets based on change analysis
	 */
	async processAssets(changes: AssetChange[]): Promise<ProcessingResult> {
		const startTime = Date.now()
		const processed: string[] = []
		const skipped: string[] = []
		const errors: string[] = []

		try {
			if (this.options.verbose) {
				this.logger.startOperation('Asset Processing')
				this.logger.addStep('Initialize processing environment')
				this.logger.addStep('Process changed assets')
				this.logger.addStep('Process dependencies')
				this.logger.addStep('Validate output')
				this.logger.addStep('Generate validation report')
			}

			// Step 1: Initialize processing environment
			if (this.options.verbose) {
				this.logger.startStep(0)
			}
			await this.ensureOutputDirectory()
			if (this.options.verbose) {
				this.logger.completeStep()
			}

			// Step 2: Process each asset based on its change status
			if (this.options.verbose) {
				this.logger.startStep(1)
			}

			// In concise mode, show simple progress
			if (!this.options.verbose) {
				console.log(`Processing ${changes.length} assets...`)
			}
			
			let processingProgress: any = null

			if (this.options.verbose) {
				processingProgress = this.logger.createProgressTracker(changes.length)
			}
			
			for (let i = 0; i < changes.length; i++) {
				const change = changes[i]
				
				try {
					if (change.type === 'unchanged' && this.options.skipUnchanged) {
						skipped.push(change.assetPath)
						if (processingProgress) {
							processingProgress.increment(`Skipped: ${change.assetPath}`)
						}
						continue
					}

					if (change.type === 'deleted') {
						// Handle deleted assets (cleanup, etc.)
						await this.handleDeletedAsset(change.assetPath)
						if (processingProgress) {
							processingProgress.increment(`Deleted: ${change.assetPath}`)
						}
						continue
					}

					// Process added or modified assets
					await this.processAsset(change.assetPath)
					processed.push(change.assetPath)
					if (processingProgress) {
						processingProgress.increment(`Processed: ${change.assetPath}`)
					}
				} catch (error) {
					const errorMsg = `Failed to process ${change.assetPath}: ${error}`

					if (this.options.verbose) {
						this.logger.error(errorMsg, { change, error: error.message }, change.assetPath)
					} else {
						console.log(`✗ ${errorMsg}`)
					}
					errors.push(errorMsg)
				}
			}
			
			if (processingProgress) {
				processingProgress.complete()
			}
			if (this.options.verbose) {
				this.logger.completeStep()
			}

			// Step 3: Process dependencies if enabled
			if (this.options.processDependencies) {
				if (this.options.verbose) {
					this.logger.startStep(2)
				}

				const dependencyResults = await this.processDependencies(changes)

				processed.push(...dependencyResults.processed)
				errors.push(...dependencyResults.errors)
				if (this.options.verbose) {
					this.logger.completeStep()
				}
			}

			// Step 4: Validate output if enabled
			let validationResult: ValidationResult | undefined

			if (this.options.validateOutput) {
				if (this.options.verbose) {
					this.logger.startStep(3)
				}
				validationResult = await this.validateOutput()
				if (validationResult.errors.length > 0) {
					errors.push(...validationResult.errors.map(e =>
						`${e.code}: ${e.message}`))
				}
				if (this.options.verbose) {
					this.logger.completeStep()
				}
			}

			// Step 5: Generate validation report
			if (this.options.verbose) {
				this.logger.startStep(4)
			}
			if (validationResult) {
				if (this.options.verbose) {
					this.logValidationReport(validationResult)
				} else {
					// Concise mode: show only critical issues
					if (validationResult.errors.length > 0) {
						console.log(`WARNING: Found ${validationResult.errors.length} validation issues`)
					}
				}
			}
			if (this.options.verbose) {
				this.logger.completeStep()
			}

			const timeMs = Date.now() - startTime

			const result: ProcessingResult = {
				processed,
				skipped,
				errors,
				validationResult,
				summary: {
					total: changes.length,
					processed: processed.length,
					skipped: skipped.length,
					errors: errors.length,
					timeMs,
				},
			}

			// Log final summary
			if (this.options.verbose) {
				this.logProcessingSummary(result)
			}
			
			if (errors.length === 0) {
				if (this.options.verbose) {
					this.logger.completeOperation(`Processed ${processed.length} assets successfully`)
				}
			} else {
				if (this.options.verbose) {
					this.logger.operationFailed(new Error(`${errors.length} errors occurred during processing`), { errors })
				}
			}

			return result
		} catch (error) {
			if (this.options.verbose) {
				this.logger.operationFailed(error as Error, { changes })
			}
			throw error
		}
	}

	/**
	 * Process a single asset
	 */
	private async processAsset(assetPath: string): Promise<void> {
		const outputPath = join(this.options.outputDir, assetPath)
		
		// Ensure output directory exists
		await this.ensureDirectory(dirname(outputPath))
		
		// Copy asset to output directory
		await copyFile(join(this.options.sourceDir, assetPath), outputPath)
		
		// Process based on asset type
		if (assetPath.endsWith('.svg')) {
			await this.processSvgAsset(assetPath, outputPath)
		} else if (assetPath.endsWith('.theme.json')) {
			await this.processThemeAsset(assetPath, outputPath)
		} else if (assetPath.endsWith('.png') || assetPath.endsWith('.jpeg') || assetPath.endsWith('.jpg')) {
			await this.processImageAsset(assetPath, outputPath)
		}
	}

	/**
	 * Process SVG assets (optimization, validation)
	 */
	private async processSvgAsset(assetPath: string, outputPath: string): Promise<void> {
		// For now, just copy - can add SVG optimization later
		// This could include: minification, validation, metadata extraction
		this.logger.debug(`Processed SVG asset: ${assetPath}`, { outputPath }, assetPath)
	}

	/**
	 * Process theme assets (dependency analysis, validation)
	 */
	private async processThemeAsset(assetPath: string, outputPath: string): Promise<void> {
		// Theme-specific processing: validate JSON, check icon references
		try {
			const fs = await import('fs/promises')
			const stripJsonComments = await import('strip-json-comments')
			const content = await fs.readFile(outputPath, 'utf-8')

			// Strip JSON comments before parsing
			const strippedContent = stripJsonComments.default(content)

			JSON.parse(strippedContent) // Validate JSON
			this.logger.debug(`Processed theme asset: ${assetPath}`, { outputPath }, assetPath)
		} catch (error) {
			this.logger.warning(`Theme validation failed for ${assetPath}`, { error: error.message }, assetPath)
		}
	}

	/**
	 * Process image assets (optimization, metadata)
	 */
	private async processImageAsset(assetPath: string, outputPath: string): Promise<void> {
		// Image-specific processing: metadata extraction, format validation
		this.logger.debug(`Processed image asset: ${assetPath}`, { outputPath }, assetPath)
	}

	/**
	 * Process dependencies for changed assets
	 */
	private async processDependencies(changes: AssetChange[]): Promise<{ processed: string[], errors: string[] }> {
		const processed: string[] = []
		const errors: string[] = []

		try {
			const manifest = await this.manifestGenerator.generateManifest()
			const changedAssets = changes
				.filter(c =>
					c.type === 'added' || c.type === 'modified')
				.map(c =>
					c.assetPath)

			// Find assets that depend on changed assets
			const dependentAssets = this.findDependentAssets(changedAssets, manifest)

			if (dependentAssets.length > 0) {
				this.logger.info(`Processing ${dependentAssets.length} dependent assets`)

				const dependencyProgress = this.logger.createProgressTracker(dependentAssets.length)
				
				for (const dependentAsset of dependentAssets) {
					try {
						await this.processAsset(dependentAsset)
						processed.push(dependentAsset)
						dependencyProgress.increment(dependentAsset)
					} catch (error) {
						const errorMsg = `Failed to process dependent asset ${dependentAsset}: ${error}`

						this.logger.error(errorMsg, { dependentAsset, error: error.message }, dependentAsset)
						errors.push(errorMsg)
					}
				}
				
				dependencyProgress.complete()
			}
		} catch (error) {
			const errorMsg = `Dependency processing failed: ${error}`

			this.logger.error(errorMsg, { error: error.message })
			errors.push(errorMsg)
		}

		return { processed, errors }
	}

	/**
	 * Find assets that depend on changed assets
	 */
	private findDependentAssets(changedAssets: string[], manifest: AssetManifest): string[] {
		const dependentAssets = new Set<string>()

		for (const changedAsset of changedAssets) {
			// Find assets that depend on this changed asset
			for (const [assetPath, dependencies] of Object.entries(manifest.dependencies)) {
				if (dependencies.includes(changedAsset)) {
					dependentAssets.add(assetPath)
				}
			}
		}

		return Array.from(dependentAssets)
	}

	/**
	 * Handle deleted assets
	 */
	private async handleDeletedAsset(assetPath: string): Promise<void> {
		const outputPath = join(this.options.outputDir, assetPath)
    
		try {
			const fs = await import('fs/promises')

			if (existsSync(outputPath)) {
				await fs.unlink(outputPath)
				this.logger.info(`Removed deleted asset: ${assetPath}`, { outputPath }, assetPath)
			}
		} catch (error) {
			this.logger.warning(`Failed to remove deleted asset ${assetPath}`, { error: error.message }, assetPath)
		}
	}

	/**
	 * Ensure output directory exists
	 */
	private async ensureOutputDirectory(): Promise<void> {
		await this.ensureDirectory(this.options.outputDir)
	}

	/**
	 * Ensure a directory exists
	 */
	private async ensureDirectory(dirPath: string): Promise<void> {
		try {
			await mkdir(dirPath, { recursive: true })
		} catch (error) {
			// Directory might already exist
			if (!existsSync(dirPath)) {
				throw error
			}
		}
	}

	/**
	 * Validate output assets
	 */
	private async validateOutput(): Promise<ValidationResult> {
		try {
			// Generate manifest for validation
			const manifest = await this.manifestGenerator.generateManifest()
			
			// Update validator with current manifest
			this.validator = new AssetValidator(
				this.options.sourceDir,
				'src/models',
				'assets/themes',
				manifest,
			)
			
			// Perform comprehensive validation with verbose flag
			return await this.validator.validateAssets(this.options.verbose)
		} catch (error) {
			this.logger.error('Output validation failed', { error: error.message })
			throw error
		}
	}

	/**
	 * Log validation report
	 */
	private logValidationReport(validationResult: ValidationResult): void {
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
		if (this.options.verbose) {
			this.logDetailedValidationReport(validationResult)
		} else {
			this.logConciseValidationReport(validationResult)
		}
	}

	/**
	 * Log concise validation report (default mode)
	 */
	private logConciseValidationReport(validationResult: ValidationResult): void {
		// Log errors summary
		if (validationResult.errors.length > 0) {
			this.logger.error(`Found ${validationResult.errors.length} validation errors`)
			
			if (validationResult.conciseSummary) {
				// Group errors by type with counts
				Object.entries(validationResult.conciseSummary!.errorCounts).forEach(([code, count], index) => {
					const isLast = index === Object.keys(validationResult.conciseSummary!.errorCounts).length - 1

					this.logger.logHierarchyError('  ', `${code}: ${count} occurrence(s)`, isLast)
					
					// Show first few examples
					const examples = validationResult.conciseSummary!.errorExamples[code] || []

					examples.forEach((example, exIndex) => {
						const isExLast = exIndex === examples.length - 1

						this.logger.logHierarchy('    ', example, isExLast)
					})
				})
			} else {
				// Fallback to simple error count if concise summary not available
				this.logger.error(`  • ${validationResult.errors.length} errors found`)
			}
		}

		// Log warnings summary
		if (validationResult.warnings.length > 0) {
			this.logger.warning(`Found ${validationResult.warnings.length} validation warnings`)
			
			if (validationResult.conciseSummary) {
				// Group warnings by type with counts
				Object.entries(validationResult.conciseSummary!.warningCounts).forEach(([code, count], index) => {
					const isLast = index === Object.keys(validationResult.conciseSummary!.warningCounts).length - 1

					this.logger.logHierarchyWarning('  ', `${code}: ${count} occurrence(s)`, isLast)
					
					// Show first few examples
					const examples = validationResult.conciseSummary!.warningExamples[code] || []

					examples.forEach((example, exIndex) => {
						const isExLast = exIndex === examples.length - 1

						this.logger.logHierarchy('    ', example, isExLast)
					})
				})
			} else {
				// Fallback to simple warning count if concise summary not available
				this.logger.warning(`  • ${validationResult.warnings.length} warnings found`)
			}
		}
	}

	/**
	 * Log detailed validation report (verbose mode)
	 */
	private logDetailedValidationReport(validationResult: ValidationResult): void {
		// Log errors
		if (validationResult.errors.length > 0) {
			this.logger.error(`Found ${validationResult.errors.length} validation errors`)
			validationResult.errors.forEach((error, index) => {
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
			validationResult.warnings.forEach((warning, index) => {
				const isLast = index === validationResult.warnings.length - 1

				this.logger.logHierarchyWarning('  ', `${warning.code}: ${warning.message}`, isLast)
				if (warning.assetPath) {
					this.logger.logHierarchy('    ', `Asset: ${warning.assetPath}`, true)
				}
			})
		}
	}

	/**
	 * Log processing summary
	 */
	private logProcessingSummary(result: ProcessingResult): void {
		this.logger.info('Processing Summary', {
			total: result.summary.total,
			processed: result.summary.processed,
			skipped: result.summary.skipped,
			errors: result.summary.errors,
			timeMs: result.summary.timeMs,
		})

		if (result.processed.length > 0) {
			this.logger.success(`Successfully processed ${result.processed.length} assets`)
		}

		if (result.skipped.length > 0) {
			this.logger.info(`Skipped ${result.skipped.length} unchanged assets`)
		}

		if (result.errors.length > 0) {
			this.logger.error(`Encountered ${result.errors.length} errors during processing`)
		}
	}

	/**
	 * Get processing statistics
	 */
	async getProcessingStats(): Promise<{
		sourceCount: number
		outputCount: number
		sourceSize: number
		outputSize: number
	}> {
		try {
			const manifest = await this.manifestGenerator.generateManifest()
			const sourceCount = manifest.assets.length
			const sourceSize = manifest.assets.reduce((sum, asset) =>
				sum + asset.size, 0)

			// Count output files
			const fs = await import('fs/promises')
			const outputCount = await this.countOutputFiles()
			const outputSize = await this.calculateOutputSize()

			return {
				sourceCount,
				outputCount,
				sourceSize,
				outputSize,
			}
		} catch (error) {
			this.logger.error('Failed to get processing stats', { error: error.message })
			return { sourceCount: 0, outputCount: 0, sourceSize: 0, outputSize: 0 }
		}
	}

	/**
	 * Count output files
	 */
	private async countOutputFiles(): Promise<number> {
		// Simple implementation - can be enhanced with recursive directory scanning
		try {
			const fs = await import('fs/promises')
			const items = await fs.readdir(this.options.outputDir, { withFileTypes: true })

			return items.filter(item =>
				item.isFile()).length
		} catch (error) {
			return 0
		}
	}

	/**
	 * Calculate output directory size
	 */
	private async calculateOutputSize(): Promise<number> {
		// Simple implementation - can be enhanced with recursive directory scanning
		try {
			const fs = await import('fs/promises')
			const items = await fs.readdir(this.options.outputDir, { withFileTypes: true })
			let totalSize = 0

			for (const item of items) {
				if (item.isFile()) {
					const stats = await stat(join(this.options.outputDir, item.name))

					totalSize += stats.size
				}
			}

			return totalSize
		} catch (error) {
			return 0
		}
	}

}

// CLI interface for standalone usage
if (process.argv[1] && process.argv[1].endsWith('asset-processor.ts')) {
	const options: ProcessingOptions = {
		sourceDir: 'assets',
		outputDir: '../ext/dist/assets',
		skipUnchanged: true,
		processDependencies: true,
		validateOutput: true,
		verbose: true,
	}

	const processor = new AssetProcessor(options)
  
	// This would typically be called with change analysis from the detector
	console.log('Asset processor initialized with options:', options)
	console.log('Use with change detector to process specific assets.')
}
