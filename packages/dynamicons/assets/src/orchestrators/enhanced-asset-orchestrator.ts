import { IconProcessor } from '../processors/icon-processor.js'
import { ThemeProcessor } from '../processors/theme-processor.js'
import { PreviewProcessor } from '../processors/preview-processor.js'
import { ModelAuditProcessor } from '../processors/model-audit-processor.js'
import { ThemeAuditProcessor } from '../processors/theme-audit-processor.js'
import { ErrorHandler } from '../utils/error-handler.js'
import { assetConstants } from '../_config/asset.constants.js'
import path from 'path'
import fs from 'fs'

interface Processor {
	process: (verbose?: boolean, demo?: boolean) => Promise<boolean>
}

export interface ChangeDetectionResult {
	iconChanges: boolean
	modelChanges: boolean
	themeFilesMissing: boolean
	previewImagesMissing: boolean
	externalSourceAvailable: boolean
	criticalError: string | null
}

export interface ScriptResult {
	script: string
	success: boolean
	output: string[]
	errors: string[]
	duration: number
	status: 'ran' | 'skipped' | 'failed'
	reason?: string
}

export interface OrchestrationResult {
	overallSuccess: boolean
	results: ScriptResult[]
	totalDuration: number
	summary: {
		passed: number
		failed: number
		total: number
	}
	changeDetection: ChangeDetectionResult
}

export class EnhancedAssetOrchestrator {
	private verbose: boolean = false
	private veryVerbose: boolean = false
	private results: ScriptResult[] = []
	private startTime: number = 0
	private errorHandler: ErrorHandler
	private changeDetection: ChangeDetectionResult | null = null

	constructor(verbose: boolean = false, veryVerbose: boolean = false) {
		this.verbose = verbose
		this.veryVerbose = veryVerbose
		this.errorHandler = new ErrorHandler()
	}

	/**
	 * Execute asset generation workflow with sophisticated dependency logic
	 */
	async generateAssets(): Promise<OrchestrationResult> {
		this.startTime = Date.now()
		
		// Change to the assets package directory for proper file resolution
		const originalCwd = process.cwd()
		const assetsDir = path.resolve(path.dirname(process.argv[1]), '..')
		process.chdir(assetsDir)
		
		try {
			if (this.verbose || this.veryVerbose) {
				console.log('\n🎨 [ENHANCED ASSET GENERATION ORCHESTRATOR]')
				console.log('═'.repeat(60))
				console.log('📋 Workflow Steps:')
				console.log('   1. 🔍 Change Detection (centralized analysis)')
				console.log('   2. 🔧 Process Icons (staging, organization, optimization)')
				console.log('   3. 📋 Audit Models (validation)')
				console.log('   4. 🎨 Generate Themes (base and dynamicons themes)')
				console.log('   5. 📋 Audit Themes (validation)')
				console.log('   6. 🖼️  Generate Previews (preview images)')
				console.log('═'.repeat(60))
				console.log('ℹ️  Note: Using sophisticated dependency logic with cascading skips')
				console.log('═'.repeat(60))
			}

			// Step 1: Centralized Change Detection
			this.changeDetection = await this.performChangeDetection()
			
			if (this.verbose || this.veryVerbose) {
				this.displayChangeDetectionResults()
			}

			// Check for critical errors
			if (this.changeDetection.criticalError) {
				return this.handleCriticalError()
			}

			// Step 2: Execute processors with dependency logic
			await this.executeProcessorsWithDependencies()

			const totalDuration = Date.now() - this.startTime
			const overallSuccess = this.results.every(r => r.success)
			
			const summary = {
				passed: this.results.filter(r => r.success).length,
				failed: this.results.filter(r => !r.success).length,
				total: this.results.length,
			}

			const orchestrationResult: OrchestrationResult = {
				overallSuccess,
				results: this.results,
				totalDuration,
				summary,
				changeDetection: this.changeDetection,
			}

			this.displayFinalResults(orchestrationResult)
			return orchestrationResult
		} finally {
			// Restore original working directory
			process.chdir(originalCwd)
		}
	}

