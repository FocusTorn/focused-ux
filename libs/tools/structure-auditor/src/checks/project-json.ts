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

export function checkUniversalTargets(projectPath: string, pkg: string, projectType: 'core' | 'ext' | 'lib') { //>
	const project = readJson(projectPath)

	if (!project)
		return false

	const targets = project.targets

	if (!targets) {
		const location = findJsonLocation(projectPath, 'targets')
		const locationStr = location ? `:${location.line}:${location.column}` : ''

		addError('Missing targets', `${pkg}/${projectType}/project.json${locationStr}: Missing 'targets' field.`)
		return false
	}

	let ok = true

	// Check for lint target
	if (!targets.lint) {
		const location = findJsonLocation(projectPath, 'lint')
		const locationStr = location ? `:${location.line}:${location.column}` : ''

		addError('Missing lint target', `${pkg}/${projectType}/project.json${locationStr}: Missing 'lint' target.`)
		ok = false
	}
	else if (!targets.lint.extends || targets.lint.extends !== 'lint') {
		const location = findJsonLocation(projectPath, 'extends')
		const locationStr = location ? `:${location.line}:${location.column}` : ''

		addError('Invalid lint extends', `${pkg}/${projectType}/project.json${locationStr}: lint target should extend 'lint'.`)
		ok = false
	}

	// Check for lint:full target
	if (!targets['lint:full']) {
		const location = findJsonLocation(projectPath, 'lint:full')
		const locationStr = location ? `:${location.line}:${location.column}` : ''

		addError('Missing lint:full target', `${pkg}/${projectType}/project.json${locationStr}: Missing 'lint:full' target.`)
		ok = false
	}
	else if (!targets['lint:full'].extends || targets['lint:full'].extends !== 'lint:full') {
		const location = findJsonLocation(projectPath, 'extends')
		const locationStr = location ? `:${location.line}:${location.column}` : ''

		addError('Invalid lint:full extends', `${pkg}/${projectType}/project.json${locationStr}: lint:full target should extend 'lint:full'.`)
		ok = false
	}

	// Check for check-types target
	if (!targets['check-types']) {
		const location = findJsonLocation(projectPath, 'check-types')
		const locationStr = location ? `:${location.line}:${location.column}` : ''

		addError('Missing check-types target', `${pkg}/${projectType}/project.json${locationStr}: Missing 'check-types' target.`)
		ok = false
	}
	else if (!targets['check-types'].extends || targets['check-types'].extends !== 'check-types') {
		const location = findJsonLocation(projectPath, 'extends')
		const locationStr = location ? `:${location.line}:${location.column}` : ''

		addError('Invalid check-types extends', `${pkg}/${projectType}/project.json${locationStr}: check-types target should extend 'check-types'.`)
		ok = false
	}

	// Check for validate target
	if (!targets.validate) {
		const location = findJsonLocation(projectPath, 'validate')
		const locationStr = location ? `:${location.line}:${location.column}` : ''

		addError('Missing validate target', `${pkg}/${projectType}/project.json${locationStr}: Missing 'validate' target.`)
		ok = false
	}
	else if (!targets.validate.extends || targets.validate.extends !== 'validate') {
		const location = findJsonLocation(projectPath, 'extends')
		const locationStr = location ? `:${location.line}:${location.column}` : ''

		addError('Invalid validate extends', `${pkg}/${projectType}/project.json${locationStr}: validate target should extend 'validate'.`)
		ok = false
	}

	// Check for validate:full target
	if (!targets['validate:full']) {
		const location = findJsonLocation(projectPath, 'validate:full')
		const locationStr = location ? `:${location.line}:${location.column}` : ''

		addError('Missing validate:full target', `${pkg}/${projectType}/project.json${locationStr}: Missing 'validate:full' target.`)
		ok = false
	}
	else if (!targets['validate:full'].extends || targets['validate:full'].extends !== 'validate:full') {
		const location = findJsonLocation(projectPath, 'extends')
		const locationStr = location ? `:${location.line}:${location.column}` : ''

		addError('Invalid validate:full extends', `${pkg}/${projectType}/project.json${locationStr}: validate:full target should extend 'validate:full'.`)
		ok = false
	}

	// Check for audit target
	if (!targets.audit) {
		const location = findJsonLocation(projectPath, 'audit')
		const locationStr = location ? `:${location.line}:${location.column}` : ''

		addError('Missing audit target', `${pkg}/${projectType}/project.json${locationStr}: Missing 'audit' target.`)
		ok = false
	}
	else if (!targets.audit.extends || targets.audit.extends !== 'audit') {
		const location = findJsonLocation(projectPath, 'extends')
		const locationStr = location ? `:${location.line}:${location.column}` : ''

		addError('Invalid audit extends', `${pkg}/${projectType}/project.json${locationStr}: audit target should extend 'audit'.`)
		ok = false
	}

	// Check for audit:full target
	if (!targets['audit:full']) {
		const location = findJsonLocation(projectPath, 'audit:full')
		const locationStr = location ? `:${location.line}:${location.column}` : ''

		addError('Missing audit:full target', `${pkg}/${projectType}/project.json${locationStr}: Missing 'audit:full' target.`)
		ok = false
	}
	else if (!targets['audit:full'].extends || targets['audit:full'].extends !== 'audit:full') {
		const location = findJsonLocation(projectPath, 'extends')
		const locationStr = location ? `:${location.line}:${location.column}` : ''

		addError('Invalid audit:full extends', `${pkg}/${projectType}/project.json${locationStr}: audit:full target should extend 'audit:full'.`)
		ok = false
	}

	// Check for clean target
	if (!targets.clean) {
		const location = findJsonLocation(projectPath, 'clean')
		const locationStr = location ? `:${location.line}:${location.column}` : ''

		addError('Missing clean target', `${pkg}/${projectType}/project.json${locationStr}: Missing 'clean' target.`)
		ok = false
	}
	else if (!targets.clean.extends || targets.clean.extends !== 'clean') {
		const location = findJsonLocation(projectPath, 'extends')
		const locationStr = location ? `:${location.line}:${location.column}` : ''

		addError('Invalid clean extends', `${pkg}/${projectType}/project.json${locationStr}: clean target should extend 'clean'.`)
		ok = false
	}

	// Check for clean:dist target
	if (!targets['clean:dist']) {
		const location = findJsonLocation(projectPath, 'clean:dist')
		const locationStr = location ? `:${location.line}:${location.column}` : ''

		addError('Missing clean:dist target', `${pkg}/${projectType}/project.json${locationStr}: Missing 'clean:dist' target.`)
		ok = false
	}
	else if (!targets['clean:dist'].extends || targets['clean:dist'].extends !== 'clean:dist') {
		const location = findJsonLocation(projectPath, 'extends')
		const locationStr = location ? `:${location.line}:${location.column}` : ''

		addError('Invalid clean:dist extends', `${pkg}/${projectType}/project.json${locationStr}: clean:dist target should extend 'clean:dist'.`)
		ok = false
	}

	// Check for clean:cache target
	if (!targets['clean:cache']) {
		const location = findJsonLocation(projectPath, 'clean:cache')
		const locationStr = location ? `:${location.line}:${location.column}` : ''

		addError('Missing clean:cache target', `${pkg}/${projectType}/project.json${locationStr}: Missing 'clean:cache' target.`)
		ok = false
	}
	else if (!targets['clean:cache'].extends || targets['clean:cache'].extends !== 'clean:cache') {
		const location = findJsonLocation(projectPath, 'extends')
		const locationStr = location ? `:${location.line}:${location.column}` : ''

		addError('Invalid clean:cache extends', `${pkg}/${projectType}/project.json${locationStr}: clean:cache target should extend 'clean:cache'.`)
		ok = false
	}

	return ok
} //<

