#!/usr/bin/env node

import { promises as fs } from 'fs'
import path from 'path'
import { assetConstants } from '../src/_config/dynamicons.constants.js'
import { errorHandler, inputValidator, rollbackManager, ErrorType, ErrorSeverity } from './error-handler.js'

/**
 * Stage icons from external source
 */
async function stageIconsFromExternalSource(): Promise<{ success: boolean, stagedCount: number }> {
	try {
		// Check if external source exists
		await fs.access(assetConstants.externalIconSource)
		
		// Read external source directory directly from assetConstants.externalIconSource
		const sourceDir = assetConstants.externalIconSource
		const sourceFiles = await fs.readdir(sourceDir)
		
		// Filter for SVG files only, ignore other file types
		const svgFiles = sourceFiles.filter((file) => {
			const ext = path.extname(file).toLowerCase()

			return assetConstants.fileTypes.allowed.includes(ext as '.svg')
			  && !assetConstants.fileTypes.ignored.includes(ext as '.png' | '.jpg' | '.jpeg' | '.gif' | '.bmp' | '.ico' | '.webp')
		})
		
		if (svgFiles.length === 0) {
			return { success: true, stagedCount: 0 }
		}
		
		// Ensure new_icons directory exists
		await fs.mkdir(assetConstants.paths.newIconsDir, { recursive: true })
		
		let stagedCount = 0
		
		// Stage each SVG file - always process external source icons
		for (const svgFile of svgFiles) {
			const sourcePath = path.join(sourceDir, svgFile)
			const destPath = path.join(assetConstants.paths.newIconsDir, svgFile)
			
			try {
				// Always copy/move from external source, overwriting if it exists
				if (assetConstants.deleteOriginalSvg) {
					// Move (delete original)
					await fs.rename(sourcePath, destPath)
				} else {
					// Copy (keep original) - overwrite if exists
					await fs.copyFile(sourcePath, destPath)
				}
				stagedCount++
			} catch (err) {
				console.log(`    ⚠️  Failed to stage ${svgFile}: ${err}`)
			}
		}
		
		return { success: true, stagedCount }
	} catch (_error) {
		// External directory doesn't exist or can't be accessed
		return { success: false, stagedCount: 0 }
	}
}

/**
 * Optimize staged icons
 */
async function optimizeStagedIcons(
	iconFiles: string[],
	targetDir: string,
	type: 'file' | 'folder',
	verbose: boolean = false,
): Promise<number> {
	let optimizedCount = 0
	
	// Import exec for SVGO optimization
	const { exec } = await import('node:child_process')
	const { promisify } = await import('node:util')
	const execAsync = promisify(exec)
	
	// Use assetConstants for optimization configuration
	const _optimizationLevel = assetConstants.processing.defaultOptimizationLevel
	
	for (let i = 0; i < iconFiles.length; i++) {
		const iconFile = iconFiles[i]
		const sourcePath = path.join(targetDir, iconFile)
		
		try {
			// Get original file size
			const stats = await fs.stat(sourcePath)
			const originalSize = stats.size
			
			// Create temporary path for optimization
			const tempPath = path.join(targetDir, `${iconFile}.tmp`)
			
			// Run SVGO optimization using the project's config file
			const svgoCommand = `svgo --config svgo.config.mjs -i "${sourcePath}" -o "${tempPath}"`

			await execAsync(svgoCommand)
			
			// Get optimized file size
			const optimizedStats = await fs.stat(tempPath)
			const optimizedSize = optimizedStats.size
			
			// Calculate compression statistics
			const sizeDifference = originalSize - optimizedSize
			const percentageChange = originalSize > 0 ? Math.round((sizeDifference / originalSize) * 100) : 0
			
			// Format output based on verbose mode
			if (verbose) {
				// Verbose mode: show detailed formatting like the original script
				const item = `     ├─── ${String(i + 1).padStart(3)} of ${iconFiles.length} ${type}: ${iconFile.padEnd(30)}`
				const optSizeP = ' '.repeat(Math.max(0, 6 - optimizedSize.toString().length))
				const optSize = `${optSizeP}${optimizedSize}`
				const origSizeP = ' '.repeat(Math.max(0, 6 - originalSize.toString().length))
				const origSize = `${origSizeP}${originalSize}`
				const reductionP = ' '.repeat(Math.max(0, 6 - sizeDifference.toString().length))
				const reductionAmt = `${reductionP}${sizeDifference}`
				const percChngP = percentageChange.toString().length < 4 ? 1 : 0
				const percentChangeStr = `${' '.repeat(percChngP)}${percentageChange}%`
				
				console.log(
					`${item} ( ${origSize} -> ${optSize} | ${reductionAmt} | ${percentChangeStr} )`,
				)
			} else {
				// Non-verbose mode: show clean, simple formatting
				const typeLabel = type === 'file' ? 'file icon' : 'folder icon'

				console.log(
					`${String(i + 1)} of ${iconFiles.length} ${typeLabel}: ${iconFile}                       ( ${originalSize.toString().padStart(5)} -> ${optimizedSize.toString().padStart(5)} | ${sizeDifference.toString().padStart(5)} | ${percentageChange.toString().padStart(2)}% )`,
				)
			}
			
			// Replace original with optimized version
			await fs.rename(tempPath, sourcePath)
			optimizedCount++
		} catch (_error) {
			if (verbose) {
				console.log(`     ├─── ${String(i + 1).padStart(3)} of ${iconFiles.length} ${type}: ${iconFile.padEnd(30)} ❌ Optimization failed: ${_error}`)
			} else {
				const typeLabel = type === 'file' ? 'file icon' : 'folder icon'

				console.log(`${String(i + 1)} of ${iconFiles.length} ${typeLabel}: ${iconFile} ❌ Optimization failed: ${_error}`)
			}
		}
	}
	
	return optimizedCount
}

