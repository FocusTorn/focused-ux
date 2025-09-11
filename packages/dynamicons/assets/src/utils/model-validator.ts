import { promises as fs } from 'fs'
import stripJsonCommentsModule from 'strip-json-comments'

// Handle both default and direct exports
const stripJsonComments = (stripJsonCommentsModule as { default?: (str: string) => string }).default || stripJsonCommentsModule

export interface ValidationResult {
	valid: boolean
	errors: string[]
	warnings: string[]
}

/**
 * Validate file icons model structure
 */
function validateFileIconsModel(model: unknown, result: ValidationResult): void {
	// Check if model is an object
	if (!model || typeof model !== 'object') {
		result.errors.push('Model must be an object')
		return
	}

	const modelObj = model as Record<string, unknown>

	// Check required top-level properties
	if (!modelObj.file || typeof modelObj.file !== 'object') {
		result.errors.push('Missing or invalid "file" property')
	}

	if (!modelObj.icons || !Array.isArray(modelObj.icons)) {
		result.errors.push('Missing or invalid "icons" array')
		return
	}

	// Validate file property
	if (modelObj.file) {
		const fileObj = modelObj.file as Record<string, unknown>

		if (!fileObj.iconName || typeof fileObj.iconName !== 'string') {
			result.errors.push('File icon missing or invalid "iconName"')
		}
	}

	// Validate icons array
	const iconsArray = modelObj.icons as unknown[]

	iconsArray.forEach((icon: unknown, index: number) => {
		if (!icon || typeof icon !== 'object') {
			result.errors.push(`Icon ${index}: Must be an object`)
			return
		}

		const iconObj = icon as Record<string, unknown>

		if (!iconObj.iconName || typeof iconObj.iconName !== 'string') {
			result.errors.push(`Icon ${index}: Missing or invalid "iconName"`)
		}

		// Check if icon has either fileExtensions or fileNames (or both)
		const hasFileExtensions = iconObj.fileExtensions && Array.isArray(iconObj.fileExtensions)
		const hasFileNames = iconObj.fileNames && Array.isArray(iconObj.fileNames)
		
		if (!hasFileExtensions && !hasFileNames) {
			result.warnings.push(`Icon ${index}: No file extensions or file names defined`)
		} else if (iconObj.fileExtensions && !Array.isArray(iconObj.fileExtensions)) {
			result.errors.push(`Icon ${index}: "fileExtensions" must be an array`)
		} else if (iconObj.fileNames && !Array.isArray(iconObj.fileNames)) {
			result.errors.push(`Icon ${index}: "fileNames" must be an array`)
		}
	})
}

/**
 * Validate folder icons model structure
 */
function validateFolderIconsModel(model: unknown, result: ValidationResult): void {
	// Check if model is an object
	if (!model || typeof model !== 'object') {
		result.errors.push('Model must be an object')
		return
	}

	const modelObj = model as Record<string, unknown>

	// Check required top-level properties
	if (!modelObj.folder || typeof modelObj.folder !== 'object') {
		result.errors.push('Missing or invalid "folder" property')
	}

	if (!modelObj.rootFolder || typeof modelObj.rootFolder !== 'object') {
		result.errors.push('Missing or invalid "rootFolder" property')
	}

	if (!modelObj.icons || !Array.isArray(modelObj.icons)) {
		result.errors.push('Missing or invalid "icons" array')
		return
	}

	// Validate folder properties
	if (modelObj.folder) {
		const folderObj = modelObj.folder as Record<string, unknown>

		if (!folderObj.iconName || typeof folderObj.iconName !== 'string') {
			result.errors.push('Folder icon missing or invalid "iconName"')
		}
	}

	if (modelObj.rootFolder) {
		const rootFolderObj = modelObj.rootFolder as Record<string, unknown>

		if (!rootFolderObj.iconName || typeof rootFolderObj.iconName !== 'string') {
			result.errors.push('Root folder icon missing or invalid "iconName"')
		}
	}

	// Validate icons array
	const iconsArray = modelObj.icons as unknown[]

	iconsArray.forEach((icon: unknown, index: number) => {
		if (!icon || typeof icon !== 'object') {
			result.errors.push(`Icon ${index}: Must be an object`)
			return
		}

		const iconObj = icon as Record<string, unknown>

		if (!iconObj.iconName || typeof iconObj.iconName !== 'string') {
			result.errors.push(`Icon ${index}: Missing or invalid "iconName"`)
		}

		if (!iconObj.folderNames) {
			result.warnings.push(`Icon ${index}: No folder names defined`)
		} else if (!Array.isArray(iconObj.folderNames)) {
			result.errors.push(`Icon ${index}: "folderNames" must be an array`)
		}
	})
}

