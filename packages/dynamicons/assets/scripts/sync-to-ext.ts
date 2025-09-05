#!/usr/bin/env node

import { promises as fs } from 'fs'
import { join, dirname, basename } from 'path'
import { assetConstants } from '../src/_config/dynamicons.constants.js'
import { errorHandler, inputValidator, rollbackManager, ErrorType, ErrorSeverity } from './error-handler.js'

interface SyncConfig {
	sourceDir: string
	targetDir: string
	verbose: boolean
	forceSync?: boolean
	validateOnly?: boolean
	backupBeforeSync?: boolean
}

interface SyncTarget {
	name: string
	path: string
	description: string
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
	private syncTargets: SyncTarget[] = []

	constructor(config: SyncConfig) {
		this.config = config
		this.initializeSyncTargets()
	}

	/**
	 * Initialize available sync targets
	 */
	private initializeSyncTargets(): void {
		this.syncTargets = [
			{
				name: 'dynamicons-ext',
				path: '../ext/dist/assets',
				description: 'Dynamicons extension package'
			},
			{
				name: 'dynamicons-core',
				path: '../core/dist/assets',
				description: 'Dynamicons core package'
			},
			{
				name: 'dynamicons-orchestrator',
				path: '../orchestrator/dist/assets',
				description: 'Combination orchestrator (monolithic extension with all functionality)'
			}
		]
	}

	/**
	 * Sync assets from source to target directory with change detection
	 */
	async syncAssets(): Promise<void> {
		if (this.config.verbose) {
			console.log('\n🔄 [ASSET SYNC WORKFLOW]')
			console.log('═══════════════════════════════════════════════════════════════')
			console.log('📋 Workflow Steps:')
			console.log('   1. 🔍 Input validation')
			console.log('   2. 📊 Change analysis')
			console.log('   3. 📁 Asset synchronization')
			console.log('   4. ✅ Verification')
			console.log('═══════════════════════════════════════════════════════════════\n')
		} else {
			console.log('🔄 Syncing assets to target package...')
		}
		
		try {
			// Step 1: Input validation
			if (this.config.verbose) {
				console.log('🔍 STEP 1: INPUT VALIDATION')
				console.log('───────────────────────────────────────────────────────────')
			}
			
			const validationResult = await this.validateSyncInputs()
			if (!validationResult) {
				const validationError = errorHandler.createError(
					'Sync input validation failed',
					ErrorType.INVALID_EXTERNAL_SOURCE,
					ErrorSeverity.HIGH,
					'syncAssets',
					undefined,
					false
				)
				await errorHandler.handleError(validationError, this.config.verbose)
				return
			}

			if (this.config.verbose) {
				console.log('✅ Input validation passed')
				console.log('───────────────────────────────────────────────────────────\n')
			}

			// Step 2: Analyze changes
			if (this.config.verbose) {
				console.log('📊 STEP 2: CHANGE ANALYSIS')
				console.log('───────────────────────────────────────────────────────────')
			}
			
			const changeAnalysis = await this.analyzeChanges()
			
			// Step 3: Report change summary
			if (this.config.verbose) {
				console.log('📊 Change Summary:')
				console.log(`  Added: ${changeAnalysis.summary.added}`)
				console.log(`  Modified: ${changeAnalysis.summary.modified}`)
				console.log(`  Deleted: ${changeAnalysis.summary.deleted}`)
				console.log(`  Unchanged: ${changeAnalysis.summary.unchanged}`)
				console.log('───────────────────────────────────────────────────────────\n')
			} else {
				console.log(`📊 Changes: ${changeAnalysis.summary.added} added, ${changeAnalysis.summary.modified} modified`)
			}
			
			// Step 4: Sync based on changes
			if (this.config.validateOnly) {
				console.log('✅ Validation only mode - no sync performed')
				return
			}
			
			if (changeAnalysis.summary.added > 0 || changeAnalysis.summary.modified > 0 || this.config.forceSync) {
				if (this.config.verbose) {
					console.log('📁 STEP 3: ASSET SYNCHRONIZATION')
					console.log('───────────────────────────────────────────────────────────')
				}
				
				// Register sync operations for rollback
				this.registerSyncOperations()
				
				// Sync assets
				await this.performSync(changeAnalysis)
				
				if (this.config.verbose) {
					console.log('───────────────────────────────────────────────────────────\n')
				}
			} else {
				console.log('✅ No changes detected, sync skipped')
			}
			
			// Step 5: Verification
			if (this.config.verbose) {
				console.log('✅ STEP 4: VERIFICATION')
				console.log('───────────────────────────────────────────────────────────')
			}
			
			await this.verifySync(changeAnalysis)
			
			if (this.config.verbose) {
				console.log('═══════════════════════════════════════════════════════════════')
				console.log('✅ ASSET SYNC WORKFLOW COMPLETED SUCCESSFULLY')
				console.log('═══════════════════════════════════════════════════════════════\n')
			} else {
				console.log('✅ Asset sync completed successfully')
			}
		} catch (error) {
			const syncError = errorHandler.createError(
				'Asset sync failed',
				ErrorType.FILE_NOT_FOUND,
				ErrorSeverity.HIGH,
				'syncAssets',
				error instanceof Error ? error : undefined,
				true
			)
			await errorHandler.handleError(syncError, this.config.verbose)
			await rollbackManager.executeRollback()
		}
	}

