#!/usr/bin/env node

import { promises as fs } from 'fs'
import path from 'path'
import { main as generateManifestsMain } from './generate_icon_manifests.js'
import { assetConstants } from '../src/_config/dynamicons.constants.js'
import { validateModels } from './audit-models.js'
import { errorHandler, inputValidator, rollbackManager, ErrorType, ErrorSeverity } from './error-handler.js'

const THEMES_DIR = path.resolve(process.cwd(), assetConstants.paths.distThemesDir)

/**
 * Check if file exists
 */
async function fileExists(p: string): Promise<boolean> {
	try {
		await fs.access(p)
		return true
	} catch {
		return false
	}
}

/**
 * Check if theme generation is needed based on recent changes
 */
async function checkIfThemeGenerationNeeded(): Promise<boolean> {
	try {
		const baseThemePath = path.join(THEMES_DIR, 'base.theme.json')
		const dynThemePath = path.join(THEMES_DIR, 'dynamicons.theme.json')
		
		// If theme files don't exist, generation is needed
		const baseThemeExists = await fileExists(baseThemePath)
		const dynThemeExists = await fileExists(dynThemePath)
		
		if (!baseThemeExists || !dynThemeExists) {
			return true
		}
		
		// Get theme file timestamps
		const baseThemeStats = await fs.stat(baseThemePath)
		const dynThemeStats = await fs.stat(dynThemePath)
		const latestThemeTime = Math.max(baseThemeStats.mtime.getTime(), dynThemeStats.mtime.getTime())
		
		// Check model files for changes
		const modelFiles = [
			path.resolve(process.cwd(), 'src/models/file_icons.model.json'),
			path.resolve(process.cwd(), 'src/models/folder_icons.model.json'),
			path.resolve(process.cwd(), 'src/models/language_icons.model.json'),
		]
		
		for (const modelFile of modelFiles) {
			try {
				const modelStats = await fs.stat(modelFile)

				if (modelStats.mtime.getTime() > latestThemeTime) {
					return true // Model file is newer than theme files
				}
			} catch {
				// Model file doesn't exist, assume generation needed
				return true
			}
		}
		
		// Check icon directories for changes
		const iconDirs = [
			path.resolve(process.cwd(), 'assets/icons/file_icons'),
			path.resolve(process.cwd(), 'assets/icons/folder_icons'),
			path.resolve(process.cwd(), 'assets/icons/language_icons'),
		]
		
		for (const iconDir of iconDirs) {
			try {
				const iconFiles = await fs.readdir(iconDir)

				for (const iconFile of iconFiles) {
					if (iconFile.endsWith('.svg')) {
						const iconPath = path.join(iconDir, iconFile)
						const iconStats = await fs.stat(iconPath)

						if (iconStats.mtime.getTime() > latestThemeTime) {
							return true // Icon file is newer than theme files
						}
					}
				}
			} catch {
				// Icon directory doesn't exist, continue
			}
		}
		
		return false // No changes detected
	} catch (_error) {
		// If we can't determine, assume generation is needed
		return true
	}
}

/**
 * Delete existing theme files
 */
async function deleteExistingThemes(): Promise<{ success: boolean, deletedCount: number }> {
	let deletedCount = 0
	
	try {
		const baseThemePath = path.join(THEMES_DIR, 'base.theme.json')
		const dynThemePath = path.join(THEMES_DIR, 'dynamicons.theme.json')
		
		// Delete base theme
		if (await fileExists(baseThemePath)) {
			await fs.unlink(baseThemePath)
			deletedCount++
		}
		
		// Delete dynamicons theme
		if (await fileExists(dynThemePath)) {
			await fs.unlink(dynThemePath)
			deletedCount++
		}
		
		return { success: true, deletedCount }
	} catch (_error) {
		errorHandler.handleError(ErrorType.THEME_DELETION, 'Failed to delete existing themes', ErrorSeverity.HIGH, _error)
		return { success: false, deletedCount }
	}
}

/**
 * Generate and verify themes
 */
