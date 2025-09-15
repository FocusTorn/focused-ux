import path from 'node:path'
import fs from 'node:fs'
import process from 'node:process'
import { color, ROOT } from './util/helpers.js'
import { errors, printGroupedErrors, printExpandedErrors } from './util/errors.js'
import { readJson } from './util/fs.js'

// New refactored end state checks
import {
	checkNoSharedReferencesAnywhere,
	checkNoMocklyReferencesAnywhere,
	checkExtensionThinWrapperPrinciple,
	checkCoreDirectInstantiation,
} from './checks/architecture.js'
import {
	checkTsconfigCore,
	checkTsconfigCoreLib,
	checkTsconfigExt,
	checkVitestConfig,
	checkVitestCoverageConfig,
} from './checks/tsconfig.js'
import {
	checkCorePackageDependencies,
	checkExtensionPackageDependencies,
	checkExtensionPackageModuleType,
} from './checks/package-json.js'
import {
	checkCorePackageBuildConfig,
	checkExtensionPackageBuildConfig,
	checkPackageTestConfig,
	checkPackageLintConfig,
	checkSharedPackageLintConfig,
} from './checks/project-json.js'
import {
	checkTestSetupStructure,
	checkTestOrganization,
	checkTestFileImports,
} from './checks/testing-strategy.js'
import { checkNoDynamicImports, checkNoVSCodeValueImports, checkRequiredFiles } from './checks/misc.js'

// Increase the listener limit to prevent the warning from the script runner.
process.setMaxListeners(20)

// Load aliases from pnpm_aliases.json
function loadAliases() {
	const aliasesPath = path.join(ROOT, '.vscode', 'shell', 'pnpm_aliases.json')

	if (!fs.existsSync(aliasesPath)) {
		return { packages: {} }
	}

	const aliases = readJson(aliasesPath)

	if (aliases === null) {
		console.warn(`Warning: Could not load aliases from ${aliasesPath}`)
		return { packages: {} }
	}

	return aliases
}

// Resolve alias or project name to package name
function resolvePackageName(input: string): string | null {
	const aliases = loadAliases()

	// Check if it's already a valid package name
	if (input.includes('/') || input.includes('-')) {
		// Handle @fux/package-name format
		if (input.startsWith('@fux/')) {
			const packageName = input.replace('@fux/', '')
			// Remove -core or -ext suffix to get the base package name
			const baseName = packageName.replace(/-core$|-ext$/, '')

			return baseName
		}
		// Handle package-name format (already a valid package name)
		return input
	}

	// Check if it's an alias
	const aliasData = aliases.packages?.[input]

	if (aliasData) {
		if (typeof aliasData === 'string') {
			// Handle direct string aliases like "shared": "@fux/shared"
			if (aliasData.startsWith('@fux/')) {
				return aliasData.replace('@fux/', '')
			}
			return aliasData
		}
		else if (aliasData.name && aliasData.suffix) {
			// Handle object aliases like { "name": "ghost-writer", "suffix": "ext" }
			return `${aliasData.name}-${aliasData.suffix}`
		}
		else if (aliasData.name) {
			// Handle object aliases with just name (no suffix)
			return aliasData.name
		}
	}

	return null
}

