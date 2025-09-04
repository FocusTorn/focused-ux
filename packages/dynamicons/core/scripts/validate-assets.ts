#!/usr/bin/env node

import { AssetManifestGenerator } from './asset-manifest'
import { AssetValidator } from './asset-validator'
import { StructuredLogger } from './asset-logger'
import { join, dirname } from 'path'
import { existsSync, mkdirSync } from 'fs'

interface ValidationOptions {
	sourceDir: string
	modelsDir: string
	themesDir: string
	manifestPath: string
	verbose: boolean
	silent: boolean
	logToFile: boolean
	logFilePath?: string
	exportReport: boolean
	reportPath?: string
}

class AssetValidationRunner {

	private readonly options: ValidationOptions
	private readonly logger: StructuredLogger

	constructor(options: ValidationOptions) {
		this.options = options
		
		// Initialize logger
		this.logger = new StructuredLogger('Asset Validation Runner', {
			verbose: options.verbose,
			silent: options.silent,
			logToFile: options.logToFile,
			logFilePath: options.logFilePath,
		})
	}

	/**
	 * Run comprehensive asset validation
	 */
	async runValidation(): Promise<boolean> {
		try {
			this.logger.startOperation('Comprehensive Asset Validation')
			this.logger.addStep('Generate asset manifest')
			this.logger.addStep('Run validation checks')
			this.logger.addStep('Generate validation report')
			this.logger.addStep('Export results')

			// Step 1: Generate asset manifest
			this.logger.startStep(0)

			const manifest = await this.generateManifest()

			if (!manifest) {
				this.logger.operationFailed(new Error('Failed to generate asset manifest'))
				return false
			}
			this.logger.completeStep()

			// Step 2: Run validation checks
			this.logger.startStep(1)

			const validationResult = await this.runValidationChecks(manifest)

			this.logger.completeStep()

			// Step 3: Generate validation report
			this.logger.startStep(2)
			this.generateValidationReport(validationResult)
			this.logger.completeStep()

			// Step 4: Export results
			this.logger.startStep(3)
			if (this.options.exportReport) {
				await this.exportValidationReport(validationResult)
			}
			this.logger.completeStep()

			// Determine success/failure
			if (validationResult.valid) {
				this.logger.completeOperation('Asset validation completed successfully')
				return true
			} else {
				this.logger.operationFailed(
					new Error(`${validationResult.errors.length} validation errors found`),
					{ validationResult },
				)
				return false
			}
		} catch (error) {
			this.logger.operationFailed(error as Error, { operation: 'validation' })
			return false
		}
	}

	/**
	 * Generate asset manifest
	 */
	private async generateManifest(): Promise<any> {
		try {
			this.logger.info('Generating asset manifest', { sourceDir: this.options.sourceDir })
			
			const generator = new AssetManifestGenerator(this.options.sourceDir, this.options.manifestPath)
			const manifest = await generator.generateManifest()
			
			this.logger.success(`Manifest generated with ${manifest.assets.length} assets`)
			this.logger.info('Manifest details', {
				categories: Object.keys(manifest.categories),
				version: manifest.version,
				generatedAt: new Date(manifest.generatedAt).toISOString(),
			})
			
			return manifest
		} catch (error) {
			this.logger.error('Failed to generate manifest', { error: error.message })
			return null
		}
	}

	/**
	 * Run comprehensive validation checks
	 */
	private async runValidationChecks(manifest: any): Promise<any> {
		try {
			this.logger.info('Running validation checks', {
				modelsDir: this.options.modelsDir,
				themesDir: this.options.themesDir,
			})

			const validator = new AssetValidator(
				this.options.sourceDir,
				this.options.modelsDir,
				this.options.themesDir,
				manifest,
			)

			const validationResult = await validator.validateAssets(this.options.verbose)
			
			this.logger.info('Validation completed', {
				valid: validationResult.valid,
				errors: validationResult.errors.length,
				warnings: validationResult.warnings.length,
			})

			return validationResult
		} catch (error) {
			this.logger.error('Validation checks failed', { error: error.message })
			throw error
		}
	}

