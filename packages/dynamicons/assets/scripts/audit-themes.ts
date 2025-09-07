#!/usr/bin/env node

import { promises as fs } from 'fs'
import path from 'path'
import { assetConstants } from '../src/_config/dynamicons.constants.js'
import stripJsonCommentsModule from 'strip-json-comments'
import { displayStructuredErrors } from './tree-formatter.js'

// Handle both default and direct exports
const stripJsonComments = (stripJsonCommentsModule as any).default || stripJsonCommentsModule

/**
 * Theme audit result interface
 */
export interface ThemeAuditResult {
	baseThemeExists: boolean
	dynamiconsThemeExists: boolean
	themesIdentical: boolean
	modelFileAssignments: string[]
	modelFolderAssignments: string[]
	modelLanguageAssignments: string[]
	themeFileAssignments: string[]
	themeFolderAssignments: string[]
	themeLanguageAssignments: string[]
	missingFileAssignments: string[]
	missingFolderAssignments: string[]
	missingLanguageAssignments: string[]
	extraFileAssignments: string[]
	extraFolderAssignments: string[]
	extraLanguageAssignments: string[]
	duplicateFileAssignments: string[]
	duplicateFolderAssignments: string[]
	duplicateLanguageAssignments: string[]
}

/**
 * Main theme audit function - validates correlation between model assignments and generated theme files
 */
export async function auditThemes(): Promise<ThemeAuditResult> {
	const baseThemePath = path.resolve(process.cwd(), assetConstants.paths.distThemesDir, 'base.theme.json')
	const dynamiconsThemePath = path.resolve(process.cwd(), assetConstants.paths.distThemesDir, 'dynamicons.theme.json')
	const fileModelPath = path.resolve(process.cwd(), assetConstants.paths.modelsDir, 'file_icons.model.json')
	const folderModelPath = path.resolve(process.cwd(), assetConstants.paths.modelsDir, 'folder_icons.model.json')
	const languageModelPath = path.resolve(process.cwd(), assetConstants.paths.modelsDir, 'language_icons.model.json')
	
	const result: ThemeAuditResult = {
		baseThemeExists: false,
		dynamiconsThemeExists: false,
		themesIdentical: false,
		modelFileAssignments: [],
		modelFolderAssignments: [],
		modelLanguageAssignments: [],
		themeFileAssignments: [],
		themeFolderAssignments: [],
		themeLanguageAssignments: [],
		missingFileAssignments: [],
		missingFolderAssignments: [],
		missingLanguageAssignments: [],
		extraFileAssignments: [],
		extraFolderAssignments: [],
		extraLanguageAssignments: [],
		duplicateFileAssignments: [],
		duplicateFolderAssignments: [],
		duplicateLanguageAssignments: []
	}

	try {
		// Check if theme files exist
		try {
			await fs.access(baseThemePath)
			result.baseThemeExists = true
		} catch {
			// Base theme doesn't exist
		}

		try {
			await fs.access(dynamiconsThemePath)
			result.dynamiconsThemeExists = true
		} catch {
			// Dynamicons theme doesn't exist
		}

		// Load model assignments
		await loadModelAssignments(result, fileModelPath, folderModelPath, languageModelPath)

		// If both themes exist, load theme assignments and compare
		if (result.baseThemeExists && result.dynamiconsThemeExists) {
			const baseThemeContent = await fs.readFile(baseThemePath, 'utf-8')
			const dynamiconsThemeContent = await fs.readFile(dynamiconsThemePath, 'utf-8')
			
			const baseTheme = JSON.parse(stripJsonComments(baseThemeContent))
			const dynamiconsTheme = JSON.parse(stripJsonComments(dynamiconsThemeContent))
			
			// Compare icon assignments (themes should be identical except for color overrides)
			result.themesIdentical = JSON.stringify(baseTheme.iconDefinitions) === JSON.stringify(dynamiconsTheme.iconDefinitions)
			
			// Extract icon assignments from base theme
			if (baseTheme.iconDefinitions) {
				// Extract file icon assignments
				for (const [key, value] of Object.entries(baseTheme.iconDefinitions)) {
					if (typeof value === 'object' && value !== null && 'iconPath' in value) {
						const iconPath = (value as any).iconPath
						if (iconPath && !iconPath.includes('folder-')) {
							result.themeFileAssignments.push(key)
						} else if (iconPath && iconPath.includes('folder-')) {
							result.themeFolderAssignments.push(key)
						}
					}
				}
			}

			// Extract language icon assignments
			if (baseTheme.languageIds) {
				for (const [key, value] of Object.entries(baseTheme.languageIds)) {
					if (typeof value === 'string') {
						result.themeLanguageAssignments.push(key)
					}
				}
			}
		}

		// Validate model-to-theme correlation
		validateModelToThemeCorrelation(result)

		// Check for duplicate assignments
		checkDuplicateAssignments(result)

	} catch (error) {
		console.error('❌ Theme audit failed:', error)
	}

	return result
}