function showHelp() {
	console.log('PAE - Feature Structure Auditor')
	console.log('')
	console.log('Usage:')
	console.log('  audit <project1> [project2] [project3] ... [options]')
	console.log('')
	console.log('Arguments:')
	console.log('  <project>     Project name, alias, or path to audit')
	console.log('')
	console.log('Options:')
	console.log('  -l, --list     Show detailed output with line/column numbers')
	console.log('  -g, --grouped  Show grouped output (default)')
	console.log('  --warn-only    Do not exit with non-zero code; print findings and exit 0')
	console.log('  -h, --help     Show this help message')
	console.log('')
	console.log('Examples:')
	console.log('  audit ghost-writer                    # Audit specific package')
	console.log('  audit ghost-writer-core ghost-writer-ext  # Audit multiple packages')
	console.log('  audit @fux/ghost-writer-ext          # Audit using full project name')
	console.log('  audit gw gwc gwe                     # Audit using aliases')
	console.log('  audit packages/ghost-writer          # Audit all projects in feature directory')
	console.log('  audit libs/shared                    # Audit specific library')
	console.log('  audit -l                             # Show detailed output')
	console.log('  audit gw -l --warn-only              # Audit with options')
	console.log('')
	console.log('Path-based Auditing:')
	console.log('  packages/feature-name                # Audit all projects in feature directory')
	console.log('  libs/library-name                    # Audit specific library')
	console.log('')
	console.log('Available packages:')

	const packagesDir = path.join(ROOT, 'packages')
	const allPackages = fs.readdirSync(packagesDir, { withFileTypes: true })
		.filter(dirent =>
			dirent.isDirectory() && !dirent.name.startsWith('template-'))
		.map(dirent =>
			dirent.name)
		.sort()

	for (const pkg of allPackages) {
		console.log(`  - ${pkg}`)
	}

	console.log('')
	console.log('Available libs:')

	const libsDir = path.join(ROOT, 'libs')

	if (fs.existsSync(libsDir)) {
		const allLibs = fs.readdirSync(libsDir, { withFileTypes: true })
			.filter(dirent =>
				dirent.isDirectory() && dirent.name !== 'tools')
			.map(dirent =>
				dirent.name)
			.sort()

		for (const lib of allLibs) {
			console.log(`  - ${lib}`)
		}
	}

	console.log('')
	console.log('Exclusions and Notes:')
	console.log('')
	console.log('Package Types:')
	console.log('  • Template packages (starting with "template-") are excluded from auditing')
	console.log('  • Core-only packages are checked for core-specific targets only')
	console.log('  • Ext packages require full target set (lint, lint:full, check-types, check-types:full, validate, validate:full)')
	console.log('  • Core packages exclude package-related and validate targets')
	console.log('')
	console.log('Libraries (libs/):')
	console.log('  • Excluded from validate target checks (libraries don\'t need validate targets)')
	console.log('  • Use @nx/eslint:lint and @nx/js:tsc executors for :full targets (not nx:run-commands)')
	console.log('  • Only require lint, lint:full, check-types, and check-types:full targets')
	console.log('  • Tools directory is excluded (admin scripts only)')
	console.log('')
	console.log('VSCode Integration:')
	console.log('  • Adapter files (*.adapter.ts) are excluded from VSCode value import checks')
	console.log('  • Type imports from VSCode are allowed (only value imports are flagged)')
	console.log('  • Comments and string literals containing "vscode." are excluded from VSCode checks')
	console.log('  • Shared package is allowed to have VSCode adapters (other packages must use shared adapters)')
	console.log('')
	console.log('Testing Strategy Compliance:')
	console.log('  • Core packages should NEVER import from @fux/shared during tests')
	console.log('  • Extension packages should only test VSCode integration, not business logic')
	console.log('  • Use Mockly shims instead of hard-coded mocks')
	console.log('  • Test setup files should clear mocks in beforeEach')
	console.log('')
	console.log('Architectural Patterns:')
	console.log('  • Extension packages must be thin wrappers (no business logic)')
	console.log('  • All adapters must be in the shared package')
	console.log('  • No direct Node.js module imports in extension code')
	console.log('  • Build-only dependencies must be in devDependencies')
	console.log('')
	console.log('Test Files:')
	console.log('  • Test files (*.test.*, *.spec.*, setup.*) are excluded from VSCode adapter checks')
	console.log('  • Test files are excluded from various validation checks')
	console.log('')
	console.log('File Processing:')
	console.log('  • Files that can\'t be read or parsed are skipped with appropriate error messages')
	console.log('  • JSON files with comments and trailing commas are supported (stripped during parsing)')
}

