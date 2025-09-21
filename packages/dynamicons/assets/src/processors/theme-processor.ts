import { promises as fs } from 'fs'
import path from 'path'
import { assetConstants } from '../_config/asset.constants.js'
import { validateModels } from '../utils/model-validator.js'
import { ErrorHandler, ErrorType, ErrorSeverity } from '../utils/error-handler.js'
import stripJsonCommentsModule from 'strip-json-comments'

// Handle both default and direct exports
const stripJsonComments = (stripJsonCommentsModule as { default?: (str: string) => string }).default || stripJsonCommentsModule

export class ThemeProcessor {

	private errorHandler: ErrorHandler
	private THEMES_DIR: string

	constructor() {
		this.errorHandler = new ErrorHandler()
		// Use absolute path for now to get theme generation working
		this.THEMES_DIR = 'D:/_dev/_Projects/_fux/_FocusedUX/packages/dynamicons/assets/dist/assets/themes'
		// Ensure themes directory exists
		this.ensureThemesDirectory()
	}

	/**
	 * Ensure themes directory exists
	 */
	private async ensureThemesDirectory(): Promise<void> {
		try {
			await fs.mkdir(this.THEMES_DIR, { recursive: true })
		} catch (_error) {
			// Directory might already exist, ignore error
		}
	}

	/**
	 * Generate Themes - Complete workflow for theme generation and verification
	 */
	async process(verbose: boolean = false, _demo: boolean = false): Promise<boolean> {
		try {
			// Step 1: Validate models and fail fast if any errors found
			const modelsValid = await validateModels(false)

			if (!modelsValid) {
				const modelValidationError = this.errorHandler.createError(
					'Model validation failed',
					ErrorType.MODEL_VALIDATION_FAILED,
					ErrorSeverity.HIGH,
					'ThemeProcessor.process',
					undefined,
					false,
				)

				await this.errorHandler.handleError(modelValidationError, verbose)
				return false
			}

			// Step 2: Check if theme generation is needed
			const needsGeneration = await this.checkIfThemeGenerationNeeded()

			if (!needsGeneration) {
				if (verbose) {
					console.log('✨ No model changes detected - theme files are up to date!')
				} else {
					console.log('✨ No model changes detected - theme files are up to date!')
				}
				return true
			}

			// Step 3: Delete existing generated themes and verify
			const deleteResult = await this.deleteExistingThemes()
			
			if (!deleteResult.success) {
				const deleteError = this.errorHandler.createError(
					'Failed to delete existing theme files',
					ErrorType.FILE_NOT_FOUND,
					ErrorSeverity.HIGH,
					'deleteExistingThemes',
					undefined,
					false,
				)

				await this.errorHandler.handleError(deleteError, verbose)
				return false
			}
			
			// Step 4: Generate new themes and verify
			try {
				await this.generateAndVerifyThemes()
				
				// Both operations succeeded - show consolidated success message only
				console.log('\x1B[32mSuccess: Models audited, theme files removed(verified) and regenerated(verified):\x1B[0m')
				console.log(`\x1B[90m  - ${path.relative(process.cwd(), path.join(this.THEMES_DIR, 'base.theme.json'))}\x1B[0m`)
				console.log(`\x1B[90m  - ${path.relative(process.cwd(), path.join(this.THEMES_DIR, 'dynamicons.theme.json'))}\x1B[0m`)
				return true
			} catch (error) {
				// Generation failed - show deletion success + generation failure
				console.log('\x1B[32mSuccess: Existing theme files deleted and verified.\x1B[0m')
				console.log('')
				
				const generationError = this.errorHandler.createError(
					'Generating theme files',
					ErrorType.THEME_GENERATION_FAILED,
					ErrorSeverity.HIGH,
					'generateAndVerifyThemes',
					error instanceof Error ? error : undefined,
					true,
				)

				await this.errorHandler.handleError(generationError, verbose)
				return false
			}
		} catch (error) {
			const themeError = this.errorHandler.createError(
				'Theme generation failed',
				ErrorType.THEME_GENERATION_FAILED,
				ErrorSeverity.HIGH,
				'ThemeProcessor.process',
				error instanceof Error ? error : undefined,
				true,
			)

			await this.errorHandler.handleError(themeError, verbose)
			return false
		}
	}

