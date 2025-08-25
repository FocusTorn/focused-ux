import path from 'node:path'
import fs from 'node:fs'
import { addError } from '../util/errors.js'
import { ROOT } from '../util/helpers.js'
import { readJson } from '../util/fs.js'

/**
 * Check that core package tsconfig.json matches canonical template.
 */
export function checkTsconfigCore(pkg: string): boolean {
	const tsconfigPath = path.join(ROOT, 'packages', pkg, 'core', 'tsconfig.json')
	const templatePath = path.join(ROOT, 'libs', 'tools', 'structure-auditor', 'templates', 'tsconfig.core.json')
	
	if (!fs.existsSync(tsconfigPath)) {
		addError('Missing tsconfig.json', `packages/${pkg}/core`)
		return false
	}

	if (!fs.existsSync(templatePath)) {
		addError('Missing canonical template', `libs/tools/structure-auditor/templates/tsconfig.core.json`)
		return false
	}

	const tsconfig = readJson(tsconfigPath)
	const template = readJson(templatePath)

	if (!tsconfig || !template) {
		return false
	}

	// Compare the configurations
	if (JSON.stringify(tsconfig, null, 4) !== JSON.stringify(template, null, 4)) {
		const relativeTemplatePath = path.relative(ROOT, templatePath).replace(/\\/g, '/')

		addError('Non-canonical tsconfig.json', `packages/${pkg}/core/tsconfig.json: Must match ${relativeTemplatePath}:1:1`)
		return false
	}

	return true
}

/**
 * Check that core package tsconfig.lib.json matches canonical template.
 */
export function checkTsconfigCoreLib(pkg: string): boolean {
	const tsconfigPath = path.join(ROOT, 'packages', pkg, 'core', 'tsconfig.lib.json')
	const templatePath = path.join(ROOT, 'libs', 'tools', 'structure-auditor', 'templates', 'tsconfig.core.lib.json')
	
	if (!fs.existsSync(tsconfigPath)) {
		addError('Missing tsconfig.lib.json', `packages/${pkg}/core`)
		return false
	}

	if (!fs.existsSync(templatePath)) {
		addError('Missing canonical template', `libs/tools/structure-auditor/templates/tsconfig.core.lib.json`)
		return false
	}

	const tsconfig = readJson(tsconfigPath)
	const template = readJson(templatePath)

	if (!tsconfig || !template) {
		return false
	}

	// Compare the configurations
	if (JSON.stringify(tsconfig, null, 4) !== JSON.stringify(template, null, 4)) {
		const relativeTemplatePath = path.relative(ROOT, templatePath).replace(/\\/g, '/')

		addError('Non-canonical tsconfig.lib.json', `packages/${pkg}/core/tsconfig.lib.json: Must match ${relativeTemplatePath}:1:1`)
		return false
	}

	return true
}

/**
 * Check that extension package tsconfig.json matches canonical template.
 */
export function checkTsconfigExt(pkg: string): boolean {
	const tsconfigPath = path.join(ROOT, 'packages', pkg, 'ext', 'tsconfig.json')
	const templatePath = path.join(ROOT, 'libs', 'tools', 'structure-auditor', 'templates', 'tsconfig.ext.json')
	
	if (!fs.existsSync(tsconfigPath)) {
		addError('Missing tsconfig.json', `packages/${pkg}/ext`)
		return false
	}

	if (!fs.existsSync(templatePath)) {
		addError('Missing canonical template', `libs/tools/structure-auditor/templates/tsconfig.ext.json`)
		return false
	}

	const tsconfig = readJson(tsconfigPath)
	const template = readJson(templatePath)

	if (!tsconfig || !template) {
		return false
	}

	// Compare the configurations
	if (JSON.stringify(tsconfig, null, 4) !== JSON.stringify(template, null, 4)) {
		const relativeTemplatePath = path.relative(ROOT, templatePath).replace(/\\/g, '/')

		addError('Non-canonical tsconfig.json', `packages/${pkg}/ext/tsconfig.json: Must match ${relativeTemplatePath}:1:1`)
		return false
	}

	return true
}

/**
 * Check that core package vitest.config.ts matches canonical template.
 */
export function checkVitestConfig(pkg: string): boolean {
	const vitestPath = path.join(ROOT, 'packages', pkg, 'core', 'vitest.config.ts')
	const templatePath = path.join(ROOT, 'libs', 'tools', 'structure-auditor', 'templates', 'vitest.config.ts')
	
	if (!fs.existsSync(vitestPath)) {
		addError('Missing vitest.config.ts', `packages/${pkg}/core`)
		return false
	}

	if (!fs.existsSync(templatePath)) {
		addError('Missing canonical template', `libs/tools/structure-auditor/templates/vitest.config.ts`)
		return false
	}

	const vitestContent = fs.readFileSync(vitestPath, 'utf-8')
	const templateContent = fs.readFileSync(templatePath, 'utf-8')

	// Compare the content exactly
	if (vitestContent !== templateContent) {
		const relativeTemplatePath = path.relative(ROOT, templatePath).replace(/\\/g, '/')

		addError('Non-canonical vitest.config.ts', `packages/${pkg}/core/vitest.config.ts: Must match ${relativeTemplatePath}:1:1`)
		return false
	}

	return true
}

/**
 * Check that core package vitest.coverage.config.ts matches canonical template.
 */
export function checkVitestCoverageConfig(pkg: string): boolean {
	const vitestPath = path.join(ROOT, 'packages', pkg, 'core', 'vitest.coverage.config.ts')
	const templatePath = path.join(ROOT, 'libs', 'tools', 'structure-auditor', 'templates', 'vitest.coverage.config.ts')
	
	if (!fs.existsSync(vitestPath)) {
		addError('Missing vitest.coverage.config.ts', `packages/${pkg}/core`)
		return false
	}

	if (!fs.existsSync(templatePath)) {
		addError('Missing canonical template', `libs/tools/structure-auditor/templates/vitest.coverage.config.ts`)
		return false
	}

	const vitestContent = fs.readFileSync(vitestPath, 'utf-8')
	const templateContent = fs.readFileSync(templatePath, 'utf-8')

	// Compare the content exactly
	if (vitestContent !== templateContent) {
		const relativeTemplatePath = path.relative(ROOT, templatePath).replace(/\\/g, '/')

		addError('Non-canonical vitest.coverage.config.ts', `packages/${pkg}/core/vitest.coverage.config.ts: Must match ${relativeTemplatePath}:1:1`)
		return false
	}

	return true
}
