import { readFileSync, existsSync, readdirSync } from 'fs'
import { join, basename, dirname } from 'path'
import type { AssetManifest } from './asset-manifest'

export interface ValidationResult {
	valid: boolean
	errors: ValidationError[]
	warnings: ValidationWarning[]
	summary: {
		totalAssets: number
		validAssets: number
		invalidAssets: number
		orphanedAssets: number
		duplicateNames: number
		missingReferences: number
	}
	// Add concise summary for non-verbose mode
	conciseSummary?: {
		errorCounts: Record<string, number>
		warningCounts: Record<string, number>
		errorExamples: Record<string, string[]>
		warningExamples: Record<string, string[]>
	}
}

export interface ValidationError {
	type: 'error'
	code: string
	message: string
	assetPath?: string
	context?: Record<string, any>
}

export interface ValidationWarning {
	type: 'warning'
	code: string
	message: string
	assetPath?: string
	context?: Record<string, any>
}

export interface IconModel {
	icons: Array<{
		name: string
		fileExtensions?: string[]
		fileNames?: string[]
		folderNames?: string[]
	}>
	orphans?: string[]
}

export interface ThemeManifest {
	iconDefinitions: Record<string, { iconPath: string }>
	folderNames?: Record<string, string>
	folderNamesExpanded?: Record<string, string>
	fileExtensions?: Record<string, string>
	fileNames?: Record<string, string>
	file?: string
	folder?: string
	folderExpanded?: string
	rootFolder?: string
	rootFolderExpanded?: string
	languageIds?: Record<string, string>
	hidesExplorerArrows?: boolean
	highContrast?: { fileExtensions?: Record<string, string>, fileNames?: Record<string, string> }
}

export class AssetValidator {

	private readonly assetsDir: string
	private readonly modelsDir: string
	private readonly themesDir: string
	private readonly manifest: AssetManifest

	constructor(
		assetsDir: string = 'assets',
		modelsDir: string = 'src/models',
		themesDir: string = 'assets/themes',
		manifest: AssetManifest,
	) {
		this.assetsDir = assetsDir
		this.modelsDir = modelsDir
		this.themesDir = themesDir
		this.manifest = manifest
	}

	/**
	 * Perform comprehensive asset validation
	 */
	async validateAssets(verbose: boolean = false): Promise<ValidationResult> {
		const errors: ValidationError[] = []
		const warnings: ValidationWarning[] = []

		// Load model files
		const fileIconsModel = await this.loadIconModel('file_icons.model.json')
		const folderIconsModel = await this.loadIconModel('folder_icons.model.json')

		if (!fileIconsModel || !folderIconsModel) {
			errors.push({
				type: 'error',
				code: 'MODEL_LOAD_FAILED',
				message: 'Failed to load icon model files',
				context: { modelsDir: this.modelsDir },
			})
			return this.createValidationResult(errors, warnings, verbose)
		}

		// Perform validation checks
		const validationChecks = [
			() =>
				this.validateAssetIntegrity(),
			() =>
				this.validateIconModels(fileIconsModel, folderIconsModel),
			() =>
				this.detectOrphanedAssets(fileIconsModel, folderIconsModel),
			() =>
				this.detectDuplicateNames(fileIconsModel, folderIconsModel),
			() =>
				this.validateThemeStructure(),
			() =>
				this.validateIconReferences(),
			() =>
				this.validatePathResolution(),
		]

		for (const check of validationChecks) {
			try {
				const result = await check()

				errors.push(...result.errors)
				warnings.push(...result.warnings)
			} catch (error) {
				errors.push({
					type: 'error',
					code: 'VALIDATION_CHECK_FAILED',
					message: `Validation check failed: ${error}`,
					context: { check: check.name },
				})
			}
		}

		return this.createValidationResult(errors, warnings, verbose)
	}

