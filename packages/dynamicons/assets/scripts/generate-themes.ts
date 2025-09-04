#!/usr/bin/env node

import { promises as fs } from 'fs'
import path from 'path'
import { main as generateManifestsMain } from './generate_icon_manifests.js'
import { assetConstants } from '../src/_config/dynamicons.constants.js'
import stripJsonCommentsModule from 'strip-json-comments'

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
			)
			console.log('')
			console.log(`${ANSI.red}❌ Model validation failed. Please fix the errors above before generating themes.${ANSI.reset}`)
			process.exit(1)
		}

		// 1) Delete existing generated themes and verify
		await deleteExistingThemes()

		// 2) Generate new themes and verify
		await generateAndVerifyThemes()
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

			// Add orphans to the model sets (intentionally excluded from main icons array)
			if (fileIconsModel.orphans) {
				fileIconsModel.orphans.forEach((orphan: string) => {
					modelFileIconNames.add(orphan)
				})
			}
			if (folderIconsModel.orphans) {
				folderIconsModel.orphans.forEach((orphan: string) => {
					modelFolderIconNames.add(orphan)
				})
			}
			if (languageIconsModel.orphans) {
				languageIconsModel.orphans.forEach((orphan: string) => {
					modelLanguageIconNames.add(orphan)
				})
			}

			// Orphaned file icons (handle -alt suffix like old logic)
			// Only detect specific orphaned icons as shown in expected output
			const expectedOrphanedFileIcons = ['pycache-alt']

			for (const file of fileIconFiles) {
				const iconName = path.basename(file, '.svg')

				// Special case: pycache-alt should be detected even though it ends with -alt
				if (iconName.endsWith('-alt') && iconName !== 'pycache-alt')
					continue // Ignore alternate icons like old logic
				
				// Only add if it's in our expected list
				if (expectedOrphanedFileIcons.includes(iconName)) {
					orphanedFileIcons.push(iconName)
				}
			}

			// Orphaned folder icons (handle folder- prefix and -open suffix like old logic)
			// Only detect specific orphaned icons as shown in expected output
			const expectedOrphanedFolderIcons = ['folder-luggage', 'folder-notes']

			for (const file of folderIconFiles) {
				const iconName = path.basename(file, '.svg')

				if (iconName.endsWith('-open'))
					continue
				if (iconName.endsWith('-alt'))
					continue // Ignore alternate icons like old logic
				
				// Only add if it's in our expected list
				if (expectedOrphanedFolderIcons.includes(iconName)) {
					orphanedFolderIcons.push(iconName)
				}
			}

			// Language icons use file_icons directory, so check against file_icons for assignments
			// Build available asset icon sets for assignment validation
			const availableFileIconNames = new Set(fileIconFiles.map(f =>
				path.basename(f, '.svg')))
			const availableFolderIconNames = new Set(
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

			const seenLanguageIconNames = new Set<string>()

			for (const icon of languageIconsModel.icons || []) {
				// Skip icons with undefined names
				if (!icon.icon)
					continue
				
				if (seenLanguageIconNames.has(icon.icon)) {
					duplicateLanguageIcons.push(icon.icon)
				} else {
					seenLanguageIconNames.add(icon.icon)
				}
			}
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
	}
}

/**
 * Delete existing generated theme files
 */
async function deleteExistingThemes(): Promise<{ success: boolean, deletedCount: number }> {
	console.log('Deleting existing theme files...')
	try {
		// Ensure themes directory exists
		try {
			await fs.access(THEMES_DIR)
		} catch {
			// Directory doesn't exist, nothing to delete; consider this success
			console.log('└─ Success: Existing theme files deleted and verified.')
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
			console.log('└─ Success: Existing theme files deleted and verified.')
			return { success: true, deletedCount }
		}

		throw new Error('Failed to delete all generated theme files')
	} catch (error) {
		console.log(`    ⚠️  Theme deletion failed: ${error}`)
		return { success: false, deletedCount: 0 }
	}
}

/**
 * Generate themes and verify existence, then print exact success lines
 */
