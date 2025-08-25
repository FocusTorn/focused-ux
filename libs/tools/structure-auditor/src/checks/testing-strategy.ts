import path from 'node:path'
import fs from 'node:fs'
import { addError } from '../util/errors.js'
import { ROOT } from '../util/helpers.js'

/**
 * Check that test setup files exist and follow canonical structure.
 */
export function checkTestSetupStructure(pkg: string): boolean {
	const coreTestSetupPath = path.join(ROOT, 'packages', pkg, 'core', '__tests__', '_setup.ts')
	const extTestSetupPath = path.join(ROOT, 'packages', pkg, 'ext', '__tests__', '_setup.ts')
	
	let found = false

	// Check core package test setup
	if (fs.existsSync(path.join(ROOT, 'packages', pkg, 'core', '__tests__'))) {
		if (!fs.existsSync(coreTestSetupPath)) {
			addError('Missing test setup file', `packages/${pkg}/core/__tests__/_setup.ts`)
			found = true
		}
	}

	// Check extension package test setup
	if (fs.existsSync(path.join(ROOT, 'packages', pkg, 'ext', '__tests__'))) {
		if (!fs.existsSync(extTestSetupPath)) {
			addError('Missing test setup file', `packages/${pkg}/ext/__tests__/_setup.ts`)
			found = true
		}
	}

	return !found
}

/**
 * Check that test files follow proper organization.
 */
export function checkTestOrganization(pkg: string): boolean {
	const coreTestsDir = path.join(ROOT, 'packages', pkg, 'core', '__tests__')
	const extTestsDir = path.join(ROOT, 'packages', pkg, 'ext', '__tests__')
	
	let found = false

	// Check core package test organization
	if (fs.existsSync(coreTestsDir)) {
		const entries = fs.readdirSync(coreTestsDir, { withFileTypes: true })
		const hasFunctionalDir = entries.some(entry => entry.isDirectory() && entry.name === 'functional')
		const hasUnitDir = entries.some(entry => entry.isDirectory() && entry.name === 'unit')

		if (!hasFunctionalDir && !hasUnitDir) {
			addError('Poor test organization', `packages/${pkg}/core/__tests__/: Should have functional/ and/or unit/ directories`)
			found = true
		}
	}

	// Check extension package test organization
	if (fs.existsSync(extTestsDir)) {
		const entries = fs.readdirSync(extTestsDir, { withFileTypes: true })
		const hasFunctionalDir = entries.some(entry => entry.isDirectory() && entry.name === 'functional')
		const hasUnitDir = entries.some(entry => entry.isDirectory() && entry.name === 'unit')

		if (!hasFunctionalDir && !hasUnitDir) {
			addError('Poor test organization', `packages/${pkg}/ext/__tests__/: Should have functional/ and/or unit/ directories`)
			found = true
		}
	}

	return !found
}

/**
 * Check that no test files import from shared or mockly.
 */
export function checkTestFileImports(pkg: string): boolean {
	const pkgDir = path.join(ROOT, 'packages', pkg)
	let found = false

	function scanTestFiles(dir: string) {
		if (!fs.existsSync(dir)) {
			return
		}

		for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
			const full = path.join(dir, entry.name)

			// Skip node_modules directories
			if (entry.isDirectory() && entry.name === 'node_modules') {
				continue
			}

			if (entry.isDirectory()) {
				scanTestFiles(full)
				continue
			}

			if (!entry.name.endsWith('.test.ts') && !entry.name.endsWith('.spec.ts')) {
				continue
			}

			const content = fs.readFileSync(full, 'utf-8')
			const lines = content.split('\n')

			// Check for forbidden imports (only @fux/mockly, @fux/shared is handled by architecture check)
			const forbiddenPatterns = [
				/from\s+['"]@fux\/mockly['"]/,
				/import.*@fux\/mockly/,
			]

			for (let i = 0; i < lines.length; i++) {
				const line = lines[i]
				
				for (const pattern of forbiddenPatterns) {
					if (pattern.test(line)) {
						const rel = path.relative(ROOT, full)
						addError('CRITICAL: Test file imports forbidden package', 
							`${rel}:${i + 1}:1 - Test files must not import from @fux/mockly`)
						found = true
					}
				}
			}
		}
	}

	// Scan both core and ext test directories
	const coreTestsDir = path.join(pkgDir, 'core', '__tests__')
	const extTestsDir = path.join(pkgDir, 'ext', '__tests__')

	if (fs.existsSync(coreTestsDir)) {
		scanTestFiles(coreTestsDir)
	}
	if (fs.existsSync(extTestsDir)) {
		scanTestFiles(extTestsDir)
	}

	return !found
}
