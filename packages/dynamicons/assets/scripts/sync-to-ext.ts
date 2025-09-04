#!/usr/bin/env node

import { promises as fs } from 'fs'
import { join, dirname, basename } from 'path'

interface SyncConfig {
	sourceDir: string
	targetDir: string
	verbose: boolean
}

interface ChangeAnalysis {
	added: string[]
	modified: string[]
	deleted: string[]
	unchanged: string[]
	summary: {
		total: number
		added: number
		modified: number
		deleted: number
		unchanged: number
	}
}

class AssetSync {
	private config: SyncConfig

	constructor(config: SyncConfig) {
		this.config = config
	}

	/**
	 * Sync assets from source to target directory with change detection
	 */
	async syncAssets(): Promise<void> {
		console.log('🔄 Syncing assets to extension package...')
		
		try {
			// Step 1: Analyze changes
			console.log('  🔍 Step 1: Analyzing changes...')
			const changeAnalysis = await this.analyzeChanges()
			
			// Step 2: Report change summary
			console.log('  📊 Step 2: Change summary:')
			console.log(`    Added: ${changeAnalysis.summary.added}`)
			console.log(`    Modified: ${changeAnalysis.summary.modified}`)
			console.log(`    Deleted: ${changeAnalysis.summary.deleted}`)
			console.log(`    Unchanged: ${changeAnalysis.summary.unchanged}`)
			
			// Step 3: Ensure target directory exists
			await this.ensureDirectoryExists(this.config.targetDir)
			
			// Step 4: Sync based on changes
			if (changeAnalysis.summary.added > 0 || changeAnalysis.summary.modified > 0) {
				console.log('  📁 Step 3: Syncing changed assets...')
				
				// Sync icons
				await this.syncDirectoryWithChanges('icons', 'icons', changeAnalysis)
				
				// Sync themes
				await this.syncDirectoryWithChanges('themes', 'themes', changeAnalysis)
				
				// Sync manifests
				await this.syncDirectoryWithChanges('manifests', 'manifests', changeAnalysis)
				
				console.log('✅ Asset sync completed successfully')
			} else {
				console.log('✅ No changes detected, sync skipped')
			}
		} catch (error) {
			console.error('❌ Asset sync failed:', error)
			throw error
		}
	}

	/**
	 * Analyze changes between source and target directories
	 */
	private async analyzeChanges(): Promise<ChangeAnalysis> {
		const added: string[] = []
		const modified: string[] = []
		const deleted: string[] = []
		const unchanged: string[] = []
		
		// Analyze each directory type
		await this.analyzeDirectoryChanges('icons', added, modified, deleted, unchanged)
		await this.analyzeDirectoryChanges('themes', added, modified, deleted, unchanged)
		await this.analyzeDirectoryChanges('manifests', added, modified, deleted, unchanged)
		
		return {
			added,
			modified,
			deleted,
			unchanged,
			summary: {
				total: added.length + modified.length + deleted.length + unchanged.length,
				added: added.length,
				modified: modified.length,
				deleted: deleted.length,
				unchanged: unchanged.length
			}
		}
	}
	
	/**
	 * Analyze changes in a specific directory
	 */
	private async analyzeDirectoryChanges(
		subDir: string,
		added: string[],
		modified: string[],
		deleted: string[],
		unchanged: string[]
	): Promise<void> {
		const sourcePath = join(this.config.sourceDir, subDir)
		const targetPath = join(this.config.targetDir, subDir)
		
		try {
			// Check if source directory exists
			await fs.access(sourcePath)
		} catch {
			return // Source doesn't exist, nothing to analyze
		}
		
		// Get source files
		const sourceFiles = await this.getAllFiles(sourcePath)
		
		for (const sourceFile of sourceFiles) {
			const relativePath = sourceFile.substring(sourcePath.length + 1)
			const targetFile = join(targetPath, relativePath)
			
			try {
				// Check if target file exists
				await fs.access(targetFile)
				
				// Compare timestamps
				const sourceStats = await fs.stat(sourceFile)
				const targetStats = await fs.stat(targetFile)
				
				if (sourceStats.mtime > targetStats.mtime) {
					modified.push(join(subDir, relativePath))
				} else {
					unchanged.push(join(subDir, relativePath))
				}
			} catch {
				// Target file doesn't exist
				added.push(join(subDir, relativePath))
			}
		}
		
		// Check for deleted files (files in target but not in source)
		try {
			await fs.access(targetPath)
			const targetFiles = await this.getAllFiles(targetPath)
			
			for (const targetFile of targetFiles) {
				const relativePath = targetFile.substring(targetPath.length + 1)
				const sourceFile = join(sourcePath, relativePath)
				
				try {
					await fs.access(sourceFile)
				} catch {
					// Source file doesn't exist, target file is deleted
					deleted.push(join(subDir, relativePath))
				}
			}
		} catch {
			// Target directory doesn't exist, no deleted files
		}
	}
	