	/**
	 * Perform centralized change detection
	 */
	private async performChangeDetection(): Promise<ChangeDetectionResult> {
		const result: ChangeDetectionResult = {
			iconChanges: false,
			modelChanges: false,
			themeFilesMissing: false,
			previewImagesMissing: false,
			externalSourceAvailable: true,
			criticalError: null,
		}

		try {
			// Check external source availability (using asset constants)
			const externalSourceDir = assetConstants.externalIconSource
			if (!fs.existsSync(externalSourceDir)) {
				result.externalSourceAvailable = false
				result.criticalError = 'External source directory not found'
				return result
			}

			// Check for icon changes
			result.iconChanges = await this.checkIconChanges()

			// Check for model changes
			result.modelChanges = await this.checkModelChanges()

			// Check for missing theme files
			result.themeFilesMissing = await this.checkThemeFilesMissing()

			// Check for missing preview images
			result.previewImagesMissing = await this.checkPreviewImagesMissing()

		} catch (error) {
			result.criticalError = error instanceof Error ? error.message : String(error)
		}

		return result
	}

	/**
	 * Check for icon changes in external source
	 */
	private async checkIconChanges(): Promise<boolean> {
		const externalSourceDir = assetConstants.externalIconSource
		const newIconsDir = path.join(process.cwd(), assetConstants.paths.newIconsDir)
		
		if (!fs.existsSync(externalSourceDir) || !fs.existsSync(newIconsDir)) {
			return false
		}

		// Check if there are new SVG files in external source that aren't in new_icons yet
		const externalFiles = fs.readdirSync(externalSourceDir).filter(f => f.endsWith('.svg'))
		const stagedFiles = fs.readdirSync(newIconsDir).filter(f => f.endsWith('.svg'))
		
		// If external source has files not yet staged, icons need processing
		return externalFiles.some(file => !stagedFiles.includes(file))
	}

	/**
	 * Check for model changes
	 */
	private async checkModelChanges(): Promise<boolean> {
		const modelsDir = path.join(process.cwd(), assetConstants.paths.modelsDir)
		const themesDir = path.join(process.cwd(), 'assets', 'themes')
		
		if (!fs.existsSync(modelsDir) || !fs.existsSync(themesDir)) {
			return true // Force generation if directories don't exist
		}

		// Check if any model file is newer than theme files
		const modelFiles = fs.readdirSync(modelsDir).filter(f => f.endsWith('.json'))
		const themeFiles = fs.readdirSync(themesDir).filter(f => f.endsWith('.json'))
		
		if (themeFiles.length === 0) {
			return true // Force generation if no theme files exist
		}

		// Get the newest model file timestamp
		let newestModelTime = 0
		for (const modelFile of modelFiles) {
			const modelPath = path.join(modelsDir, modelFile)
			const stats = fs.statSync(modelPath)
			newestModelTime = Math.max(newestModelTime, stats.mtime.getTime())
		}

		// Get the oldest theme file timestamp
		let oldestThemeTime = Infinity
		for (const themeFile of themeFiles) {
			const themePath = path.join(themesDir, themeFile)
			const stats = fs.statSync(themePath)
			oldestThemeTime = Math.min(oldestThemeTime, stats.mtime.getTime())
		}

		return newestModelTime > oldestThemeTime
	}

	/**
	 * Check if theme files are missing
	 */
	private async checkThemeFilesMissing(): Promise<boolean> {
		const themesDir = path.join(process.cwd(), 'assets', 'themes')
		const expectedThemeFiles = [
			assetConstants.themeFiles.baseTheme,
			assetConstants.themeFiles.generatedTheme
		]
		
		if (!fs.existsSync(themesDir)) {
			return true
		}

		return expectedThemeFiles.some(file => !fs.existsSync(path.join(themesDir, file)))
	}

	/**
	 * Check if preview images are missing
	 */
	private async checkPreviewImagesMissing(): Promise<boolean> {
		const previewsDir = path.join(process.cwd(), 'previews')
		const expectedPreviewFiles = ['file-icons-preview.png', 'folder-icons-preview.png', 'language-icons-preview.png']
		
		if (!fs.existsSync(previewsDir)) {
			return true
		}

		return expectedPreviewFiles.some(file => !fs.existsSync(path.join(previewsDir, file)))
	}

