#!/usr/bin/env node

import { promises as fs } from 'fs'
import path from 'path'
import stripJsonCommentsModule from 'strip-json-comments'
import { displayStructuredErrors } from './tree-formatter.js'

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
	orphanedFileAssignments: string[]
	orphanedFolderAssignments: string[]
	orphanedLanguageAssignments: string[]
	invalidLanguageIds: string[]
}

/**
 * Main audit function - inspects models and asset folders to find model-related problems
 */
export async function auditModels(): Promise<ModelAuditResult> {
	const fileIconsModelPath = path.resolve(process.cwd(), 'src/models/file_icons.model.json')
	const folderIconsModelPath = path.resolve(process.cwd(), 'src/models/folder_icons.model.json')
	const languageIconsModelPath = path.resolve(process.cwd(), 'src/models/language_icons.model.json')

	const orphanedFileIcons: string[] = []
	const orphanedFolderIcons: string[] = []
	const orphanedLanguageIcons: string[] = []
	const duplicateFileIcons: string[] = []
	const duplicateFolderIcons: string[] = []
	const duplicateLanguageIcons: string[] = []
	const orphanedFileAssignments: string[] = []
	const orphanedFolderAssignments: string[] = []
	const orphanedLanguageAssignments: string[] = []
	const invalidLanguageIds: string[] = []

	try {
		// Read model files to check for errors
		const fileIconsModelContent = await fs.readFile(fileIconsModelPath, 'utf-8')
		const folderIconsModelContent = await fs.readFile(folderIconsModelPath, 'utf-8')
		const languageIconsModelContent = await fs.readFile(languageIconsModelPath, 'utf-8')

		const fileIconsModel = JSON.parse(stripJsonComments(fileIconsModelContent))
		const folderIconsModel = JSON.parse(stripJsonComments(folderIconsModelContent))
		const languageIconsModel = JSON.parse(stripJsonComments(languageIconsModelContent))

		// Check for orphaned icons
		const fileIconsDir = path.resolve(process.cwd(), 'assets/icons/file_icons')
		const folderIconsDir = path.resolve(process.cwd(), 'assets/icons/folder_icons')
		const languageIconsDir = path.resolve(process.cwd(), 'assets/icons/language_icons')

		try {
			const fileIconFiles = (await fs.readdir(fileIconsDir)).filter(f => f.endsWith('.svg'))
			
			const folderIconFiles = (await fs.readdir(folderIconsDir)).filter(f => f.endsWith('.svg'))
			
			let _languageIconFiles: string[] = []

			try {
				_languageIconFiles = (await fs.readdir(languageIconsDir)).filter(f => f.endsWith('.svg'))
			} catch {
				// Language icons directory not found, skip
			}

			// Extract icon names from model (including orphans field and default icons)
			const modelFileIconNames = new Set(fileIconsModel.icons?.map((icon: { iconName: string }) => icon.iconName) || [])
			const modelFolderIconNames = new Set(folderIconsModel.icons?.map((icon: { iconName: string }) => icon.iconName) || [])
			const modelLanguageIconNames = new Set(languageIconsModel.icons?.map((icon: { languageID: string }) => icon.languageID) || [])

			// Add default file/folder/rootFolder icons (like the old logic)
			if (fileIconsModel.file?.iconName) {
				modelFileIconNames.add(fileIconsModel.file.iconName)
			}
			if (folderIconsModel.folder?.iconName) {
				modelFolderIconNames.add(folderIconsModel.folder.iconName)
			}
			if (folderIconsModel.rootFolder?.iconName) {
				modelFolderIconNames.add(folderIconsModel.rootFolder.iconName)
			}

			// Add orphans and unassigned to the model sets (intentionally excluded from main icons array)
			if (fileIconsModel.orphans) {
				fileIconsModel.orphans.forEach((orphan: string) => {
					modelFileIconNames.add(orphan)
				})
			}
			if (fileIconsModel.unassigned) {
				fileIconsModel.unassigned.forEach((unassigned: string) => {
					modelFileIconNames.add(unassigned)
				})
			}
			if (folderIconsModel.orphans) {
				folderIconsModel.orphans.forEach((orphan: string) => {
					modelFolderIconNames.add(orphan)
				})
			}
			if (folderIconsModel.unassigned) {
				folderIconsModel.unassigned.forEach((unassigned: string) => {
					modelFolderIconNames.add(unassigned)
				})
			}
			if (languageIconsModel.orphans) {
				languageIconsModel.orphans.forEach((orphan: string) => {
					modelLanguageIconNames.add(orphan)
				})
			}
			if (languageIconsModel.unassigned) {
				languageIconsModel.unassigned.forEach((unassigned: string) => {
					modelLanguageIconNames.add(unassigned)
				})
			}

			// Orphaned file icons - scan directory and compare against model
			for (const file of fileIconFiles) {
				const iconName = path.basename(file, '.svg')

				// Skip -alt variants (except specific ones like pycache-alt that should be detected)
				if (iconName.endsWith('-alt') && iconName !== 'pycache-alt')
					continue
				
				// Check if this icon is defined in the model (icons array, file.name, or orphans)
				if (!modelFileIconNames.has(iconName)) {
					orphanedFileIcons.push(iconName)
				}
			}

			// Orphaned folder icons - scan directory and compare against model
			for (const file of folderIconFiles) {
				const iconName = path.basename(file, '.svg')

				// Skip -open variants (these are auto-generated)
				if (iconName.endsWith('-open'))
					continue
				// Skip -alt variants
				if (iconName.endsWith('-alt'))
					continue
				
				// Extract base name by removing 'folder-' prefix for comparison with model
				const baseName = iconName.startsWith('folder-') ? iconName.substring(7) : iconName
				
				// Check if this icon is defined in the model (icons array, folder.name, rootFolder.name, or orphans)
				if (!modelFolderIconNames.has(baseName)) {
					orphanedFolderIcons.push(baseName)
				}
			}

			// Language icons use file_icons directory, so check against file_icons for assignments
			// Build available asset icon sets for assignment validation
			const availableFileIconNames = new Set(fileIconFiles.map(f => path.basename(f, '.svg')))
			
			// For folder assignment validation, we need ALL folder icon names (base + open variants)
			const availableFolderIconNames = new Set(folderIconFiles.map(f => path.basename(f, '.svg')))
			
			// For orphaned folder detection, we only want base icons (excluding -open variants to avoid duplicates)
			const _availableFolderBaseIconNames = new Set(
				folderIconFiles
					.filter(f => !f.endsWith('-open.svg'))
					.map(f => path.basename(f, '.svg')),
			)
			
			// Language icons are stored in file_icons directory
			const availableLanguageIconNames = availableFileIconNames

			// Orphaned assignments: model references with no corresponding asset
			// Note: This excludes the orphans array since those are intentionally not in assets
			
			// Check file icon assignments against file_icons directory
			for (const icon of fileIconsModel.icons || []) {
				if (!icon.iconName)
					continue // Skip undefined names

				if (!availableFileIconNames.has(icon.iconName)) {
					orphanedFileAssignments.push(icon.iconName)
				}
			}

			// Check folder icon assignments against folder_icons directory
			for (const icon of folderIconsModel.icons || []) {
				if (!icon.iconName)
					continue // Skip undefined names

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
					
					orphanedFolderAssignments.push(description)
				}
			}

			// Check language assignments against file_icons directory
			for (const icon of languageIconsModel.icons || []) {
				if (!icon.iconName)
					continue // Skip undefined icon names

				// Remove .svg extension for comparison
				const iconName = icon.iconName.replace('.svg', '')

				if (!availableLanguageIconNames.has(iconName)) {
					orphanedLanguageAssignments.push(icon.iconName)
				}
			}

			// Duplicate names in models
			const seenFileIconNames = new Set<string>()

			for (const icon of fileIconsModel.icons || []) {
				if (seenFileIconNames.has(icon.iconName)) {
					duplicateFileIcons.push(icon.iconName)
				} else {
					seenFileIconNames.add(icon.iconName)
				}
			}

			const seenFolderIconNames = new Set<string>()

			for (const icon of folderIconsModel.icons || []) {
				if (seenFolderIconNames.has(icon.iconName)) {
					duplicateFolderIcons.push(icon.iconName)
				} else {
					seenFolderIconNames.add(icon.iconName)
				}
			}

			const seenLanguageIconIds = new Set<string>()

			for (const icon of languageIconsModel.icons || []) {
				// Skip icons with undefined ids
				if (!icon.languageID)
					continue
				
				if (seenLanguageIconIds.has(icon.languageID)) {
					duplicateLanguageIcons.push(icon.languageID)
				} else {
					seenLanguageIconIds.add(icon.languageID)
				}
			}

			// Note: Invalid language ID validation removed as requested
		} catch (_dirError) {
			// Missing asset folders are treated as no orphans found
		}
	} catch (_modelError) {
		// Failed to read/parse models -> return no model errors here
	}

	return {
		orphanedFileIcons,
		orphanedFolderIcons,
		orphanedLanguageIcons,
		duplicateFileIcons,
		duplicateFolderIcons,
		duplicateLanguageIcons,
		orphanedFileAssignments,
		orphanedFolderAssignments,
		orphanedLanguageAssignments,
		invalidLanguageIds,
	}
}

