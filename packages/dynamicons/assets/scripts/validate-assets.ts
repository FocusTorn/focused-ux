#!/usr/bin/env node

import { promises as fs } from 'fs'
import path from 'path'
import stripJsonCommentsModule from 'strip-json-comments'

// Handle both default and direct exports
const stripJsonComments = (stripJsonCommentsModule as any).default || stripJsonCommentsModule

const ASSETS_DIR = path.resolve(process.cwd(), 'assets')
const ICONS_DIR = path.join(ASSETS_DIR, 'icons')
const THEMES_DIR = path.join(ASSETS_DIR, 'themes')
const MODELS_DIR = path.resolve(process.cwd(), 'src/models')

interface ValidationError {
	code: string
	message: string
	filePath?: string
	details?: string
}

interface ValidationWarning {
	code: string
	message: string
	filePath?: string
	details?: string
}

interface ValidationResult {
	success: boolean
	errors: ValidationError[]
	warnings: ValidationWarning[]
	summary: {
		totalAssets: number
		validAssets: number
		invalidAssets: number
		totalThemes: number
		validThemes: number
		invalidThemes: number
	}
}

/**
 * Validate Assets - Comprehensive validation of SVG files and theme files
 */
async function validateAssets(verbose: boolean = false): Promise<void> {
	if (verbose) {
		console.log('🔄 [Validate Assets] Starting comprehensive asset validation...')
	}
	
	try {
		const result: ValidationResult = {
			success: true,
			errors: [],
			warnings: [],
			summary: {
				totalAssets: 0,
				validAssets: 0,
				invalidAssets: 0,
				totalThemes: 0,
				validThemes: 0,
				invalidThemes: 0,
			},
		}
		
		// Step 1: Validate SVG files
		if (verbose) {
			console.log('  🔍 Step 1: Validating SVG files...')
		}

		const svgValidation = await validateSvgFiles()

		result.errors.push(...svgValidation.errors)
		result.warnings.push(...svgValidation.warnings)
		result.summary.totalAssets = svgValidation.total
		result.summary.validAssets = svgValidation.valid
		result.summary.invalidAssets = svgValidation.invalid
		
		// Step 2: Validate theme files
		if (verbose) {
			console.log('  🔍 Step 2: Validating theme files...')
		}

		const themeValidation = await validateThemeFiles()

		result.errors.push(...themeValidation.errors)
		result.warnings.push(...themeValidation.warnings)
		result.summary.totalThemes = themeValidation.total
		result.summary.validThemes = themeValidation.valid
		result.summary.invalidThemes = themeValidation.invalid
		
		// Step 3: Validate icon models
		if (verbose) {
			console.log('  🔍 Step 3: Validating icon models...')
		}

		const modelValidation = await validateIconModels()

		result.errors.push(...modelValidation.errors)
		result.warnings.push(...modelValidation.warnings)
		
		// Step 4: Detect orphaned assets
		if (verbose) {
			console.log('  🔍 Step 4: Detecting orphaned assets...')
		}

		const orphanValidation = await detectOrphanedAssets()

		result.warnings.push(...orphanValidation)
		
		// Determine overall success
		result.success = result.errors.length === 0
		
		// Step 5: Generate comprehensive report
		if (verbose) {
			console.log('  📊 Step 5: Generating validation report...')
		}
		await generateValidationReport(result, verbose)
		
		if (verbose) {
			if (result.success) {
				console.log('✅ Asset validation completed successfully!')
			} else {
				console.log('⚠️  Asset validation completed with issues')
			}
		}
	} catch (error) {
		console.error('❌ Asset validation failed:', error)
		throw error
	}
}

/**
 * Validate SVG files for integrity and structure
 */
