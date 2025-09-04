#!/usr/bin/env node

import { promises as fs } from 'fs'
import path from 'path'
import { errorHandler, ErrorType, ErrorSeverity } from './error-handler.js'

/**
 * Error Reporter - Comprehensive error analysis and reporting
 */
export class ErrorReporter {
	private errorHandler = errorHandler

	/**
	 * Generate comprehensive error report
	 */
	public async generateReport(outputPath?: string): Promise<string> {
		const summary = this.errorHandler.getErrorSummary()
		const report = this.formatReport(summary)
		
		if (outputPath) {
			await this.saveReport(report, outputPath)
		}
		
		return report
	}

	/**
	 * Format error report
	 */
	private formatReport(summary: {
		total: number
		bySeverity: Record<ErrorSeverity, number>
		byType: Record<ErrorType, number>
	}): string {
		const timestamp = new Date().toISOString()
		const report = []

		// Header
		report.push('='.repeat(80))
		report.push('ASSET GENERATION ERROR REPORT')
		report.push('='.repeat(80))
		report.push(`Generated: ${timestamp}`)
		report.push(`Total Errors: ${summary.total}`)
		report.push('')

		// Severity breakdown
		report.push('ERROR SEVERITY BREAKDOWN')
		report.push('-'.repeat(40))
		Object.entries(summary.bySeverity).forEach(([severity, count]) => {
			if (count > 0) {
				report.push(`${severity.padEnd(10)}: ${count}`)
			}
		})
		report.push('')

		// Error type breakdown
		report.push('ERROR TYPE BREAKDOWN')
		report.push('-'.repeat(40))
		Object.entries(summary.byType)
			.sort(([,a], [,b]) => b - a) // Sort by count descending
			.forEach(([type, count]) => {
				report.push(`${type.padEnd(30)}: ${count}`)
			})
		report.push('')

		// Recommendations
		report.push('RECOMMENDATIONS')
		report.push('-'.repeat(40))
		this.addRecommendations(report, summary)
		report.push('')

		// Footer
		report.push('='.repeat(80))
		report.push('End of Report')
		report.push('='.repeat(80))

		return report.join('\n')
	}

	/**
	 * Add recommendations based on error analysis
	 */
	private addRecommendations(
		report: string[],
		summary: {
			total: number
			bySeverity: Record<ErrorSeverity, number>
			byType: Record<ErrorType, number>
		}
	): void {
		if (summary.total === 0) {
			report.push('✅ No errors detected - system is healthy')
			return
		}

		// Critical errors
		if (summary.bySeverity[ErrorSeverity.CRITICAL] > 0) {
			report.push('🚨 CRITICAL ERRORS DETECTED:')
			report.push('   - Immediate attention required')
			report.push('   - Check system resources and permissions')
			report.push('   - Review external dependencies')
		}

		// High severity errors
		if (summary.bySeverity[ErrorSeverity.HIGH] > 0) {
			report.push('⚠️  HIGH SEVERITY ERRORS:')
			report.push('   - Review input validation')
			report.push('   - Check file system permissions')
			report.push('   - Verify model file integrity')
		}

		// Input validation errors
		if (summary.byType[ErrorType.INVALID_EXTERNAL_SOURCE] > 0) {
			report.push('📁 EXTERNAL SOURCE ISSUES:')
			report.push('   - Verify external icon source path')
			report.push('   - Check network connectivity if remote')
			report.push('   - Ensure source directory exists and is accessible')
		}

		// File system errors
		if (summary.byType[ErrorType.FILE_NOT_FOUND] > 0 || summary.byType[ErrorType.DIRECTORY_NOT_FOUND] > 0) {
			report.push('📂 FILE SYSTEM ISSUES:')
			report.push('   - Verify all required directories exist')
			report.push('   - Check file permissions')
			report.push('   - Ensure sufficient disk space')
		}

		// Model validation errors
		if (summary.byType[ErrorType.INVALID_MODEL_FORMAT] > 0) {
			report.push('📋 MODEL VALIDATION ISSUES:')
			report.push('   - Check JSON syntax in model files')
			report.push('   - Verify required fields are present')
			report.push('   - Ensure model files are properly formatted')
		}

		// Processing errors
		if (summary.byType[ErrorType.OPTIMIZATION_FAILED] > 0) {
			report.push('🔧 OPTIMIZATION ISSUES:')
			report.push('   - Check SVGO configuration')
			report.push('   - Verify SVG file integrity')
			report.push('   - Review optimization parameters')
		}

		// Theme generation errors
		if (summary.byType[ErrorType.THEME_GENERATION_FAILED] > 0) {
			report.push('🎨 THEME GENERATION ISSUES:')
			report.push('   - Verify model file integrity')
			report.push('   - Check icon file existence')
			report.push('   - Review theme generation configuration')
		}

		// General recommendations
		report.push('🔧 GENERAL RECOMMENDATIONS:')
		report.push('   - Run with --verbose flag for detailed error information')
		report.push('   - Check system logs for additional context')
		report.push('   - Verify all dependencies are installed')
		report.push('   - Review asset generation workflow documentation')
	}