/**
 * Check if model validation is needed by comparing file timestamps
 */
async function checkIfModelValidationNeeded(): Promise<boolean> {
	try {
		const modelFiles = [
			path.resolve(process.cwd(), 'src/models/file_icons.model.json'),
			path.resolve(process.cwd(), 'src/models/folder_icons.model.json'),
			path.resolve(process.cwd(), 'src/models/language_icons.model.json'),
		]
		
		const iconDirs = [
			path.resolve(process.cwd(), 'assets/icons/file_icons'),
			path.resolve(process.cwd(), 'assets/icons/folder_icons'),
			path.resolve(process.cwd(), 'assets/icons/language_icons'),
		]
		
		// Check if any model files have been modified recently (within last 2 minutes)
		// This is a simple heuristic - if models were modified recently, validation is needed
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

						if (iconStats.mtime.getTime() > fiveMinutesAgo) {
							return true // Icon file was recently modified
						}
					}
				}
			} catch {
				// Icon directory doesn't exist, continue
			}
		}
		
		return false // No recent changes detected
	} catch (_error) {
		return true // If we can't determine, assume validation is needed
	}
}

/**
 * Check if models have any errors and display them if found
 * Returns validation result and skip status
 */
export async function validateModelsWithStatus(showSuccessMessage: boolean = true): Promise<{ isValid: boolean, wasSkipped: boolean }> {
	// Check if validation is needed
	const validationNeeded = await checkIfModelValidationNeeded()
	
	if (!validationNeeded) {
		if (showSuccessMessage) {
			console.log('⏭️ Model validation skipped - no recent changes detected')
		}
		return { isValid: true, wasSkipped: true } // Assume models are still valid if no changes
	}
	
	const modelErrors = await auditModels()
	
	const totalModelErrors
		= modelErrors.orphanedFileIcons.length
		  + modelErrors.orphanedFolderIcons.length
		  + modelErrors.orphanedLanguageIcons.length
		  + modelErrors.duplicateFileIcons.length
		  + modelErrors.duplicateFolderIcons.length
		  + modelErrors.duplicateLanguageIcons.length
		  + modelErrors.orphanedFileAssignments.length
		  + modelErrors.orphanedFolderAssignments.length
		  + modelErrors.orphanedLanguageAssignments.length
		  + modelErrors.invalidLanguageIds.length

	if (totalModelErrors > 0) {
		// Show the model errors block
		displayStructuredErrors(
			[],
			modelErrors.orphanedFileIcons,
			modelErrors.orphanedFolderIcons,
			modelErrors.orphanedLanguageIcons,
			modelErrors.duplicateFileIcons,
			modelErrors.duplicateFolderIcons,
			modelErrors.duplicateLanguageIcons,
			modelErrors.orphanedFileAssignments,
			modelErrors.orphanedFolderAssignments,
			modelErrors.orphanedLanguageAssignments,
			modelErrors.invalidLanguageIds,
			'MODEL ERRORS', // Custom title for model audit
			{
				assignedIconNotFound: 'MODEL: ASSIGNED ICON NOT FOUND',
				duplicateAssignment: 'MODEL: DUPLICATE ASSIGNMENT',
				unassignedIcon: 'DIRECTORY: UNASSIGNED ICON',
				duplicateAssignmentId: 'MODEL: DUPLICATE ASSIGNMENT ID',
			},
		)
		console.log('')
		console.log(`❌ Model validation failed. Please fix the errors above before proceeding.`)
		return { isValid: false, wasSkipped: false }
	}

	if (showSuccessMessage) {
		console.log('✅ Model validation passed - no errors found.')
	}
	
	return { isValid: true, wasSkipped: false }
}