/**
 * Load assignments from model files
 */
async function loadModelAssignments(result: ThemeAuditResult, fileModelPath: string, folderModelPath: string, languageModelPath: string): Promise<void> {
	try {
		// Load file icon model
		const fileModelContent = await fs.readFile(fileModelPath, 'utf-8')
		const fileModel = JSON.parse(stripJsonComments(fileModelContent))
		
		if (fileModel.icons && Array.isArray(fileModel.icons)) {
			for (const icon of fileModel.icons) {
				if (icon.iconName) {
					result.modelFileAssignments.push(icon.iconName)
				}
			}
		}



		// Load folder icon model
		const folderModelContent = await fs.readFile(folderModelPath, 'utf-8')
		const folderModel = JSON.parse(stripJsonComments(folderModelContent))
		
		if (folderModel.icons && Array.isArray(folderModel.icons)) {
			for (const icon of folderModel.icons) {
				if (icon.iconName) {
					result.modelFolderAssignments.push(icon.iconName)
				}
			}
		}



		// Load language icon model
		const languageModelContent = await fs.readFile(languageModelPath, 'utf-8')
		const languageModel = JSON.parse(stripJsonComments(languageModelContent))
		
		if (languageModel.icons && Array.isArray(languageModel.icons)) {
			for (const icon of languageModel.icons) {
				if (icon.languageID) {
					result.modelLanguageAssignments.push(icon.languageID)
				}
			}
		}


	} catch (error) {
		console.error('⚠️  Could not load model files:', error)
	}
}

/**
 * Validate correlation between model assignments and generated theme files
 */
function validateModelToThemeCorrelation(result: ThemeAuditResult): void {
	// Check for missing file assignments (in model but not in theme)
	for (const modelAssignment of result.modelFileAssignments) {
		const themeAssignment = `_${modelAssignment}`
		if (!result.themeFileAssignments.includes(themeAssignment)) {
			result.missingFileAssignments.push(modelAssignment)
		}
	}

	// Check for missing folder assignments (in model but not in theme)
	for (const modelAssignment of result.modelFolderAssignments) {
		const baseThemeAssignment = `_folder-${modelAssignment}`
		const openThemeAssignment = `_folder-${modelAssignment}-open`
		
		if (!result.themeFolderAssignments.includes(baseThemeAssignment)) {
			result.missingFolderAssignments.push(`${modelAssignment} (base)`)
		}
		if (!result.themeFolderAssignments.includes(openThemeAssignment)) {
			result.missingFolderAssignments.push(`${modelAssignment} (open)`)
		}
	}

	// Check for missing language assignments (in model but not in theme)
	for (const modelAssignment of result.modelLanguageAssignments) {
		if (!result.themeLanguageAssignments.includes(modelAssignment)) {
			result.missingLanguageAssignments.push(modelAssignment)
		}
	}

	// Check for extra file assignments (in theme but not in model)
	for (const themeAssignment of result.themeFileAssignments) {
		const modelAssignment = themeAssignment.startsWith('_') ? themeAssignment.substring(1) : themeAssignment
		// Skip core assignments that should always be present
		if (modelAssignment === 'file') {
			continue
		}
		if (!result.modelFileAssignments.includes(modelAssignment)) {
			result.extraFileAssignments.push(themeAssignment)
		}
	}

	// Check for extra folder assignments (in theme but not in model)
	for (const themeAssignment of result.themeFolderAssignments) {
		const cleanName = themeAssignment.startsWith('_') ? themeAssignment.substring(1) : themeAssignment
		if (cleanName.startsWith('folder-')) {
			const baseName = cleanName.substring(7) // remove 'folder-'
			// Skip core assignments that should always be present
			if (baseName === 'basic' || baseName === 'basic-open' || baseName === 'root' || baseName === 'root-open') {
				continue
			}
			if (baseName.endsWith('-open')) {
				const modelName = baseName.substring(0, baseName.length - 5) // remove '-open'
				if (!result.modelFolderAssignments.includes(modelName)) {
					result.extraFolderAssignments.push(themeAssignment)
				}
			} else {
				if (!result.modelFolderAssignments.includes(baseName)) {
					result.extraFolderAssignments.push(themeAssignment)
				}
			}
		}
	}

	// Check for extra language assignments (in theme but not in model)
	for (const themeAssignment of result.themeLanguageAssignments) {
		if (!result.modelLanguageAssignments.includes(themeAssignment)) {
			result.extraLanguageAssignments.push(themeAssignment)
		}
	}
}