	/**
	 * Validate basic asset integrity
	 */
	private async validateAssetIntegrity(): Promise<{ errors: ValidationError[], warnings: ValidationWarning[] }> {
		const errors: ValidationError[] = []
		const warnings: ValidationWarning[] = []

		for (const asset of this.manifest.assets) {
			const fullPath = join(this.assetsDir, asset.path)

			// Check if asset file exists
			if (!existsSync(fullPath)) {
				errors.push({
					type: 'error',
					code: 'ASSET_NOT_FOUND',
					message: `Asset file not found: ${asset.path}`,
					assetPath: asset.path,
				})
				continue
			}

			// Check file size
			if (asset.size === 0) {
				warnings.push({
					type: 'warning',
					code: 'EMPTY_ASSET',
					message: `Asset file is empty: ${asset.path}`,
					assetPath: asset.path,
				})
			}

			// Validate SVG files
			if (asset.path.endsWith('.svg')) {
				const svgValidation = this.validateSvgFile(fullPath)

				if (!svgValidation.valid) {
					errors.push({
						type: 'error',
						code: 'INVALID_SVG',
						message: `Invalid SVG file: ${asset.path}`,
						assetPath: asset.path,
						context: { svgErrors: svgValidation.errors },
					})
				}
			}

			// Validate theme files
			if (asset.path.endsWith('.theme.json')) {
				const themeValidation = this.validateThemeFile(fullPath)

				if (!themeValidation.valid) {
					errors.push({
						type: 'error',
						code: 'INVALID_THEME',
						message: `Invalid theme file: ${asset.path}`,
						assetPath: asset.path,
						context: { themeErrors: themeValidation.errors },
					})
				}
			}
		}

		return { errors, warnings }
	}

	/**
	 * Validate icon model files
	 */
	private async validateIconModels(
		fileIconsModel: IconModel,
		folderIconsModel: IconModel,
	): Promise<{ errors: ValidationError[], warnings: ValidationWarning[] }> {
		const errors: ValidationError[] = []
		const warnings: ValidationWarning[] = []

		// Validate file icons model
		for (const icon of fileIconsModel.icons) {
			if (!icon.name) {
				errors.push({
					type: 'error',
					code: 'MISSING_ICON_NAME',
					message: 'Icon entry missing name property',
					context: { icon },
				})
				continue
			}

			// Check if icon has at least one association
			if ((!icon.fileExtensions || icon.fileExtensions.length === 0)
			  && (!icon.fileNames || icon.fileNames.length === 0)) {
				warnings.push({
					type: 'warning',
					code: 'UNASSOCIATED_ICON',
					message: `Icon '${icon.name}' has no file associations`,
					context: { icon },
				})
			}

			// Validate file extensions format
			if (icon.fileExtensions) {
				for (const ext of icon.fileExtensions) {
					if (!ext.startsWith('.') && ext !== '') {
						warnings.push({
							type: 'warning',
							code: 'INVALID_EXTENSION_FORMAT',
							message: `File extension should start with '.' for icon '${icon.name}': ${ext}`,
							context: { icon, extension: ext },
						})
					}
				}
			}
		}

		// Validate folder icons model
		for (const icon of folderIconsModel.icons) {
			if (!icon.name) {
				errors.push({
					type: 'error',
					code: 'MISSING_ICON_NAME',
					message: 'Folder icon entry missing name property',
					context: { icon },
				})
				continue
			}

			// Check if icon has folder name associations
			if (!icon.folderNames || icon.folderNames.length === 0) {
				warnings.push({
					type: 'warning',
					code: 'UNASSOCIATED_FOLDER_ICON',
					message: `Folder icon '${icon.name}' has no folder associations`,
					context: { icon },
				})
			}
		}

		return { errors, warnings }
	}