	/**
	 * Display change detection results
	 */
	private displayChangeDetectionResults(): void {
		console.log('\n🔍 [CHANGE DETECTION RESULTS]')
		console.log('─'.repeat(60))
		console.log(`📁 External Source Available: ${this.changeDetection?.externalSourceAvailable ? '✅' : '❌'}`)
		console.log(`🖼️  Icon Changes Detected: ${this.changeDetection?.iconChanges ? '✅' : '❌'}`)
		console.log(`📋 Model Changes Detected: ${this.changeDetection?.modelChanges ? '✅' : '❌'}`)
		console.log(`🎨 Theme Files Missing: ${this.changeDetection?.themeFilesMissing ? '✅' : '❌'}`)
		console.log(`🖼️  Preview Images Missing: ${this.changeDetection?.previewImagesMissing ? '✅' : '❌'}`)
		if (this.changeDetection?.criticalError) {
			console.log(`❌ Critical Error: ${this.changeDetection.criticalError}`)
		}
		console.log('─'.repeat(60))
	}

	/**
	 * Handle critical errors
	 */
	private handleCriticalError(): OrchestrationResult {
		const totalDuration = Date.now() - this.startTime
		
		// Create failed results for all processors
		const processors = [
			{ name: 'process-icons', description: 'Process Icons' },
			{ name: 'audit-models', description: 'Audit Models' },
			{ name: 'generate-themes', description: 'Generate Themes' },
			{ name: 'audit-themes', description: 'Audit Themes' },
			{ name: 'generate-previews', description: 'Generate Previews' },
		]

		for (const { name, description } of processors) {
			this.results.push({
				script: `${description} (${name})`,
				success: false,
				output: [],
				errors: [this.changeDetection?.criticalError || 'Critical error'],
				duration: 0,
				status: 'failed',
				reason: 'Critical error - stopping execution',
			})
		}

		return {
			overallSuccess: false,
			results: this.results,
			totalDuration,
			summary: {
				passed: 0,
				failed: this.results.length,
				total: this.results.length,
			},
			changeDetection: this.changeDetection!,
		}
	}

	/**
	 * Execute processors with sophisticated dependency logic
	 */
	private async executeProcessorsWithDependencies(): Promise<void> {
		// Define processors with their dependencies
		const processors = [
			{
				name: 'process-icons',
				description: 'Process Icons',
				processor: new IconProcessor(),
				shouldRun: () => this.changeDetection?.iconChanges || false,
				skipReason: 'no new icons',
			},
			{
				name: 'audit-models',
				description: 'Audit Models',
				processor: new ModelAuditProcessor(),
				shouldRun: () => this.changeDetection?.modelChanges || this.changeDetection?.themeFilesMissing || false,
				skipReason: 'no model changes',
			},
			{
				name: 'generate-themes',
				description: 'Generate Themes',
				processor: new ThemeProcessor(),
				shouldRun: () => this.changeDetection?.modelChanges || this.changeDetection?.themeFilesMissing || false,
				skipReason: 'no model changes',
			},
			{
				name: 'audit-themes',
				description: 'Audit Themes',
				processor: new ThemeAuditProcessor(),
				shouldRun: () => {
					// Only run if themes were generated (check previous results)
					const themesResult = this.results.find(r => r.script.includes('Generate Themes'))
					return themesResult?.success || false
				},
				skipReason: 'themes not generated',
			},
			{
				name: 'generate-previews',
				description: 'Generate Previews',
				processor: new PreviewProcessor(),
				shouldRun: () => this.changeDetection?.iconChanges || this.changeDetection?.previewImagesMissing || false,
				skipReason: 'no icon changes',
			},
		]

		// Execute processors with dependency logic
		for (const { name, description, processor, shouldRun, skipReason } of processors) {
			const shouldExecute = shouldRun()
			
			if (shouldExecute) {
				const result = await this.executeProcessor(name, description, processor)
				this.results.push(result)
				
				// Stop on first failure unless very verbose mode, but allow theme audit to fail
				if (!result.success && !this.veryVerbose) {
					// Allow theme audit to fail without stopping the workflow
					if (name === 'audit-themes') {
						// Continue to next processor (previews)
						continue
					}
					
					// Mark remaining processors as skipped due to failure
					const remainingProcessors = processors.slice(processors.findIndex(p => p.name === name) + 1)
					for (const remaining of remainingProcessors) {
						this.results.push({
							script: `${remaining.description} (${remaining.name})`,
							success: false,
							output: [],
							errors: [`Skipped due to ${name} failure`],
							duration: 0,
							status: 'skipped',
							reason: `dependency failed: ${name}`,
						})
					}
					break
				}
			} else {
				// Skip processor
				this.results.push({
					script: `${description} (${name})`,
					success: true,
					output: [`No changes detected - ${skipReason}`],
					errors: [],
					duration: 0,
					status: 'skipped',
					reason: skipReason,
				})
			}
		}
	}