/**
 * Check for duplicate assignments
 */
function checkDuplicateAssignments(result: ThemeAuditResult): void {
	// Check for duplicate file assignments in theme
	const seenFileIcons = new Set<string>()
	for (const icon of result.themeFileAssignments) {
		if (seenFileIcons.has(icon)) {
			result.duplicateFileAssignments.push(icon)
		} else {
			seenFileIcons.add(icon)
		}
	}

	// Check for duplicate folder assignments in theme
	const seenFolderIcons = new Set<string>()
	for (const icon of result.themeFolderAssignments) {
		if (seenFolderIcons.has(icon)) {
			result.duplicateFolderAssignments.push(icon)
		} else {
			seenFolderIcons.add(icon)
		}
	}

	// Check for duplicate language assignments in theme
	const seenLanguageIcons = new Set<string>()
	for (const icon of result.themeLanguageAssignments) {
		if (seenLanguageIcons.has(icon)) {
			result.duplicateLanguageAssignments.push(icon)
		} else {
			seenLanguageIcons.add(icon)
		}
	}
}

/**
 * Validate themes and display results
 */
/**
 * Check if theme validation is needed based on recent changes
 */
async function checkIfThemeValidationNeeded(): Promise<boolean> {
	try {
		const baseThemePath = path.resolve(process.cwd(), assetConstants.paths.distThemesDir, assetConstants.themeFiles.baseTheme)
		const dynamiconsThemePath = path.resolve(process.cwd(), assetConstants.paths.distThemesDir, assetConstants.themeFiles.generatedTheme)
		
		// If theme files don't exist, validation is needed
		try {
			await fs.stat(baseThemePath)
			await fs.stat(dynamiconsThemePath)
		} catch {
			return true // Theme files don't exist, validation needed
		}
		
		// Get theme file timestamps
		const baseThemeStat = await fs.stat(baseThemePath)
		const dynamiconsThemeStat = await fs.stat(dynamiconsThemePath)
		const latestThemeTime = Math.max(baseThemeStat.mtime.getTime(), dynamiconsThemeStat.mtime.getTime())
		
		// Check if theme files were modified recently (within last 2 minutes)
		// This ensures audit runs after theme generation
		const twoMinutesAgo = Date.now() - (2 * 60 * 1000)
		if (latestThemeTime > twoMinutesAgo) {
			return true // Themes were recently generated, validation needed
		}
		
		// Check if model files are newer than theme files
		const modelFiles = [
			path.resolve(process.cwd(), assetConstants.paths.modelsDir, 'file_icons.model.json'),
			path.resolve(process.cwd(), assetConstants.paths.modelsDir, 'folder_icons.model.json')
		]
		
		for (const modelFile of modelFiles) {
			try {
				const modelStat = await fs.stat(modelFile)
				if (modelStat.mtime.getTime() > latestThemeTime) {
					return true // Model file is newer than theme files
				}
			} catch {
				return true // Model file doesn't exist, validation needed
			}
		}
		
		return false // No changes detected - themes are up to date
	} catch (error) {
		return true // If we can't determine, assume validation is needed
	}
}

