#!/usr/bin/env node

import { promises as fs } from 'fs'
import path from 'path'
import { assetConstants } from '../src/_config/dynamicons.constants.js'
import { main as optimizeIconsMain } from './generate_optimized_icons.js'
import { main as generatePreviewsMain } from './generate_icon_previews.js'

/**
 * Process Icons - Complete workflow from external source to optimized output
 * Follows the new workflow: Stage → Organize → Optimize → Preview
 */
async function processIcons(verbose: boolean = false): Promise<void> {
	if (verbose) {
		console.log('🔄 [Process Icons] Starting complete icon workflow...')
	}
	
	try {
		// Step 1: Stage icons from external source
		if (verbose) {
			console.log('  📥 Step 1: Staging icons from external source...')
		}

		const stageResult = await stageIconsFromExternalSource()
		
		if (stageResult.success) {
			if (verbose) {
				console.log(`  ✅ Staged ${stageResult.stagedCount} new SVG icons`)
			} else {
				console.log(`📥 Icons: ${stageResult.stagedCount} staged`)
			}
		} else {
			if (verbose) {
				console.log('  ⚠️  External source not available, continuing with existing assets')
			}
		}
		
		// Step 2: Organize and optimize icons
		if (verbose) {
			console.log('  🔧 Step 2: Organizing and optimizing icons...')
		}

		const optimizationResult = await organizeAndOptimizeIcons()
		
		if (optimizationResult.success) {
			if (verbose) {
				console.log(`  ✅ Icons organized and optimized: ${optimizationResult.optimizedCount} processed`)
			} else {
				console.log(`🔧 Icons: ${optimizationResult.optimizedCount} optimized`)
			}
		}
		
		// Step 3: Generate preview images
		if (verbose) {
			console.log('  🖼️  Step 3: Generating preview images...')
		}

		const previewResult = await generatePreviews()
		
		if (previewResult.success) {
			if (verbose) {
				console.log('  ✅ Preview images generated successfully')
			} else {
				console.log('🖼️  Previews: Generated')
			}
		}
		
		if (verbose) {
			console.log('✅ Icon processing workflow completed successfully!')
		}
	} catch (error) {
		console.error('❌ Icon processing failed:', error)
		throw error
	}
}

/**
 * Stage SVG icons from external source to new_icons directory
 */
async function stageIconsFromExternalSource(): Promise<{ success: boolean, stagedCount: number }> {
	try {
		// Check if external source exists
		await fs.access(assetConstants.externalIconSource)
		
		// Read external source directory
		const sourceFiles = await fs.readdir(assetConstants.externalIconSource)
		
		// Filter for SVG files only, ignore other file types
		const svgFiles = sourceFiles.filter(file => {
			const ext = path.extname(file).toLowerCase()
			return assetConstants.fileTypes.allowed.includes(ext as '.svg') && 
				   !assetConstants.fileTypes.ignored.includes(ext as '.png' | '.jpg' | '.jpeg' | '.gif' | '.bmp' | '.ico' | '.webp')
		})
		
		if (svgFiles.length === 0) {
			return { success: true, stagedCount: 0 }
		}
		
		// Ensure new_icons directory exists
		await fs.mkdir(assetConstants.paths.newIconsDir, { recursive: true })
		
		let stagedCount = 0
		
		// Stage each SVG file
		for (const svgFile of svgFiles) {
			const sourcePath = path.join(assetConstants.externalIconSource, svgFile)
			const destPath = path.join(assetConstants.paths.newIconsDir, svgFile)
			
			try {
				if (assetConstants.deleteOriginalSvg) {
					// Move (delete original)
					await fs.rename(sourcePath, destPath)
				} else {
					// Copy (keep original)
					await fs.copyFile(sourcePath, destPath)
				}
				stagedCount++
			} catch (err) {
				console.log(`    ⚠️  Failed to stage ${svgFile}: ${err}`)
			}
		}
		
		return { success: true, stagedCount }
	} catch (error) {
		// External directory doesn't exist or can't be accessed
		return { success: false, stagedCount: 0 }
	}
}

/**
 * Organize staged icons into file_icons and folder_icons directories, then optimize them
 */
async function organizeAndOptimizeIcons(): Promise<{ success: boolean, optimizedCount: number }> {
	try {
		// Check if new_icons directory exists and has files
		try {
			const newIconsFiles = await fs.readdir(assetConstants.paths.newIconsDir)
			const svgFiles = newIconsFiles.filter(file => 
				file.toLowerCase().endsWith('.svg'))
			
			if (svgFiles.length === 0) {
				// No new icons to process
				return { success: true, optimizedCount: 0 }
			}
			
			// Ensure target directories exist
			await fs.mkdir(assetConstants.paths.fileIconsDir, { recursive: true })
			await fs.mkdir(assetConstants.paths.folderIconsDir, { recursive: true })
			
			// Organize icons into appropriate directories
			for (const svgFile of svgFiles) {
				const sourcePath = path.join(assetConstants.paths.newIconsDir, svgFile)
				
				// Determine if it's a folder icon or file icon based on naming convention
				const isFolderIcon = svgFile.toLowerCase().startsWith(assetConstants.iconNaming.folderPrefix)
				const targetDir = isFolderIcon ? assetConstants.paths.folderIconsDir : assetConstants.paths.fileIconsDir
				const destPath = path.join(targetDir, svgFile)
				
				try {
					// Move from new_icons to appropriate target directory
					await fs.rename(sourcePath, destPath)
				} catch (err) {
					console.log(`    ⚠️  Failed to organize ${svgFile}: ${err}`)
				}
			}
			
			// Now run optimization on the organized icons
			const result = await optimizeIconsMain('all', true)
			
			return {
				success: true,
				optimizedCount: result.fileOptimizationDetails.length + result.folderOptimizationDetails.length,
			}
		} catch (error) {
			// new_icons directory doesn't exist
			return { success: true, optimizedCount: 0 }
		}
	} catch (error) {
		console.log(`    ⚠️  Icon organization and optimization failed: ${error}`)
		return { success: false, optimizedCount: 0 }
	}
}

/**
 * Generate preview images using the existing preview logic
 */
async function generatePreviews(): Promise<{ success: boolean }> {
	try {
		const success = await generatePreviewsMain('all', true)
		return { success }
	} catch (error) {
		console.log(`    ⚠️  Preview generation failed: ${error}`)
		return { success: false }
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