	/**
	 * Sync a specific directory with change detection
	 */
	private async syncDirectoryWithChanges(
		sourceSubDir: string, 
		targetSubDir: string, 
		changeAnalysis: ChangeAnalysis
	): Promise<void> {
		const sourcePath = join(this.config.sourceDir, sourceSubDir)
		const targetPath = join(this.config.targetDir, targetSubDir)
		
		try {
			// Check if source directory exists
			await fs.access(sourcePath)
		} catch {
			if (this.config.verbose) {
				console.log(`⚠️  Source directory not found: ${sourcePath}`)
			}
			return
		}

		// Ensure target directory exists
		await this.ensureDirectoryExists(targetPath)
		
		// Get all files in source directory
		const files = await this.getAllFiles(sourcePath)
		
		let syncedCount = 0
		let skippedCount = 0
		
		for (const file of files) {
			const relativePath = file.substring(sourcePath.length + 1)
			const targetFile = join(targetPath, relativePath)
			const targetDir = dirname(targetFile)
			
			// Ensure target subdirectory exists
			await this.ensureDirectoryExists(targetDir)
			
			// Check if we need to copy this file based on change analysis
			const assetPath = join(sourceSubDir, relativePath)
			const shouldSync = changeAnalysis.added.includes(assetPath) || 
							  changeAnalysis.modified.includes(assetPath)
			
			if (shouldSync) {
				await fs.copyFile(file, targetFile)
				syncedCount++
				if (this.config.verbose) {
					console.log(`  📁 Synced: ${relativePath}`)
				}
			} else {
				skippedCount++
			}
		}
		
		if (this.config.verbose) {
			console.log(`  📊 ${sourceSubDir}: ${syncedCount} synced, ${skippedCount} skipped`)
		}
	}
	
	/**
	 * Sync a specific directory (legacy method)
	 */
	private async syncDirectory(sourceSubDir: string, targetSubDir: string): Promise<void> {
		const sourcePath = join(this.config.sourceDir, sourceSubDir)
		const targetPath = join(this.config.targetDir, targetSubDir)
		
		try {
			// Check if source directory exists
			await fs.access(sourcePath)
		} catch {
			if (this.config.verbose) {
				console.log(`⚠️  Source directory not found: ${sourcePath}`)
			}
			return
		}

		// Ensure target directory exists
		await this.ensureDirectoryExists(targetPath)
		
		// Get all files in source directory
		const files = await this.getAllFiles(sourcePath)
		
		let syncedCount = 0
		let skippedCount = 0
		
		for (const file of files) {
			const relativePath = file.substring(sourcePath.length + 1)
			const targetFile = join(targetPath, relativePath)
			const targetDir = dirname(targetFile)
			
			// Ensure target subdirectory exists
			await this.ensureDirectoryExists(targetDir)
			
			// Check if we need to copy this file
			if (await this.shouldCopyFile(file, targetFile)) {
				await fs.copyFile(file, targetFile)
				syncedCount++
				if (this.config.verbose) {
					console.log(`  📁 Copied: ${relativePath}`)
				}
			} else {
				skippedCount++
			}
		}
		
		if (this.config.verbose) {
			console.log(`  📊 ${sourceSubDir}: ${syncedCount} synced, ${skippedCount} skipped`)
		}
	}

	/**
	 * Get all files in a directory recursively
	 */
	private async getAllFiles(dir: string): Promise<string[]> {
		const files: string[] = []
		
		const items = await fs.readdir(dir, { withFileTypes: true })
		
		for (const item of items) {
			const fullPath = join(dir, item.name)
			
			if (item.isDirectory()) {
				files.push(...await this.getAllFiles(fullPath))
			} else {
				files.push(fullPath)
			}
		}
		
		return files
	}

	/**
	 * Check if we should copy a file (based on timestamp comparison)
	 */
	private async shouldCopyFile(sourceFile: string, targetFile: string): Promise<boolean> {
		try {
			// Check if target file exists
			await fs.access(targetFile)
			
			// Compare timestamps
			const sourceStats = await fs.stat(sourceFile)
			const targetStats = await fs.stat(targetFile)
			
			// Copy if source is newer
			return sourceStats.mtime > targetStats.mtime
		} catch {
			// Target file doesn't exist, copy it
			return true
		}
	}

	/**
	 * Ensure a directory exists
	 */
	private async ensureDirectoryExists(dir: string): Promise<void> {
		try {
			await fs.access(dir)
		} catch {
			await fs.mkdir(dir, { recursive: true })
		}
	}
}

// CLI interface
async function main(): Promise<void> {
	const args = process.argv.slice(2)
	
	const config: SyncConfig = {
		sourceDir: 'assets',
		targetDir: '../ext/dist/assets',
		verbose: args.includes('--verbose') || args.includes('-v')
	}
	
	// Parse command line arguments
	for (let i = 0; i < args.length; i++) {
		const arg = args[i]
		
		switch (arg) {
			case '--source-dir':
			case '-s':
				config.sourceDir = args[++i] || config.sourceDir
				break
			case '--target-dir':
			case '-t':
				config.targetDir = args[++i] || config.targetDir
				break
			case '--verbose':
			case '-v':
				config.verbose = true
				break
			case '--help':
			case '-h':
				showHelp()
				return
		}
	}
	
	try {
		const sync = new AssetSync(config)
		await sync.syncAssets()
	} catch (error) {
		console.error('❌ Asset sync failed:', error)
		process.exit(1)
	}
}

function showHelp(): void {
	console.log(`
Dynamicons Asset Sync Tool

Usage: npx tsx scripts/sync-to-ext.ts [options]

Options:
  -s, --source-dir <dir>     Source assets directory (default: assets)
  -t, --target-dir <dir>     Target extension directory (default: ../ext/dist/assets)
  -v, --verbose              Enable verbose logging
  -h, --help                 Show this help message

Examples:
  # Sync assets with default settings
  npx tsx scripts/sync-to-ext.ts
  
  # Sync with verbose logging
  npx tsx scripts/sync-to-ext.ts --verbose
  
  # Custom source and target directories
  npx tsx scripts/sync-to-ext.ts -s shared-assets -t ../ext/assets
`)
}

// Run if called directly
if (process.argv[1] && process.argv[1].endsWith('sync-to-ext.ts')) {
	main().catch((error) => {
		console.error('Asset sync failed:', error)
		process.exit(1)
	})
}

export { AssetSync, SyncConfig }