export async function validateThemesWithStatus(showSuccessMessage: boolean = true): Promise<{ isValid: boolean; wasSkipped: boolean }> {
	const needsValidation = await checkIfThemeValidationNeeded()
	
	if (!needsValidation) {
		if (showSuccessMessage) {
			console.log('✅ Theme validation skipped - no recent changes detected')
		}
		return { isValid: true, wasSkipped: true }
	}
	
	const isValid = await validateThemes()
	return { isValid, wasSkipped: false }
}

export async function validateThemes(): Promise<boolean> {
	const auditResult = await auditThemes()
	
	let hasErrors = false
	
	// Check theme file existence
	if (!auditResult.baseThemeExists) {
		console.log('❌ Base theme file missing')
		hasErrors = true
	}
	
	if (!auditResult.dynamiconsThemeExists) {
		console.log('❌ Dynamicons theme file missing')
		hasErrors = true
	}
	
	// Check theme identity
	if (auditResult.baseThemeExists && auditResult.dynamiconsThemeExists && !auditResult.themesIdentical) {
		console.log('❌ Base and Dynamicons themes are not identical')
		hasErrors = true
	}
	
	// Check if there are any validation errors to display in tree format
	const totalErrors = auditResult.missingFileAssignments.length +
		auditResult.missingFolderAssignments.length +
		auditResult.missingLanguageAssignments.length +
		auditResult.extraFileAssignments.length +
		auditResult.extraFolderAssignments.length +
		auditResult.extraLanguageAssignments.length +
		auditResult.duplicateFileAssignments.length +
		auditResult.duplicateFolderAssignments.length +
		auditResult.duplicateLanguageAssignments.length
	
	if (totalErrors > 0) {
		// Display errors in tree format
		displayStructuredErrors(
			[], // themeErrors (not used for theme audit)
			auditResult.extraFileAssignments,
			auditResult.extraFolderAssignments,
			auditResult.extraLanguageAssignments,
			auditResult.duplicateFileAssignments,
			auditResult.duplicateFolderAssignments,
			auditResult.duplicateLanguageAssignments,
			auditResult.missingFileAssignments,
			auditResult.missingFolderAssignments,
			auditResult.missingLanguageAssignments,
			[], // invalidLanguageIds (not applicable for theme audit)
			'THEME ERRORS', // Custom title for theme audit
			{
				assignedIconNotFound: 'THEME: MISSING MODEL ASSIGNMENT',
				duplicateAssignment: 'THEME: DUPLICATE ASSIGNMENT',
				unassignedIcon: 'THEME: EXTRA ASSIGNMENT',
				duplicateAssignmentId: 'THEME: DUPLICATE ASSIGNMENT ID'
			}
		)
		console.log('')
		console.log(`❌ Theme validation failed. Please fix the errors above before proceeding.`)
		hasErrors = true
	}
	
	if (!hasErrors) {
		console.log('✅ Theme validation passed - all checks successful')
		console.log(`📊 Summary: ${auditResult.modelFileAssignments.length} model file assignments, ${auditResult.modelFolderAssignments.length} model folder assignments, ${auditResult.modelLanguageAssignments.length} model language assignments`)
		console.log(`📊 Theme: ${auditResult.themeFileAssignments.length} file assignments, ${auditResult.themeFolderAssignments.length} folder assignments, ${auditResult.themeLanguageAssignments.length} language assignments`)
	}
	
	return !hasErrors
}

// CLI interface
const _argv1 = process.argv[1] ?? ''

if (_argv1.includes('audit-themes')) {
	const args = process.argv.slice(2)
	const verbose = args.includes('--verbose') || args.includes('-v')

	// Run theme validation
	validateThemes().then((isValid) => {
		if (!isValid) {
			process.exit(1)
		}
		process.exit(0)
	}).catch((error) => {
		console.error('Fatal error during theme audit:', error)
		process.exit(1)
	})
}