	/**
	 * Execute a single processor
	 */
	private async executeProcessor(
		processorName: string,
		description: string,
		processor: Processor,
	): Promise<ScriptResult> {
		const startTime = Date.now()
		
		if (this.verbose || this.veryVerbose) {
			console.log(`\n🔄 Executing: ${description} (${processorName})`)
			console.log('─'.repeat(60))
		}

		try {
			let success = false
			const output: string[] = []
			const errors: string[] = []

			// Capture console output temporarily
			const originalLog = console.log
			const originalError = console.error
			
			console.log = (...args: unknown[]) => {
				const message = args.join(' ')
				output.push(message)
				// Always show errors, show other output only in verbose modes
				const isError = message.includes('❌') || message.includes('ERROR') || message.includes('FAILED')
				const isTreeStructure = message.includes('├─') || message.includes('└─') || message.includes('THEME:') || message.includes('MODEL:')
				if (this.verbose || this.veryVerbose || isError || isTreeStructure) {
					originalLog(...args)
				}
			}
			console.error = (...args: unknown[]) => {
				const message = args.join(' ')
				errors.push(message)
				// Always show errors
				originalError(...args)
			}

			let status: 'ran' | 'skipped' | 'failed' = 'ran'
			let reason: string | undefined

			try {
				// Execute the processor
				success = await processor.process(this.verbose)
				
				// Check for skip conditions
				if (output.some(line => line.includes('No changes detected'))) {
					status = 'skipped'
					reason = 'No changes detected'
				} else if (success) {
					status = 'ran'
				} else {
					status = 'failed'
					reason = 'Processor returned failure'
				}
			} catch (error) {
				success = false
				status = 'failed'
				reason = error instanceof Error ? error.message : String(error)
				errors.push(reason)
			} finally {
				// Restore console functions
				console.log = originalLog
				console.error = originalError
			}

			const duration = Date.now() - startTime

			const result: ScriptResult = {
				script: `${description} (${processorName})`,
				success,
				output,
				errors,
				duration,
				status,
				reason,
			}

			if (this.verbose || this.veryVerbose) {
				this.displayScriptResult(result)
			}

			return result
		} catch (error) {
			const duration = Date.now() - startTime
			const result: ScriptResult = {
				script: `${description} (${processorName})`,
				success: false,
				output: [],
				errors: [error instanceof Error ? error.message : String(error)],
				duration,
				status: 'failed',
				reason: error instanceof Error ? error.message : String(error),
			}

			if (this.verbose || this.veryVerbose) {
				this.displayScriptResult(result)
			}

			return result
		}
	}