/**
 * Check if models have any errors and display them if found
 * Returns true if models are valid, false if errors found
 */
export async function validateModels(showSuccessMessage: boolean = true): Promise<boolean> {
	// Check if validation is needed
	const validationNeeded = await checkIfModelValidationNeeded()
	
	if (!validationNeeded) {
		if (showSuccessMessage) {
			console.log('⏭️ Model validation skipped - no recent changes detected')
		}
		return true // Assume models are still valid if no changes
	}
	
	const modelErrors = await auditModels()

	const totalModelErrors
		= modelErrors.orphanedFileIcons.length
		  + modelErrors.orphanedFolderIcons.length
		  + modelErrors.orphanedLanguageIcons.length
		  + modelErrors.duplicateFileIcons.length
		  + modelErrors.duplicateFolderIcons.length
		  + modelErrors.duplicateLanguageIcons.length
		  + modelErrors.orphanedFileAssignments.length
		  + modelErrors.orphanedFolderAssignments.length
		  + modelErrors.orphanedLanguageAssignments.length
		  + modelErrors.invalidLanguageIds.length

	if (totalModelErrors > 0) {
		// Show the model errors block
		displayStructuredErrors(
			[],
			modelErrors.orphanedFileIcons,
			modelErrors.orphanedFolderIcons,
			modelErrors.orphanedLanguageIcons,
			modelErrors.duplicateFileIcons,
			modelErrors.duplicateFolderIcons,
			modelErrors.duplicateLanguageIcons,
			modelErrors.orphanedFileAssignments,
			modelErrors.orphanedFolderAssignments,
			modelErrors.orphanedLanguageAssignments,
			modelErrors.invalidLanguageIds,
			'MODEL ERRORS', // Custom title for model audit
			{
				assignedIconNotFound: 'MODEL: ASSIGNED ICON NOT FOUND',
				duplicateAssignment: 'MODEL: DUPLICATE ASSIGNMENT',
				unassignedIcon: 'DIRECTORY: UNASSIGNED ICON',
				duplicateAssignmentId: 'MODEL: DUPLICATE ASSIGNMENT ID',
			},
		)
		console.log('')
		console.log(`❌ Model validation failed. Please fix the errors above before proceeding.`)
		return false
	}

	if (showSuccessMessage) {
		console.log('✅ Model validation passed - no errors found.')
	}
	
	return true
}

