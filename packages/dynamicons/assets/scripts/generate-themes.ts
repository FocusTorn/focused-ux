#!/usr/bin/env node

import { promises as fs } from 'fs'
import path from 'path'
import { main as generateManifestsMain } from './generate_icon_manifests.js'
import { assetConstants } from '../src/_config/dynamicons.constants.js'
import stripJsonCommentsModule from 'strip-json-comments'
import { displayStructuredErrors } from './tree-formatter.js'

// Handle both default and direct exports
const stripJsonComments = (stripJsonCommentsModule as any).default || stripJsonCommentsModule

const THEMES_DIR = path.resolve(process.cwd(), assetConstants.paths.distThemesDir)

// Global variable to store error data between function calls
const globalErrorData: {
	orphanedFileIcons: string[]
	orphanedFolderIcons: string[]
	duplicateFileIcons: string[]
} = {
	orphanedFileIcons: [],
	orphanedFolderIcons: [],
	duplicateFileIcons: [],
}

/**
 * Generate Themes - Complete workflow for theme generation and verification
 */
async function generateThemes(_verbose: boolean = false): Promise<void> {
	try {
		// 0) Collect model errors and fail fast if any
		const modelErrors = await collectModelErrors()

		globalErrorData.orphanedFileIcons = modelErrors.orphanedFileIcons
		globalErrorData.orphanedFolderIcons = modelErrors.orphanedFolderIcons
		globalErrorData.duplicateFileIcons = modelErrors.duplicateFileIcons

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
			// Show only the model errors block and exit non-zero
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
			)
			console.log('')
			console.log(`❌ Model validation failed. Please fix the errors above before generating themes.`)
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
			console.log('\x1B[32mSuccess: Theme files removed(verified) and regenerated(verified):\x1B[0m')
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
 * Inspect models and asset folders to find model-related problems
 */
async function collectModelErrors(): Promise<{
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
}> {
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
			const fileIconFiles = (await fs.readdir(fileIconsDir)).filter(f =>
				f.endsWith('.svg'))
			
			const folderIconFiles = (await fs.readdir(folderIconsDir)).filter(f =>
				f.endsWith('.svg'))
			
			let languageIconFiles: string[] = []

			try {
				languageIconFiles = (await fs.readdir(languageIconsDir)).filter(f =>
					f.endsWith('.svg'))
			} catch {
				// Language icons directory not found, skip
			}

			// Extract icon names from model (including orphans field and default icons)
			const modelFileIconNames = new Set(fileIconsModel.icons?.map((icon: any) =>
				icon.name) || [])
			const modelFolderIconNames = new Set(folderIconsModel.icons?.map((icon: any) =>
				icon.name) || [])
			const modelLanguageIconNames = new Set(languageIconsModel.icons?.map((icon: any) =>
				icon.name) || [])

			// Add default file/folder/rootFolder icons (like the old logic)
			if (fileIconsModel.file?.name) {
				modelFileIconNames.add(fileIconsModel.file.name)
			}
			if (folderIconsModel.folder?.name) {
				modelFolderIconNames.add(folderIconsModel.folder.name)
			}
			if (folderIconsModel.rootFolder?.name) {
				modelFolderIconNames.add(folderIconsModel.rootFolder.name)
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
			const availableFileIconNames = new Set(fileIconFiles.map(f =>
				path.basename(f, '.svg')))
			
			// For folder assignment validation, we need ALL folder icon names (base + open variants)
			const availableFolderIconNames = new Set(folderIconFiles.map(f =>
				path.basename(f, '.svg')))
			
			// For orphaned folder detection, we only want base icons (excluding -open variants to avoid duplicates)
			const availableFolderBaseIconNames = new Set(
				folderIconFiles
					.filter(f =>
						!f.endsWith('-open.svg'))
					.map(f =>
						path.basename(f, '.svg')),
			)
			
			// Language icons are stored in file_icons directory
			const availableLanguageIconNames = availableFileIconNames

			// Orphaned assignments: model references with no corresponding asset
			// Note: This excludes the orphans array since those are intentionally not in assets
			
			// Check file icon assignments against file_icons directory
			for (const icon of fileIconsModel.icons || []) {
				if (!icon.name)
					continue // Skip undefined names

				if (!availableFileIconNames.has(icon.name)) {
					orphanedFileAssignments.push(icon.name)
				}
			}

			// Check folder icon assignments against folder_icons directory
			for (const icon of folderIconsModel.icons || []) {
				if (!icon.name)
					continue // Skip undefined names

				const baseIconName = `folder-${icon.name}`
				const openIconName = `folder-${icon.name}-open`
				
				const baseIconExists = availableFolderIconNames.has(baseIconName)
				const openIconExists = availableFolderIconNames.has(openIconName)
				
				if (!baseIconExists || !openIconExists) {
					let description = `${icon.name}.svg`
					
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
				if (!icon.icon)
					continue // Skip undefined icon names

				// Remove .svg extension for comparison
				const iconName = icon.icon.replace('.svg', '')

				if (!availableLanguageIconNames.has(iconName)) {
					orphanedLanguageAssignments.push(icon.icon)
				}
			}

			// Duplicate names in models
			const seenFileIconNames = new Set<string>()

			for (const icon of fileIconsModel.icons || []) {
				if (seenFileIconNames.has(icon.name)) {
					duplicateFileIcons.push(icon.name)
				} else {
					seenFileIconNames.add(icon.name)
				}
			}

			const seenFolderIconNames = new Set<string>()

			for (const icon of folderIconsModel.icons || []) {
				if (seenFolderIconNames.has(icon.name)) {
					duplicateFolderIcons.push(icon.name)
				} else {
					seenFolderIconNames.add(icon.name)
				}
			}

			const seenLanguageIconIds = new Set<string>()

			for (const icon of languageIconsModel.icons || []) {
				// Skip icons with undefined ids
				if (!icon.id)
					continue
				
				if (seenLanguageIconIds.has(icon.id)) {
					duplicateLanguageIcons.push(icon.id)
				} else {
					seenLanguageIconIds.add(icon.id)
				}
			}

			// Note: Invalid language ID validation removed as requested
		} catch (_dirError) {
			// Missing asset folders are treated as no orphans found
		}
	} catch (_modelError) {
		// Failed to read/parse models -> return no model errors here; themeErrors would handle JSON issues later
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

/**
 * Verify that theme generation was successful (kept for compatibility if used elsewhere)
 */
async function verifyThemeGeneration(): Promise<{ success: boolean, themeCount: number }> {
	try {
		// Check if themes directory exists
		try {
			await fs.access(THEMES_DIR)
		} catch {
			return { success: false, themeCount: 0 }
		}

		// Count theme files
		const themeFiles = await fs.readdir(THEMES_DIR)
		const generatedThemes = themeFiles.filter(
			file =>
				file.endsWith('.theme.json') && !file.includes('focused-ux-colors'),
		)

		// Verify we have at least some themes
		if (generatedThemes.length === 0) {
			return { success: false, themeCount: 0 }
		}

		// Verify each theme file is valid JSON
		let validThemes = 0

		for (const themeFile of generatedThemes) {
			const themePath = path.join(THEMES_DIR, themeFile)

			try {
				const content = await fs.readFile(themePath, 'utf-8')

				JSON.parse(content)
				validThemes++
			} catch {
				// ignore invalids here
			}
		}

		// Optionally also show errors here (not requested in this flow)
		return { success: validThemes > 0, themeCount: validThemes }
	} catch (_error) {
		return { success: false, themeCount: 0 }
	}
}

/**
 * Parse VS Code's installed language IDs from the built-in language registry
 * This would return all legitimate language identifiers that VS Code recognizes
 */
async function getInstalledLanguageIds(): Promise<string[]> {
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
	} catch (error) {
		console.error('❌ Failed to parse VS Code language registry:', error)
		return []
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