	/**
	 * Display result for a single script
	 */
	private displayScriptResult(result: ScriptResult): void {
		let status: string
		let statusText: string
		
		switch (result.status) {
			case 'ran':
				status = '\x1B[32m✓\x1B[0m'
				statusText = 'Ran'
				break
			case 'skipped':
				status = '\x1B[32m\x1B[1m●\x1B[0m'
				statusText = 'Skipped'
				break
			case 'failed':
				status = '\x1B[31m✗\x1B[0m'
				statusText = 'Failed'
				break
		}
		
		const duration = `${result.duration}ms`
		const reasonText = result.reason ? ` - ${result.reason}` : ''
		
		console.log(`${status} ${result.script} (${statusText}, ${duration})${reasonText}`)
		
		if (!result.success && result.errors.length > 0) {
			console.log('   Errors:')
			result.errors.forEach(error => console.log(`   ${error}`))
		}
		
		if (this.veryVerbose && result.output.length > 0) {
			console.log('   Output:')
			result.output.forEach(line => console.log(`   ${line}`))
		}
	}

	/**
	 * Display final orchestration results
	 */
	private displayFinalResults(result: OrchestrationResult): void {
		const separator = '═'.repeat(100)
		
		// Always show header
		console.log(`\n${separator}`)
		console.log('ASSET GENERATION SUMMARY')
		console.log(separator)
		
		// Show optimization results if there are any
		const processIconsResult = result.results.find(r => r.script.includes('Process Icons'))
		if (processIconsResult && processIconsResult.success) {
			// Extract optimization lines from output
			const optimizationLines = processIconsResult.output.filter(line => 
				line.includes('of') && line.includes('file icon:') && line.includes('->')
			)
			
			// Display optimization results (already in correct format)
			optimizationLines.forEach(line => {
				console.log(line)
			})
			console.log(separator)
		}
		
		// Show failure results if there are any
		const failedResults = result.results.filter(r => !r.success)
		if (failedResults.length > 0) {
			// Check for theme audit failure and display theme errors
			const themeAuditResult = failedResults.find(r => r.script.includes('Audit Themes'))
			if (themeAuditResult) {
				// Display actual theme errors from the processor output
				// The theme audit processor should handle its own error display
				console.log('❌ Theme validation failed - see processor output above for details')
			}
			
			// Display other error output from failed processors
			failedResults.forEach(scriptResult => {
				// Skip theme audit as we handle it above
				if (scriptResult.script.includes('Audit Themes')) {
					return
				}
				
				// Display error output (already formatted by processors)
				scriptResult.output.forEach(line => {
					if (line.includes('❌') || line.includes('THEME:') || line.includes('MODEL:') || 
						line.includes('ERROR') || line.includes('FAILED')) {
						console.log(line)
					}
				})
			})
			console.log(separator)
		}
		
		// Show detailed results
		console.log('📋 Detailed Results:')
		result.results.forEach((scriptResult, index) => {
			let status: string
			let statusText: string
			
			switch (scriptResult.status) {
				case 'ran':
					status = '\x1B[32m✓\x1B[0m'
					statusText = 'Ran'
					break
				case 'skipped':
					status = '\x1B[32m\x1B[1m●\x1B[0m'
					statusText = 'Skipped'
					break
				case 'failed':
					status = '\x1B[31m✗\x1B[0m'
					statusText = 'Failed'
					break
			}
			
			const duration = `${scriptResult.duration}ms`
			const reasonText = scriptResult.reason ? ` - ${scriptResult.reason}` : ''
			
			console.log(`   ${index + 1}. ${status} ${scriptResult.script} (${statusText}, ${duration})${reasonText}`)
			
			if (!scriptResult.success && scriptResult.errors.length > 0) {
				console.log('      Errors:')
				scriptResult.errors.forEach(error => console.log(`      ${error}`))
			}
		})
		console.log(separator)
		
		console.log(`📊 Summary: ${result.summary.passed}/${result.summary.total} processors passed`)
		console.log(`⏱️  Total Duration: ${result.totalDuration}ms`)
		console.log(separator)
	}

	/**
	 * Get formatted results for external consumption
	 */
	getResults(): OrchestrationResult {
		return {
			overallSuccess: this.results.every(r => r.success),
			results: this.results,
			totalDuration: Date.now() - this.startTime,
			summary: {
				passed: this.results.filter(r => r.success).length,
				failed: this.results.filter(r => !r.success).length,
				total: this.results.length,
			},
			changeDetection: this.changeDetection!,
		}
	}
}