	/**
	 * Detect orphaned assets (assets not referenced in models)
	 */
	private async detectOrphanedAssets(
		fileIconsModel: IconModel,
		folderIconsModel: IconModel,
	): Promise<{ errors: ValidationError[], warnings: ValidationWarning[] }> {
		const errors: ValidationError[] = []
		const warnings: ValidationWarning[] = []

		// Collect all known icon names from models
		const knownIconNames = new Set<string>()
		const knownOrphanNames = new Set<string>()

		// Add file icon names
		fileIconsModel.icons.forEach((icon) => {
			if (icon.name)
				knownIconNames.add(icon.name)
		})

		// Add folder icon names
		folderIconsModel.icons.forEach((icon) => {
			if (icon.name)
				knownIconNames.add(icon.name)
		})

		// Add known orphans
		;(fileIconsModel.orphans || []).forEach(orphan =>
			knownOrphanNames.add(orphan))
		;(folderIconsModel.orphans || []).forEach(orphan =>
			knownOrphanNames.add(orphan))

		// Check for orphaned file icons
		const fileIconsDir = join(this.assetsDir, 'icons/file_icons')

		if (existsSync(fileIconsDir)) {
			const orphanedFileIcons = this.findOrphanedIcons(fileIconsDir, knownIconNames, knownOrphanNames)

			orphanedFileIcons.forEach((orphan) => {
				warnings.push({
					type: 'warning',
					code: 'ORPHANED_FILE_ICON',
					message: `Orphaned file icon found: ${orphan}`,
					assetPath: orphan,
					context: { iconType: 'file' },
				})
			})
		}

		// Check for orphaned folder icons
		const folderIconsDir = join(this.assetsDir, 'icons/folder_icons')

		if (existsSync(folderIconsDir)) {
			const orphanedFolderIcons = this.findOrphanedIcons(folderIconsDir, knownIconNames, knownOrphanNames)

			orphanedFolderIcons.forEach((orphan) => {
				warnings.push({
					type: 'warning',
					code: 'ORPHANED_FOLDER_ICON',
					message: `Orphaned folder icon found: ${orphan}`,
					assetPath: orphan,
					context: { iconType: 'folder' },
				})
			})
		}

		return { errors, warnings }
	}

	/**
	 * Detect duplicate icon names in models
	 */
	private async detectDuplicateNames(
		fileIconsModel: IconModel,
		folderIconsModel: IconModel,
	): Promise<{ errors: ValidationError[], warnings: ValidationWarning[] }> {
		const errors: ValidationError[] = []
		const warnings: ValidationWarning[] = []

		// Check for duplicate file icon names
		const fileIconNames = new Set<string>()
		const duplicateFileNames = new Set<string>()

		for (const icon of fileIconsModel.icons) {
			if (icon.name) {
				if (fileIconNames.has(icon.name)) {
					duplicateFileNames.add(icon.name)
				} else {
					fileIconNames.add(icon.name)
				}
			}
		}

		// Check for duplicate folder icon names
		const folderIconNames = new Set<string>()
		const duplicateFolderNames = new Set<string>()

		for (const icon of folderIconsModel.icons) {
			if (icon.name) {
				if (folderIconNames.has(icon.name)) {
					duplicateFolderNames.add(icon.name)
				} else {
					folderIconNames.add(icon.name)
				}
			}
		}

		// Report duplicates
		duplicateFileNames.forEach((name) => {
			warnings.push({
				type: 'warning',
				code: 'DUPLICATE_FILE_ICON_NAME',
				message: `Duplicate file icon name: ${name}`,
				context: { iconType: 'file', name },
			})
		})

		duplicateFolderNames.forEach((name) => {
			warnings.push({
				type: 'warning',
				code: 'DUPLICATE_FOLDER_ICON_NAME',
				message: `Duplicate folder icon name: ${name}`,
				context: { iconType: 'folder', name },
			})
		})

		return { errors, warnings }
	}

