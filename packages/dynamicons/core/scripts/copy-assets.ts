#!/usr/bin/env node

import { copyFile, mkdir, readdir } from 'fs/promises'
import { join } from 'path'
import { existsSync } from 'fs'

interface CopyOptions {
	sourceDir: string
	outputDir: string
	verbose?: boolean
}

class AssetCopier {

	private options: CopyOptions

	constructor(options: CopyOptions) {
		this.options = options
	}

	/**
	 * Copy all assets from source to output directory
	 */
	async copyAssets(): Promise<void> {
		try {
			this.log('📁 Starting asset copy...')
      
			// Ensure output directory exists
			await this.ensureDirectory(this.options.outputDir)
      
			// Copy all assets recursively
			await this.copyDirectory(this.options.sourceDir, this.options.outputDir)
      
			this.log('✅ Asset copy completed successfully!')
		} catch (error) {
			this.log(`❌ Asset copy failed: ${error}`)
			throw error
		}
	}

	/**
	 * Copy a directory recursively
	 */
	private async copyDirectory(sourcePath: string, destPath: string): Promise<void> {
		const items = await readdir(sourcePath, { withFileTypes: true })
    
		for (const item of items) {
			const sourceItemPath = join(sourcePath, item.name)
			const destItemPath = join(destPath, item.name)
      
			if (item.isDirectory()) {
				// Create destination directory and copy contents
				await this.ensureDirectory(destItemPath)
				await this.copyDirectory(sourceItemPath, destItemPath)
			} else {
				// Copy file
				await this.copyFile(sourceItemPath, destItemPath)
			}
		}
	}

	/**
	 * Copy a single file
	 */
	private async copyFile(sourcePath: string, destPath: string): Promise<void> {
		try {
			await copyFile(sourcePath, destPath)
			this.log(`📄 Copied: ${sourcePath} → ${destPath}`)
		} catch (error) {
			this.log(`⚠️ Failed to copy ${sourcePath}: ${error}`)
		}
	}

	/**
	 * Ensure a directory exists
	 */
	private async ensureDirectory(dirPath: string): Promise<void> {
		if (!existsSync(dirPath)) {
			await mkdir(dirPath, { recursive: true })
			this.log(`📁 Created directory: ${dirPath}`)
		}
	}

	/**
	 * Log message with optional verbose check
	 */
	private log(message: string): void {
		if (this.options.verbose) {
			console.log(message)
		} else {
			// Only log important messages in non-verbose mode
			if (message.includes('📁') || message.includes('✅') || message.includes('❌')) {
				console.log(message)
			}
		}
	}

}

// CLI interface
async function main(): Promise<void> {
	const args = process.argv.slice(2)
  
	// Parse command line arguments
	const options: CopyOptions = {
		sourceDir: '',
		outputDir: '',
		verbose: args.includes('--verbose') || args.includes('-v'),
	}
  
	// Parse arguments
	for (let i = 0; i < args.length; i++) {
		const arg = args[i]
    
		switch (arg) {
			case '--source-dir':
			case '-s':
				options.sourceDir = args[++i] || ''
				break
			case '--output-dir':
			case '-o':
				options.outputDir = args[++i] || ''
				break
			case '--help':
			case '-h':
				showHelp()
				return
		}
	}
  
	// Validate required arguments
	if (!options.sourceDir || !options.outputDir) {
		console.error('❌ Both --source-dir and --output-dir are required')
		showHelp()
		process.exit(1)
	}
  
	try {
		const copier = new AssetCopier(options)

		await copier.copyAssets()
	} catch (error) {
		console.error('❌ Asset copy failed:', error)
		process.exit(1)
	}
}

function showHelp(): void {
	console.log(`
Asset Copy Tool

Usage: npx tsx scripts/copy-assets.ts --source-dir <dir> --output-dir <dir> [options]

Required Arguments:
  -s, --source-dir <dir>     Source assets directory
  -o, --output-dir <dir>     Output directory

Options:
  -v, --verbose              Enable verbose logging
  -h, --help                 Show this help message

Examples:
  # Copy assets with default settings
  npx tsx scripts/copy-assets.ts --source-dir ../../core/dist/assets --output-dir dist/assets
  
  # Copy with verbose logging
  npx tsx scripts/copy-assets.ts --source-dir ../../core/dist/assets --output-dir dist/assets --verbose
`)
}

// Run if called directly
if (process.argv[1] && process.argv[1].endsWith('copy-assets.ts')) {
	main().catch((error) => {
		console.error('Asset copy failed:', error)
		process.exit(1)
	})
}

export { AssetCopier, CopyOptions }
