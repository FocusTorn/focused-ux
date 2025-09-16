import { promises as fs } from 'fs'
import * as fsSync from 'fs'
import path from 'path'
import { assetConstants } from '../_config/asset.constants.js'
import { ErrorHandler, ErrorType, ErrorSeverity } from '../utils/error-handler.js'
import stripJsonCommentsModule from 'strip-json-comments'

// Handle both default and direct exports
const stripJsonComments = (stripJsonCommentsModule as { default?: (str: string) => string }).default || stripJsonCommentsModule

/**
 * Theme audit result interface
 */
interface ThemeAuditResult {
	baseThemeExists: boolean
	dynamiconsThemeExists: boolean
	themesIdentical: boolean
	modelFileAssignments: string[]
	modelFolderAssignments: string[]
	modelLanguageAssignments: string[]
	themeFileAssignments: string[]
	themeFolderAssignments: string[]
	themeLanguageAssignments: string[]
	themeLanguageIds: string[]
	themeFileTargets: string[]
	themeFolderTargets: string[]
	themeFolderTargetsInFolderNames: string[]
	themeFolderTargetsInFolderNamesExpanded: string[]
	missingFileAssignments: string[]
	missingFolderAssignments: string[]
	missingLanguageAssignments: string[]
	extraFileAssignments: string[]
	extraFolderAssignments: string[]
	extraLanguageAssignments: string[]
	duplicateFileAssignments: string[]
	duplicateFolderAssignments: string[]
	duplicateLanguageAssignments: string[]
	mismatchFileAssignments: string[]
	mismatchFolderAssignments: string[]
	mismatchLanguageAssignments: string[]
}

/**
 * Theme Audit Processor - Validates correlation between model assignments and generated theme files
 */
export class ThemeAuditProcessor {

	private errorHandler: ErrorHandler
	private fileIconsModel: any = null
	private folderIconsModel: any = null
	private languageIconsModel: any = null

	constructor() {
		this.errorHandler = new ErrorHandler()
	}

	/**
	 * Load model data for inverse mapping validation
	 */
	private loadModelData(): void {
		try {
			this.fileIconsModel = JSON.parse(stripJsonComments(fsSync.readFileSync(path.resolve(process.cwd(), assetConstants.paths.modelsDir, 'file_icons.model.json'), 'utf8')))
			this.folderIconsModel = JSON.parse(stripJsonComments(fsSync.readFileSync(path.resolve(process.cwd(), assetConstants.paths.modelsDir, 'folder_icons.model.json'), 'utf8')))
			this.languageIconsModel = JSON.parse(stripJsonComments(fsSync.readFileSync(path.resolve(process.cwd(), assetConstants.paths.modelsDir, 'language_icons.model.json'), 'utf8')))
		} catch (error) {
			console.error('❌ Failed to load model data:', error)
		}
	}