function main(): number {
	const packagesDir = path.join(ROOT, 'packages')
	const libsDir = path.join(ROOT, 'libs')

	// Get all packages and their subdirectories
	const allPackages: string[] = []

	if (fs.existsSync(packagesDir)) {
		const packageDirs = fs.readdirSync(packagesDir, { withFileTypes: true })
			.filter(dirent =>
				dirent.isDirectory() && !dirent.name.startsWith('template-'))

		for (const pkgDir of packageDirs) {
			const pkgPath = path.join(packagesDir, pkgDir.name)
			const subDirs = fs.readdirSync(pkgPath, { withFileTypes: true })
				.filter(dirent =>
					dirent.isDirectory())
				.map(dirent =>
					dirent.name)

			for (const subDir of subDirs) {
				allPackages.push(`${pkgDir.name}-${subDir}`)
			}
		}
	}

	// Get all libs (excluding tools)
	const allLibs = fs.existsSync(libsDir)
		? fs.readdirSync(libsDir, { withFileTypes: true })
			.filter(dirent =>
				dirent.isDirectory() && dirent.name !== 'tools')
			.map(dirent =>
				dirent.name)
		: []

	// Tool packages are direct execution scripts, not buildable packages
	// They are excluded from auditing as they don't follow the same structure
	// Combine all items for checking (excluding tools)
	const allItems = [...allPackages, ...allLibs]

	// Parse command line arguments
	const args = process.argv.slice(2)
	const projectArgs: string[] = []
	let isExpanded = false
	let warnOnly = false

	// Check for help flags first
	if (args.includes('-h') || args.includes('--help')) {
		showHelp()
		return 0
	}

	for (let i = 0; i < args.length; i++) {
		const arg = args[i]

		if (arg === '-l' || arg === '--list') {
			isExpanded = true
		}
		else if (arg === '--warn-only') {
			warnOnly = true
		}
		else if (!arg.startsWith('-')) {
			projectArgs.push(arg.trim())
		}
	}

	// If no project arguments provided, show help
	if (projectArgs.length === 0) {
		console.error(`${color(196)}Error: No projects specified for audit.\x1B[0m`)
		console.error(`${color(196)}Usage: audit <project1> [project2] [project3] ... [options]\x1B[0m`)
		console.error(`${color(196)}Examples:\x1B[0m`)
		console.error(`${color(196)}  audit ghost-writer-core\x1B[0m`)
		console.error(`${color(196)}  audit ghost-writer-core ghost-writer-ext\x1B[0m`)
		console.error(`${color(196)}  audit packages/ghost-writer\x1B[0m`)
		console.error(`${color(196)}  audit gw gwc gwe\x1B[0m`)
		console.error(`${color(196)}  audit -h\x1B[0m`)
		return 1
	}

	// Process project arguments to resolve aliases and paths
	const itemsToAudit: string[] = []

	for (const projectArg of projectArgs) {
		// Check if it's a path (contains '/' or '\')
		if (projectArg.includes('/') || projectArg.includes('\\')) {
			const normalizedPath = projectArg.replace(/\\/g, '/')

			// Handle @fux/project-name format
			if (normalizedPath.startsWith('@fux/')) {
				const projectName = normalizedPath.replace('@fux/', '')

				if (allItems.includes(projectName)) {
					itemsToAudit.push(projectName)
				}
				else {
					console.error(`${color(196)}Error: Project '${projectName}' not found.\x1B[0m`)
					return 1
				}
			}
			// Handle packages/feature-name format
			else if (normalizedPath.startsWith('packages/')) {
				const featureName = normalizedPath.replace('packages/', '')
				const featureDir = path.join(packagesDir, featureName)

				if (fs.existsSync(featureDir) && fs.statSync(featureDir).isDirectory()) {
					// Get all subdirectories in the feature directory
					const subDirs = fs.readdirSync(featureDir, { withFileTypes: true })
						.filter(dirent =>
							dirent.isDirectory())
						.map(dirent =>
							dirent.name)

					for (const subDir of subDirs) {
						const fullProjectName = `${featureName}-${subDir}`

						if (allItems.includes(fullProjectName)) {
							itemsToAudit.push(fullProjectName)
						}
					}
				}
				else {
					console.error(`${color(196)}Error: Directory '${normalizedPath}' not found.\x1B[0m`)
					return 1
				}
			}
			// Handle libs/feature-name format
			else if (normalizedPath.startsWith('libs/')) {
				const libName = normalizedPath.replace('libs/', '')

				if (allItems.includes(libName)) {
					itemsToAudit.push(libName)
				}
				else {
					console.error(`${color(196)}Error: Library '${libName}' not found.\x1B[0m`)
					return 1
				}
			}
			else {
				console.error(
					`${color(196)}Error: Invalid path '${projectArg}'. Use 'packages/feature-name' or 'libs/library-name'.\x1B[0m`,
				)
				return 1
			}
		}
		// Check if it's already a valid project name
		else if (allItems.includes(projectArg)) {
			itemsToAudit.push(projectArg)
		}
		// Try to resolve as alias or project name
		else {
			const resolvedPackage = resolvePackageName(projectArg)

			if (resolvedPackage && allItems.includes(resolvedPackage)) {
				itemsToAudit.push(resolvedPackage)
			}
			else {
				console.error(
					`${color(196)}Error: Project '${projectArg}' not found in the 'packages' or 'libs' directories, and is not a valid alias.\x1B[0m`,
				)
				console.error(`${color(196)}Available projects: ${allItems.join(', ')}\x1B[0m`)
				console.error(
					`${color(196)}Available aliases: ${Object.keys(loadAliases().packages || {}).join(', ')}\x1B[0m`,
				)
				return 1
			}
		}
	}

	// Remove duplicates while preserving order
	const uniqueItemsToAudit = [...new Set(itemsToAudit)]

	// Show audit list
	console.log('Auditing:')
	for (const item of uniqueItemsToAudit) {
		console.log(`  - ${item}`)
	}
	console.log() // Blank line before errors

	let ok = true

	for (const item of uniqueItemsToAudit) {
		// Check if it's a package or lib
		const isPackage = allPackages.includes(item)
		const isLib = allLibs.includes(item)

		if (isPackage) {
			// Extract feature name from project name (e.g., "ghost-writer-core" -> "ghost-writer")
			const featureName = item.replace(/-core$|-ext$/, '')

			// Run package-specific checks
			ok = checkTsconfigCore(featureName) && ok
			ok = checkTsconfigCoreLib(featureName) && ok
			ok = checkTsconfigExt(featureName) && ok
			ok = checkVitestConfig(featureName) && ok
			ok = checkVitestCoverageConfig(featureName) && ok
			ok = checkNoDynamicImports(featureName) && ok
			ok = checkNoVSCodeValueImports(featureName) && ok
			ok = checkRequiredFiles(featureName) && ok
			ok = checkCorePackageDependencies(featureName) && ok
			ok = checkExtensionPackageDependencies(featureName) && ok
			ok = checkExtensionPackageModuleType(featureName) && ok
			ok = checkCorePackageBuildConfig(featureName) && ok
			ok = checkExtensionPackageBuildConfig(featureName) && ok
			ok = checkPackageTestConfig(featureName) && ok
			ok = checkPackageLintConfig(featureName) && ok
			ok = checkTestSetupStructure(featureName) && ok
			ok = checkTestOrganization(featureName) && ok
			ok = checkTestFileImports(featureName) && ok
			ok = checkNoSharedReferencesAnywhere(featureName) && ok
			ok = checkNoMocklyReferencesAnywhere(featureName) && ok
			ok = checkExtensionThinWrapperPrinciple(featureName) && ok
			ok = checkCoreDirectInstantiation(featureName) && ok
		}
		else if (isLib) {
			// Check if it's the shared package
			if (item === '@fux/shared') {
				ok = checkSharedPackageLintConfig() && ok
			}
			// Other lib-specific checks can be added here if needed
		}
	}

	// Use expanded output if flag is set, otherwise use grouped (default)
	if (isExpanded) {
		printExpandedErrors()
	}
	else {
		printGroupedErrors()
	}

	if (Object.keys(errors).length > 0) {
		if (warnOnly) {
			console.log(
				`${color(214)}Auditor findings present, but --warn-only specified. Exiting 0. [0m`,
			)
			return 0
		}
		return 1
	}
	return 0
}

