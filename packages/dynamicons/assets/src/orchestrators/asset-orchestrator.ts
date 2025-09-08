import { IconProcessor } from '../processors/icon-processor.js'
import { ThemeProcessor } from '../processors/theme-processor.js'
import { PreviewProcessor } from '../processors/preview-processor.js'
import { ErrorHandler } from '../utils/error-handler.js'

interface Processor {
	process: (verbose?: boolean) => Promise<boolean>
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
}

export class AssetOrchestrator {

	private verbose: boolean = false
	private veryVerbose: boolean = false
	private results: ScriptResult[] = []
	private startTime: number = 0
	private errorHandler: ErrorHandler

	constructor(verbose: boolean = false, veryVerbose: boolean = false) {
		this.verbose = verbose
		this.veryVerbose = veryVerbose
		this.errorHandler = new ErrorHandler()
	}

	/**
	 * Execute asset generation workflow using proper TypeScript modules
	 */
	async generateAssets(): Promise<OrchestrationResult> {
		this.startTime = Date.now()
		
		if (this.verbose || this.veryVerbose) {
			console.log('\n🎨 [ASSET GENERATION ORCHESTRATOR]')
			console.log('═'.repeat(60))
			console.log('📋 Workflow Steps:')
			console.log('   1. 🔧 Process Icons (staging, organization, optimization)')
			console.log('   2. 🎨 Generate Themes (base and dynamicons themes)')
			console.log('   3. 🖼️  Generate Previews (preview images)')
			console.log('═'.repeat(60))
			console.log('ℹ️  Note: Using compiled TypeScript modules for better performance')
			console.log('═'.repeat(60))
		}

		// Define the processors to execute in order
		const processors = [
			{ name: 'process-icons', description: 'Process Icons', processor: new IconProcessor() },
			{ name: 'generate-themes', description: 'Generate Themes', processor: new ThemeProcessor() },
			{ name: 'generate-previews', description: 'Generate Previews', processor: new PreviewProcessor() },
		]

		// Execute each processor sequentially
		for (const { name, description, processor } of processors) {
			const result = await this.executeProcessor(name, description, processor)

			this.results.push(result)
			
			// Stop on first failure unless very verbose mode
			if (!result.success && !this.veryVerbose) {
				break
			}
		}

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
		}

		this.displayFinalResults(orchestrationResult)
		return orchestrationResult
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
				if (this.veryVerbose) {
					originalLog(...args)
				}
			}
			console.error = (...args: unknown[]) => {
				const message = args.join(' ')

				errors.push(message)
				if (this.veryVerbose) {
					originalError(...args)
				}
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
				} else {
					status = 'ran'
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
		console.log(`\n${'═'.repeat(60)}`)
		
		if (result.overallSuccess) {
			console.log('✅ ASSET GENERATION COMPLETED SUCCESSFULLY')
		} else {
			console.log('❌ ASSET GENERATION FAILED')
		}
		
		console.log('═'.repeat(60))
		
		console.log(`📊 Summary: ${result.summary.passed}/${result.summary.total} processors passed`)
		console.log(`⏱️  Total Duration: ${result.totalDuration}ms`)
		console.log('═'.repeat(60))
		
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
		console.log('═'.repeat(60))
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
		}
	}

}