/**
 * Organize staged icons into file_icons and folder_icons directories, then optimize them
 */
async function organizeAndOptimizeIcons(verbose: boolean = false): Promise<{ success: boolean, optimizedCount: number }> {
	try {
		// Check if new_icons directory exists and has files
		try {
			const newIconsFiles = await fs.readdir(assetConstants.paths.newIconsDir)
			const svgFiles = newIconsFiles.filter(file => file.toLowerCase().endsWith('.svg'))
			
			if (svgFiles.length === 0) {
				// No new icons to process
				return { success: true, optimizedCount: 0 }
			}
			
			// Ensure target directories exist
			await fs.mkdir(assetConstants.paths.fileIconsDir, { recursive: true })
			await fs.mkdir(assetConstants.paths.folderIconsDir, { recursive: true })
			
			// Organize icons into appropriate directories - always overwrite existing
			for (const svgFile of svgFiles) {
				const sourcePath = path.join(assetConstants.paths.newIconsDir, svgFile)
				
				// Determine if it's a folder icon or file icon based on naming convention
				const isFolderIcon = svgFile.toLowerCase().startsWith(assetConstants.iconNaming.folderPrefix)
				const targetDir = isFolderIcon ? assetConstants.paths.folderIconsDir : assetConstants.paths.fileIconsDir
				const destPath = path.join(targetDir, svgFile)
				
				try {
					// Always move from new_icons to target directory, overwriting if exists
					// Remove existing file first to ensure clean replacement
					try {
						await fs.unlink(destPath)
					} catch {
						// File doesn't exist, that's fine
					}
					await fs.rename(sourcePath, destPath)
				} catch (err) {
					console.log(`    ⚠️  Failed to organize ${svgFile}: ${err}`)
				}
			}
			
			// Now run optimization on the newly organized icons
			// We need to implement our own optimization logic to process only the staged icons
			let optimizedCount = 0
		
			// Separate file and folder icons for processing
			const fileIcons: string[] = []
			const folderIcons: string[] = []
			
			// Read the organized files
			const fileIconsFiles = await fs.readdir(assetConstants.paths.fileIconsDir)
			const folderIconsFiles = await fs.readdir(assetConstants.paths.folderIconsDir)
			
			// Filter for SVG files
			fileIcons.push(...fileIconsFiles.filter(file => file.toLowerCase().endsWith('.svg')))
			folderIcons.push(...folderIconsFiles.filter(file => file.toLowerCase().endsWith('.svg')))
			
			// Optimize file icons
			if (fileIcons.length > 0) {
				const fileOptimizedCount = await optimizeStagedIcons(fileIcons, assetConstants.paths.fileIconsDir, 'file', verbose)

				optimizedCount += fileOptimizedCount
			}
			
			// Optimize folder icons
			if (folderIcons.length > 0) {
				const folderOptimizedCount = await optimizeStagedIcons(folderIcons, assetConstants.paths.folderIconsDir, 'folder', verbose)

				optimizedCount += folderOptimizedCount
			}
			
			return { success: true, optimizedCount }
		} catch (_error) {
			// new_icons directory doesn't exist or can't be accessed
			return { success: false, optimizedCount: 0 }
		}
	} catch (_error) {
		errorHandler.handleError(ErrorType.ICON_ORGANIZATION, 'Failed to organize and optimize icons', ErrorSeverity.HIGH, _error)
		return { success: false, optimizedCount: 0 }
	}
}

