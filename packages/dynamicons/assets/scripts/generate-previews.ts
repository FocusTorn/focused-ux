#!/usr/bin/env node

import { promises as fs } from 'fs'
import path from 'path'
import { assetConstants } from '../src/_config/dynamicons.constants.js'
import { main as generatePreviewsMain } from './generate_icon_previews.js'

/**
 * Generate preview images using the existing preview logic
 * Handles change detection, forced regeneration, and verification
 */
export async function generatePreviews(verbose: boolean = false, iconsChanged: boolean = false): Promise<{ success: boolean }> {
	try {
		const previewDir = assetConstants.paths.distImagesDir
		const expectedFiles = [
			'File_icons_preview.png',
			'Folder_icons_preview.png',
			'Folder_Open_icons_preview.png'
		]
		
		// Ensure preview directory exists
		await fs.mkdir(previewDir, { recursive: true })
		
		// Check if all three preview images already exist
		const existingFiles = []
		for (const file of expectedFiles) {
			try {
				await fs.access(path.join(previewDir, file))
				existingFiles.push(file)
			} catch {
				// File doesn't exist
			}
		}
		
		// If all three files exist and no icons changed, show green success message
		if (existingFiles.length === 3 && !iconsChanged) {
			if (verbose) {
				console.log('✅ Preview images already exist and up to date')
				console.log('📄 Existing files:')
				console.log(`   • ${expectedFiles[0]}`)
				console.log(`   • ${expectedFiles[1]}`)
				console.log(`   • ${expectedFiles[2]}`)
				console.log('───────────────────────────────────────────────────────────')
			}
			console.log('\x1B[32m🖼️  Previews: All preview images already exist\x1B[0m')
			return { success: true }
		}
		
		// If icons have changed, force regeneration by deleting existing previews
		if (iconsChanged) {
			if (verbose) {
				console.log('🔄 CHANGE DETECTED - FORCING REGENERATION')
				console.log('   Deleting existing preview files...')
			}
			
			// Delete all existing preview files
			for (const file of expectedFiles) {
				try {
					const filePath = path.join(previewDir, file)
					await fs.access(filePath)
					await fs.unlink(filePath)
				} catch {
					// File doesn't exist or can't be deleted, continue
				}
			}
			
			// Verify deletion
			const remainingFiles = []
			for (const file of expectedFiles) {
				try {
					await fs.access(path.join(previewDir, file))
					remainingFiles.push(file)
				} catch {
					// File successfully deleted
				}
			}
			
			if (remainingFiles.length > 0) {
				console.log(`\x1B[31m❌ Preview regeneration failed: Could not delete existing files: ${remainingFiles.join(', ')}\x1B[0m`)
				return { success: false }
			}
			
			if (verbose) {
				console.log('✅ Existing preview files deleted and verified')
			}
		}
		
		// Generate previews using our own logic to avoid unwanted output
		// Only show generation message and source directories in verbose mode
		if (verbose) {
			console.log('\n🖼️  GENERATING PREVIEW IMAGES')
			console.log('───────────────────────────────────────────────────────────')
			console.log('📁 Source Directories:')
			console.log(`   File icons:   ${path.resolve(process.cwd(), assetConstants.paths.fileIconsDir)}`)
			console.log(`   Folder icons: ${path.resolve(process.cwd(), assetConstants.paths.folderIconsDir)}`)
			console.log(`📁 Output:      ${path.resolve(process.cwd(), previewDir)}`)
			console.log('🔄 Generating preview images...')
		}
		
		// Call the preview generation function but capture and suppress its output
		try {
			// Temporarily redirect console.log to suppress output from underlying script
			const originalLog = console.log
			const originalError = console.error
			
			// Always suppress output from the underlying script since we handle our own verbose output
			console.log = () => {} // Suppress all output
			console.error = () => {} // Suppress all errors
			
			// Generate the previews
			await generatePreviewsMain('all', true)
			
			// Restore console functions
			console.log = originalLog
			console.error = originalError
		} catch (error) {
			// Restore console functions in case of error
			console.log = originalLog
			console.error = originalError
			throw error
		}
		
		// Wait a moment for files to be fully written
		await new Promise(resolve => setTimeout(resolve, 1000))
		
		// Check if all three files were created (regardless of return value)
		const generatedFiles = []
		for (const file of expectedFiles) {
			try {
				await fs.access(path.join(previewDir, file))
				generatedFiles.push(file)
			} catch {
				// File still doesn't exist
			}
		}
		
		if (generatedFiles.length === 3) {
			if (verbose) {
				console.log('✅ Preview generation completed successfully')
				console.log('📄 Generated files:')
				console.log(`   • ${expectedFiles[0]}`)
				console.log(`   • ${expectedFiles[1]}`)
				console.log(`   • ${expectedFiles[2]}`)
				console.log('───────────────────────────────────────────────────────────')
			}
			console.log('\x1B[32m🖼️  Previews: Generated and verified\x1B[0m')
			return { success: true }
		} else {
			if (verbose) {
				console.log('❌ Preview generation failed')
				console.log(`📄 Expected: ${expectedFiles.join(', ')}`)
				console.log(`📄 Created:  ${generatedFiles.join(', ')}`)
				console.log(`📄 Missing:  ${expectedFiles.filter(f => !generatedFiles.includes(f)).join(', ')}`)
				console.log('───────────────────────────────────────────────────────────')
			}
			console.log(`\x1B[31m❌ Preview generation failed: Only ${generatedFiles.length}/3 files created\x1B[0m`)
			return { success: false }
		}
	} catch (error) {
		console.log(`\x1B[31m❌ Preview generation failed: ${error instanceof Error ? error.message : String(error)}\x1B[0m`)
		return { success: false }
	}
}

/**
 * Check if preview images exist and are up to date
 * Returns true if all expected preview files exist
 */
export async function checkPreviewImages(): Promise<{ exists: boolean, missingFiles: string[] }> {
	const previewDir = assetConstants.paths.distImagesDir
	const expectedFiles = [
		'File_icons_preview.png',
		'Folder_icons_preview.png',
		'Folder_Open_icons_preview.png'
	]
	
	const missingFiles: string[] = []
	
	for (const file of expectedFiles) {
		try {
			await fs.access(path.join(previewDir, file))
		} catch {
			missingFiles.push(file)
		}
	}
	
	return {
		exists: missingFiles.length === 0,
		missingFiles
	}
}

/**
 * Force regeneration of all preview images
 * Deletes existing previews and generates new ones
 */
export async function forceRegeneratePreviews(verbose: boolean = false): Promise<{ success: boolean }> {
	return generatePreviews(verbose, true)
}

// CLI interface
const _argv1 = process.argv[1] ?? ''

if (_argv1.includes('generate-previews')) {
	const args = process.argv.slice(2)
	const verbose = args.includes('--verbose') || args.includes('-v')
	const force = args.includes('--force') || args.includes('-f')

	if (force) {
		// Force regeneration
		forceRegeneratePreviews(verbose).then((result) => {
			if (!result.success) {
				process.exit(1)
			}
			process.exit(0)
		}).catch((error) => {
			console.error('Fatal error during preview generation:', error)
			process.exit(1)
		})
	} else {
		// Check and generate if needed
		generatePreviews(verbose, false).then((result) => {
			if (!result.success) {
				process.exit(1)
			}
			process.exit(0)
		}).catch((error) => {
			console.error('Fatal error during preview generation:', error)
			process.exit(1)
		})
	}
}