	/**
	 * Main theme audit function
	 */
	async process(verbose: boolean = false, demo: boolean = false): Promise<boolean> {
		try {
			// Load model data for inverse mapping validation
			this.loadModelData()

			if (verbose) {
				console.log('🎨 [THEME AUDIT PROCESSOR]')
				console.log('═'.repeat(60))
			}

			// Check if theme files exist first (skip in demo mode)
			if (!demo) {
				const baseThemePath = path.resolve(process.cwd(), assetConstants.paths.distThemesDir, 'base.theme.json')
				const dynamiconsThemePath = path.resolve(process.cwd(), assetConstants.paths.distThemesDir, 'dynamicons.theme.json')
				
				const baseThemeExists = await this.fileExists(baseThemePath)
				const dynamiconsThemeExists = await this.fileExists(dynamiconsThemePath)
				
				if (!baseThemeExists || !dynamiconsThemeExists) {
					if (verbose) {
						console.log('⏭️ Theme audit skipped - theme files not found')
					}
					return true
				}
			}

			// Perform comprehensive theme audit or create demo data
			let auditResult: ThemeAuditResult
			
			if (demo) {
				auditResult = {
					baseThemeExists: true,
					dynamiconsThemeExists: true,
					themesIdentical: true,
					modelFileAssignments: [],
					modelFolderAssignments: [],
					modelLanguageAssignments: [],
					themeFileAssignments: [],
					themeFolderAssignments: [],
					themeLanguageAssignments: [],
					themeLanguageIds: [],
					themeFileTargets: [],
					themeFolderTargets: [],
					themeFolderTargetsInFolderNames: [],
					themeFolderTargetsInFolderNamesExpanded: [],
					missingFileAssignments: ['missing1', 'missing2'],
					missingFolderAssignments: ['missing-folder1', 'missing-folder2'],
					missingLanguageAssignments: ['missing-lang1', 'missing-lang2'],
					extraFileAssignments: ['_extra1', '_extra2'],
					extraFolderAssignments: ['_folder-extra1', '_folder-extra2'],
					extraLanguageAssignments: ['_lang-extra1', '_lang-extra2'],
					duplicateFileAssignments: ['test1', 'test2'],
					duplicateFolderAssignments: ['folder-test1', 'folder-test2'],
					duplicateLanguageAssignments: ['lang-test1', 'lang-test2'],
					mismatchFileAssignments: [],
					mismatchFolderAssignments: [],
					mismatchLanguageAssignments: [],
				}
			} else {
				auditResult = await this.auditThemes()
			}
			
			// Check if there are any errors
			const totalErrors = this.calculateTotalErrors(auditResult)

			if (totalErrors > 0) {
				// Always display theme errors when there are failures
				this.displayThemeErrors(auditResult)
				console.log('')
				
				// Return false to indicate failure
				return false
			}

			if (verbose) {
				console.log('✅ Theme validation passed - all checks successful')
				console.log(`📊 Summary: ${auditResult.modelFileAssignments.length} model file assignments, ${auditResult.modelFolderAssignments.length} model folder assignments, ${auditResult.modelLanguageAssignments.length} model language assignments`)
				console.log(`📊 Theme: ${auditResult.themeFileAssignments.length} file assignments, ${auditResult.themeFolderAssignments.length} folder assignments, ${auditResult.themeLanguageAssignments.length} language assignments`)
			}
			
			return true
		} catch (error) {
			const auditError = this.errorHandler.createError(
				'Theme audit failed',
				ErrorType.THEME_GENERATION_FAILED,
				ErrorSeverity.HIGH,
				'ThemeAuditProcessor.process',
				error instanceof Error ? error : undefined,
				true,
			)

			await this.errorHandler.handleError(auditError, verbose)
			return false
		}
	}

	/**
	 * Comprehensive theme audit function
	 */
	private async auditThemes(): Promise<ThemeAuditResult> {
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
			themeLanguageIds: [],
			themeFileTargets: [],
			themeFolderTargets: [],
			themeFolderTargetsInFolderNames: [],
			themeFolderTargetsInFolderNamesExpanded: [],
			missingFileAssignments: [],
			missingFolderAssignments: [],
			missingLanguageAssignments: [],
			extraFileAssignments: [],
			extraFolderAssignments: [],
			extraLanguageAssignments: [],
			duplicateFileAssignments: [],
			duplicateFolderAssignments: [],
			duplicateLanguageAssignments: [],
			mismatchFileAssignments: [],
			mismatchFolderAssignments: [],
			mismatchLanguageAssignments: [],
		}

		try {
			// Check if theme files exist
			result.baseThemeExists = await this.fileExists(baseThemePath)
			result.dynamiconsThemeExists = await this.fileExists(dynamiconsThemePath)

			// Load model assignments
			await this.loadModelAssignments(result, fileModelPath, folderModelPath, languageModelPath)

			// If both themes exist, load theme assignments and compare
			if (result.baseThemeExists && result.dynamiconsThemeExists) {
				const [baseTheme, dynamiconsTheme] = await Promise.all([
					this.loadThemeFile(baseThemePath),
					this.loadThemeFile(dynamiconsThemePath),
				])
				
				// Compare icon assignments (themes should be identical except for color overrides)
				result.themesIdentical = JSON.stringify(baseTheme.iconDefinitions) === JSON.stringify(dynamiconsTheme.iconDefinitions)
				
				// Extract theme assignments
				this.extractThemeAssignments(result, baseTheme)

				// Validate inverse mappings (check if model-specified mappings exist in theme)
				this.validateInverseMappings(result, baseTheme)

				// Validate model-to-theme correlation
				this.validateModelToThemeCorrelation(result, baseTheme)
			}

			// Check for duplicate assignments
			this.checkDuplicateAssignments(result)
		} catch (error) {
			console.error('❌ Theme audit failed:', error)
		}

