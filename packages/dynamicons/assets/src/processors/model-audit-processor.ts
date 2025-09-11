import { promises as fs } from 'fs'
import path from 'path'
import { assetConstants } from '../_config/asset.constants.js'
import { ErrorHandler, ErrorType, ErrorSeverity } from '../utils/error-handler.js'
import { TreeFormatter } from '../utils/tree-formatter.js'
import stripJsonCommentsModule from 'strip-json-comments'

// Handle both default and direct exports
const stripJsonComments = (stripJsonCommentsModule as { default?: (str: string) => string }).default || stripJsonCommentsModule

/**
 * Model audit result interface
 */
export interface ModelAuditResult {
	orphanedFileIcons: string[]
	orphanedFolderIcons: string[]
	orphanedLanguageIcons: string[]
	duplicateFileIcons: string[]
	duplicateFolderIcons: string[]
	duplicateLanguageIcons: string[]
	duplicateFileAssignments: string[]
	duplicateFolderAssignments: string[]
	orphanedFileAssignments: string[]
	orphanedFolderAssignments: string[]
	orphanedLanguageAssignments: string[]
	invalidLanguageIds: string[]
}

/**
 * Model Audit Processor - Validates model files and asset directories for consistency
 */
export class ModelAuditProcessor {
	private errorHandler: ErrorHandler

	constructor() {
		this.errorHandler = new ErrorHandler()
	}

	/**
	 * Main audit function - inspects models and asset folders to find model-related problems
	 */
	async process(verbose: boolean = false, demo: boolean = false): Promise<boolean> {
		try {
			if (verbose) {
				console.log('🔍 [MODEL AUDIT PROCESSOR]')
				console.log('═'.repeat(60))
			}

			// Perform comprehensive model audit or create demo data
			let auditResult: ModelAuditResult
			
			if (demo) {
				auditResult = {
					orphanedFileIcons: ['orphaned-file1', 'orphaned-file2'],
					orphanedFolderIcons: ['orphaned-folder1', 'orphaned-folder2'],
					orphanedLanguageIcons: ['orphaned-lang1', 'orphaned-lang2'],
					duplicateFileIcons: ['duplicate-file1', 'duplicate-file2'],
					duplicateFolderIcons: ['duplicate-folder1', 'duplicate-folder2'],
					duplicateLanguageIcons: ['duplicate-lang1', 'duplicate-lang2'],
					duplicateFileAssignments: [],
					duplicateFolderAssignments: [],
					orphanedFileAssignments: ['missing-file1', 'missing-file2'],
					orphanedFolderAssignments: ['missing-folder1', 'missing-folder2'],
					orphanedLanguageAssignments: ['missing-lang1', 'missing-lang2'],
					invalidLanguageIds: ['invalid-id1', 'invalid-id2'],
				}
			} else {
				auditResult = await this.auditModels()
			}
			
			// Check if there are any errors
			const totalErrors = this.calculateTotalErrors(auditResult)
		

		if (totalErrors > 0) {
				// Display errors using tree formatter
				TreeFormatter.displayStructuredErrors(
					[], // themeErrors (not used for model audit)
					auditResult.orphanedFileIcons,
					auditResult.orphanedFolderIcons,
					auditResult.orphanedLanguageIcons,
					auditResult.duplicateFileIcons,
					auditResult.duplicateFolderIcons,
					auditResult.duplicateLanguageIcons,
					auditResult.duplicateFileAssignments,
					auditResult.duplicateFolderAssignments,
					auditResult.orphanedFileAssignments,
					auditResult.orphanedFolderAssignments,
					auditResult.orphanedLanguageAssignments,
					auditResult.invalidLanguageIds,
					'MODEL ERRORS',
					{
						assignedIconNotFound: 'MODEL: ASSIGNED ICON NOT FOUND',
						duplicateAssignment: 'MODEL: DUPLICATE ASSIGNMENT',
						unassignedIcon: 'UNUSED FILE ICONS',
						duplicateAssignmentId: 'MODEL: DUPLICATE ASSIGNMENT ID',
					},
				)
				
				console.log('')
				
				// Create error for tracking
				const auditError = this.errorHandler.createError(
					`Model validation failed with ${totalErrors} errors`,
					ErrorType.MODEL_VALIDATION_FAILED,
					ErrorSeverity.HIGH,
					'ModelAuditProcessor.process',
					undefined,
					false,
				)
				
				await this.errorHandler.handleError(auditError, verbose)
				return false
			}

			if (verbose) {
				console.log('✅ Model validation passed - no errors found.')
			}
			
			return true
		} catch (error) {
			const auditError = this.errorHandler.createError(
				'Model audit failed',
				ErrorType.MODEL_VALIDATION_FAILED,
				ErrorSeverity.HIGH,
				'ModelAuditProcessor.process',
				error instanceof Error ? error : undefined,
				true,
			)

			await this.errorHandler.handleError(auditError, verbose)
			return false
		}
	}