async function generateAndVerifyThemes(): Promise<void> {
	try {
		// Generate icon manifests first
		await generateManifestsMain()
		
		// Generate themes
		const { execSync } = await import('child_process')

		execSync('npx tsx scripts/generate_icon_manifests.ts', { stdio: 'inherit' })
		
		// Verify themes were generated
		const baseThemePath = path.join(THEMES_DIR, 'base.theme.json')
		const dynThemePath = path.join(THEMES_DIR, 'dynamicons.theme.json')
		
		if (!(await fileExists(baseThemePath)) || !(await fileExists(dynThemePath))) {
			throw new Error('Theme generation failed - files not created')
		}
	} catch (_error) {
		errorHandler.handleError(ErrorType.THEME_GENERATION, 'Failed to generate themes', ErrorSeverity.HIGH, _error)
		throw _error
	}
}

/**
 * Generate Themes - Complete workflow for theme generation and verification
 * Now includes change detection for Nx caching optimization
 */
async function generateThemes(_verbose: boolean = false): Promise<void> {
	try {
		// Step 0: Input validation
		const validationResult = await inputValidator.validateModelFiles()

		if (!validationResult) {
			const validationError = errorHandler.createError(
				'Model validation failed',
				ErrorType.INVALID_MODEL_FORMAT,
				ErrorSeverity.HIGH,
				'generateThemes',
				undefined,
				false,
			)

			await errorHandler.handleError(validationError, _verbose)
			return
		}

		// Step 1: Validate models and fail fast if any errors found
		const modelsValid = await validateModels(false)

		if (!modelsValid) {
			const modelValidationError = errorHandler.createError(
				'Model validation failed',
				ErrorType.MODEL_VALIDATION_FAILED,
				ErrorSeverity.HIGH,
				'generateThemes',
				undefined,
				false,
			)

			await errorHandler.handleError(modelValidationError, _verbose)
			return
		}

		// Step 2: Check if theme generation is needed
		const needsGeneration = await checkIfThemeGenerationNeeded()

		if (!needsGeneration) {
			if (_verbose) {
				console.log('✨ No model changes detected - theme files are up to date!')
			} else {
				console.log('✨ No model changes detected - theme files are up to date!')
			}
			return
		}

		// Step 3: Delete existing generated themes and verify
		const deleteResult = await deleteExistingThemes()
		
		if (!deleteResult.success) {
			const deleteError = errorHandler.createError(
				'Failed to delete existing theme files',
				ErrorType.FILE_NOT_FOUND,
				ErrorSeverity.HIGH,
				'deleteExistingThemes',
				undefined,
				false,
			)

			await errorHandler.handleError(deleteError, _verbose)
			return
		}
		
		// Step 4: Generate new themes and verify
		try {
			await generateAndVerifyThemes()
			
			// Both operations succeeded - show consolidated success message only
			console.log('\x1B[32mSuccess: Models audited, theme files removed(verified) and regenerated(verified):\x1B[0m')
			console.log(`\x1B[90m  - ${path.relative(process.cwd(), path.join(THEMES_DIR, 'base.theme.json'))}\x1B[0m`)
			console.log(`\x1B[90m  - ${path.relative(process.cwd(), path.join(THEMES_DIR, 'dynamicons.theme.json'))}\x1B[0m`)
		} catch (_error) {
			// Generation failed - show deletion success + generation failure
			console.log('\x1B[32mSuccess: Existing theme files deleted and verified.\x1B[0m')
			console.log('')
			
			const generationError = errorHandler.createError(
				'Generating theme files',
				ErrorType.THEME_GENERATION_FAILED,
				ErrorSeverity.HIGH,
				'generateAndVerifyThemes',
				_error instanceof Error ? _error : undefined,
				true,
			)

			await errorHandler.handleError(generationError, _verbose)
			await rollbackManager.executeRollback()
		}
	} catch (_error) {
		const themeError = errorHandler.createError(
			'Theme generation failed',
			ErrorType.THEME_GENERATION_FAILED,
			ErrorSeverity.HIGH,
			'generateThemes',
			_error instanceof Error ? _error : undefined,
			true,
		)

		await errorHandler.handleError(themeError, _verbose)
		await rollbackManager.executeRollback()
	}
}

// Export the function for use by other scripts
export { generateThemes }

// CLI interface
const _argv1 = process.argv[1] ?? ''

if (_argv1.includes('generate-themes')) {
	const args = process.argv.slice(2)
	const verbose = args.includes('--verbose') || args.includes('-v')

	generateThemes(verbose).catch((_error) => {
		console.error('Fatal error:', _error)
		process.exit(1)
	})
}