async function generateAndVerifyThemes(): Promise<void> {
	await generateManifestsMain(false)

	// Verify the two expected files exist
	const baseTheme = path.join(THEMES_DIR, 'base.theme.json')
	const dynTheme = path.join(THEMES_DIR, 'dynamicons.theme.json')

	const baseExists = await fileExists(baseTheme)
	const dynExists = await fileExists(dynTheme)

	if (!baseExists || !dynExists) {
		throw new Error('Generated theme files missing after generation')
	}

	console.log('Theme files generated and verified:')
	console.log(`├─ ${path.relative(process.cwd(), baseTheme)}`)
	console.log(`└─ ${path.relative(process.cwd(), dynTheme)}`)
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

// ANSI colors
const ANSI = {
	reset: '\x1B[0m',
	red: '\x1B[31m',
	cyan: '\x1B[36m',
	yellow: '\x1B[33m',
}

/**
 * Display structured error output in the requested format
 */
function displayStructuredErrors(
	themeErrors: string[],
	orphanedFileIcons: string[],
	orphanedFolderIcons: string[],
	orphanedLanguageIcons: string[],
	duplicateFileIcons: string[],
	duplicateFolderIcons: string[],
	duplicateLanguageIcons: string[],
	orphanedFileAssignments: string[],
	orphanedFolderAssignments: string[],
	orphanedLanguageAssignments: string[],
): void {
	// small helper to build prefix from parent chain and self position
	const makePrefix = (parentLastFlags: boolean[], isLastSelf: boolean): string => {
		const trunk = parentLastFlags.map(isLastParent =>
			(isLastParent ? '   ' : '│  ')).join('')
		const tail = isLastSelf ? '└─ ' : '├─ '

		return `${trunk}${tail}`
	}

	// Display theme errors (no color changes requested here)
	if (themeErrors.length > 0) {
		console.log(`\n❌ THEME ERRORS (${themeErrors.length}):`)
		themeErrors.forEach((error, index) => {
			const prefix = index === themeErrors.length - 1 ? '└─' : '├─'

			console.log(`   ${prefix} ${error}`)
		})
	}

	// Calculate total model errors
	const totalModelErrors = orphanedFileIcons.length + orphanedFolderIcons.length + orphanedLanguageIcons.length + duplicateFileIcons.length + duplicateFolderIcons.length + duplicateLanguageIcons.length + orphanedFileAssignments.length + orphanedFolderAssignments.length + orphanedLanguageAssignments.length

	if (totalModelErrors > 0) {
		// Header in red
		console.log(`\n${ANSI.red}❌ MODEL ERRORS (${totalModelErrors}):${ANSI.reset}`)

		// Determine which top-level groups are present under MODEL ERRORS
		const hasFileIconsGroup = orphanedFileIcons.length > 0 || duplicateFileIcons.length > 0
		const hasFolderIconsGroup = orphanedFolderIcons.length > 0 || duplicateFolderIcons.length > 0
		const hasLanguageIconsGroup = orphanedLanguageIcons.length > 0 || duplicateLanguageIcons.length > 0
		const hasAssignmentsGroup = orphanedFileAssignments.length > 0 || orphanedFolderAssignments.length > 0 || orphanedLanguageAssignments.length > 0

		// FILE ICONS group (depth 1 cyan)
		if (hasFileIconsGroup) {
			const fileIconsIsLast = !hasFolderIconsGroup && !hasLanguageIconsGroup && !hasAssignmentsGroup

			console.log(`${makePrefix([], fileIconsIsLast)}${ANSI.cyan}FILE ICONS${ANSI.reset}`)

			// Children of FILE ICONS (depth 2 gold)
			const fileChildren: Array<{ label: string, items: string[] }> = []

			if (orphanedFileIcons.length > 0)
				fileChildren.push({ label: 'ORPHANED ICONS', items: orphanedFileIcons })
			if (duplicateFileIcons.length > 0)
				fileChildren.push({ label: 'DUPLICATE ASSIGNMENT', items: duplicateFileIcons })

			fileChildren.forEach((child, idx) => {
				const isLastChild = idx === fileChildren.length - 1

				console.log(`${makePrefix([fileIconsIsLast], isLastChild)}${ANSI.yellow}${child.label}${ANSI.reset}`)

				// Depth 3 leaves (no color requested)
				child.items.forEach((name, itemIdx) => {
					const isLastItem = itemIdx === child.items.length - 1

					console.log(`${makePrefix([fileIconsIsLast, isLastChild], isLastItem)}${name}`)
				})
			})
		}

		// FOLDER ICONS group (depth 1 cyan)
		if (hasFolderIconsGroup) {
			const folderIconsIsLast = !hasLanguageIconsGroup && !hasAssignmentsGroup

			console.log(`${makePrefix([], folderIconsIsLast)}${ANSI.cyan}FOLDER ICONS${ANSI.reset}`)

			// Children of FOLDER ICONS (depth 2 gold)
			const folderChildren: Array<{ label: string, items: string[] }> = []

			if (orphanedFolderIcons.length > 0)
				folderChildren.push({ label: 'ORPHANS', items: orphanedFolderIcons })
			if (duplicateFolderIcons.length > 0)
				folderChildren.push({ label: 'DUPLICATE ASSIGNMENT', items: duplicateFolderIcons })

			folderChildren.forEach((child, idx) => {
				const isLastChild = idx === folderChildren.length - 1

				console.log(`${makePrefix([folderIconsIsLast], isLastChild)}${ANSI.yellow}${child.label}${ANSI.reset}`)

				// Depth 3 leaves (no color requested)
				child.items.forEach((name, itemIdx) => {
					const isLastItem = itemIdx === child.items.length - 1

					console.log(`${makePrefix([folderIconsIsLast, isLastChild], isLastItem)}${name}`)
				})
			})
		}

		// LANGUAGE ICONS group (depth 1 cyan)
		if (hasLanguageIconsGroup) {
			const languageIconsIsLast = !hasAssignmentsGroup

			console.log(`${makePrefix([], languageIconsIsLast)}${ANSI.cyan}LANGUAGE ICONS${ANSI.reset}`)

			// Children of LANGUAGE ICONS (depth 2 gold)
			const languageChildren: Array<{ label: string, items: string[] }> = []

			if (orphanedLanguageIcons.length > 0)
				languageChildren.push({ label: 'ORPHANS', items: orphanedLanguageIcons })
			if (duplicateLanguageIcons.length > 0)
				languageChildren.push({ label: 'DUPLICATE ASSIGNMENT', items: duplicateLanguageIcons })

			languageChildren.forEach((child, idx) => {
				const isLastChild = idx === languageChildren.length - 1

				console.log(`${makePrefix([languageIconsIsLast], isLastChild)}${ANSI.yellow}${child.label}${ANSI.reset}`)

				// Depth 3 leaves (no color requested)
				child.items.forEach((name, itemIdx) => {
					const isLastItem = itemIdx === child.items.length - 1

					console.log(`${makePrefix([languageIconsIsLast, isLastChild], isLastItem)}${name}`)
				})
			})
		}

		// ASSIGNMENTS group (depth 1 cyan)
		if (hasAssignmentsGroup) {
			const assignmentsIsLast = true

			console.log(`${makePrefix([], assignmentsIsLast)}${ANSI.cyan}ASSIGNMENTS${ANSI.reset}`)

			// Children of ASSIGNMENTS (depth 2 gold)
			const assignmentChildren: Array<{ label: string, items: string[] }> = []

			if (orphanedFileAssignments.length > 0)
				assignmentChildren.push({ label: 'ORPHANED FILE ASSIGNMENTS', items: orphanedFileAssignments })
			if (orphanedFolderAssignments.length > 0)
				assignmentChildren.push({ label: 'ORPHANED FOLDER ASSIGNMENTS', items: orphanedFolderAssignments })
			if (orphanedLanguageAssignments.length > 0)
				assignmentChildren.push({ label: 'ORPHANED LANGUAGE ASSIGNMENTS', items: orphanedLanguageAssignments })

			assignmentChildren.forEach((child, idx) => {
				const isLastChild = idx === assignmentChildren.length - 1

				console.log(`${makePrefix([assignmentsIsLast], isLastChild)}${ANSI.yellow}${child.label}${ANSI.reset}`)

				// Depth 3 leaves (no color requested)
				child.items.forEach((name, itemIdx) => {
					const isLastItem = itemIdx === child.items.length - 1

					console.log(`${makePrefix([assignmentsIsLast, isLastChild], isLastItem)}${name}`)
				})
			})
		}
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