	/**
	 * Comprehensive model audit function
	 */
	private async auditModels(): Promise<ModelAuditResult> {
		const fileIconsModelPath = path.resolve(process.cwd(), assetConstants.paths.modelsDir, 'file_icons.model.json')
		const folderIconsModelPath = path.resolve(process.cwd(), assetConstants.paths.modelsDir, 'folder_icons.model.json')
		const languageIconsModelPath = path.resolve(process.cwd(), assetConstants.paths.modelsDir, 'language_icons.model.json')

		const result: ModelAuditResult = {
			orphanedFileIcons: [],
			orphanedFolderIcons: [],
			orphanedLanguageIcons: [],
			duplicateFileIcons: [],
			duplicateFolderIcons: [],
			duplicateLanguageIcons: [],
			duplicateFileAssignments: [],
			duplicateFolderAssignments: [],
			orphanedFileAssignments: [],
			orphanedFolderAssignments: [],
			orphanedLanguageAssignments: [],
			invalidLanguageIds: [],
		}

		try {
			// Read and parse model files
			const [fileIconsModel, folderIconsModel, languageIconsModel] = await Promise.all([
				this.loadModelFile(fileIconsModelPath),
				this.loadModelFile(folderIconsModelPath),
				this.loadModelFile(languageIconsModelPath),
			])

			// Load asset directories
			const [fileIconsDir, folderIconsDir, languageIconsDir] = await Promise.all([
				this.loadAssetDirectory(assetConstants.paths.fileIconsDir),
				this.loadAssetDirectory(assetConstants.paths.folderIconsDir),
				this.loadAssetDirectory(assetConstants.paths.languageIconsDir),
			])

			// Perform audit checks
			await this.auditOrphanedIcons(result, fileIconsModel, folderIconsModel, languageIconsModel, fileIconsDir, folderIconsDir, languageIconsDir)
			await this.auditOrphanedAssignments(result, fileIconsModel, folderIconsModel, languageIconsModel, fileIconsDir, folderIconsDir, languageIconsDir)
			await this.auditDuplicateAssignments(result, fileIconsModel, folderIconsModel, languageIconsModel)

		} catch (error) {
			// If we can't read models or assets, return empty result
			console.warn('⚠️ Could not complete model audit:', error instanceof Error ? error.message : String(error))
		}

		return result
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
	 * Load asset directory contents
	 */
	private async loadAssetDirectory(dirPath: string): Promise<string[]> {
		try {
			const files = await fs.readdir(dirPath)
			return files.filter(f => f.endsWith('.svg'))
		} catch {
			return []
		}
	}

	/**
	 * Audit for orphaned icons (files in directories but not referenced in models)
	 */
	private async auditOrphanedIcons(
		result: ModelAuditResult,
		fileIconsModel: any,
		folderIconsModel: any,
		languageIconsModel: any,
		fileIconsDir: string[],
		folderIconsDir: string[],
		languageIconsDir: string[],
	): Promise<void> {
		// Build model icon name sets
		const modelFileIconNames = this.buildModelIconSet(fileIconsModel, 'iconName')
		const modelFolderIconNames = this.buildModelIconSet(folderIconsModel, 'iconName')
		const modelLanguageIconNames = this.buildModelIconSet(languageIconsModel, 'languageID')

		// Check for orphaned file icons
		for (const file of fileIconsDir) {
			const iconName = path.basename(file, '.svg')
			if (!iconName.endsWith('-alt') || iconName === 'pycache-alt') {
				if (!modelFileIconNames.has(iconName)) {
					result.orphanedFileIcons.push(iconName)
				}
			}
		}

		// Check for orphaned folder icons
		for (const file of folderIconsDir) {
			const iconName = path.basename(file, '.svg')
			if (!iconName.endsWith('-open') && !iconName.endsWith('-alt')) {
				const baseName = iconName.startsWith('folder-') ? iconName.substring(7) : iconName
				if (!modelFolderIconNames.has(baseName)) {
					result.orphanedFolderIcons.push(baseName)
				}
			}
		}

		// Language icons are just file icons with different purpose - no separate directory check needed
	}

	/**
	 * Audit for orphaned assignments (referenced in models but files don't exist)
	 */
	private async auditOrphanedAssignments(
		result: ModelAuditResult,
		fileIconsModel: any,
		folderIconsModel: any,
		languageIconsModel: any,
		fileIconsDir: string[],
		folderIconsDir: string[],
		languageIconsDir: string[],
	): Promise<void> {
		// Build available asset sets
		const availableFileIconNames = new Set(fileIconsDir.map(f => path.basename(f, '.svg')))
		const availableFolderIconNames = new Set(folderIconsDir.map(f => path.basename(f, '.svg')))
		const availableLanguageIconNames = new Set(languageIconsDir.map(f => path.basename(f, '.svg')))
		
		// Check file icon assignments
		for (const icon of fileIconsModel.icons || []) {
			if (icon.iconName && !availableFileIconNames.has(icon.iconName)) {
				result.orphanedFileAssignments.push(icon.iconName)
			}
		}

		// Check folder icon assignments
		for (const icon of folderIconsModel.icons || []) {
			if (icon.iconName) {
				const baseIconName = `folder-${icon.iconName}`
				const openIconName = `folder-${icon.iconName}-open`
				
				const baseIconExists = availableFolderIconNames.has(baseIconName)
				const openIconExists = availableFolderIconNames.has(openIconName)
				
				if (!baseIconExists || !openIconExists) {
					let description = `${icon.iconName}.svg`
					
					if (!baseIconExists && !openIconExists) {
						description += ' (closed,open)'
					} else if (!baseIconExists) {
						description += ' (closed)'
					} else if (!openIconExists) {
						description += ' (open)'
					}
					
					result.orphanedFolderAssignments.push(description)
				}
			}
		}

		// Check language assignments
		for (const icon of languageIconsModel.icons || []) {
			if (icon.iconName) {
				const iconName = icon.iconName.replace('.svg', '')
				if (!availableLanguageIconNames.has(iconName)) {
					result.orphanedLanguageAssignments.push(icon.iconName)
				}
			}
		}
	}

	/**
	 * Audit for duplicate assignments in models
	 */
	private async auditDuplicateAssignments(
		result: ModelAuditResult,
		fileIconsModel: any,
		folderIconsModel: any,
		languageIconsModel: any,
	): Promise<void> {
		// Check for duplicate file icon names
		const seenFileIconNames = new Set<string>()
		for (const icon of fileIconsModel.icons || []) {
			if (icon.iconName) {
				if (seenFileIconNames.has(icon.iconName)) {
					result.duplicateFileIcons.push(icon.iconName)
				} else {
					seenFileIconNames.add(icon.iconName)
				}
			}
		}

		// Check for duplicate folder icon names
		const seenFolderIconNames = new Set<string>()
		for (const icon of folderIconsModel.icons || []) {
			if (icon.iconName) {
				if (seenFolderIconNames.has(icon.iconName)) {
					result.duplicateFolderIcons.push(icon.iconName)
				} else {
					seenFolderIconNames.add(icon.iconName)
				}
			}
		}

		// Check for duplicate language icon IDs
		const seenLanguageIconIds = new Set<string>()
		for (const icon of languageIconsModel.icons || []) {
			if (icon.languageID) {
				if (seenLanguageIconIds.has(icon.languageID)) {
					result.duplicateLanguageIcons.push(icon.languageID)
				} else {
					seenLanguageIconIds.add(icon.languageID)
				}
			}
		}

		// Check for duplicate folder name assignments
		const folderNameToIcons = new Map<string, string[]>()
		for (const icon of folderIconsModel.icons || []) {
			if (icon.folderNames && Array.isArray(icon.folderNames)) {
				for (const folderName of icon.folderNames) {
					if (!folderNameToIcons.has(folderName)) {
						folderNameToIcons.set(folderName, [])
					}
					folderNameToIcons.get(folderName)!.push(icon.iconName)
				}
			}
		}
		
		// Add duplicates to result
		for (const [folderName, iconNames] of folderNameToIcons) {
			if (iconNames.length > 1) {
				result.duplicateFolderAssignments.push(`${folderName} (${iconNames.join(', ')})`)
			}
		}

		// Check for duplicate file name assignments
		const fileNameToIcons = new Map<string, string[]>()
		for (const icon of fileIconsModel.icons || []) {
			if (icon.fileNames && Array.isArray(icon.fileNames)) {
				for (const fileName of icon.fileNames) {
					if (!fileNameToIcons.has(fileName)) {
						fileNameToIcons.set(fileName, [])
					}
					fileNameToIcons.get(fileName)!.push(icon.iconName)
				}
			}
		}
		
		// Add duplicates to result
		for (const [fileName, iconNames] of fileNameToIcons) {
			if (iconNames.length > 1) {
				result.duplicateFileAssignments.push(`${fileName} (${iconNames.join(', ')})`)
			}
		}

		// Check for duplicate file extension assignments
		const fileExtensionToIcons = new Map<string, string[]>()
		for (const icon of fileIconsModel.icons || []) {
			if (icon.fileExtensions && Array.isArray(icon.fileExtensions)) {
				for (const fileExtension of icon.fileExtensions) {
					if (!fileExtensionToIcons.has(fileExtension)) {
						fileExtensionToIcons.set(fileExtension, [])
					}
					fileExtensionToIcons.get(fileExtension)!.push(icon.iconName)
				}
			}
		}
		
		// Add duplicates to result
		for (const [fileExtension, iconNames] of fileExtensionToIcons) {
			if (iconNames.length > 1) {
				result.duplicateFileAssignments.push(`${fileExtension} (${iconNames.join(', ')})`)
			}
		}
	}

	/**
	 * Build a set of icon names from model data
	 */
	private buildModelIconSet(model: any, keyField: string): Set<string> {
		const iconSet = new Set<string>()

		// Add icons from main icons array
		if (model.icons && Array.isArray(model.icons)) {
			model.icons.forEach((icon: any) => {
				if (icon[keyField]) {
					iconSet.add(icon[keyField])
				}
			})
		}

		// Add default icons
		if (model.file?.iconName) {
			iconSet.add(model.file.iconName)
		}
		if (model.folder?.iconName) {
			iconSet.add(model.folder.iconName)
		}
		if (model.rootFolder?.iconName) {
			iconSet.add(model.rootFolder.iconName)
		}

		// Add orphans and unassigned
		if (model.orphans) {
			model.orphans.forEach((orphan: string) => iconSet.add(orphan))
		}
		if (model.unassigned) {
			model.unassigned.forEach((unassigned: string) => iconSet.add(unassigned))
		}

		return iconSet
	}

	/**
	 * Check if model validation is needed based on recent changes
	 */
	private async checkIfModelValidationNeeded(): Promise<boolean> {
		try {
			const modelFiles = [
				path.resolve(process.cwd(), assetConstants.paths.modelsDir, 'file_icons.model.json'),
				path.resolve(process.cwd(), assetConstants.paths.modelsDir, 'folder_icons.model.json'),
				path.resolve(process.cwd(), assetConstants.paths.modelsDir, 'language_icons.model.json'),
			]
			
			const iconDirs = [
				path.resolve(process.cwd(), assetConstants.paths.fileIconsDir),
				path.resolve(process.cwd(), assetConstants.paths.folderIconsDir),
				path.resolve(process.cwd(), assetConstants.paths.languageIconsDir),
			]
			
			// Check if any model files have been modified recently (within last 2 minutes)
			const twoMinutesAgo = Date.now() - (2 * 60 * 1000)
			
			// First check if any model files were modified recently
			let modelFilesModified = false

			for (const modelFile of modelFiles) {
				try {
					const modelStats = await fs.stat(modelFile)

					if (modelStats.mtime.getTime() > twoMinutesAgo) {
						modelFilesModified = true
						break
					}
				} catch {
					return true // Model file doesn't exist, assume validation needed
				}
			}
			
			// If no model files were modified recently, no validation needed
			if (!modelFilesModified) {
				return false
			}
			
			// Check if any icon files have been modified recently
			for (const iconDir of iconDirs) {
				try {
					const iconFiles = await fs.readdir(iconDir)

					for (const iconFile of iconFiles) {
						if (iconFile.endsWith('.svg')) {
							const iconPath = path.join(iconDir, iconFile)
							const iconStats = await fs.stat(iconPath)

							if (iconStats.mtime.getTime() > twoMinutesAgo) {
								return true // Icon file was recently modified
							}
						}
					}
				} catch {
					// Icon directory doesn't exist, continue
				}
			}
			
			return false // No recent changes detected
		} catch {
			return true // If we can't determine, assume validation is needed
		}
	}

	/**
	 * Calculate total number of errors in audit result
	 */
	private calculateTotalErrors(result: ModelAuditResult): number {
		return result.orphanedFileIcons.length
			+ result.orphanedFolderIcons.length
			+ result.orphanedLanguageIcons.length
			+ result.duplicateFileIcons.length
			+ result.duplicateFolderIcons.length
			+ result.duplicateLanguageIcons.length
			+ result.duplicateFileAssignments.length
			+ result.duplicateFolderAssignments.length
			+ result.orphanedFileAssignments.length
			+ result.orphanedFolderAssignments.length
			+ result.orphanedLanguageAssignments.length
			+ result.invalidLanguageIds.length
	}
}
