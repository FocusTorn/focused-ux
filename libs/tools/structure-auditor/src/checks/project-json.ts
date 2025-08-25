import path from 'node:path'
import fs from 'node:fs'
import { addError } from '../util/errors.js'
import { ROOT } from '../util/helpers.js'
import { readJson } from '../util/fs.js'

/**
 * Check that core packages have proper build configuration.
 */
export function checkCorePackageBuildConfig(pkg: string): boolean {
	const projectJsonPath = path.join(ROOT, 'packages', pkg, 'core', 'project.json')
	
	if (!fs.existsSync(projectJsonPath)) {
		addError('Missing project.json', `packages/${pkg}/core`)
		return false
	}

	const projectJson = readJson(projectJsonPath)
	if (!projectJson) {
		return false
	}

	// Check for proper project type
	if (projectJson.projectType !== 'library') {
		addError('CRITICAL: Core package wrong project type', 
			`packages/${pkg}/core/project.json: Core packages must have "projectType": "library"`)
		return false
	}

	// Check for proper build executor
	const buildTarget = projectJson.targets?.build
	if (!buildTarget) {
		addError('Missing build target', `packages/${pkg}/core/project.json`)
		return false
	}

	if (buildTarget.executor !== '@nx/esbuild:esbuild') {
		addError('CRITICAL: Core package wrong build executor', 
			`packages/${pkg}/core/project.json: Core packages must use "@nx/esbuild:esbuild" executor`)
		return false
	}

	// Check for proper build options
	const options = buildTarget.options
	if (!options) {
		addError('Missing build options', `packages/${pkg}/core/project.json`)
		return false
	}

	if (options.bundle !== false) {
		addError('CRITICAL: Core package wrong bundle setting', 
			`packages/${pkg}/core/project.json: Core packages must have "bundle": false`)
		return false
	}

	if (!options.format?.includes('esm')) {
		addError('CRITICAL: Core package wrong format', 
			`packages/${pkg}/core/project.json: Core packages must have "format": ["esm"]`)
		return false
	}

	return true
}

/**
 * Check that extension packages have proper build configuration.
 */
export function checkExtensionPackageBuildConfig(pkg: string): boolean {
	const projectJsonPath = path.join(ROOT, 'packages', pkg, 'ext', 'project.json')
	
	if (!fs.existsSync(projectJsonPath)) {
		addError('Missing project.json', `packages/${pkg}/ext`)
		return false
	}

	const projectJson = readJson(projectJsonPath)
	if (!projectJson) {
		return false
	}

	// Check for proper project type
	if (projectJson.projectType !== 'application') {
		addError('CRITICAL: Extension package wrong project type', 
			`packages/${pkg}/ext/project.json: Extension packages must have "projectType": "application"`)
		return false
	}

	// Check for proper build executor
	const buildTarget = projectJson.targets?.build
	if (!buildTarget) {
		addError('Missing build target', `packages/${pkg}/ext/project.json`)
		return false
	}

	if (buildTarget.executor !== '@nx/esbuild:esbuild') {
		addError('CRITICAL: Extension package wrong build executor', 
			`packages/${pkg}/ext/project.json: Extension packages must use "@nx/esbuild:esbuild" executor`)
		return false
	}

	// Check for proper build options
	const options = buildTarget.options
	if (!options) {
		addError('Missing build options', `packages/${pkg}/ext/project.json`)
		return false
	}

	if (options.bundle !== true) {
		addError('CRITICAL: Extension package wrong bundle setting', 
			`packages/${pkg}/ext/project.json: Extension packages must have "bundle": true`)
		return false
	}

	if (!options.format?.includes('cjs')) {
		addError('CRITICAL: Extension package wrong format', 
			`packages/${pkg}/ext/project.json: Extension packages must have "format": ["cjs"]`)
		return false
	}

	return true
}

/**
 * Check that packages have proper test configuration.
 */
export function checkPackageTestConfig(pkg: string): boolean {
	const coreProjectJsonPath = path.join(ROOT, 'packages', pkg, 'core', 'project.json')
	const extProjectJsonPath = path.join(ROOT, 'packages', pkg, 'ext', 'project.json')
	
	let found = false

	// Check core package test config
	if (fs.existsSync(coreProjectJsonPath)) {
		const projectJson = readJson(coreProjectJsonPath)
		if (projectJson) {
			const testTarget = projectJson.targets?.test
			if (testTarget) {
				if (testTarget.executor !== '@nx/vite:test') {
					addError('CRITICAL: Core package wrong test executor', 
						`packages/${pkg}/core/project.json: Core packages must use "@nx/vite:test" executor`)
					found = true
				}
			}
		}
	}

	// Check extension package test config
	if (fs.existsSync(extProjectJsonPath)) {
		const projectJson = readJson(extProjectJsonPath)
		if (projectJson) {
			const testTarget = projectJson.targets?.test
			if (testTarget) {
				if (testTarget.executor !== '@nx/vite:test') {
					addError('CRITICAL: Extension package wrong test executor', 
						`packages/${pkg}/ext/project.json: Extension packages must use "@nx/vite:test" executor`)
					found = true
				}
			}
		}
	}

	return !found
}