	/**
	 * Save report to file
	 */
	private async saveReport(report: string, outputPath: string): Promise<void> {
		try {
			await fs.writeFile(outputPath, report, 'utf-8')
			console.log(`✅ Error report saved to: ${outputPath}`)
		} catch (error) {
			const saveError = this.errorHandler.createError(
				`Failed to save error report to ${outputPath}`,
				ErrorType.FILE_NOT_FOUND,
				ErrorSeverity.MEDIUM,
				'saveReport',
				error instanceof Error ? error : undefined,
				true,
				outputPath
			)
			await this.errorHandler.handleError(saveError)
		}
	}

	/**
	 * Export error log for external analysis
	 */
	public exportErrorLog(outputPath?: string): string {
		const errorLog = this.errorHandler.exportErrorLog()
		
		if (outputPath) {
			fs.writeFile(outputPath, errorLog, 'utf-8').catch(error => {
				console.error(`Failed to export error log: ${error}`)
			})
		}
		
		return errorLog
	}

	/**
	 * Get error statistics
	 */
	public getErrorStatistics(): {
		total: number
		critical: number
		high: number
		medium: number
		low: number
		recoverable: number
		nonRecoverable: number
	} {
		const summary = this.errorHandler.getErrorSummary()
		const errors = this.errorHandler['errorLog'] // Access private property for detailed analysis
		
		let recoverable = 0
		let nonRecoverable = 0
		
		errors.forEach(error => {
			if (error.recoverable) {
				recoverable++
			} else {
				nonRecoverable++
			}
		})

		return {
			total: summary.total,
			critical: summary.bySeverity[ErrorSeverity.CRITICAL],
			high: summary.bySeverity[ErrorSeverity.HIGH],
			medium: summary.bySeverity[ErrorSeverity.MEDIUM],
			low: summary.bySeverity[ErrorSeverity.LOW],
			recoverable,
			nonRecoverable
		}
	}

	/**
	 * Clear error log
	 */
	public clearErrorLog(): void {
		this.errorHandler.clearErrorLog()
		console.log('✅ Error log cleared')
	}
}

/**
 * CLI interface for error reporting
 */
async function main(): Promise<void> {
	const args = process.argv.slice(2)
	const reporter = new ErrorReporter()

	if (args.includes('--help') || args.includes('-h')) {
		console.log('Error Reporter Usage:')
		console.log('  --report [output-file]     Generate comprehensive error report')
		console.log('  --export [output-file]     Export error log as JSON')
		console.log('  --stats                    Show error statistics')
		console.log('  --clear                    Clear error log')
		console.log('  --help, -h                 Show this help message')
		return
	}

	if (args.includes('--clear')) {
		reporter.clearErrorLog()
		return
	}

	if (args.includes('--stats')) {
		const stats = reporter.getErrorStatistics()
		console.log('Error Statistics:')
		console.log(`  Total Errors: ${stats.total}`)
		console.log(`  Critical: ${stats.critical}`)
		console.log(`  High: ${stats.high}`)
		console.log(`  Medium: ${stats.medium}`)
		console.log(`  Low: ${stats.low}`)
		console.log(`  Recoverable: ${stats.recoverable}`)
		console.log(`  Non-recoverable: ${stats.nonRecoverable}`)
		return
	}

	if (args.includes('--export')) {
		const exportIndex = args.indexOf('--export')
		const outputFile = args[exportIndex + 1] || 'error-log.json'
		reporter.exportErrorLog(outputFile)
		return
	}

	if (args.includes('--report')) {
		const reportIndex = args.indexOf('--report')
		const outputFile = args[reportIndex + 1]
		const report = await reporter.generateReport(outputFile)
		console.log(report)
		return
	}

	// Default: show report in console
	const report = await reporter.generateReport()
	console.log(report)
}

// Run if called directly
if (process.argv[1].endsWith('error-reporter.ts')) {
	main().catch(error => {
		console.error('Error reporter failed:', error)
		process.exit(1)
	})
}
