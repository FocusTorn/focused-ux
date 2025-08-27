import path from 'node:path'
import fs from 'node:fs'
import { addError } from '../util/errors.js'
import { ROOT } from '../util/helpers.js'

/**
 * Check that core packages NEVER import from @fux/shared during tests.
 * This is a critical architectural rule from FocusedUX-Testing-Strategy.md
 */
export function checkNoSharedImportsInCoreTests(pkg: string): boolean {
	const coreTestDir = path.join(ROOT, 'packages', pkg, 'core', '__tests__')
	let found = false

	if (!fs.existsSync(coreTestDir)) {
		return true
	}

	function scanDir(dir: string) {
		if (!fs.existsSync(dir)) {
			return
		}

		for (const entry of fs.readdirSync(dir)) {
			const full = path.join(dir, entry)
			const stat = fs.statSync(full)

			if (stat.isDirectory()) {
				scanDir(full)
				continue
			}

			if (!entry.endsWith('.ts')) {
				continue
			}

			const content = fs.readFileSync(full, 'utf-8')
			const lines = content.split('\n')
			const sharedImportRegex = /import.*from\s+['"]@fux\/shared['"]/g

			for (let i = 0; i < lines.length; i++) {
				const line = lines[i]
				const matches = line.match(sharedImportRegex)

				if (matches) {
					const rel = path.relative(ROOT, full)
					addError('CRITICAL: Core package importing from @fux/shared during tests', 
						`${rel}:${i + 1}:1 - Core packages should NEVER import from @fux/shared during tests. Use Mockly instead.`)
					found = true
				}
			}
		}
	}

	scanDir(coreTestDir)
	return !found
}

/**
 * Check that extension packages follow the thin wrapper principle.
 * Extension packages should only test VSCode integration, not business logic.
 */
export function checkExtensionThinWrapperPrinciple(pkg: string): boolean {
	const extTestDir = path.join(ROOT, 'packages', pkg, 'ext', '__tests__')
	let found = false

	if (!fs.existsSync(extTestDir)) {
		return true
	}

	function scanDir(dir: string) {
		if (!fs.existsSync(dir)) {
			return
		}

		for (const entry of fs.readdirSync(dir)) {
			const full = path.join(dir, entry)
			const stat = fs.statSync(full)

			if (stat.isDirectory()) {
				scanDir(full)
				continue
			}

			if (!entry.endsWith('.ts')) {
				continue
			}

			const content = fs.readFileSync(full, 'utf-8')
			const lines = content.split('\n')

			// Check for business logic testing patterns that should be in core
			const businessLogicPatterns = [
				/describe\(['"]File System Operations['"]/,
				/describe\(['"]Business Logic['"]/,
				/it\(['"]should copy files['"]/,
				/it\(['"]should process data['"]/,
				/it\(['"]should validate input['"]/,
			]

			for (let i = 0; i < lines.length; i++) {
				const line = lines[i]
				
				for (const pattern of businessLogicPatterns) {
					if (pattern.test(line)) {
						const rel = path.relative(ROOT, full)
						addError('Extension testing business logic', 
							`${rel}:${i + 1}:1 - Extension packages should only test VSCode integration, not business logic. Move to core package tests.`)
						found = true
					}
				}
			}
		}
	}

	scanDir(extTestDir)
	return !found
}

/**
 * Check that test files use proper Mockly integration patterns.
 */
export function checkMocklyIntegrationPatterns(pkg: string): boolean {
	const testDirs = [
		path.join(ROOT, 'packages', pkg, 'core', '__tests__'),
		path.join(ROOT, 'packages', pkg, 'ext', '__tests__'),
	]
	let found = false

	function scanDir(dir: string) {
		if (!fs.existsSync(dir)) {
			return
		}

		for (const entry of fs.readdirSync(dir)) {
			const full = path.join(dir, entry)
			const stat = fs.statSync(full)

			if (stat.isDirectory()) {
				scanDir(full)
				continue
			}

			if (!entry.endsWith('.ts')) {
				continue
			}

			const content = fs.readFileSync(full, 'utf-8')
			const lines = content.split('\n')

			// Check for hard-coded mocks instead of Mockly
			const hardCodedMockPatterns = [
				/vi\.mock\(['"]@fux\/shared['"]/,
				/mockReturnValue\(\{[^}]*\}/,
				/mockImplementation\(\{[^}]*\}/,
			]

			for (let i = 0; i < lines.length; i++) {
				const line = lines[i]
				
				for (const pattern of hardCodedMockPatterns) {
					if (pattern.test(line)) {
						const rel = path.relative(ROOT, full)
						addError('Hard-coded mocks instead of Mockly', 
							`${rel}:${i + 1}:1 - Use Mockly shims instead of hard-coded mocks. "If you're mocking @fux/shared, you're doing it wrong."`)
						found = true
					}
				}
			}
		}
	}

	for (const dir of testDirs) {
		scanDir(dir)
	}

	return !found
}

/**
 * Check that test setup files follow proper patterns.
 */
export function checkTestSetupPatterns(pkg: string): boolean {
	const setupFiles = [
		path.join(ROOT, 'packages', pkg, 'core', '__tests__', '_setup.ts'),
		path.join(ROOT, 'packages', pkg, 'ext', '__tests__', '_setup.ts'),
	]
	let found = false

	for (const setupFile of setupFiles) {
		if (!fs.existsSync(setupFile)) {
			continue
		}

		const content = fs.readFileSync(setupFile, 'utf-8')
		const lines = content.split('\n')

		// Check for proper mock clearing in beforeEach
		let hasBeforeEach = false
		let hasMockClear = false

		for (let i = 0; i < lines.length; i++) {
			const line = lines[i]
			
			if (line.includes('beforeEach')) {
				hasBeforeEach = true
			}
			
			if (line.includes('.mockClear()')) {
				hasMockClear = true
			}
		}

		if (hasBeforeEach && !hasMockClear) {
			const rel = path.relative(ROOT, setupFile)
			addError('Missing mock clearing in test setup', 
				`${rel}: Test setup should clear mocks in beforeEach to prevent test interference`)
			found = true
		}
	}

	return !found
} 