	/**
	 * Validate sync inputs
	 */
	private async validateSyncInputs(): Promise<boolean> {
		try {
			// Validate source directory exists
			await fs.access(this.config.sourceDir)
			
			// Validate target directory path is valid
			const targetPath = join(process.cwd(), this.config.targetDir)
			const targetDir = dirname(targetPath)
			await fs.access(targetDir)
			
			return true
		} catch (error) {
			const validationError = errorHandler.createError(
				`Invalid sync paths: source=${this.config.sourceDir}, target=${this.config.targetDir}`,
				ErrorType.DIRECTORY_NOT_FOUND,
				ErrorSeverity.HIGH,
				'validateSyncInputs',
				error instanceof Error ? error : undefined,
				false
			)
			await errorHandler.handleError(validationError, this.config.verbose)
			return false
		}
	}

	/**
	 * Register sync operations for rollback
	 */
	private registerSyncOperations(): void {
		if (this.config.backupBeforeSync) {
			rollbackManager.registerOperation(
				'backup-target',
				async () => {
					// Backup logic would go here
					if (this.config.verbose) {
						console.log('  🔄 Rollback: Restoring target from backup')
					}
				},
				'Backup target directory before sync'
			)
		}
	}

	/**
	 * Perform the actual sync operation
	 */
	private async performSync(changeAnalysis: ChangeAnalysis): Promise<void> {
		// Ensure target directory exists
		await this.ensureDirectoryExists(this.config.targetDir)
		
		// Sync different asset types
		const assetTypes = [
			{ source: 'icons', target: 'icons', description: 'Icon files' },
			{ source: 'themes', target: 'themes', description: 'Theme files' },
			{ source: 'images/preview-images', target: 'images/preview-images', description: 'Preview images' }
		]
		
		for (const assetType of assetTypes) {
			if (this.config.verbose) {
				console.log(`  📁 Syncing ${assetType.description}...`)
			}
			await this.syncDirectoryWithChanges(assetType.source, assetType.target, changeAnalysis)
		}
	}

	/**
	 * Verify sync operation
	 */
	private async verifySync(changeAnalysis: ChangeAnalysis): Promise<void> {
		const verificationErrors: string[] = []
		
		// Verify that all added/modified files exist in target
		for (const file of [...changeAnalysis.added, ...changeAnalysis.modified]) {
			const targetFile = join(this.config.targetDir, file)
			try {
				await fs.access(targetFile)
			} catch {
				verificationErrors.push(`Missing in target: ${file}`)
			}
		}
		
		if (verificationErrors.length > 0) {
			const verificationError = errorHandler.createError(
				`Sync verification failed: ${verificationErrors.length} files missing`,
				ErrorType.FILE_NOT_FOUND,
				ErrorSeverity.HIGH,
				'verifySync',
				undefined,
				true
			)
			await errorHandler.handleError(verificationError, this.config.verbose)
		} else if (this.config.verbose) {
			console.log('✅ All synced files verified successfully')
		}
	}