		return result
	}

	/**
	 * Load and parse a theme file
	 */
	private async loadThemeFile(filePath: string): Promise<any> {
		try {
			const content = await fs.readFile(filePath, 'utf-8')

			return JSON.parse(stripJsonComments(content))
		} catch {
			return { iconDefinitions: {}, languageIds: {} }
		}
	}

	/**
	 * Load assignments from model files
	 */
	private async loadModelAssignments(result: ThemeAuditResult, fileModelPath: string, folderModelPath: string, languageModelPath: string): Promise<void> {
		try {
			// Load file icon model
			const fileModel = await this.loadModelFile(fileModelPath)

			if (fileModel.icons && Array.isArray(fileModel.icons)) {
				for (const icon of fileModel.icons) {
					// Add file names
					if (icon.fileNames && Array.isArray(icon.fileNames)) {
						for (const fileName of icon.fileNames) {
							result.modelFileAssignments.push(fileName)
						}
					}
					// Add file extensions
					if (icon.fileExtensions && Array.isArray(icon.fileExtensions)) {
						for (const fileExtension of icon.fileExtensions) {
							result.modelFileAssignments.push(fileExtension)
						}
					}
				}
			}

			// Load folder icon model
			const folderModel = await this.loadModelFile(folderModelPath)

			if (folderModel.icons && Array.isArray(folderModel.icons)) {
				for (const icon of folderModel.icons) {
					if (icon.folderNames && Array.isArray(icon.folderNames)) {
						for (const folderName of icon.folderNames) {
							result.modelFolderAssignments.push(folderName)
						}
					}
				}
			}

			// Load language icon model
			const languageModel = await this.loadModelFile(languageModelPath)

			if (languageModel.icons && Array.isArray(languageModel.icons)) {
				for (const icon of languageModel.icons) {
					if (icon.iconName) {
						result.modelLanguageAssignments.push(icon.iconName)
					}
				}
			}
		} catch (error) {
			console.error('⚠️  Could not load model files:', error)
		}
	}

	/**
	 * Load and parse a model file
	 */
	private async loadModelFile(filePath: string): Promise<any> {
		try {
			const content = await fs.readFile(filePath, 'utf-8')

			return JSON.parse(stripJsonComments(content))
		} catch {
			return { icons: [] }
		}
	}

	/**
	 * Extract icon assignments from theme file
	 */
	private extractThemeAssignments(result: ThemeAuditResult, theme: any): void {
		// Extract file extension assignments (extract both keys and values)
		if (theme.fileExtensions) {
			for (const [key, value] of Object.entries(theme.fileExtensions)) {
				if (typeof value === 'string') {
					// Store the target (key) for duplicate checking
					result.themeFileTargets.push(key)

					// Strip the _ prefix from the theme assignment value
					const cleanValue = value.startsWith('_') ? value.substring(1) : value

					result.themeFileAssignments.push(cleanValue)
				}
			}
		}

		// Extract file name assignments (extract both keys and values)
		if (theme.fileNames) {
			for (const [key, value] of Object.entries(theme.fileNames)) {
				if (typeof value === 'string') {
					// Store the target (key) for duplicate checking
					result.themeFileTargets.push(key)

					// Strip the _ prefix from the theme assignment value
					const cleanValue = value.startsWith('_') ? value.substring(1) : value

					result.themeFileAssignments.push(cleanValue)
				}
			}
		}

		// Extract folder name assignments (extract both keys and values)
		if (theme.folderNames) {
			for (const [key, value] of Object.entries(theme.folderNames)) {
				if (typeof value === 'string') {
					// Store the target (key) for duplicate checking within folderNames section
					result.themeFolderTargetsInFolderNames.push(key)
					result.themeFolderTargets.push(key)

					// Strip the _ prefix from the theme assignment value
					const cleanValue = value.startsWith('_') ? value.substring(1) : value

					result.themeFolderAssignments.push(cleanValue)
				}
			}
		}

		// Extract expanded folder name assignments (extract both keys and values)
		if (theme.folderNamesExpanded) {
			for (const [key, value] of Object.entries(theme.folderNamesExpanded)) {
				if (typeof value === 'string') {
					// Store the target (key) for duplicate checking within folderNamesExpanded section
					result.themeFolderTargetsInFolderNamesExpanded.push(key)
					result.themeFolderTargets.push(key)

					// Strip the _ prefix from the theme assignment value
					const cleanValue = value.startsWith('_') ? value.substring(1) : value

					result.themeFolderAssignments.push(cleanValue)
				}
			}
		}

		// Extract language icon assignments (extract the values for validation, keys for duplicate checking)
		if (theme.languageIds) {
			for (const [key, value] of Object.entries(theme.languageIds)) {
				if (typeof value === 'string') {
					// Strip the _ prefix from the theme assignment value for validation
					const cleanValue = value.startsWith('_') ? value.substring(1) : value

					result.themeLanguageAssignments.push(cleanValue)
					// Store the language ID (key) for duplicate checking
					result.themeLanguageIds.push(key)
				}
			}
		}
	}

	/**
	 * Validate correlation between model assignments and generated theme files
	 */
	private validateModelToThemeCorrelation(result: ThemeAuditResult, theme: any): void {
		// Check for missing file assignments (model-defined file extensions/names not mapped in theme)
		if (this.fileIconsModel?.icons) {
			for (const icon of this.fileIconsModel.icons) {
				// Check if file extensions are mapped in theme
				if (icon.fileExtensions) {
					for (const ext of icon.fileExtensions) {
						if (!this.isFileExtensionMappedInTheme(ext, theme)) {
							result.missingFileAssignments.push(`${ext} (${icon.iconName})`)
						}
					}
				}
				
				// Check if file names are mapped in theme
				if (icon.fileNames) {
					for (const fileName of icon.fileNames) {
						if (!this.isFileNameMappedInTheme(fileName, theme)) {
							result.missingFileAssignments.push(`${fileName} (${icon.iconName})`)
						}
					}
				}
			}
		}

		// Check for missing folder assignments (in model but not in theme)
		for (const modelAssignment of result.modelFolderAssignments) {
			// Check if this folder name is mapped in the theme
			const isMappedInFolderNames = result.themeFolderTargetsInFolderNames.includes(modelAssignment)
			const isMappedInFolderNamesExpanded = result.themeFolderTargetsInFolderNamesExpanded.includes(modelAssignment)
			
			if (!isMappedInFolderNames || !isMappedInFolderNamesExpanded) {
				let description = modelAssignment
				
				if (!isMappedInFolderNames && !isMappedInFolderNamesExpanded) {
					description += ' (closed,open)'
				} else if (!isMappedInFolderNames) {
					description += ' (closed)'
				} else if (!isMappedInFolderNamesExpanded) {
					description += ' (open)'
				}
				
				result.missingFolderAssignments.push(description)
			}
		}

		// Check for missing language assignments (in model but not in theme)
		for (const modelAssignment of result.modelLanguageAssignments) {
			if (!result.themeLanguageAssignments.includes(modelAssignment)) {
				result.missingLanguageAssignments.push(modelAssignment)
			}
		}

		// Check for extra file assignments (in theme but not in file model)
		for (const themeTarget of result.themeFileTargets) {
			// Check only against file model assignments
			if (!result.modelFileAssignments.includes(themeTarget)) {
				result.extraFileAssignments.push(themeTarget)
			}
		}

		// Check for extra folder assignments (in theme but not in model)
		// Check folder targets from both folderNames and folderNamesExpanded sections
		const allThemeFolderTargets = new Set([
			...result.themeFolderTargetsInFolderNames,
			...result.themeFolderTargetsInFolderNamesExpanded,
		])
		
		for (const themeTarget of allThemeFolderTargets) {
			if (!result.modelFolderAssignments.includes(themeTarget)) {
				result.extraFolderAssignments.push(themeTarget)
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
	 * Validate inverse mappings - check if model-specified mappings exist in theme
	 */
	private validateInverseMappings(result: ThemeAuditResult, theme: any): void {
		// Check file extension mappings
		if (theme.fileExtensions) {
			for (const [extension, iconName] of Object.entries(theme.fileExtensions)) {
				// Check if this extension should be mapped according to the model
				const expectedIconName = this.getExpectedIconForFileExtension(extension)

				if (expectedIconName && expectedIconName !== iconName) {
					result.mismatchFileAssignments.push(`${extension}: expected ${expectedIconName}, got ${iconName}`)
				}
			}
		}

		// Check file name mappings
		if (theme.fileNames) {
			for (const [fileName, iconName] of Object.entries(theme.fileNames)) {
				// Check if this file name should be mapped according to the model
				const expectedIconName = this.getExpectedIconForFileName(fileName)

				if (expectedIconName && expectedIconName !== iconName) {
					result.mismatchFileAssignments.push(`${fileName}: expected ${expectedIconName}, got ${iconName}`)
				}
			}
		}

		// Check folder name mappings
		if (theme.folderNames) {
			for (const [folderName, iconName] of Object.entries(theme.folderNames)) {
				// Check if this folder name should be mapped according to the model
				const expectedIconName = this.getExpectedIconForFolderName(folderName)

				if (expectedIconName && expectedIconName !== iconName) {
					result.mismatchFolderAssignments.push(`${folderName}: expected ${expectedIconName}, got ${iconName}`)
				}
			}
		}

		// Check expanded folder name mappings
		if (theme.folderNamesExpanded) {
			for (const [folderName, iconName] of Object.entries(theme.folderNamesExpanded)) {
				// Check if this folder name should be mapped according to the model
				const expectedIconName = this.getExpectedIconForExpandedFolderName(folderName)

				if (expectedIconName && expectedIconName !== iconName) {
					result.mismatchFolderAssignments.push(`${folderName}: expected ${expectedIconName}, got ${iconName}`)
				}
			}
		}

		// Check language ID mappings
		if (theme.languageIds) {
			for (const [languageId, iconName] of Object.entries(theme.languageIds)) {
				// Check if this language ID should be mapped according to the model
				const expectedIconName = this.getExpectedIconForLanguageId(languageId)

				if (expectedIconName && expectedIconName !== iconName) {
					result.mismatchLanguageAssignments.push(`${languageId}: expected ${expectedIconName}, got ${iconName}`)
				}
			}
		}
	}

	/**
	 * Get expected icon name for file extension based on model
	 */
	private getExpectedIconForFileExtension(extension: string): string | null {
		if (!this.fileIconsModel?.icons)
			return null

		// Check if this extension is defined in the file icons model
		for (const icon of this.fileIconsModel.icons) {
			if (icon.fileExtensions && icon.fileExtensions.includes(extension)) {
				return `_${icon.iconName}`
			}
		}
		return null
	}

	/**
	 * Get expected icon name for file name based on model
	 */
	private getExpectedIconForFileName(fileName: string): string | null {
		if (!this.fileIconsModel?.icons)
			return null

		// Check if this file name is defined in the file icons model
		for (const icon of this.fileIconsModel.icons) {
			if (icon.fileNames && icon.fileNames.includes(fileName)) {
				return `_${icon.iconName}`
			}
		}
		return null
	}

	/**
	 * Get expected icon name for folder name based on model
	 */
	private getExpectedIconForFolderName(folderName: string): string | null {
		if (!this.folderIconsModel?.icons)
			return null

		// Check if this folder name is defined in the folder icons model
		for (const icon of this.folderIconsModel.icons) {
			if (icon.folderNames && icon.folderNames.includes(folderName)) {
				return `_folder-${icon.iconName}`
			}
		}
		return null
	}

	/**
	 * Get expected icon name for expanded folder name based on model
	 */
	private getExpectedIconForExpandedFolderName(folderName: string): string | null {
		if (!this.folderIconsModel?.icons)
			return null

		// Check if this folder name is defined in the folder icons model
		for (const icon of this.folderIconsModel.icons) {
			if (icon.folderNamesExpanded && icon.folderNamesExpanded.includes(folderName)) {
				return `_folder-${icon.iconName}`
			}
		}
		return null
	}

	/**
	 * Get expected icon name for language ID based on model
	 */
	private getExpectedIconForLanguageId(languageId: string): string | null {
		if (!this.languageIconsModel?.icons)
			return null

		// Remove the _ prefix from the theme language ID to match model format
		const cleanLanguageId = languageId.startsWith('_') ? languageId.substring(1) : languageId

		// Check if this language ID is defined in the language icons model
		for (const icon of this.languageIconsModel.icons) {
			if (icon.languageID === cleanLanguageId) {
				return `_${icon.iconName}`
			}
		}
		return null
	}

	/**
	 * Check if a file extension is mapped in the theme
	 */
	private isFileExtensionMappedInTheme(extension: string, theme: any): boolean {
		return theme.fileExtensions && theme.fileExtensions[extension] !== undefined
	}

	/**
	 * Check if a file name is mapped in the theme
	 */
	private isFileNameMappedInTheme(fileName: string, theme: any): boolean {
		return theme.fileNames && theme.fileNames[fileName] !== undefined
	}

	/**
	 * Check for duplicate assignments
	 */
	private checkDuplicateAssignments(result: ThemeAuditResult): void {
		// Check for duplicate file targets in theme
		const seenFileTargets = new Set<string>()

		for (const target of result.themeFileTargets) {
			if (seenFileTargets.has(target)) {
				result.duplicateFileAssignments.push(target)
			} else {
				seenFileTargets.add(target)
			}
		}

		// Check for duplicate folder targets in theme
		// Check duplicates within folderNames section
		const seenFolderNamesTargets = new Set<string>()

		for (const target of result.themeFolderTargetsInFolderNames) {
			if (seenFolderNamesTargets.has(target)) {
				result.duplicateFolderAssignments.push(target)
			} else {
				seenFolderNamesTargets.add(target)
			}
		}

		// Check duplicates within folderNamesExpanded section
		const seenFolderNamesExpandedTargets = new Set<string>()

		for (const target of result.themeFolderTargetsInFolderNamesExpanded) {
			if (seenFolderNamesExpandedTargets.has(target)) {
				result.duplicateFolderAssignments.push(target)
			} else {
				seenFolderNamesExpandedTargets.add(target)
			}
		}

		// Check for duplicate language IDs in theme
		const seenLanguageIds = new Set<string>()

		for (const languageId of result.themeLanguageIds) {
			if (seenLanguageIds.has(languageId)) {
				result.duplicateLanguageAssignments.push(languageId)
			} else {
				seenLanguageIds.add(languageId)
			}
		}
	}

	/**
	 * Check if theme validation is needed based on recent changes
	 */
	private async checkIfThemeValidationNeeded(): Promise<boolean> {
		try {
			const baseThemePath = path.resolve(process.cwd(), assetConstants.paths.distThemesDir, 'base.theme.json')
			const dynamiconsThemePath = path.resolve(process.cwd(), assetConstants.paths.distThemesDir, 'dynamicons.theme.json')
			
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
			const twoMinutesAgo = Date.now() - (2 * 60 * 1000)

			if (latestThemeTime > twoMinutesAgo) {
				return true // Themes were recently generated, validation needed
			}
			
			// Check if model files are newer than theme files
			const modelFiles = [
				path.resolve(process.cwd(), assetConstants.paths.modelsDir, 'file_icons.model.json'),
				path.resolve(process.cwd(), assetConstants.paths.modelsDir, 'folder_icons.model.json'),
			]
			
			for (const modelFile of modelFiles) {
				try {
					const modelStat = await fs.stat(modelFile)

					if (modelStat.mtime.getTime() > latestThemeTime) {
						return true // Model file is newer than theme files, validation needed
					}
				} catch {
					// Model file doesn't exist, validation needed
					return true
				}
			}
			
			return false // No changes detected, validation not needed
		} catch {
			// If we can't determine, assume validation is needed
			return true
		}
	}

	/**
	 * Check if file exists
	 */
	private async fileExists(filePath: string): Promise<boolean> {
		try {
			await fs.access(filePath)
			return true
		} catch {
			return false
		}
	}

	/**
	 * Calculate total number of errors in audit result
	 */
	private calculateTotalErrors(result: ThemeAuditResult): number {
		return result.missingFileAssignments.length
		  + result.missingFolderAssignments.length
		  + result.missingLanguageAssignments.length
		  + result.extraFileAssignments.length
		  + result.extraFolderAssignments.length
		  + result.extraLanguageAssignments.length
		  + result.duplicateFileAssignments.length
		  + result.duplicateFolderAssignments.length
		  + result.duplicateLanguageAssignments.length
		  + result.mismatchFileAssignments.length
		  + result.mismatchFolderAssignments.length
		  + result.mismatchLanguageAssignments.length
	}

	/**
	 * Display theme-specific errors
	 */
	private displayThemeErrors(result: ThemeAuditResult): void {
		const totalErrors = result.missingFileAssignments.length + result.missingFolderAssignments.length
		  + result.missingLanguageAssignments.length + result.duplicateFileAssignments.length
		  + result.duplicateFolderAssignments.length + result.duplicateLanguageAssignments.length
		  + result.extraFileAssignments.length + result.extraFolderAssignments.length
		  + result.extraLanguageAssignments.length + result.mismatchFileAssignments.length
		  + result.mismatchFolderAssignments.length + result.mismatchLanguageAssignments.length

		if (totalErrors > 0) {
			console.log(`\n❌ THEME ERRORS (${totalErrors})`)

			// Build theme error categories grouped by theme section
			const errorCategories = [
				{
					items: result.missingFileAssignments,
					title: 'fileExtensions: MISSING ASSIGNMENT',
					description: 'File extension/name target defined in model but not mapped in theme',
					hasItems: result.missingFileAssignments.length > 0,
				},
				{
					items: result.duplicateFileAssignments,
					title: 'fileNames: DUPLICATE ASSIGNMENT',
					description: 'File icon appears multiple times in theme',
					hasItems: result.duplicateFileAssignments.length > 0,
				},
				{
					items: result.extraFileAssignments,
					title: 'fileExtensions: EXTRA ASSIGNMENT',
					description: 'File target in theme but not defined in model',
					hasItems: result.extraFileAssignments.length > 0,
				},
				{
					items: result.missingFolderAssignments,
					title: 'folderNames: MISSING ASSIGNMENT',
					description: 'Folder target defined in model but not mapped in theme',
					hasItems: result.missingFolderAssignments.length > 0,
				},
				{
					items: result.duplicateFolderAssignments,
					title: 'folderNamesExpanded: DUPLICATE ASSIGNMENT',
					description: 'Folder icon appears multiple times in theme',
					hasItems: result.duplicateFolderAssignments.length > 0,
				},
				{
					items: result.extraFolderAssignments,
					title: 'folderNames: EXTRA ASSIGNMENT',
					description: 'Folder target in theme but not defined in model',
					hasItems: result.extraFolderAssignments.length > 0,
				},
				{
					items: result.missingLanguageAssignments,
					title: 'languageIds: MISSING ASSIGNMENT',
					description: 'Language ID defined in model but not mapped in theme',
					hasItems: result.missingLanguageAssignments.length > 0,
				},
				{
					items: result.duplicateLanguageAssignments,
					title: 'languageIds: DUPLICATE ASSIGNMENT',
					description: 'Language ID appears multiple times in theme',
					hasItems: result.duplicateLanguageAssignments.length > 0,
				},
				{
					items: result.extraLanguageAssignments,
					title: 'languageIds: EXTRA ASSIGNMENT',
					description: 'Language ID in theme but not defined in model',
					hasItems: result.extraLanguageAssignments.length > 0,
				},
				{
					items: result.mismatchFileAssignments,
					title: 'fileExtensions: MISMATCH ASSIGNMENT',
					description: 'File target in theme but maps to wrong icon',
					hasItems: result.mismatchFileAssignments.length > 0,
				},
				{
					items: result.mismatchFolderAssignments,
					title: 'folderNames: MISMATCH ASSIGNMENT',
					description: 'Folder target in theme but maps to wrong icon',
					hasItems: result.mismatchFolderAssignments.length > 0,
				},
				{
					items: result.mismatchLanguageAssignments,
					title: 'languageIds: MISMATCH ASSIGNMENT',
					description: 'Language ID in theme but maps to wrong icon',
					hasItems: result.mismatchLanguageAssignments.length > 0,
				},
			]

			// Filter out empty categories
			const nonEmptyCategories = errorCategories.filter(category =>
				category.hasItems)

			// Display tree structure
			nonEmptyCategories.forEach((category, categoryIndex) => {
				const isLastCategory = categoryIndex === nonEmptyCategories.length - 1
				const categoryPrefix = isLastCategory ? '└── ' : '├── '
				
				// Display category header with description
				console.log(`${categoryPrefix}${category.title} (${category.items.length}) - ${category.description}`)
				
				// Display items under category
				category.items.forEach((item, itemIndex) => {
					const isLastItem = itemIndex === category.items.length - 1
					const itemPrefix = isLastCategory
						? (isLastItem ? '    └── ' : '    ├── ')
						: (isLastItem ? '│   └── ' : '│   ├── ')
					
					console.log(`${itemPrefix}${item}`)
				})
			})
		}
	}

}
