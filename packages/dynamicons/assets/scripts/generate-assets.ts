#!/usr/bin/env node

import { spawn } from 'child_process'
import { promises as fs } from 'fs'
import path from 'path'

interface ScriptResult {
	script: string
	success: boolean
	output: string[]
	errors: string[]
	duration: number
}

interface OrchestrationResult {
	overallSuccess: boolean
	results: ScriptResult[]
	totalDuration: number
	summary: {
		passed: number
		failed: number
		total: number
	}
}

class AssetGenerationOrchestrator {
	private verbose: boolean = false
	private veryVerbose: boolean = false
	private results: ScriptResult[] = []
	private startTime: number = 0

	constructor(verbose: boolean = false, veryVerbose: boolean = false) {
		this.verbose = verbose
		this.veryVerbose = veryVerbose
	}

	/**
	 * Execute a single script and capture its output
	 */
	private async executeScript(scriptName: string, args: string[] = []): Promise<ScriptResult> {
		const scriptPath = path.join(process.cwd(), 'scripts', scriptName)
		const startTime = Date.now()
		
		if (this.verbose || this.veryVerbose) {
			console.log(`\n🔄 Executing: ${scriptName} ${args.join(' ')}`)
			console.log('─'.repeat(60))
		}

		return new Promise((resolve) => {
			const isWindows = process.platform === 'win32'
			const command = isWindows ? 'npx.cmd' : 'npx'
			
			const child = spawn(command, ['tsx', scriptPath, ...args], {
				stdio: this.veryVerbose ? 'inherit' : 'pipe',
				cwd: process.cwd(),
				shell: isWindows
			})

			const output: string[] = []
			const errors: string[] = []

			if (!this.veryVerbose) {
				child.stdout?.on('data', (data) => {
					const lines = data.toString().split('\n').filter((line: string) => line.trim())
					output.push(...lines)
				})

				child.stderr?.on('data', (data) => {
					const lines = data.toString().split('\n').filter((line: string) => line.trim())
					errors.push(...lines)
				})
			}

			child.on('close', (code) => {
				const duration = Date.now() - startTime
				const success = code === 0

				const result: ScriptResult = {
					script: scriptName,
					success,
					output,
					errors,
					duration
				}

				if (this.verbose || this.veryVerbose) {
					this.displayScriptResult(result)
				}

				resolve(result)
			})

			child.on('error', (error) => {
				const duration = Date.now() - startTime
				const result: ScriptResult = {
					script: scriptName,
					success: false,
					output: [],
					errors: [error.message],
					duration
				}

				if (this.verbose || this.veryVerbose) {
					this.displayScriptResult(result)
				}

				resolve(result)
			})
		})
	}

	/**
	 * Display result for a single script
	 */
	private displayScriptResult(result: ScriptResult): void {
		const status = result.success ? '✅' : '❌'
		const duration = `${result.duration}ms`
		
		console.log(`${status} ${result.script} (${duration})`)
		
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
	 * Execute the complete asset generation workflow
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
		}

		// Define the scripts to execute in order
		const scripts = [
			{ name: 'process-icons.ts', args: this.verbose ? ['--verbose'] : [] },
			{ name: 'generate-themes.ts', args: this.verbose ? ['--verbose'] : [] },
			{ name: 'generate-previews.ts', args: this.verbose ? ['--verbose'] : [] }
		]

		// Execute each script sequentially
		for (const script of scripts) {
			const result = await this.executeScript(script.name, script.args)
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
			total: this.results.length
		}

		const orchestrationResult: OrchestrationResult = {
			overallSuccess,
			results: this.results,
			totalDuration,
			summary
		}

		this.displayFinalResults(orchestrationResult)
		return orchestrationResult
	}

	/**
	 * Display final orchestration results
	 */
	private displayFinalResults(result: OrchestrationResult): void {
		console.log('\n' + '═'.repeat(60))
		
		if (result.overallSuccess) {
			console.log('✅ ASSET GENERATION COMPLETED SUCCESSFULLY')
		} else {
			console.log('❌ ASSET GENERATION FAILED')
		}
		
		console.log('═'.repeat(60))
		console.log(`📊 Summary: ${result.summary.passed}/${result.summary.total} scripts passed`)
		console.log(`⏱️  Total Duration: ${result.totalDuration}ms`)
		
		if (this.verbose || this.veryVerbose) {
			console.log('\n📋 Detailed Results:')
			result.results.forEach((scriptResult, index) => {
				const status = scriptResult.success ? '✅' : '❌'
				console.log(`   ${index + 1}. ${status} ${scriptResult.script} (${scriptResult.duration}ms)`)
			})
		}
		
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
				total: this.results.length
			}
		}
	}
}

// CLI interface
async function main(): Promise<void> {
	const args = process.argv.slice(2)
	
	// Check for explicit verbose flags or Nx verbose mode
	const verbose = args.includes('--verbose') || args.includes('-v') || 
		process.env.NX_VERBOSE_LOGGING === 'true' ||
		process.argv.some(arg => arg.includes('--verbose'))
	const veryVerbose = args.includes('--very-verbose') || args.includes('-vv')
	
	if (args.includes('--help') || args.includes('-h')) {
		showHelp()
		return
	}

	const orchestrator = new AssetGenerationOrchestrator(verbose, veryVerbose)
	const result = await orchestrator.generateAssets()
	
	// Exit with appropriate code
	process.exit(result.overallSuccess ? 0 : 1)
}

function showHelp(): void {
	console.log(`
Asset Generation Orchestrator

Usage: npx tsx scripts/generate-assets.ts [options]

Options:
  -v, --verbose              Enable verbose output for each script
  -vv, --very-verbose        Enable very verbose output (shows all script output)
  -h, --help                 Show this help message

Examples:
  # Generate assets with minimal output
  npx tsx scripts/generate-assets.ts
  
  # Generate assets with verbose output
  npx tsx scripts/generate-assets.ts --verbose
  
  # Generate assets with very verbose output
  npx tsx scripts/generate-assets.ts --very-verbose
`)
}

// Run if called directly
if (process.argv[1] && process.argv[1].endsWith('generate-assets.ts')) {
	main().catch((error) => {
		console.error('Asset generation failed:', error)
		process.exit(1)
	})
}

export { AssetGenerationOrchestrator, OrchestrationResult, ScriptResult }