async function validateSvgFiles(): Promise<{ total: number, valid: number, invalid: number, errors: ValidationError[], warnings: ValidationWarning[] }> {
	const errors: ValidationError[] = []
	const warnings: ValidationWarning[] = []
	let total = 0
	let valid = 0
	let invalid = 0
	
	try {
		// Check if icons directory exists
		try {
			await fs.access(ICONS_DIR)
		} catch {
			return { total: 0, valid: 0, invalid: 0, errors, warnings }
		}
		
		// Scan for SVG files recursively
		const svgFiles = await findSvgFiles(ICONS_DIR)

		total = svgFiles.length
		
		for (const svgFile of svgFiles) {
			try {
				const content = await fs.readFile(svgFile, 'utf-8')
				
				// Basic SVG validation
				if (!content.includes('<svg')) {
					errors.push({
						code: 'INVALID_SVG',
						message: 'File does not contain SVG content',
						filePath: path.relative(ASSETS_DIR, svgFile),
					})
					invalid++
					continue
				}
				
				// Check for common SVG issues
				if (content.includes('<?xml')) {
					warnings.push({
						code: 'XML_DECLARATION',
						message: 'SVG contains XML declaration (not recommended)',
						filePath: path.relative(ASSETS_DIR, svgFile),
					})
				}
				
				if (!content.includes('viewBox') && !content.includes('width') && !content.includes('height')) {
					warnings.push({
						code: 'MISSING_DIMENSIONS',
						message: 'SVG missing viewBox, width, or height attributes',
						filePath: path.relative(ASSETS_DIR, svgFile),
					})
				}
				
				valid++
			} catch (err) {
				errors.push({
					code: 'SVG_READ_ERROR',
					message: `Failed to read SVG file: ${err}`,
					filePath: path.relative(ASSETS_DIR, svgFile),
				})
				invalid++
			}
		}
	} catch (error) {
		errors.push({
			code: 'SVG_VALIDATION_ERROR',
			message: `SVG validation failed: ${error}`,
		})
	}
	
	return { total, valid, invalid, errors, warnings }
}

/**
 * Validate theme files for JSON structure and content
 */
async function validateThemeFiles(): Promise<{ total: number, valid: number, invalid: number, errors: ValidationError[], warnings: ValidationWarning[] }> {
	const errors: ValidationError[] = []
	const warnings: ValidationWarning[] = []
	let total = 0
	let valid = 0
	let invalid = 0
	
	try {
		// Check if themes directory exists
		try {
			await fs.access(THEMES_DIR)
		} catch {
			return { total: 0, valid: 0, invalid: 0, errors, warnings }
		}
		
		// Find theme files
		const themeFiles = await findThemeFiles(THEMES_DIR)

		total = themeFiles.length
		
		for (const themeFile of themeFiles) {
			try {
				const content = await fs.readFile(themeFile, 'utf-8')
				const contentWithoutComments = stripJsonComments(content.toString())
				const theme = JSON.parse(contentWithoutComments)
				
				// Validate icon manifest structure (not VSCode theme structure)
				if (!theme.iconDefinitions) {
					errors.push({
						code: 'MISSING_ICON_DEFINITIONS',
						message: 'Theme missing required "iconDefinitions" field',
						filePath: path.relative(ASSETS_DIR, themeFile),
					})
					invalid++
					continue
				}
				
				if (!theme.file || !theme.folder) {
					warnings.push({
						code: 'MISSING_DEFAULT_ICONS',
						message: 'Theme missing default file/folder icon definitions',
						filePath: path.relative(ASSETS_DIR, themeFile),
					})
				}
				
				// Check if it's a valid icon manifest
				if (typeof theme.iconDefinitions === 'object'
				  && Object.keys(theme.iconDefinitions).length > 0) {
					valid++
				} else {
					errors.push({
						code: 'EMPTY_ICON_DEFINITIONS',
						message: 'Theme has empty iconDefinitions',
						filePath: path.relative(ASSETS_DIR, themeFile),
					})
					invalid++
				}
			} catch (err) {
				errors.push({
					code: 'THEME_PARSE_ERROR',
					message: `Failed to parse theme file: ${err}`,
					filePath: path.relative(ASSETS_DIR, themeFile),
				})
				invalid++
			}
		}
	} catch (error) {
		errors.push({
			code: 'THEME_VALIDATION_ERROR',
			message: `Theme validation failed: ${error}`,
		})
	}
	
	return { total, valid, invalid, errors, warnings }
}

/**
 * Validate icon models for structure and references
 */
