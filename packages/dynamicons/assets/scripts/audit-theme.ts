#!/usr/bin/env node

import { promises as fs } from 'fs'
import path from 'path'
import { assetConstants } from '../src/_config/dynamicons.constants.js'

const THEMES_DIR = path.resolve(process.cwd(), assetConstants.paths.distThemesDir)

/**
 * Theme audit result interface
 */
export interface ThemeAuditResult {
	success: boolean
	themeCount: number
	invalidThemes: string[]
	missingThemes: string[]
	expectedThemes: string[]
}

/**
 * Verify that theme generation was successful
 * Checks for theme file existence and JSON validity
 */
export async function verifyThemeGeneration(): Promise<ThemeAuditResult> {
	const expectedThemes = ['base.theme.json', 'dynamicons.theme.json']
	const invalidThemes: string[] = []
	const missingThemes: string[] = []

	try {
		// Check if themes directory exists
		try {
			await fs.access(THEMES_DIR)
		} catch {
			return {
				success: false,
				themeCount: 0,
				invalidThemes,
				missingThemes,
				expectedThemes
			}
		}

		// Count theme files
		const themeFiles = await fs.readdir(THEMES_DIR)
		const generatedThemes = themeFiles.filter(
			file =>
				file.endsWith('.theme.json') && !file.includes('focused-ux-colors'),
		)

		// Verify we have at least some themes
		if (generatedThemes.length === 0) {
			return {
				success: false,
				themeCount: 0,
				invalidThemes,
				missingThemes: expectedThemes,
				expectedThemes
			}
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
				invalidThemes.push(themeFile)
			}
		}

		// Check for missing expected themes
		for (const expectedTheme of expectedThemes) {
			if (!generatedThemes.includes(expectedTheme)) {
				missingThemes.push(expectedTheme)
			}
		}

		return {
			success: validThemes > 0 && missingThemes.length === 0,
			themeCount: validThemes,
			invalidThemes,
			missingThemes,
			expectedThemes
		}
	} catch (_error) {
		return {
			success: false,
			themeCount: 0,
			invalidThemes,
			missingThemes: expectedThemes,
			expectedThemes
		}
	}
}

/**
 * Validate theme files and display results
 * Returns true if themes are valid, false if errors found
 */
export async function validateThemes(): Promise<boolean> {
	const auditResult = await verifyThemeGeneration()

	if (!auditResult.success) {
		console.log(`\n❌ Theme validation failed:`)
		
		if (auditResult.missingThemes.length > 0) {
			console.log(`  Missing themes: ${auditResult.missingThemes.join(', ')}`)
		}
		
		if (auditResult.invalidThemes.length > 0) {
			console.log(`  Invalid JSON themes: ${auditResult.invalidThemes.join(', ')}`)
		}
		
		if (auditResult.themeCount === 0) {
			console.log(`  No valid theme files found`)
		}
		
		return false
	}

	console.log(`✅ Theme validation passed - ${auditResult.themeCount} valid themes found.`)
	return true
}

/**
 * Check if a file exists
 */
async function fileExists(p: string): Promise<boolean> {
	try {
		await fs.access(p)
		return true
	} catch {
		return false
	}
}

/**
 * Verify specific theme files exist
 */
export async function verifyThemeFilesExist(): Promise<{ success: boolean, missingFiles: string[] }> {
	const expectedFiles = [
		path.join(THEMES_DIR, 'base.theme.json'),
		path.join(THEMES_DIR, 'dynamicons.theme.json')
	]
	
	const missingFiles: string[] = []
	
	for (const file of expectedFiles) {
		if (!(await fileExists(file))) {
			missingFiles.push(path.relative(process.cwd(), file))
		}
	}
	
	return {
		success: missingFiles.length === 0,
		missingFiles
	}
}

// CLI interface
const _argv1 = process.argv[1] ?? ''

if (_argv1.includes('audit-theme')) {
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