process.exitCode = main()

// import path from 'node:path'
// import fs from 'node:fs'
// import process from 'node:process'
// import { color, ROOT } from './util/helpers.js'
// import { errors, printGroupedErrors, printExpandedErrors } from './util/errors.js'
// import { readJson } from './util/fs.js'

// // New refactored end state checks
// import { checkNoSharedReferencesAnywhere, checkNoMocklyReferencesAnywhere, checkExtensionThinWrapperPrinciple, checkCoreDirectInstantiation } from './checks/architecture.js'
// import { checkTsconfigCore, checkTsconfigCoreLib, checkTsconfigExt, checkVitestConfig, checkVitestCoverageConfig } from './checks/tsconfig.js'
// import { checkCorePackageDependencies, checkExtensionPackageDependencies, checkExtensionPackageModuleType } from './checks/package-json.js'
// import { checkCorePackageBuildConfig, checkExtensionPackageBuildConfig, checkPackageTestConfig } from './checks/project-json.js'
// import { checkTestSetupStructure, checkTestOrganization, checkTestFileImports } from './checks/testing-strategy.js'
// import { checkNoDynamicImports, checkNoVSCodeValueImports, checkRequiredFiles } from './checks/misc.js'

// // Load aliases from pnpm_aliases.json
// function loadAliases() {
// 	const aliasesPath = path.join(ROOT, '.vscode', 'shell', 'pnpm_aliases.json')