	/**
	 * Validate theme file structure
	 */
	private async validateThemeStructure(): Promise<{ errors: ValidationError[], warnings: ValidationWarning[] }> {
		const errors: ValidationError[] = []
		const warnings: ValidationWarning[] = []

		const themeFiles = this.manifest.assets.filter(asset =>
			asset.path.endsWith('.theme.json'))

		for (const themeAsset of themeFiles) {
			const themePath = join(this.assetsDir, themeAsset.path)
			
			try {
				const themeContent = readFileSync(themePath, 'utf-8')
				const theme = JSON.parse(themeContent) as ThemeManifest

				// Validate required properties
				if (!theme.iconDefinitions) {
					errors.push({
						type: 'error',
						code: 'MISSING_ICON_DEFINITIONS',
						message: `Theme missing iconDefinitions: ${themeAsset.path}`,
						assetPath: themeAsset.path,
					})
				}

				// Validate icon definitions structure
				if (theme.iconDefinitions) {
					for (const [key, definition] of Object.entries(theme.iconDefinitions)) {
						if (!definition.iconPath) {
							errors.push({
								type: 'error',
								code: 'INVALID_ICON_DEFINITION',
								message: `Icon definition missing iconPath: ${key}`,
								assetPath: themeAsset.path,
								context: { iconKey: key },
							})
						}
					}
				}

				// Validate file associations
				if (theme.fileExtensions) {
					for (const [ext, iconKey] of Object.entries(theme.fileExtensions)) {
						if (!theme.iconDefinitions?.[iconKey]) {
							errors.push({
								type: 'error',
								code: 'INVALID_FILE_EXTENSION_REFERENCE',
								message: `File extension '${ext}' references undefined icon: ${iconKey}`,
								assetPath: themeAsset.path,
								context: { extension: ext, iconKey },
							})
						}
					}
				}

				// Validate file name associations
				if (theme.fileNames) {
					for (const [fileName, iconKey] of Object.entries(theme.fileNames)) {
						if (!theme.iconDefinitions?.[iconKey]) {
							errors.push({
								type: 'error',
								code: 'INVALID_FILE_NAME_REFERENCE',
								message: `File name '${fileName}' references undefined icon: ${iconKey}`,
								assetPath: themeAsset.path,
								context: { fileName, iconKey },
							})
						}
					}
				}

				// Validate folder name associations
				if (theme.folderNames) {
					for (const [folderName, iconKey] of Object.entries(theme.folderNames)) {
						if (!theme.iconDefinitions?.[iconKey]) {
							errors.push({
								type: 'error',
								code: 'INVALID_FOLDER_NAME_REFERENCE',
								message: `Folder name '${folderName}' references undefined icon: ${iconKey}`,
								assetPath: themeAsset.path,
								context: { folderName, iconKey },
							})
						}
					}
				}
			} catch (error) {
				errors.push({
					type: 'error',
					code: 'THEME_PARSE_ERROR',
					message: `Failed to parse theme file: ${themeAsset.path}`,
					assetPath: themeAsset.path,
					context: { error: error.message },
				})
			}
		}

		return { errors, warnings }
	}

	/**
	 * Validate icon references in themes
	 */
	private async validateIconReferences(): Promise<{ errors: ValidationError[], warnings: ValidationWarning[] }> {
		const errors: ValidationError[] = []
		const warnings: ValidationWarning[] = []

		const themeFiles = this.manifest.assets.filter(asset =>
			asset.path.endsWith('.theme.json'))

		for (const themeAsset of themeFiles) {
			const themePath = join(this.assetsDir, themeAsset.path)
			
			try {
				const themeContent = readFileSync(themePath, 'utf-8')
				const theme = JSON.parse(themeContent) as ThemeManifest

				if (theme.iconDefinitions) {
					for (const [iconKey, definition] of Object.entries(theme.iconDefinitions)) {
						const iconPath = definition.iconPath
						
						// Check if icon path is relative
						if (iconPath.startsWith('/') || iconPath.includes(':\\')) {
							warnings.push({
								type: 'warning',
								code: 'ABSOLUTE_ICON_PATH',
								message: `Icon path should be relative: ${iconPath}`,
								assetPath: themeAsset.path,
								context: { iconKey, iconPath },
							})
						}

						// Check if referenced icon file exists
						const fullIconPath = join(dirname(themePath), iconPath)

						if (!existsSync(fullIconPath)) {
							errors.push({
								type: 'error',
								code: 'ICON_FILE_NOT_FOUND',
								message: `Referenced icon file not found: ${iconPath}`,
								assetPath: themeAsset.path,
								context: { iconKey, iconPath, fullPath: fullIconPath },
							})
						}
					}
				}
			} catch (error) {
				errors.push({
					type: 'error',
					code: 'ICON_REFERENCE_VALIDATION_ERROR',
					message: `Failed to validate icon references in theme: ${themeAsset.path}`,
					assetPath: themeAsset.path,
					context: { error: error.message },
				})
			}
		}

		return { errors, warnings }
	}

	/**
	 * Validate path resolution
	 */
	private async validatePathResolution(): Promise<{ errors: ValidationError[], warnings: ValidationWarning[] }> {
		const errors: ValidationError[] = []
		const warnings: ValidationWarning[] = []

		// Check for path traversal issues
		for (const asset of this.manifest.assets) {
			if (asset.path.includes('..') || asset.path.includes('\\')) {
				warnings.push({
					type: 'warning',
					code: 'PATH_TRAVERSAL_DETECTED',
					message: `Path traversal detected in asset path: ${asset.path}`,
					assetPath: asset.path,
				})
			}

			// Check for absolute paths
			if (asset.path.startsWith('/') || asset.path.includes(':\\')) {
				warnings.push({
					type: 'warning',
					code: 'ABSOLUTE_ASSET_PATH',
					message: `Asset path should be relative: ${asset.path}`,
					assetPath: asset.path,
				})
			}
		}

		return { errors, warnings }
	}

