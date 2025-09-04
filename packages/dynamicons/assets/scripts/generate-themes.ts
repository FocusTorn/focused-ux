#!/usr/bin/env node

import { promises as fs } from 'fs'
import path from 'path'
import { main as generateManifestsMain } from './generate_icon_manifests.js'
import { assetConstants } from '../src/_config/dynamicons.constants.js'
import { validateModels } from './audit-models.js'

const THEMES_DIR = path.resolve(process.cwd(), assetConstants.paths.distThemesDir)



/**
 * Generate Themes - Complete workflow for theme generation and verification
 */
async function generateThemes(_verbose: boolean = false): Promise<void> {
	try {
		// 0) Validate models and fail fast if any errors found
		const modelsValid = await validateModels(false)
		if (!modelsValid) {
			process.exit(1)
		}

		// 1) Delete existing generated themes and verify
		const deleteResult = await deleteExistingThemes()
		
		if (!deleteResult.success) {
			// Delete failed - exit early
			process.exit(1)
		}
		
		// 2) Generate new themes and verify
		try {
			await generateAndVerifyThemes()
			
			// Both operations succeeded - show consolidated success message only
			console.log('\x1B[32mSuccess: Models audited, theme files removed(verified) and regenerated(verified):\x1B[0m')
			console.log(`\x1B[90m  - ${path.relative(process.cwd(), path.join(THEMES_DIR, 'base.theme.json'))}\x1B[0m`)
			console.log(`\x1B[90m  - ${path.relative(process.cwd(), path.join(THEMES_DIR, 'dynamicons.theme.json'))}\x1B[0m`)
		} catch (error) {
			// Generation failed - show deletion success + generation failure
			console.log('\x1B[32mSuccess: Existing theme files deleted and verified.\x1B[0m')
			console.log('')
			console.error('\x1B[31mError: Generating theme files\x1B[0m')
			console.error(`Type: ${error instanceof Error ? error.constructor.name : 'Unknown'}`)
			console.error(`Description: ${error instanceof Error ? error.message : String(error)}`)
			process.exit(1)
		}
	} catch (error) {
		console.error('❌ Theme generation failed:', error)
		throw error
	}
}



/**
 * Delete existing generated theme files
 */
async function deleteExistingThemes(): Promise<{ success: boolean, deletedCount: number }> {
	try {
		// Ensure themes directory exists
		try {
			await fs.access(THEMES_DIR)
		} catch {
			// Directory doesn't exist, nothing to delete; consider this success
			// Success - no output needed, handled by caller
			return { success: true, deletedCount: 0 }
		}

		const themeFiles = await fs.readdir(THEMES_DIR)
		const generatedThemes = themeFiles.filter(
			file =>
				file.endsWith('.theme.json') && !file.includes('focused-ux-colors'),
		)

		let deletedCount = 0

		for (const themeFile of generatedThemes) {
			const themePath = path.join(THEMES_DIR, themeFile)

			try {
				await fs.unlink(themePath)
				deletedCount++
			} catch (_err) {
				// Continue attempting to delete others
			}
		}

		// Verify deletion
		const remaining = (await fs.readdir(THEMES_DIR)).filter(
			file =>
				file.endsWith('.theme.json') && !file.includes('focused-ux-colors'),
		)

		if (remaining.length === 0) {
			// Success - no output needed, handled by caller
			return { success: true, deletedCount }
		}

		console.log('\x1B[31mFailed: Existing theme files not removed.\x1B[0m')
		return { success: false, deletedCount: 0 }
	} catch (error) {
		console.log('\x1B[31mFailed: Existing theme files not removed.\x1B[0m')
		return { success: false, deletedCount: 0 }
	}
}

/**
 * Generate themes and verify existence, then print exact success lines
 */
async function generateAndVerifyThemes(): Promise<void> {
	try {
		// Generate theme files (this will handle deletion internally)
		const success = await generateManifestsMain(true) // Use silent mode to avoid duplicate output

		if (!success) {
			throw new Error('Theme generation failed')
		}

		// Verify the two expected files exist
		const baseTheme = path.join(THEMES_DIR, 'base.theme.json')
		const dynTheme = path.join(THEMES_DIR, 'dynamicons.theme.json')

		const baseExists = await fileExists(baseTheme)
		const dynExists = await fileExists(dynTheme)

		if (!baseExists || !dynExists) {
			throw new Error('Generated theme files missing after generation')
		}

		// Success - no output needed, handled by caller
	} catch (error) {
		console.error('Error: Generating theme files')
		console.error(`Type: ${error instanceof Error ? error.constructor.name : 'Unknown'}`)
		console.error(`Description: ${error instanceof Error ? error.message : String(error)}`)
		throw error
	}
}

async function fileExists(p: string): Promise<boolean> {
	try {
		await fs.access(p)
		return true
	} catch {
		return false
	}
}



// CLI interface
const _argv1 = process.argv[1] ?? ''

if (_argv1.includes('generate-themes')) {
	const args = process.argv.slice(2)
	const verbose = args.includes('--verbose') || args.includes('-v')

	generateThemes(verbose).catch((error) => {
		console.error('Fatal error:', error)
		process.exit(1)
	})
}
