import path from 'node:path'
import fs from 'node:fs'
import { addError } from '../util/errors.js'
import { ROOT } from '../util/helpers.js'
import { readJson } from '../util/fs.js'

/**
 * Check that core packages have no shared dependencies.
 */
export function checkCorePackageDependencies(pkg: string): boolean {
	const pkgJsonPath = path.join(ROOT, 'packages', pkg, 'core', 'package.json')
	
	if (!fs.existsSync(pkgJsonPath)) {
		return true
	}

	const pkgJson = readJson(pkgJsonPath)
	if (!pkgJson) {
		return false
	}

	const deps = pkgJson.dependencies || {}
	const devDeps = pkgJson.devDependencies || {}

	// Check for forbidden dependencies
	const forbiddenDeps = ['@fux/shared', '@fux/mockly']
	let found = false

	for (const forbiddenDep of forbiddenDeps) {
		if (deps[forbiddenDep]) {
			addError('CRITICAL: Core package has forbidden dependency', 
				`packages/${pkg}/core/package.json: Core packages must not depend on '${forbiddenDep}'. Use direct instantiation instead.`)
			found = true
		}
		if (devDeps[forbiddenDep]) {
			addError('CRITICAL: Core package has forbidden devDependency', 
				`packages/${pkg}/core/package.json: Core packages must not depend on '${forbiddenDep}' even in devDependencies.`)
			found = true
		}
	}

	return !found
}

/**
 * Check that extension packages have no shared dependencies.
 */
export function checkExtensionPackageDependencies(pkg: string): boolean {
	const pkgJsonPath = path.join(ROOT, 'packages', pkg, 'ext', 'package.json')
	
	if (!fs.existsSync(pkgJsonPath)) {
		return true
	}

	const pkgJson = readJson(pkgJsonPath)
	if (!pkgJson) {
		return false
	}

	const deps = pkgJson.dependencies || {}
	const devDeps = pkgJson.devDependencies || {}

	// Check for forbidden dependencies
	const forbiddenDeps = ['@fux/shared', '@fux/mockly']
	let found = false

	for (const forbiddenDep of forbiddenDeps) {
		if (deps[forbiddenDep]) {
			addError('CRITICAL: Extension package has forbidden dependency', 
				`packages/${pkg}/ext/package.json: Extension packages must not depend on '${forbiddenDep}'. Use dependency injection instead.`)
			found = true
		}
		if (devDeps[forbiddenDep]) {
			addError('CRITICAL: Extension package has forbidden devDependency', 
				`packages/${pkg}/ext/package.json: Extension packages must not depend on '${forbiddenDep}' even in devDependencies.`)
			found = true
		}
	}

	return !found
}



/**
 * Check that extension packages don't have module type (CommonJS).
 */
export function checkExtensionPackageModuleType(pkg: string): boolean {
	const pkgJsonPath = path.join(ROOT, 'packages', pkg, 'ext', 'package.json')
	
	if (!fs.existsSync(pkgJsonPath)) {
		return true
	}

	const pkgJson = readJson(pkgJsonPath)
	if (!pkgJson) {
		return false
	}

	if (pkgJson.type === 'module') {
		addError('CRITICAL: Extension package has wrong module type', 
			`packages/${pkg}/ext/package.json: Extension packages must NOT have "type": "module" (should be CommonJS)`)
		return false
	}

	return true
}