// 	if (!fs.existsSync(aliasesPath)) {
// 		return { packages: {} }
// 	}
	
// 	const aliases = readJson(aliasesPath)
	
// 	if (aliases === null) {
// 		console.warn(`Warning: Could not load aliases from ${aliasesPath}`)
// 		return { packages: {} }
// 	}
	
// 	return aliases
// }

// // Resolve alias or project name to package name
// function resolvePackageName(input: string): string | null {
// 	const aliases = loadAliases()
	
// 	// Check if it's already a valid package name
// 	if (input.includes('/') || input.includes('-')) {
// 		// Handle @fux/package-name format
// 		if (input.startsWith('@fux/')) {
// 			const packageName = input.replace('@fux/', '')
// 			// Remove -core or -ext suffix to get the base package name
// 			const baseName = packageName.replace(/-core$|-ext$/, '')

// 			return baseName
// 		}
// 		// Handle package-name format (already a valid package name)
// 		return input
// 	}
	
// 	// Check if it's an alias
// 	const aliasData = aliases.packages?.[input]

// 	if (aliasData) {
// 		if (typeof aliasData === 'string') {
// 			// Handle direct string aliases like "shared": "@fux/shared"
// 			if (aliasData.startsWith('@fux/')) {
// 				return aliasData.replace('@fux/', '')
// 			}
// 			return aliasData
// 		}
// 		else if (aliasData.name && aliasData.suffix) {
// 			// Handle object aliases like { "name": "ghost-writer", "suffix": "ext" }
// 			return `${aliasData.name}-${aliasData.suffix}`
// 		}
// 		else if (aliasData.name) {
// 			// Handle object aliases with just name (no suffix)
// 			return aliasData.name
// 		}
// 	}
	
// 	return null
// }

// function showHelp() {
// 	console.log('Feature Structure Auditor')
// 	console.log('')
// 	console.log('Usage:')
// 	console.log('  audit <project1> [project2] [project3] ... [options]')
// 	console.log('')
// 	console.log('Arguments:')
// 	console.log('  <project>     Project name, alias, or path to audit')
// 	console.log('')
// 	console.log('Options:')
// 	console.log('  -l, --list     Show detailed output with line/column numbers')
// 	console.log('  -g, --grouped  Show grouped output (default)')
// 	console.log('  --warn-only    Do not exit with non-zero code; print findings and exit 0')
// 	console.log('  -h, --help     Show this help message')
// 	console.log('')
// 	console.log('Examples:')
// 	console.log('  audit ghost-writer                    # Audit specific package')
// 	console.log('  audit ghost-writer-core ghost-writer-ext  # Audit multiple packages')
// 	console.log('  audit @fux/ghost-writer-ext          # Audit using full project name')
// 	console.log('  audit gw gwc gwe                     # Audit using aliases')
// 	console.log('  audit packages/ghost-writer          # Audit all projects in feature directory')
// 	console.log('  audit libs/shared                    # Audit specific library')
// 	console.log('  audit -l                             # Show detailed output')
// 	console.log('  audit gw -l --warn-only              # Audit with options')
// 	console.log('')
// 	console.log('Path-based Auditing:')
// 	console.log('  packages/feature-name                # Audit all projects in feature directory')
// 	console.log('  libs/library-name                    # Audit specific library')
// 	console.log('')
// 	console.log('Available packages:')

