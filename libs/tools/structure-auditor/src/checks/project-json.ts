import path from 'node:path'
import fs from 'node:fs'
import { addError } from '../util/errors.js'
import { readJson, findJsonLocation } from '../util/fs.js'
import { ROOT } from '../util/helpers.js'

export function checkProjectJsonExt(pkg: string) { //>
	const projectPath = path.join(ROOT, 'packages', pkg, 'ext', 'project.json')

	if (!fs.existsSync(projectPath)) {
		addError('Missing project.json', `${pkg}/ext`)
		return false
	}

	const project = readJson(projectPath)

	if (!project)
		return false

	if (!project.targets || !project.targets.build) {
		const location = findJsonLocation(projectPath, 'targets')
		const locationStr = location ? `:${location.line}:${location.column}` : ''
		addError('Missing build target', `${pkg}/ext/project.json${locationStr}: Missing build target.`)
		return false
	}
	if (project.targets.build.extends) {
		const location = findJsonLocation(projectPath, 'extends')
		const locationStr = location ? `:${location.line}:${location.column}` : ''
		addError('Target extends', `${pkg}/ext/project.json${locationStr}: build target should not use 'extends'. All build targets must be explicit and inlined for clarity and maintainability.`)
		return false
	}
	if (project.targets.build.executor !== '@nx/esbuild:esbuild') {
		const location = findJsonLocation(projectPath, 'executor')
		const locationStr = location ? `:${location.line}:${location.column}` : ''
		addError('Invalid executor', `${pkg}/ext/project.json${locationStr}: build target executor should be '@nx/esbuild:esbuild'.`)
		return false
	}
	return true
} //<

export function checkProjectJsonPackaging(pkg: string) { //>
	const projectJsonPath = path.join(ROOT, 'packages', pkg, 'ext', 'project.json')

	if (!fs.existsSync(projectJsonPath))
		return true

	const projectJson = readJson(projectJsonPath)

	if (!projectJson)
		return false

	const targets = projectJson.targets

	if (!targets) {
		const location = findJsonLocation(projectJsonPath, 'targets')
		const locationStr = location ? `:${location.line}:${location.column}` : ''
		addError('Missing targets', `${pkg}/ext/project.json${locationStr}: Missing 'targets' field.`)
		return false
	}

	// Check for obsolete copy-assets target
	if (targets['copy-assets']) {
		const location = findJsonLocation(projectJsonPath, 'copy-assets')
		const locationStr = location ? `:${location.line}:${location.column}` : ''
		addError('Obsolete Target', `${pkg}/ext/project.json${locationStr}: 'copy-assets' target is obsolete and should be removed.`)
		return false
	}

	// Check package:dev target
	const packageDevTarget = targets['package:dev']

	if (!packageDevTarget) {
		const location = findJsonLocation(projectJsonPath, 'package:dev')
		const locationStr = location ? `:${location.line}:${location.column}` : ''
		addError('Missing Target', `${pkg}/ext/project.json${locationStr}: Missing 'package:dev' target.`)
		return false
	}

	const expectedDevCommand = `node scripts/create-vsix.js packages/${pkg}/ext vsix_packages --dev`

	if (packageDevTarget.options?.command !== expectedDevCommand) {
		const location = findJsonLocation(projectJsonPath, 'command')
		const locationStr = location ? `:${location.line}:${location.column}` : ''
		addError('Incorrect Command', `${pkg}/ext/project.json${locationStr}: 'package:dev' command is incorrect.`)
		return false
	}

	// Check package target
	const packageTarget = targets.package

	if (!packageTarget) {
		const location = findJsonLocation(projectJsonPath, 'package')
		const locationStr = location ? `:${location.line}:${location.column}` : ''
		addError('Missing Target', `${pkg}/ext/project.json${locationStr}: Missing 'package' target.`)
		return false
	}

	const expectedPackageCommand = `node scripts/create-vsix.js packages/${pkg}/ext vsix_packages`

	if (packageTarget.options?.command !== expectedPackageCommand) {
		const location = findJsonLocation(projectJsonPath, 'command')
		const locationStr = location ? `:${location.line}:${location.column}` : ''
		addError('Incorrect Command', `${pkg}/ext/project.json${locationStr}: 'package' command is incorrect.`)
		return false
	}

	return true
} //<

export function checkProjectJsonExternalsConsistency(pkg: string) { //>
	const coreProjectPath = path.join(ROOT, 'packages', pkg, 'core', 'project.json')
	const extProjectPath = path.join(ROOT, 'packages', pkg, 'ext', 'project.json')

	if (!fs.existsSync(coreProjectPath) || !fs.existsSync(extProjectPath))
		return true // One of the files doesn't exist, so we can't compare them.

	const coreProject = readJson(coreProjectPath)
	const extProject = readJson(extProjectPath)

	if (!coreProject || !extProject)
		return false

	const coreExternals = coreProject.targets?.build?.options?.external || []
	const extExternals = extProject.targets?.build?.options?.external || []

	// We only care about non-vscode externals from core
	const coreThirdPartyExternals = coreExternals.filter((dep: string) => dep !== 'vscode')

	for (const dep of coreThirdPartyExternals) {
		if (!extExternals.includes(dep)) {
			const location = findJsonLocation(extProjectPath, 'external')
			const locationStr = location ? `:${location.line}:${location.column}` : ''
			addError(
				'Inconsistent Externals',
				`${pkg}/ext/project.json${locationStr}: The external dependency '${dep}' is defined in 'core/project.json' but is missing from 'ext/project.json'.`,
			)
			return false
		}
	}

	return true
} //<

export function checkProjectJsonExtExternals(pkg: string) { //>
	const extPackagePath = path.join(ROOT, 'packages', pkg, 'ext', 'package.json')
	const extProjectPath = path.join(ROOT, 'packages', pkg, 'ext', 'project.json')

	if (!fs.existsSync(extPackagePath) || !fs.existsSync(extProjectPath))
		return true

	const pkgJson = readJson(extPackagePath)
	const projectJson = readJson(extProjectPath)

	if (!pkgJson || !projectJson)
		return false

	const dependencies = Object.keys(pkgJson.dependencies || {})
	const thirdPartyDeps = dependencies.filter(dep => !dep.startsWith('@fux/'))

	const externals = projectJson.targets?.build?.options?.external

	if (!externals || !Array.isArray(externals)) {
		const location = findJsonLocation(extProjectPath, 'external')
		const locationStr = location ? `:${location.line}:${location.column}` : ''
		addError('Invalid Externals', `${pkg}/ext/project.json${locationStr}: 'external' array is missing or not an array in build target.`)
		return false
	}

	const externalsSet = new Set(externals)
	let ok = true

	if (!externalsSet.has('vscode')) {
		const location = findJsonLocation(extProjectPath, 'vscode')
		const locationStr = location ? `:${location.line}:${location.column}` : ''
		addError('Invalid Externals', `${pkg}/ext/project.json${locationStr}: 'external' array must include "vscode".`)
		ok = false
	}

	for (const dep of thirdPartyDeps) {
		if (!externalsSet.has(dep)) {
			const location = findJsonLocation(extProjectPath, 'external')
			const locationStr = location ? `:${location.line}:${location.column}` : ''
			addError('Invalid Externals', `${pkg}/ext/project.json${locationStr}: 'external' array is missing third-party dependency '${dep}' from package.json.`)
			ok = false
		}
	}

	return ok
} //<