	/**
	 * Generate comprehensive validation report
	 */
	private generateValidationReport(validationResult: any): void {
		this.logger.info('Generating validation report')

		// Overall status
		if (validationResult.valid) {
			this.logger.success('🎉 All assets passed validation!')
		} else {
			this.logger.error(`❌ Validation failed with ${validationResult.errors.length} errors`)
		}

		// Summary statistics
		this.logger.info('📊 Validation Summary', {
			totalAssets: validationResult.summary.totalAssets,
			validAssets: validationResult.summary.validAssets,
			invalidAssets: validationResult.summary.invalidAssets,
			orphanedAssets: validationResult.summary.orphanedAssets,
			duplicateNames: validationResult.summary.duplicateNames,
			missingReferences: validationResult.summary.missingReferences,
		})

		// Use concise output by default, detailed output for verbose mode
		if (this.options.verbose) {
			this.generateDetailedReport(validationResult)
		} else {
			this.generateConciseReport(validationResult)
		}
	}

	/**
	 * Generate actionable recommendations based on validation results
	 */
	private generateRecommendations(validationResult: any): void {
		this.logger.info('💡 Recommendations')

		if (validationResult.errors.length === 0 && validationResult.warnings.length === 0) {
			this.logger.success('  • All assets are properly configured and validated')
			this.logger.success('  • No action required')
			return
		}

		// Error-based recommendations
		if (validationResult.errors.length > 0) {
			this.logger.error('  • Critical issues must be resolved before proceeding:')
			
			const errorTypes = new Set(validationResult.errors.map((e: any) =>
				e.code))
			
			if (errorTypes.has('ASSET_NOT_FOUND')) {
				this.logger.error('    - Check for missing asset files referenced in themes')
			}
			
			if (errorTypes.has('INVALID_SVG')) {
				this.logger.error('    - Fix malformed SVG files')
			}
			
			if (errorTypes.has('INVALID_THEME')) {
				this.logger.error('    - Fix malformed theme JSON files')
			}
			
			if (errorTypes.has('MISSING_ICON_DEFINITIONS')) {
				this.logger.error('    - Ensure themes have proper iconDefinitions structure')
			}
			
			if (errorTypes.has('INVALID_ICON_DEFINITION')) {
				this.logger.error('    - Fix icon definitions missing iconPath')
			}
			
			if (errorTypes.has('INVALID_FILE_EXTENSION_REFERENCE')) {
				this.logger.error('    - Fix file extension associations pointing to undefined icons')
			}
			
			if (errorTypes.has('INVALID_FILE_NAME_REFERENCE')) {
				this.logger.error('    - Fix file name associations pointing to undefined icons')
			}
			
			if (errorTypes.has('INVALID_FOLDER_NAME_REFERENCE')) {
				this.logger.error('    - Fix folder name associations pointing to undefined icons')
			}
			
			if (errorTypes.has('ICON_FILE_NOT_FOUND')) {
				this.logger.error('    - Fix icon file references in themes')
			}
		}

		// Warning-based recommendations
		if (validationResult.warnings.length > 0) {
			this.logger.warning('  • Consider addressing these warnings:')
			
			const warningTypes = new Set(validationResult.warnings.map((w: any) =>
				w.code))
			
			if (warningTypes.has('ORPHANED_FILE_ICON') || warningTypes.has('ORPHANED_FOLDER_ICON')) {
				this.logger.warning('    - Remove unused icon files or add them to model files')
			}
			
			if (warningTypes.has('DUPLICATE_FILE_ICON_NAME') || warningTypes.has('DUPLICATE_FOLDER_ICON_NAME')) {
				this.logger.warning('    - Remove duplicate icon names from model files')
			}
			
			if (warningTypes.has('UNASSOCIATED_ICON')) {
				this.logger.warning('    - Add file associations for icons or mark them as orphans')
			}
			
			if (warningTypes.has('UNASSOCIATED_FOLDER_ICON')) {
				this.logger.warning('    - Add folder associations for icons or mark them as orphans')
			}
			
			if (warningTypes.has('INVALID_EXTENSION_FORMAT')) {
				this.logger.warning('    - Fix file extensions to start with "." (e.g., ".js" not "js")')
			}
			
			if (warningTypes.has('ABSOLUTE_ICON_PATH')) {
				this.logger.warning('    - Use relative paths for icon references in themes')
			}
			
			if (warningTypes.has('PATH_TRAVERSAL_DETECTED')) {
				this.logger.warning('    - Avoid path traversal patterns in asset paths')
			}
			
			if (warningTypes.has('ABSOLUTE_ASSET_PATH')) {
				this.logger.warning('    - Use relative paths for all asset references')
			}
			
			if (warningTypes.has('EMPTY_ASSET')) {
				this.logger.warning('    - Check for empty asset files')
			}
		}

		// General recommendations
		this.logger.info('  • General best practices:')
		this.logger.info('    - Keep icon names consistent between models and files')
		this.logger.info('    - Use relative paths for all asset references')
		this.logger.info('    - Validate SVG files before adding them')
		this.logger.info('    - Test theme files after making changes')
	}