	/**
	 * Validate SVG file format
	 */
	private validateSvgFile(filePath: string): { valid: boolean, errors: string[] } {
		const errors: string[] = []

		try {
			const content = readFileSync(filePath, 'utf-8')

			// Basic SVG validation - only check for essential elements
			if (!content.includes('<svg')) {
				errors.push('Missing <svg> tag')
			}

			if (!content.includes('</svg>')) {
				errors.push('Missing </svg> tag')
			}

			// Check for common SVG issues
			if (content.includes('<?xml')) {
				// XML declaration is optional but should be valid if present
				if (!content.includes('encoding="utf-8"') && !content.includes('encoding="UTF-8"')) {
					errors.push('XML declaration should specify UTF-8 encoding')
				}
			}

			// Note: viewBox is recommended but not required for valid SVGs
			// Many icon SVGs work perfectly fine without it
		} catch (error) {
			errors.push(`Failed to read SVG file: ${error.message}`)
		}

		return {
			valid: errors.length === 0,
			errors,
		}
	}

	/**
	 * Validate theme file format
	 */
	private validateThemeFile(filePath: string): { valid: boolean, errors: string[] } {
		const errors: string[] = []

		try {
			const content = readFileSync(filePath, 'utf-8')
			const theme = JSON.parse(content)

			// Basic theme structure validation
			if (typeof theme !== 'object' || theme === null) {
				errors.push('Theme must be a JSON object')
				return { valid: false, errors }
			}

			// Detect theme type and validate accordingly
			if (theme.type === 'dark' || theme.type === 'light') {
				// This is a color theme, not an icon theme
				if (!theme.colors || typeof theme.colors !== 'object') {
					errors.push('Color theme must have a "colors" object')
				}
				if (theme.colors && Object.keys(theme.colors).length === 0) {
					errors.push('Color theme "colors" object is empty')
				}
			} else if (theme.iconDefinitions) {
				// This is an icon theme
				if (typeof theme.iconDefinitions !== 'object') {
					errors.push('Icon theme "iconDefinitions" must be an object')
				}
				if (Object.keys(theme.iconDefinitions).length === 0) {
					errors.push('Icon theme "iconDefinitions" object is empty')
				}
			} else {
				// Unknown theme type
				errors.push('Theme must be either a color theme (with "type" and "colors") or icon theme (with "iconDefinitions")')
			}

			// Check for required VSCode theme properties
			if (!theme.$schema && !theme.name) {
				errors.push('Theme should have either "$schema" (VSCode) or "name" property')
			}
		} catch (error) {
			errors.push(`Failed to parse theme file: ${error.message}`)
		}

		return {
			valid: errors.length === 0,
			errors,
		}
	}

	/**
	 * Find orphaned icons in a directory
	 */
	private findOrphanedIcons(
		iconsDir: string,
		knownIconNames: Set<string>,
		knownOrphanNames: Set<string>,
	): string[] {
		const orphanedIcons: string[] = []

		try {
			const files = readdirSync(iconsDir)
			
			for (const file of files) {
				if (file.endsWith('.svg')) {
					const baseName = basename(file, '.svg')
					
					// Remove folder- prefix for folder icons
					const iconName = baseName.startsWith('folder-')
						? baseName.substring(7)
						: baseName

					// Check if icon is orphaned
					if (!knownIconNames.has(iconName) && !knownOrphanNames.has(iconName)) {
						orphanedIcons.push(join(basename(iconsDir), file))
					}
				}
			}
		} catch (error) {
			// Directory might not exist, which is fine
		}

		return orphanedIcons
	}

	/**
	 * Load icon model from file
	 */
	private async loadIconModel(filename: string): Promise<IconModel | null> {
		try {
			const modelPath = join(this.modelsDir, filename)

			if (!existsSync(modelPath)) {
				return null
			}

			const content = readFileSync(modelPath, 'utf-8')

			// Strip comments from JSON content
			const cleanContent = content
				.split('\n')
				.filter(line => !line.trim().startsWith('//'))
				.join('\n')

			return JSON.parse(cleanContent) as IconModel
		} catch (error) {
			return null
		}
	}