/**
 * Process Icons - Complete workflow from external source to optimized output
 * Follows the workflow: Stage → Organize → Optimize
 * Now includes change detection for Nx caching optimization
 */
async function processIcons(verbose: boolean = false): Promise<void> {
	if (verbose) {
		console.log('\n🔄 [ICON PROCESSING WORKFLOW]')
		console.log('═══════════════════════════════════════════════════════════════')
		console.log('📋 Workflow Steps:')
		console.log('   1. 🔍 Input validation')
		console.log('   2. 📥 Stage icons from external source')
		console.log('   3. 🔧 Organize and optimize icons')
		console.log('═══════════════════════════════════════════════════════════════\n')
	}
	
	try {
		// Step 0: Input validation
		if (verbose) {
			console.log('🔍 STEP 0: INPUT VALIDATION')
			console.log('───────────────────────────────────────────────────────────')
			console.log('🔄 Validating external source, directories, and disk space...')
		}

		const validationResult = await inputValidator.validateAllInputs()

		if (!validationResult) {
			const validationError = errorHandler.createError(
				'Input validation failed',
				ErrorType.INVALID_EXTERNAL_SOURCE,
				ErrorSeverity.HIGH,
				'processIcons',
				undefined,
				false,
			)

			await errorHandler.handleError(validationError, verbose)
			return
		}

		if (verbose) {
			console.log('✅ Input validation passed')
			console.log('───────────────────────────────────────────────────────────\n')
		}

		// Step 1: Stage icons from external source
		if (verbose) {
			console.log('📥 STEP 1: STAGING ICONS')
			console.log('───────────────────────────────────────────────────────────')
			console.log(`📁 Source: ${assetConstants.externalIconSource}`)
			console.log(`📁 Destination: ${assetConstants.paths.newIconsDir}`)
			console.log('🔄 Processing...')
		}

		const stageResult = await stageIconsFromExternalSource()
		
		if (stageResult.success) {
			if (verbose) {
				console.log(`✅ Staged ${stageResult.stagedCount} SVG icons`)
				console.log('───────────────────────────────────────────────────────────\n')
			} else {
				console.log(`📥 Icons Staged: ${stageResult.stagedCount}`)
				console.log('')
			}
		} else {
			if (verbose) {
				console.log('⚠️  External source not available, continuing with existing assets')
				console.log('───────────────────────────────────────────────────────────\n')
			}
		}
		
		// Step 2: Organize and optimize icons
		if (verbose) {
			console.log('🔧 STEP 2: ORGANIZATION & OPTIMIZATION')
			console.log('───────────────────────────────────────────────────────────')
			console.log(`📁 File icons: ${assetConstants.paths.fileIconsDir}`)
			console.log(`📁 Folder icons: ${assetConstants.paths.folderIconsDir}`)
			console.log(`⚙️  Optimization: SVGO with ${assetConstants.processing.defaultOptimizationLevel} level`)
			console.log('🔄 Processing...')
		}

		const optimizationResult = await organizeAndOptimizeIcons(verbose)
		
		if (optimizationResult.success) {
			if (verbose) {
				console.log(`✅ Optimized ${optimizationResult.optimizedCount} icons`)
				console.log('───────────────────────────────────────────────────────────\n')
			}
		}
		
		// Step 3: Check if any processing was actually needed
		const totalProcessed = stageResult.stagedCount + optimizationResult.optimizedCount

		if (totalProcessed === 0) {
			if (verbose) {
				console.log('✨ No icon changes detected - all icons are up to date!')
				console.log('═══════════════════════════════════════════════════════════════\n')
			} else {
				console.log('✨ No icon changes detected - all icons are up to date!')
			}
		} else {
			if (verbose) {
				console.log('═══════════════════════════════════════════════════════════════')
				console.log('✅ ICON PROCESSING WORKFLOW COMPLETED SUCCESSFULLY')
				console.log('═══════════════════════════════════════════════════════════════\n')
			}
		}
	} catch (_error) {
		const processingError = errorHandler.createError(
			'Icon processing failed',
			ErrorType.OPTIMIZATION_FAILED,
			ErrorSeverity.HIGH,
			'processIcons',
			_error instanceof Error ? _error : undefined,
			true,
		)

		await errorHandler.handleError(processingError, verbose)
		await rollbackManager.executeRollback()
	}
}

// CLI interface
if (process.argv[1] && process.argv[1].endsWith('process-icons.ts')) {
	const args = process.argv.slice(2)
	const verbose = args.includes('--verbose') || args.includes('-v')

	processIcons(verbose).catch((error) => {
		console.error('Fatal error:', error)
		process.exit(1)
	})
}

export { processIcons }