// 	const packagesDir = path.join(ROOT, 'packages')
// 	const allPackages = fs.readdirSync(packagesDir, { withFileTypes: true })
// 		.filter(dirent => dirent.isDirectory() && !dirent.name.startsWith('template-'))
// 		.map(dirent => dirent.name)
// 		.sort()
	
// 	for (const pkg of allPackages) {
// 		console.log(`  - ${pkg}`)
// 	}
	
// 	console.log('')
// 	console.log('Available libs:')

// 	const libsDir = path.join(ROOT, 'libs')

// 	if (fs.existsSync(libsDir)) {
// 		const allLibs = fs.readdirSync(libsDir, { withFileTypes: true })
// 			.filter(dirent => dirent.isDirectory() && dirent.name !== 'tools')
// 			.map(dirent => dirent.name)
// 			.sort()
		
// 		for (const lib of allLibs) {
// 			console.log(`  - ${lib}`)
// 		}
// 	}
	
// 	console.log('')
// 	console.log('Exclusions and Notes:')
// 	console.log('')
// 	console.log('Package Types:')
// 	console.log('  • Template packages (starting with "template-") are excluded from auditing')
// 	console.log('  • Core-only packages are checked for core-specific targets only')
// 	console.log('  • Ext packages require full target set (lint, lint:full, check-types, check-types:full, validate, validate:full)')
// 	console.log('  • Core packages exclude package-related and validate targets')
// 	console.log('')
// 	console.log('Libraries (libs/):')
// 	console.log('  • Excluded from validate target checks (libraries don\'t need validate targets)')
// 	console.log('  • Use @nx/eslint:lint and @nx/js:tsc executors for :full targets (not nx:run-commands)')
// 	console.log('  • Only require lint, lint:full, check-types, and check-types:full targets')
// 	console.log('  • Tools directory is excluded (admin scripts only)')
// 	console.log('')
// 	console.log('VSCode Integration:')
// 	console.log('  • Adapter files (*.adapter.ts) are excluded from VSCode value import checks')
// 	console.log('  • Type imports from VSCode are allowed (only value imports are flagged)')
// 	console.log('  • Comments and string literals containing "vscode." are excluded from VSCode checks')
// 	console.log('  • Shared package is allowed to have VSCode adapters (other packages must use shared adapters)')
// 	console.log('')
// 	console.log('Testing Strategy Compliance:')
// 	console.log('  • Core packages should NEVER import from @fux/shared during tests')
// 	console.log('  • Extension packages should only test VSCode integration, not business logic')
// 	console.log('  • Use Mockly shims instead of hard-coded mocks')
// 	console.log('  • Test setup files should clear mocks in beforeEach')
// 	console.log('')
// 	console.log('Architectural Patterns:')
// 	console.log('  • Extension packages must be thin wrappers (no business logic)')
// 	console.log('  • All adapters must be in the shared package')
// 	console.log('  • No direct Node.js module imports in extension code')
// 	console.log('  • Build-only dependencies must be in devDependencies')
// 	console.log('')
// 	console.log('Test Files:')
// 	console.log('  • Test files (*.test.*, *.spec.*, setup.*) are excluded from VSCode adapter checks')
// 	console.log('  • Test files are excluded from various validation checks')
// 	console.log('')
// 	console.log('File Processing:')
// 	console.log('  • Files that can\'t be read or parsed are skipped with appropriate error messages')
// 	console.log('  • JSON files with comments and trailing commas are supported (stripped during parsing)')
// }

// function main() { //>
// 	const packagesDir = path.join(ROOT, 'packages')
// 	const libsDir = path.join(ROOT, 'libs')
	
// 	// Get all packages and their subdirectories
// 	const allPackages: string[] = []

// 	if (fs.existsSync(packagesDir)) {
// 		const packageDirs = fs.readdirSync(packagesDir, { withFileTypes: true })
// 			.filter(dirent => dirent.isDirectory() && !dirent.name.startsWith('template-'))
		
// 		for (const pkgDir of packageDirs) {
// 			const pkgPath = path.join(packagesDir, pkgDir.name)
// 			const subDirs = fs.readdirSync(pkgPath, { withFileTypes: true })
// 				.filter(dirent => dirent.isDirectory())
// 				.map(dirent => dirent.name)
			