	/**
	 * Create validation result with summary
	 */
	private createValidationResult(
		errors: ValidationError[],
		warnings: ValidationWarning[],
		verbose: boolean = false,
	): ValidationResult {
		const totalAssets = this.manifest.assets.length
		const validAssets = totalAssets - errors.filter(e =>
			e.assetPath).length
		const invalidAssets = errors.filter(e =>
			e.assetPath).length
		const orphanedAssets = warnings.filter(w =>
			w.code.includes('ORPHANED')).length
		const duplicateNames = warnings.filter(w =>
			w.code.includes('DUPLICATE')).length
		const missingReferences = errors.filter(e =>
			e.code.includes('REFERENCE')).length

		const result: ValidationResult = {
			valid: errors.length === 0,
			errors,
			warnings,
			summary: {
				totalAssets,
				validAssets,
				invalidAssets,
				orphanedAssets,
				duplicateNames,
				missingReferences,
			},
		}

		// Add concise summary for non-verbose mode
		if (!verbose) {
			result.conciseSummary = this.createConciseSummary(errors, warnings)
		}

		return result
	}

	/**
	 * Create concise summary grouping similar issues
	 */
	private createConciseSummary(
		errors: ValidationError[],
		warnings: ValidationWarning[],
	): ValidationResult['conciseSummary'] {
		const errorCounts: Record<string, number> = {}
		const warningCounts: Record<string, number> = {}
		const errorExamples: Record<string, string[]> = {}
		const warningExamples: Record<string, string[]> = {}

		// Count errors by type
		errors.forEach((error) => {
			const code = error.code

			errorCounts[code] = (errorCounts[code] || 0) + 1
			
			if (!errorExamples[code]) {
				errorExamples[code] = []
			}
			
			// Keep only first few examples for each error type
			if (errorExamples[code].length < 3) {
				const example = error.assetPath ? `${error.message} (${error.assetPath})` : error.message

				errorExamples[code].push(example)
			}
		})

		// Count warnings by type
		warnings.forEach((warning) => {
			const code = warning.code

			warningCounts[code] = (warningCounts[code] || 0) + 1
			
			if (!warningExamples[code]) {
				warningExamples[code] = []
			}
			
			// Keep only first few examples for each warning type
			if (warningExamples[code].length < 3) {
				const example = warning.assetPath ? `${warning.message} (${warning.assetPath})` : warning.message

				warningExamples[code].push(example)
			}
		})

		return {
			errorCounts,
			warningCounts,
			errorExamples,
			warningExamples,
		}
	}

}

// CLI interface for standalone usage
if (process.argv[1] && process.argv[1].endsWith('asset-validator.ts')) {
	import('./asset-manifest').then(async ({ AssetManifestGenerator }) => {
		const generator = new AssetManifestGenerator()
		const manifest = await generator.generateManifest()
		
		const validator = new AssetValidator('assets', 'src/models', 'assets/themes', manifest)
		const result = await validator.validateAssets()
		
		console.log('Asset Validation Results:')
		console.log(`Valid: ${result.valid}`)
		console.log(`Errors: ${result.errors.length}`)
		console.log(`Warnings: ${result.warnings.length}`)
		console.log('\nSummary:')
		console.log(`  Total Assets: ${result.summary.totalAssets}`)
		console.log(`  Valid Assets: ${result.summary.validAssets}`)
		console.log(`  Invalid Assets: ${result.summary.invalidAssets}`)
		console.log(`  Orphaned Assets: ${result.summary.orphanedAssets}`)
		console.log(`  Duplicate Names: ${result.summary.duplicateNames}`)
		console.log(`  Missing References: ${result.summary.missingReferences}`)
		
		if (result.errors.length > 0) {
			console.log('\nErrors:')
			result.errors.forEach((error) => {
				console.log(`  [ERROR] ${error.code}: ${error.message}`)
				if (error.assetPath)
					console.log(`    Asset: ${error.assetPath}`)
			})
		}
		
		if (result.warnings.length > 0) {
			console.log('\nWarnings:')
			result.warnings.forEach((warning) => {
				console.log(`  [WARNING] ${warning.code}: ${warning.message}`)
				if (warning.assetPath)
					console.log(`    Asset: ${warning.assetPath}`)
			})
		}
		
		process.exit(result.valid ? 0 : 1)
	}).catch((error) => {
		console.error('Validation failed:', error)
		process.exit(1)
	})
}