async function validateIconModels(): Promise<{ errors: ValidationError[], warnings: ValidationWarning[] }> {
	const errors: ValidationError[] = []
	const warnings: ValidationWarning[] = []
	
	try {
		// Check if models directory exists
		try {
			await fs.access(MODELS_DIR)
		} catch {
			errors.push({
				code: 'MODELS_DIR_MISSING',
				message: 'Icon models directory not found',
			})
			return { errors, warnings }
		}
		
		// Validate file icons model
		const fileIconsPath = path.join(MODELS_DIR, 'file_icons.model.json')

		try {
			const content = await fs.readFile(fileIconsPath, 'utf-8')
			const contentWithoutComments = stripJsonComments(content.toString())
			const model = JSON.parse(contentWithoutComments)
			
			if (!model.icons || !Array.isArray(model.icons)) {
				errors.push({
					code: 'INVALID_FILE_ICONS_MODEL',
					message: 'File icons model missing or invalid "icons" array',
				})
			}
		} catch (err) {
			errors.push({
				code: 'FILE_ICONS_MODEL_ERROR',
				message: `Failed to read file icons model: ${err}`,
			})
		}
		
		// Validate folder icons model
		const folderIconsPath = path.join(MODELS_DIR, 'folder_icons.model.json')

		try {
			const content = await fs.readFile(folderIconsPath, 'utf-8')
			const contentWithoutComments = stripJsonComments(content.toString())
			const model = JSON.parse(contentWithoutComments)
			
			if (!model.icons || !Array.isArray(model.icons)) {
				errors.push({
					code: 'INVALID_FOLDER_ICONS_MODEL',
					message: 'Folder icons model missing or invalid "icons" array',
				})
			}
		} catch (err) {
			errors.push({
				code: 'FOLDER_ICONS_MODEL_ERROR',
				message: `Failed to read folder icons model: ${err}`,
			})
		}
	} catch (error) {
		errors.push({
			code: 'MODEL_VALIDATION_ERROR',
			message: `Model validation failed: ${error}`,
		})
	}
	
	return { errors, warnings }
}

/**
 * Detect orphaned assets (files not referenced in models)
 */
async function detectOrphanedAssets(): Promise<ValidationWarning[]> {
	const warnings: ValidationWarning[] = []
	
	try {
		// Read icon models to get referenced icon names
		const fileIconsModel = await readIconModel('file_icons.model.json')
		const folderIconsModel = await readIconModel('folder_icons.model.json')
		
		if (!fileIconsModel || !folderIconsModel) {
			warnings.push({
				code: 'MODEL_READ_ERROR',
				message: 'Could not read icon models for orphan detection',
				details: 'Skipping orphan detection',
			})
			return warnings
		}
		
		// Extract all referenced icon names from models
		const referencedFileIcons = new Set<string>()
		const referencedFolderIcons = new Set<string>()
		
		// Add icon names from models
		if (fileIconsModel.icons) {
			fileIconsModel.icons.forEach((icon: any) => {
				if (icon.name)
					referencedFileIcons.add(icon.name)
			})
		}
		if (folderIconsModel.icons) {
			folderIconsModel.icons.forEach((icon: any) => {
				if (icon.name)
					referencedFolderIcons.add(icon.name)
			})
		}
		
		// Add default icons
		if (fileIconsModel.file?.name)
			referencedFileIcons.add(fileIconsModel.file.name)
		if (folderIconsModel.folder?.name)
			referencedFolderIcons.add(folderIconsModel.folder.name)
		if (folderIconsModel.rootFolder?.name)
			referencedFolderIcons.add(folderIconsModel.rootFolder.name)
		
		// Check for orphaned file icons
		const fileIconsDir = path.join(ICONS_DIR, 'file_icons')

		try {
			const files = await fs.readdir(fileIconsDir)
			const svgFiles = files.filter(f =>
				f.endsWith('.svg'))
			
			const orphanedFileIcons = svgFiles.filter((svgFile) => {
				const baseName = svgFile.replace(/\.svg$/, '')

				return !referencedFileIcons.has(baseName)
				  && !(fileIconsModel.orphans || []).includes(baseName)
			})
			
			if (orphanedFileIcons.length > 0) {
				warnings.push({
					code: 'ORPHANED_FILE_ICONS',
					message: `Found ${orphanedFileIcons.length} truly orphaned file icon(s)`,
					details: `Orphaned: ${orphanedFileIcons.slice(0, 5).join(', ')}${orphanedFileIcons.length > 5 ? '...' : ''}`,
				})
			}
		} catch {
			// Directory doesn't exist
		}
		
		// Check for orphaned folder icons
		const folderIconsDir = path.join(ICONS_DIR, 'folder_icons')

		try {
			const files = await fs.readdir(folderIconsDir)
			const svgFiles = files.filter(f =>
				f.endsWith('.svg'))
			
			const orphanedFolderIcons = svgFiles.filter((svgFile) => {
				let baseName = svgFile.replace(/\.svg$/, '')

				baseName = baseName.replace(/^folder-/, '').replace(/-open$/, '')
				return !referencedFolderIcons.has(baseName)
				  && !(folderIconsModel.orphans || []).includes(baseName)
			})
			
			if (orphanedFolderIcons.length > 0) {
				warnings.push({
					code: 'ORPHANED_FOLDER_ICONS',
					message: `Found ${orphanedFolderIcons.length} truly orphaned folder icon(s)`,
					details: `Orphaned: ${orphanedFolderIcons.slice(0, 5).join(', ')}${orphanedFolderIcons.length > 5 ? '...' : ''}`,
				})
			}
		} catch {
			// Directory doesn't exist
		}
	} catch (error) {
		warnings.push({
			code: 'ORPHANED_DETECTION_ERROR',
			message: `Failed to detect orphaned assets: ${error}`,
		})
	}
	
	return warnings
}

