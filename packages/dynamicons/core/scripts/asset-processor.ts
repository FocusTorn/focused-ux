import type { AssetChange } from './change-detector'
import type { AssetManifest } from './asset-manifest'
import { AssetManifestGenerator } from './asset-manifest'
import { copyFile, mkdir, stat } from 'fs/promises'
import { join, dirname } from 'path'
import { existsSync } from 'fs'

export interface ProcessingOptions {
	sourceDir: string
	outputDir: string
	skipUnchanged: boolean
	processDependencies: boolean
	validateOutput: boolean
}

export interface ProcessingResult {
	processed: string[]
	skipped: string[]
	errors: string[]
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

	constructor(options: ProcessingOptions) {
		this.options = options
		this.manifestGenerator = new AssetManifestGenerator(options.sourceDir)
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
			// Ensure output directory exists
			await this.ensureOutputDirectory()

			// Process each asset based on its change status
			for (const change of changes) {
				try {
					if (change.type === 'unchanged' && this.options.skipUnchanged) {
						skipped.push(change.assetPath)
						continue
					}

					if (change.type === 'deleted') {
						// Handle deleted assets (cleanup, etc.)
						await this.handleDeletedAsset(change.assetPath)
						continue
					}

					// Process added or modified assets
					await this.processAsset(change.assetPath)
					processed.push(change.assetPath)
				} catch (error) {
					const errorMsg = `Failed to process ${change.assetPath}: ${error}`

					console.error(errorMsg)
					errors.push(errorMsg)
				}
			}

			// Process dependencies if enabled
			if (this.options.processDependencies) {
				const dependencyResults = await this.processDependencies(changes)

				processed.push(...dependencyResults.processed)
				errors.push(...dependencyResults.errors)
			}

			// Validate output if enabled
			if (this.options.validateOutput) {
				const validationErrors = await this.validateOutput()

				errors.push(...validationErrors)
			}

			const timeMs = Date.now() - startTime

			return {
				processed,
				skipped,
				errors,
				summary: {
					total: changes.length,
					processed: processed.length,
					skipped: skipped.length,
					errors: errors.length,
					timeMs,
				},
			}
		} catch (error) {
			const errorMsg = `Asset processing failed: ${error}`

			console.error(errorMsg)
			errors.push(errorMsg)

			return {
				processed,
				skipped,
				errors,
				summary: {
					total: changes.length,
					processed: processed.length,
					skipped: skipped.length,
					errors: errors.length,
					timeMs: Date.now() - startTime,
				},
			}
		}
	}

	/**
	 * Process a single asset
	 */
	private async processAsset(assetPath: string): Promise<void> {
		const sourcePath = join(this.options.sourceDir, assetPath)
		const outputPath = join(this.options.outputDir, assetPath)

		// Ensure output directory exists
		await this.ensureDirectory(dirname(outputPath))

		// Copy the asset
		await copyFile(sourcePath, outputPath)

		// Apply asset-specific processing
		await this.applyAssetProcessing(assetPath, outputPath)
	}

	/**
	 * Apply asset-specific processing based on type
	 */
	private async applyAssetProcessing(assetPath: string, outputPath: string): Promise<void> {
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
		console.log(`Processed SVG asset: ${assetPath}`)
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
			console.log(`Processed theme asset: ${assetPath}`)
		} catch (error) {
			console.warn(`Theme validation failed for ${assetPath}:`, error)
		}
	}

	/**
	 * Process image assets (optimization, metadata)
	 */
	private async processImageAsset(assetPath: string, outputPath: string): Promise<void> {
		// Image-specific processing: metadata extraction, format validation
		console.log(`Processed image asset: ${assetPath}`)
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

			for (const dependentAsset of dependentAssets) {
				try {
					await this.processAsset(dependentAsset)
					processed.push(dependentAsset)
				} catch (error) {
					const errorMsg = `Failed to process dependent asset ${dependentAsset}: ${error}`

					console.error(errorMsg)
					errors.push(errorMsg)
				}
			}
		} catch (error) {
			const errorMsg = `Dependency processing failed: ${error}`

			console.error(errorMsg)
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
				console.log(`Removed deleted asset: ${assetPath}`)
			}
		} catch (error) {
			console.warn(`Failed to remove deleted asset ${assetPath}:`, error)
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
	 * Validate output directory
	 */
	private async validateOutput(): Promise<string[]> {
		const errors: string[] = []

		try {
			const manifest = await this.manifestGenerator.generateManifest()
      
			for (const asset of manifest.assets) {
				const outputPath = join(this.options.outputDir, asset.path)
        
				if (!existsSync(outputPath)) {
					errors.push(`Missing output asset: ${asset.path}`)
				} else {
					// Check file size and basic integrity
					const stats = await stat(outputPath)

					if (stats.size === 0) {
						errors.push(`Empty output asset: ${asset.path}`)
					}
				}
			}
		} catch (error) {
			errors.push(`Output validation failed: ${error}`)
		}

		return errors
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
			console.error('Failed to get processing stats:', error)
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
	}

	const processor = new AssetProcessor(options)
  
	// This would typically be called with change analysis from the detector
	console.log('Asset processor initialized with options:', options)
	console.log('Use with change detector to process specific assets.')
}