/**
 * Validate language icons model structure
 */
function validateLanguageIconsModel(model: unknown, result: ValidationResult): void {
	// Check if model is an object
	if (!model || typeof model !== 'object') {
		result.errors.push('Model must be an object')
		return
	}

	const modelObj = model as Record<string, unknown>

	if (!modelObj.icons || !Array.isArray(modelObj.icons)) {
		result.errors.push('Missing or invalid "icons" array')
		return
	}

	// Validate icons array
	const iconsArray = modelObj.icons as unknown[]

	iconsArray.forEach((icon: unknown, index: number) => {
		if (!icon || typeof icon !== 'object') {
			result.errors.push(`Icon ${index}: Must be an object`)
			return
		}

		const iconObj = icon as Record<string, unknown>

		if (!iconObj.languageID || typeof iconObj.languageID !== 'string') {
			result.errors.push(`Icon ${index}: Missing or invalid "languageID"`)
		}

		if (!iconObj.iconName || typeof iconObj.iconName !== 'string') {
			result.errors.push(`Icon ${index}: Missing or invalid "iconName"`)
		}
	})
}

/**
 * Validate individual model file
 */
async function validateModelFile(filePath: string, name: string, silent: boolean = false): Promise<ValidationResult> {
	const result: ValidationResult = {
		valid: true,
		errors: [],
		warnings: [],
	}

	try {
		// Check if file exists
		await fs.access(filePath)

		// Read and parse file
		const content = await fs.readFile(filePath, 'utf-8')
		const parsed = JSON.parse(stripJsonComments(content))

		// Validate based on file type
		if (filePath.includes('file_icons')) {
			validateFileIconsModel(parsed, result)
		} else if (filePath.includes('folder_icons')) {
			validateFolderIconsModel(parsed, result)
		} else if (filePath.includes('language_icons')) {
			validateLanguageIconsModel(parsed, result)
		}

		if (result.errors.length > 0) {
			result.valid = false
		}

		if (!silent) {
			if (result.valid) {
				console.log(`✅ ${name}: Valid`)
			} else {
				console.log(`❌ ${name}: Invalid`)
				result.errors.forEach(error => console.log(`   • ${error}`))
			}
			if (result.warnings.length > 0) {
				result.warnings.forEach(warning => console.log(`   ⚠️  ${warning}`))
			}
		}

		return result
	} catch (error) {
		result.valid = false
		result.errors.push(`Failed to read or parse file: ${error instanceof Error ? error.message : String(error)}`)
		
		if (!silent) {
			console.log(`❌ ${name}: File error`)
			result.errors.forEach(error => console.log(`   • ${error}`))
		}

		return result
	}
}

/**
 * Validate model files for correct structure and content
 */
export async function validateModels(silent: boolean = false): Promise<boolean> {
	try {
		const modelFiles = [
			{ path: 'src/models/file_icons.model.json', name: 'File Icons Model' },
			{ path: 'src/models/folder_icons.model.json', name: 'Folder Icons Model' },
			{ path: 'src/models/language_icons.model.json', name: 'Language Icons Model' },
		]

		let allValid = true

		for (const modelFile of modelFiles) {
			const result = await validateModelFile(modelFile.path, modelFile.name, silent)

			if (!result.valid) {
				allValid = false
			}
		}

		return allValid
	} catch (error) {
		if (!silent) {
			console.error('Model validation failed:', error)
		}
		return false
	}
}