/**
 * Helper function to read icon models
 */
async function readIconModel(filename: string): Promise<any> {
	try {
		const modelPath = path.join(MODELS_DIR, filename)
		const content = await fs.readFile(modelPath, 'utf-8')
		const contentWithoutComments = stripJsonComments(content.toString())

		return JSON.parse(contentWithoutComments)
	} catch {
		return null
	}
}

/**
 * Generate comprehensive validation report
 */
async function generateValidationReport(result: ValidationResult, verbose: boolean = false): Promise<void> {
	console.log('\n📊 VALIDATION REPORT')
	console.log('='.repeat(50))
	
	// Summary
	console.log(`\n📈 SUMMARY:`)
	console.log(`  Assets: ${result.summary.validAssets}/${result.summary.totalAssets} valid`)
	console.log(`  Themes: ${result.summary.validThemes}/${result.summary.totalThemes} valid`)
	console.log(`  Overall: ${result.success ? '✅ PASSED' : '❌ FAILED'}`)
	
	// Errors
	if (result.errors.length > 0) {
		console.log(`\n❌ ERRORS (${result.errors.length}):`)

		const errorGroups = groupByCode(result.errors)
		
		Object.entries(errorGroups).forEach(([code, errors]) => {
			console.log(`  ${code}: ${errors.length} occurrence(s)`)
			errors.slice(0, 3).forEach((error, index) => {
				const prefix = index === errors.length - 1 ? '└─' : '├─'
				const display = error.filePath ? `${error.message} (${error.filePath})` : error.message

				console.log(`    ${prefix} ${display}`)
			})
		})
	}
	
	// Warnings
	if (result.warnings.length > 0) {
		console.log(`\n⚠️  WARNINGS (${result.warnings.length}):`)

		const warningGroups = groupByCode(result.warnings)
		
		Object.entries(warningGroups).forEach(([code, warnings]) => {
			console.log(`  ${code}: ${warnings.length} occurrence(s)`)
			warnings.slice(0, 3).forEach((warning, index) => {
				const prefix = index === warnings.length - 1 ? '└─' : '├─'
				const display = warning.filePath ? `${warning.message} (${warning.filePath})` : warning.message

				console.log(`    ${prefix} ${display}`)
			})
		})
	}
	
	console.log(`\n${'='.repeat(50)}`)
}

/**
 * Helper function to find SVG files recursively
 */
async function findSvgFiles(dir: string): Promise<string[]> {
	const files: string[] = []
	
	try {
		const items = await fs.readdir(dir, { withFileTypes: true })
		
		for (const item of items) {
			const fullPath = path.join(dir, item.name)
			
			if (item.isDirectory()) {
				files.push(...await findSvgFiles(fullPath))
			} else if (item.name.toLowerCase().endsWith('.svg')) {
				files.push(fullPath)
			}
		}
	} catch {
		// Directory doesn't exist or can't be read
	}
	
	return files
}

/**
 * Helper function to find theme files
 */
async function findThemeFiles(dir: string): Promise<string[]> {
	const files: string[] = []
	
	try {
		const items = await fs.readdir(dir, { withFileTypes: true })
		
		for (const item of items) {
			if (item.isFile() && item.name.endsWith('.theme.json')) {
				files.push(path.join(dir, item.name))
			}
		}
	} catch {
		// Directory doesn't exist or can't be read
	}
	
	return files
}

/**
 * Helper function to group validation issues by code
 */
function groupByCode<T extends { code: string }>(items: T[]): Record<string, T[]> {
	const groups: Record<string, T[]> = {}
	
	items.forEach((item) => {
		if (!groups[item.code]) {
			groups[item.code] = []
		}
		groups[item.code].push(item)
	})
	
	return groups
}

// CLI interface
if (process.argv[1] && process.argv[1].endsWith('validate-assets.ts')) {
	const args = process.argv.slice(2)
	const verbose = args.includes('--verbose') || args.includes('-v')
	validateAssets(verbose).catch((error) => {
		console.error('Fatal error:', error)
		process.exit(1)
	})
}

export { validateAssets }