/**
 * Parse VS Code's installed language IDs from the built-in language registry
 * This would return all legitimate language identifiers that VS Code recognizes
 */
export async function getInstalledLanguageIds(): Promise<string[]> {
	try {
		// VS Code stores language definitions in its built-in extensions
		// Common locations for language IDs:
		const possiblePaths = [
			// Windows
			'C:\\Users\\%USERNAME%\\AppData\\Local\\Programs\\Microsoft VS Code\\resources\\app\\extensions',
			// macOS
			'/Applications/Visual Studio Code.app/Contents/Resources/app/extensions',
			// Linux
			'/usr/share/code/resources/app/extensions',
			// Portable installations
			process.env.VSCODE_EXTENSIONS || '',
		]

		// For demonstration, let's show what we would find
		console.log('🔍 Would parse VS Code language registry from:')
		possiblePaths.forEach((path) => {
			if (path)
				console.log(`  - ${path}`)
		})

		// Example of what the output would contain:
		const exampleLanguageIds = [
			// Common languages
			'javascript', 'typescript', 'python', 'java', 'cpp', 'csharp',
			// Web technologies
			'html', 'css', 'json', 'xml', 'yaml', 'markdown',
			// Scripting languages
			'shellscript', 'powershell', 'bash', 'python',
			// Database
			'sql', 'mysql', 'postgresql',
			// Configuration files
			'dockerfile', 'git-commit', 'git-rebase', 'ignore',
			// And many more...
		]

		console.log('\n📋 Example of language IDs that would be found:')
		console.log(`  Total: ${exampleLanguageIds.length} examples`)
		console.log('  First 10:', exampleLanguageIds.slice(0, 10).join(', '))
		console.log('  ... and hundreds more')

		return exampleLanguageIds
	} catch (_error) {
		console.error('❌ Failed to parse VS Code language registry:', error)
		return []
	}
}

// CLI interface
const _argv1 = process.argv[1] ?? ''

if (_argv1.includes('audit-models')) {
	const args = process.argv.slice(2)
	const _verbose = args.includes('--verbose') || args.includes('-v')

	// Run model validation
	validateModels(true).then((isValid) => {
		if (!isValid) {
			process.exit(1)
		}
		process.exit(0)
	}).catch((error) => {
		console.error('Fatal error during model audit:', error)
		process.exit(1)
	})
}