// 			for (const subDir of subDirs) {
// 				allPackages.push(`${pkgDir.name}-${subDir}`)
// 			}
// 		}
// 	}
	
// 	// Get all libs (excluding tools)
// 	const allLibs = fs.existsSync(libsDir)
// 		? fs.readdirSync(libsDir, { withFileTypes: true })
// 			.filter(dirent => dirent.isDirectory() && dirent.name !== 'tools')
// 			.map(dirent => dirent.name)
// 		: []
	
// 	// Combine all items for checking
// 	const allItems = [...allPackages, ...allLibs]

// 	// Parse command line arguments
// 	const args = process.argv.slice(2)
// 	const projectArgs: string[] = []
// 	let isExpanded = false
// 	let warnOnly = false

// 	// Check for help flags first
// 	if (args.includes('-h') || args.includes('--help')) {
// 		showHelp()
// 		process.exit(0)
// 	}

// 	for (let i = 0; i < args.length; i++) {
// 		const arg = args[i]

// 		if (arg === '-l' || arg === '--list') {
// 			isExpanded = true
// 		}
// 		else if (arg === '--warn-only') {
// 			warnOnly = true
// 		}
// 		else if (!arg.startsWith('-')) {
// 			projectArgs.push(arg.trim())
// 		}
// 	}

// 	// If no project arguments provided, show help
// 	if (projectArgs.length === 0) {
// 		console.error(`${color(196)}Error: No projects specified for audit.\x1B[0m`)
// 		console.error(`${color(196)}Usage: audit <project1> [project2] [project3] ... [options]\x1B[0m`)
// 		console.error(`${color(196)}Examples:\x1B[0m`)
// 		console.error(`${color(196)}  audit ghost-writer-core\x1B[0m`)
// 		console.error(`${color(196)}  audit ghost-writer-core ghost-writer-ext\x1B[0m`)
// 		console.error(`${color(196)}  audit packages/ghost-writer\x1B[0m`)
// 		console.error(`${color(196)}  audit gw gwc gwe\x1B[0m`)
// 		console.error(`${color(196)}  audit -h\x1B[0m`)
// 		process.exit(1)
// 	}

// 	// Process project arguments to resolve aliases and paths
// 	const itemsToAudit: string[] = []

// 	for (const projectArg of projectArgs) {
// 		// Check if it's a path (contains '/' or '\')
// 		if (projectArg.includes('/') || projectArg.includes('\\')) {
// 			const normalizedPath = projectArg.replace(/\\/g, '/')
			
// 			// Handle @fux/project-name format
// 			if (normalizedPath.startsWith('@fux/')) {
// 				const projectName = normalizedPath.replace('@fux/', '')

// 				if (allItems.includes(projectName)) {
// 					itemsToAudit.push(projectName)
// 				}
// 				else {
// 					console.error(`${color(196)}Error: Project '${projectName}' not found.\x1B[0m`)
// 					process.exit(1)
// 				}
// 			}
// 			// Handle packages/feature-name format
// 			else if (normalizedPath.startsWith('packages/')) {
// 				const featureName = normalizedPath.replace('packages/', '')
// 				const featureDir = path.join(packagesDir, featureName)
				
// 				if (fs.existsSync(featureDir) && fs.statSync(featureDir).isDirectory()) {
// 					// Get all subdirectories in the feature directory
// 					const subDirs = fs.readdirSync(featureDir, { withFileTypes: true })
// 						.filter(dirent => dirent.isDirectory())
// 						.map(dirent => dirent.name)
					
// 					for (const subDir of subDirs) {
// 						const fullProjectName = `${featureName}-${subDir}`

// 						if (allItems.includes(fullProjectName)) {
// 							itemsToAudit.push(fullProjectName)
// 						}
// 					}
// 				}
// 				else {
// 					console.error(`${color(196)}Error: Directory '${normalizedPath}' not found.\x1B[0m`)
// 					process.exit(1)
// 				}
// 			}
// 			// Handle libs/feature-name format
// 			else if (normalizedPath.startsWith('libs/')) {
// 				const libName = normalizedPath.replace('libs/', '')