	/**
	 * Export validation report to file
	 */
	private async exportValidationReport(validationResult: any): Promise<void> {
		if (!this.options.exportReport || !this.options.reportPath) {
			return
		}

		try {
			// Ensure report directory exists
			const reportDir = dirname(this.options.reportPath)

			if (!existsSync(reportDir)) {
				mkdirSync(reportDir, { recursive: true })
			}

			// Prepare export data
			const exportData = {
				exportedAt: new Date().toISOString(),
				validationResult,
				logSummary: this.logger.getLogSummary(),
				recommendations: this.generateRecommendationsText(validationResult),
			}

			// Write report
			const fs = await import('fs/promises')

			await fs.writeFile(this.options.reportPath, JSON.stringify(exportData, null, 2))
			
			this.logger.success('Validation report exported', { path: this.options.reportPath })
		} catch (error) {
			this.logger.error('Failed to export validation report', { error: error.message })
		}
	}

	/**
	 * Generate recommendations as text for export
	 */
	private generateRecommendationsText(validationResult: any): string[] {
		const recommendations: string[] = []

		if (validationResult.errors.length === 0 && validationResult.warnings.length === 0) {
			recommendations.push('All assets are properly configured and validated')
			recommendations.push('No action required')
			return recommendations
		}

		if (validationResult.errors.length > 0) {
			recommendations.push('Critical issues must be resolved before proceeding:')
			
			const errorTypes = new Set(validationResult.errors.map((e: any) =>
				e.code))
			
			if (errorTypes.has('ASSET_NOT_FOUND')) {
				recommendations.push('- Check for missing asset files referenced in themes')
			}
			
			if (errorTypes.has('INVALID_SVG')) {
				recommendations.push('- Fix malformed SVG files')
			}
			
			if (errorTypes.has('INVALID_THEME')) {
				recommendations.push('- Fix malformed theme JSON files')
			}
			
			if (errorTypes.has('MISSING_ICON_DEFINITIONS')) {
				recommendations.push('- Ensure themes have proper iconDefinitions structure')
			}
			
			if (errorTypes.has('INVALID_ICON_DEFINITION')) {
				recommendations.push('- Fix icon definitions missing iconPath')
			}
			
			if (errorTypes.has('INVALID_FILE_EXTENSION_REFERENCE')) {
				recommendations.push('- Fix file extension associations pointing to undefined icons')
			}
			
			if (errorTypes.has('INVALID_FILE_NAME_REFERENCE')) {
				recommendations.push('- Fix file name associations pointing to undefined icons')
			}
			
			if (errorTypes.has('INVALID_FOLDER_NAME_REFERENCE')) {
				recommendations.push('- Fix folder name associations pointing to undefined icons')
			}
			
			if (errorTypes.has('ICON_FILE_NOT_FOUND')) {
				recommendations.push('- Fix icon file references in themes')
			}
		}

		if (validationResult.warnings.length > 0) {
			recommendations.push('Consider addressing these warnings:')
			
			const warningTypes = new Set(validationResult.warnings.map((w: any) =>
				w.code))
			
			if (warningTypes.has('ORPHANED_FILE_ICON') || warningTypes.has('ORPHANED_FOLDER_ICON')) {
				recommendations.push('- Remove unused icon files or add them to model files')
			}
			
			if (warningTypes.has('DUPLICATE_FILE_ICON_NAME') || warningTypes.has('DUPLICATE_FOLDER_ICON_NAME')) {
				recommendations.push('- Remove duplicate icon names from model files')
			}
			
			if (warningTypes.has('UNASSOCIATED_ICON')) {
				recommendations.push('- Add file associations for icons or mark them as orphans')
			}
			
			if (warningTypes.has('UNASSOCIATED_FOLDER_ICON')) {
				recommendations.push('- Add folder associations for icons or mark them as orphans')
			}
			
			if (warningTypes.has('INVALID_EXTENSION_FORMAT')) {
				recommendations.push('- Fix file extensions to start with "." (e.g., ".js" not "js")')
			}
			
			if (warningTypes.has('ABSOLUTE_ICON_PATH')) {
				recommendations.push('- Use relative paths for icon references in themes')
			}
			
			if (warningTypes.has('PATH_TRAVERSAL_DETECTED')) {
				recommendations.push('- Avoid path traversal patterns in asset paths')
			}
			
			if (warningTypes.has('ABSOLUTE_ASSET_PATH')) {
				recommendations.push('- Use relative paths for all asset references')
			}
			
			if (warningTypes.has('EMPTY_ASSET')) {
				recommendations.push('- Check for empty asset files')
			}
		}

		recommendations.push('General best practices:')
		recommendations.push('- Keep icon names consistent between models and files')
		recommendations.push('- Use relative paths for all asset references')
		recommendations.push('- Validate SVG files before adding them')
		recommendations.push('- Test theme files after making changes')

		return recommendations
	}