	/**
	 * Delete existing generated theme files
	 */
	private async deleteExistingThemes(): Promise<{ success: boolean, deletedCount: number }> {
		try {
			// Ensure themes directory exists
			try {
				await fs.access(this.THEMES_DIR)
			} catch {
				// Directory doesn't exist, nothing to delete; consider this success
				return { success: true, deletedCount: 0 }
			}

			const themeFiles = await fs.readdir(this.THEMES_DIR)
			const generatedThemes = themeFiles.filter(
				file => file.endsWith('.theme.json') && !file.includes('focused-ux-colors'),
			)

			let deletedCount = 0

			for (const themeFile of generatedThemes) {
				const themePath = path.join(this.THEMES_DIR, themeFile)

				try {
					await fs.unlink(themePath)
					deletedCount++
				} catch (_err) {
					// Continue attempting to delete others
				}
			}

			// Verify deletion
			const remaining = (await fs.readdir(this.THEMES_DIR)).filter(
				file => file.endsWith('.theme.json') && !file.includes('focused-ux-colors'),
			)

			if (remaining.length === 0) {
				return { success: true, deletedCount }
			}

			console.log('\x1B[31mFailed: Existing theme files not removed.\x1B[0m')
			return { success: false, deletedCount: 0 }
		} catch (_error) {
			console.log('\x1B[31mFailed: Existing theme files not removed.\x1B[0m')
			return { success: false, deletedCount: 0 }
		}
	}

	/**
	 * Generate themes and verify existence
	 */
	private async generateAndVerifyThemes(): Promise<void> {
		try {
			// Generate theme files
			const success = await this.generateThemeFiles()

			if (!success) {
				throw new Error('Theme generation failed')
			}

			// Verify the two expected files exist
			const baseTheme = path.join(this.THEMES_DIR, 'base.theme.json')
			const dynTheme = path.join(this.THEMES_DIR, 'dynamicons.theme.json')

			const baseExists = await this.fileExists(baseTheme)
			const dynExists = await this.fileExists(dynTheme)

			if (!baseExists || !dynExists) {
				throw new Error('Generated theme files missing after generation')
			}
		} catch (error) {
			console.error('Error: Generating theme files')
			console.error(`Type: ${error instanceof Error ? error.constructor.name : 'Unknown'}`)
			console.error(`Description: ${error instanceof Error ? error.message : String(error)}`)
			throw error
		}
	}