// 				if (allItems.includes(libName)) {
// 					itemsToAudit.push(libName)
// 				}
// 				else {
// 					console.error(`${color(196)}Error: Library '${libName}' not found.\x1B[0m`)
// 					process.exit(1)
// 				}
// 			}
// 			else {
// 				console.error(`${color(196)}Error: Invalid path '${projectArg}'. Use 'packages/feature-name' or 'libs/library-name'.\x1B[0m`)
// 				process.exit(1)
// 			}
// 		}
// 		// Check if it's already a valid project name
// 		else if (allItems.includes(projectArg)) {
// 			itemsToAudit.push(projectArg)
// 		}
// 		// Try to resolve as alias or project name
// 		else {
// 			const resolvedPackage = resolvePackageName(projectArg)

// 			if (resolvedPackage && allItems.includes(resolvedPackage)) {
// 				itemsToAudit.push(resolvedPackage)
// 			}
// 			else {
// 				console.error(`${color(196)}Error: Project '${projectArg}' not found in the 'packages' or 'libs' directories, and is not a valid alias.\x1B[0m`)
// 				console.error(`${color(196)}Available projects: ${allItems.join(', ')}\x1B[0m`)
// 				console.error(`${color(196)}Available aliases: ${Object.keys(loadAliases().packages || {}).join(', ')}\x1B[0m`)
// 				process.exit(1)
// 			}
// 		}
// 	}

// 	// Remove duplicates while preserving order
// 	const uniqueItemsToAudit = [...new Set(itemsToAudit)]

// 	// Show audit list
// 	console.log('Auditing:')
// 	for (const item of uniqueItemsToAudit) {
// 		console.log(`  - ${item}`)
// 	}
// 	console.log() // Blank line before errors

// 	let ok = true

// 	for (const item of uniqueItemsToAudit) {
// 		// Check if it's a package or lib
// 		const isPackage = allPackages.includes(item)
// 		const isLib = allLibs.includes(item)
		
// 		if (isPackage) {
// 			// Extract feature name from project name (e.g., "ghost-writer-core" -> "ghost-writer")
// 			const featureName = item.replace(/-core$|-ext$/, '')
			
// 			// Run package-specific checks
// 			ok = checkTsconfigCore(featureName) && ok
// 			ok = checkTsconfigCoreLib(featureName) && ok
// 			ok = checkTsconfigExt(featureName) && ok
// 			ok = checkVitestConfig(featureName) && ok
// 			ok = checkVitestCoverageConfig(featureName) && ok
// 			ok = checkNoDynamicImports(featureName) && ok
// 			ok = checkNoVSCodeValueImports(featureName) && ok
// 			ok = checkRequiredFiles(featureName) && ok
// 			ok = checkCorePackageDependencies(featureName) && ok
// 			ok = checkExtensionPackageDependencies(featureName) && ok
// 			ok = checkExtensionPackageModuleType(featureName) && ok
// 			ok = checkCorePackageBuildConfig(featureName) && ok
// 			ok = checkExtensionPackageBuildConfig(featureName) && ok
// 			ok = checkPackageTestConfig(featureName) && ok
// 			ok = checkTestSetupStructure(featureName) && ok
// 			ok = checkTestOrganization(featureName) && ok
// 			ok = checkTestFileImports(featureName) && ok
// 			ok = checkNoSharedReferencesAnywhere(featureName) && ok
// 			ok = checkNoMocklyReferencesAnywhere(featureName) && ok
// 			ok = checkExtensionThinWrapperPrinciple(featureName) && ok
// 			ok = checkCoreDirectInstantiation(featureName) && ok
// 		}
// 		else if (isLib) {
// 			// Lib-specific checks can be added here if needed
// 			// For now, libs are not part of the refactored end state audit
// 		}
// 	}

// 	// Use expanded output if flag is set, otherwise use grouped (default)
// 	if (isExpanded) {
// 		printExpandedErrors()
// 	}
// 	else {
// 		printGroupedErrors()
// 	}

// 	if (Object.keys(errors).length > 0) {
// 		if (warnOnly) {
// 			console.log(`${color(214)}Auditor findings present, but --warn-only specified. Exiting 0.[0m`)
// 			process.exit(0)
// 		}
// 		process.exit(1)
// 	}
// } //<

// main()