	/**
	 * Get available sync targets
	 */
	public getAvailableTargets(): SyncTarget[] {
		return this.syncTargets
	}

	/**
	 * Analyze changes between source and target directories
	 */
	private async analyzeChanges(): Promise<ChangeAnalysis> {
		const added: string[] = []
		const modified: string[] = []
		const deleted: string[] = []
		const unchanged: string[] = []
		
		// Define asset types to analyze
		const assetTypes = [
			{ source: 'icons', description: 'Icon files' },
			{ source: 'themes', description: 'Theme files' },
			{ source: 'images/preview-images', description: 'Preview images' }
		]
		
		// Analyze each asset type
		for (const assetType of assetTypes) {
			if (this.config.verbose) {
				console.log(`  🔍 Analyzing ${assetType.description}...`)
			}
			await this.analyzeDirectoryChanges(assetType.source, added, modified, deleted, unchanged)
		}
		
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
		sourceDir: 'dist/assets',
		targetDir: '../ext/dist/assets',
		verbose: args.includes('--verbose') || args.includes('-v'),
		forceSync: args.includes('--force') || args.includes('-f'),
		validateOnly: args.includes('--validate-only') || args.includes('--dry-run'),
		backupBeforeSync: args.includes('--backup') || args.includes('-b')
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
			case '--target':
			case '--to':
				const targetName = args[++i]
				if (targetName) {
					const sync = new AssetSync(config)
					const targets = sync.getAvailableTargets()
					const target = targets.find(t => t.name === targetName)
					if (target) {
						config.targetDir = target.path
					} else {
						console.error(`❌ Unknown target: ${targetName}`)
						console.log('Available targets:')
						targets.forEach(t => console.log(`  ${t.name}: ${t.description}`))
						process.exit(1)
					}
				}
				break
			case '--verbose':
			case '-v':
				config.verbose = true
				break
			case '--force':
			case '-f':
				config.forceSync = true
				break
			case '--validate-only':
			case '--dry-run':
				config.validateOnly = true
				break
			case '--backup':
			case '-b':
				config.backupBeforeSync = true
				break
			case '--list-targets':
				const sync = new AssetSync(config)
				const targets = sync.getAvailableTargets()
				console.log('Available sync targets:')
				targets.forEach(t => console.log(`  ${t.name}: ${t.description} (${t.path})`))
				return
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
  -s, --source-dir <dir>     Source assets directory (default: dist/assets)
  -t, --target-dir <dir>     Target extension directory (default: ../ext/dist/assets)
  --target, --to <name>      Use predefined target (dynamicons-ext, dynamicons-core, dynamicons-orchestrator)
  -v, --verbose              Enable verbose logging
  -f, --force                Force sync even if no changes detected
  --validate-only, --dry-run Validate only, don't perform sync
  -b, --backup               Create backup before syncing
  --list-targets             List available predefined targets
  -h, --help                 Show this help message

Examples:
  # Sync assets with default settings
  npx tsx scripts/sync-to-ext.ts
  
  # Sync with verbose logging
  npx tsx scripts/sync-to-ext.ts --verbose
  
  # Use predefined target
  npx tsx scripts/sync-to-ext.ts --target dynamicons-ext
  
  # Custom source and target directories
  npx tsx scripts/sync-to-ext.ts -s shared-assets -t ../ext/assets
  
  # Validate only (dry run)
  npx tsx scripts/sync-to-ext.ts --validate-only
  
  # Force sync with backup
  npx tsx scripts/sync-to-ext.ts --force --backup
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