	/**
	 * Generate theme files from models and icons
	 */
	private async generateThemeFiles(): Promise<boolean> {
		try {
			// Ensure themes directory exists
			await this.ensureThemesDirectory()
			
			// Read model files
			const fileIconsModelPath = 'D:/_dev/_Projects/_fux/_FocusedUX/packages/dynamicons/assets/src/models/file_icons.model.json'
			const folderIconsModelPath = 'D:/_dev/_Projects/_fux/_FocusedUX/packages/dynamicons/assets/src/models/folder_icons.model.json'
			const languageIconsModelPath = 'D:/_dev/_Projects/_fux/_FocusedUX/packages/dynamicons/assets/src/models/language_icons.model.json'
			
			const fileIconsModel = JSON.parse(stripJsonComments(await fs.readFile(fileIconsModelPath, 'utf-8')))
			const folderIconsModel = JSON.parse(stripJsonComments(await fs.readFile(folderIconsModelPath, 'utf-8')))
			const languageIconsModel = JSON.parse(stripJsonComments(await fs.readFile(languageIconsModelPath, 'utf-8')))
			
			// Build theme manifest
			const themeManifest: {
				iconDefinitions: Record<string, { iconPath: string }>
				folderNames: Record<string, string>
				folderNamesExpanded: Record<string, string>
				fileExtensions: Record<string, string>
				fileNames: Record<string, string>
				file: string
				folder: string
				folderExpanded: string
				rootFolder: string
				rootFolderExpanded: string
				languageIds: Record<string, string>
				hidesExplorerArrows: boolean
			} = {
				iconDefinitions: {},
				folderNames: {},
				folderNamesExpanded: {},
				fileExtensions: {},
				fileNames: {},
				file: fileIconsModel.file.iconName,
				folder: folderIconsModel.folder.iconName,
				folderExpanded: folderIconsModel.folder.iconName,
				rootFolder: folderIconsModel.rootFolder.iconName,
				rootFolderExpanded: folderIconsModel.rootFolder.iconName,
				languageIds: {},
				hidesExplorerArrows: false,
			}
			
			// Add file icon definitions and assignments
			fileIconsModel.icons.forEach((icon: { iconName: string, fileExtensions?: string[], fileNames?: string[] }) => {
				if (icon.iconName) {
					const iconName = `_${icon.iconName}`

					themeManifest.iconDefinitions[iconName] = {
						iconPath: `../assets/icons/file_icons/${icon.iconName}.svg`,
					}
					
					if (icon.fileExtensions) {
						icon.fileExtensions.forEach((ext: string) => {
							themeManifest.fileExtensions[ext] = iconName
						})
					}
					
					if (icon.fileNames) {
						icon.fileNames.forEach((fileName: string) => {
							themeManifest.fileNames[fileName] = iconName
						})
					}
				}
			})
			
			// Add folder icon definitions and assignments
			folderIconsModel.icons.forEach((icon: { iconName: string, folderNames?: string[] }) => {
				if (icon.iconName) {
					const baseIconName = `_folder-${icon.iconName}`
					const openIconName = `_folder-${icon.iconName}-open`

					// Add base folder icon definition
					themeManifest.iconDefinitions[baseIconName] = {
						iconPath: `../assets/icons/folder_icons/folder-${icon.iconName}.svg`,
					}
					
					// Add open folder icon definition
					themeManifest.iconDefinitions[openIconName] = {
						iconPath: `../assets/icons/folder_icons/folder-${icon.iconName}-open.svg`,
					}
					
					if (icon.folderNames) {
						icon.folderNames.forEach((folderName: string) => {
							themeManifest.folderNames[folderName] = baseIconName
							themeManifest.folderNamesExpanded[folderName] = openIconName
						})
					}
				}
			})
			
			// Add language icon definitions and assignments
			languageIconsModel.icons.forEach((icon: { iconName: string, languageID: string }) => {
				if (icon.iconName && icon.languageID) {
					const iconName = `_${icon.iconName.replace('.svg', '')}`

					themeManifest.iconDefinitions[iconName] = {
						iconPath: `../assets/icons/language_icons/${icon.iconName}`,
					}
					themeManifest.languageIds[icon.languageID] = iconName
				}
			})
			
			// Write theme files
			const baseThemePath = path.join(this.THEMES_DIR, 'base.theme.json')
			const dynamiconsThemePath = path.join(this.THEMES_DIR, 'dynamicons.theme.json')
			
			await fs.writeFile(baseThemePath, JSON.stringify(themeManifest, null, 2))
			await fs.writeFile(dynamiconsThemePath, JSON.stringify(themeManifest, null, 2))
			
			return true
		} catch (error) {
			console.error('Theme generation failed:', error)
			return false
		}
	}

	/**
	 * Check if theme generation is needed by comparing model file timestamps with theme file timestamps
	 */
	private async checkIfThemeGenerationNeeded(): Promise<boolean> {
		try {
			const baseThemePath = path.join(this.THEMES_DIR, 'base.theme.json')
			const dynThemePath = path.join(this.THEMES_DIR, 'dynamicons.theme.json')
			
			// If theme files don't exist, generation is needed
			const baseThemeExists = await this.fileExists(baseThemePath)
			const dynThemeExists = await this.fileExists(dynThemePath)
			
			if (!baseThemeExists || !dynThemeExists) {
				return true
			}
			
			// Get theme file timestamps
			const baseThemeStats = await fs.stat(baseThemePath)
			const dynThemeStats = await fs.stat(dynThemePath)
			const latestThemeTime = Math.max(baseThemeStats.mtime.getTime(), dynThemeStats.mtime.getTime())
			
			// Check model files for changes
			const modelFiles = [
				'D:/_dev/_Projects/_fux/_FocusedUX/packages/dynamicons/assets/src/models/file_icons.model.json',
				'D:/_dev/_Projects/_fux/_FocusedUX/packages/dynamicons/assets/src/models/folder_icons.model.json',
				'D:/_dev/_Projects/_fux/_FocusedUX/packages/dynamicons/assets/src/models/language_icons.model.json',
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

	private async fileExists(p: string): Promise<boolean> {
		try {
			await fs.access(p)
			return true
		} catch {
			return false
		}
	}

}