export function checkProjectJsonLintAndTestTargets(pkg: string) { //>
	const projectPath = path.join(ROOT, 'packages', pkg, 'ext', 'project.json')

	if (!fs.existsSync(projectPath)) {
		// Check if it's a core-only package
		const coreProjectPath = path.join(ROOT, 'packages', pkg, 'core', 'project.json')

		if (fs.existsSync(coreProjectPath)) {
			return checkUniversalTargets(coreProjectPath, pkg, 'core')
		}
		return true // Not a package we're checking
	}

	return checkUniversalTargets(projectPath, pkg, 'ext')
} //<

export function checkProjectJsonLintAndTestTargetsCore(pkg: string) { //>
	const projectPath = path.join(ROOT, 'packages', pkg, 'core', 'project.json')

	if (!fs.existsSync(projectPath)) {
		return true // Not a package we're checking
	}

	return checkUniversalTargets(projectPath, pkg, 'core')
} //<

export function checkProjectJsonLintAndTestTargetsLibs(pkg: string) { //>
	const projectPath = path.join(ROOT, 'libs', pkg, 'project.json')

	if (!fs.existsSync(projectPath)) {
		return true // Not a lib we're checking
	}

	return checkUniversalTargets(projectPath, pkg, 'lib')
} //<

export function checkProjectJsonTargetConsistency(pkg: string) { //>
	// Define the expected targets based on ghost-writer structure
	const expectedTargets = [
		'build',
		'package',
		'package:dev',
		'lint',
		'lint:full',
		'test',
		'test:full',
		'check-types',
		'validate',
		'validate:full',
	]

	// Check ext project.json
	const extProjectPath = path.join(ROOT, 'packages', pkg, 'ext', 'project.json')

	if (fs.existsSync(extProjectPath)) {
		const extProject = readJson(extProjectPath)

		if (!extProject)
			return false

		const targets = extProject.targets || {}
		let ok = true

		for (const targetName of expectedTargets) {
			if (!targets[targetName]) {
				const location = findJsonLocation(extProjectPath, targetName)
				const locationStr = location ? `:${location.line}:${location.column}` : ''

				addError('Missing Target', `${pkg}/ext/project.json${locationStr}: Missing '${targetName}' target. All packages should have the same targets as ghost-writer.`)
				ok = false
			}
		}

		if (!ok)
			return false
	}

	// Check core project.json
	const coreProjectPath = path.join(ROOT, 'packages', pkg, 'core', 'project.json')

	if (fs.existsSync(coreProjectPath)) {
		const coreProject = readJson(coreProjectPath)

		if (!coreProject)
			return false

		const targets = coreProject.targets || {}
		let ok = true

		// Core packages should have the same targets except package-related ones
		const coreExpectedTargets = expectedTargets.filter(target =>
			!target.startsWith('package')
		)

		for (const targetName of coreExpectedTargets) {
			if (!targets[targetName]) {
				const location = findJsonLocation(coreProjectPath, targetName)
				const locationStr = location ? `:${location.line}:${location.column}` : ''

				addError('Missing Target', `${pkg}/core/project.json${locationStr}: Missing '${targetName}' target. All packages should have the same targets as ghost-writer.`)
				ok = false
			}
		}

		if (!ok)
			return false
	}

	return true
} //<