	/**
	 * Generate concise validation report (default mode)
	 */
	private generateConciseReport(validationResult: any): void {
		// Error summary
		if (validationResult.errors.length > 0) {
			this.logger.error(`🚨 Validation Errors (${validationResult.errors.length})`)
			
			if (validationResult.conciseSummary) {
				// Group errors by type with counts
				Object.entries(validationResult.conciseSummary.errorCounts).forEach(([code, count], index) => {
					const isLast = index === Object.keys(validationResult.conciseSummary.errorCounts).length - 1

					this.logger.logHierarchyError('  ', `${code}: ${count} occurrence(s)`, isLast)
					
					// Show first few examples
					const examples = validationResult.conciseSummary.errorExamples[code] || []

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

		// Warning summary
		if (validationResult.warnings.length > 0) {
			this.logger.warning(`⚠️ Validation Warnings (${validationResult.warnings.length})`)
			
			if (validationResult.conciseSummary) {
				// Group warnings by type with counts
				Object.entries(validationResult.conciseSummary.warningCounts).forEach(([code, count], index) => {
					const isLast = index === Object.keys(validationResult.conciseSummary.warningCounts).length - 1

					this.logger.logHierarchyWarning('  ', `${code}: ${count} occurrence(s)`, isLast)
					
					// Show first few examples
					const examples = validationResult.conciseSummary.warningExamples[code] || []

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

		// Recommendations
		this.generateRecommendations(validationResult)
	}

	/**
	 * Generate detailed validation report (verbose mode)
	 */
	private generateDetailedReport(validationResult: any): void {
		// Error details
		if (validationResult.errors.length > 0) {
			this.logger.error(`🚨 Validation Errors (${validationResult.errors.length})`)
			validationResult.errors.forEach((error: any, index: number) => {
				const isLast = index === validationResult.errors.length - 1

				this.logger.logHierarchyError('  ', `${error.code}: ${error.message}`, isLast)
				
				if (error.assetPath) {
					this.logger.logHierarchy('    ', `Asset: ${error.assetPath}`, true)
				}
				
				if (error.context && Object.keys(error.context).length > 0) {
					Object.entries(error.context).forEach(([key, value], ctxIndex) => {
						const isCtxLast = ctxIndex === Object.keys(error.context).length - 1

						this.logger.logHierarchy('      ', `${key}: ${JSON.stringify(value)}`, isCtxLast)
					})
				}
			})
		}

		// Warning details
		if (validationResult.warnings.length > 0) {
			this.logger.warning(`⚠️ Validation Warnings (${validationResult.warnings.length})`)
			validationResult.warnings.forEach((warning: any, index: number) => {
				const isLast = index === validationResult.warnings.length - 1

				this.logger.logHierarchyWarning('  ', `${warning.code}: ${warning.message}`, isLast)
				
				if (warning.assetPath) {
					this.logger.logHierarchy('    ', `Asset: ${warning.assetPath}`, true)
				}
				
				if (warning.context && Object.keys(warning.context).length > 0) {
					Object.entries(warning.context).forEach(([key, value], ctxIndex) => {
						const isCtxLast = ctxIndex === Object.keys(warning.context).length - 1

						this.logger.logHierarchy('      ', `${key}: ${JSON.stringify(value)}`, isCtxLast)
					})
				}
			})
		}

		// Recommendations
		this.generateRecommendations(validationResult)
	}

}

// CLI interface
async function main(): Promise<void> {
	const args = process.argv.slice(2)
	
	// Default configuration
	const options: ValidationOptions = {
		sourceDir: 'assets',
		modelsDir: 'src/models',
		themesDir: 'assets/themes',
		manifestPath: 'asset-manifest.json',
		verbose: false,
		silent: false,
		logToFile: false,
		exportReport: false,
	}

	// Parse command line arguments
	for (let i = 0; i < args.length; i++) {
		const arg = args[i]
		
		switch (arg) {
			case '--source-dir':
				options.sourceDir = args[++i] || 'assets'
				break
			case '--models-dir':
				options.modelsDir = args[++i] || 'src/models'
				break
			case '--themes-dir':
				options.themesDir = args[++i] || 'assets/themes'
				break
			case '--manifest-path':
				options.manifestPath = args[++i] || 'asset-manifest.json'
				break
			case '--verbose':
			case '-v':
				options.verbose = true
				break
			case '--silent':
			case '-s':
				options.silent = true
				break
			case '--log-to-file':
				options.logToFile = true
				options.logFilePath = join(process.cwd(), 'logs', 'asset-validation.log')
				break
			case '--export-report':
				options.exportReport = true
				options.reportPath = args[++i] || join(process.cwd(), 'reports', `validation-report-${Date.now()}.json`)
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

	const runner = new AssetValidationRunner(options)
	const success = await runner.runValidation()
	
	process.exit(success ? 0 : 1)
}

function showHelp(): void {
	console.log(`
Asset Validation Runner

Usage: tsx validate-assets.ts [options]

Options:
  --source-dir <path>      Source assets directory (default: assets)
  --models-dir <path>      Icon models directory (default: src/models)
  --themes-dir <path>      Theme files directory (default: assets/themes)
  --manifest-path <path>   Asset manifest file path (default: asset-manifest.json)
  --verbose, -v            Enable verbose logging
  --silent, -s             Suppress all output
  --log-to-file            Enable file logging
  --export-report [path]   Export validation report to JSON file
  --help, -h               Show this help message

Examples:
  tsx validate-assets.ts --verbose
  tsx validate-assets.ts --log-to-file --export-report reports/validation.json
  tsx validate-assets.ts --source-dir src/assets --models-dir src/models
`)
}

// Run if called directly
if (process.argv[1] && process.argv[1].endsWith('validate-assets.ts')) {
	main().catch((error) => {
		console.error('Fatal error:', error)
		process.exit(1)
	})
}
