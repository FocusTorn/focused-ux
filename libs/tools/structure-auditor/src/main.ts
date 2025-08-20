import path from 'node:path'
import fs from 'node:fs'
import process from 'node:process'
import { color, ROOT } from './util/helpers.js'
import { errors, printGroupedErrors, printExpandedErrors } from './util/errors.js'
import { readJson } from './util/fs.js'
import { checkPackageJsonExtDependencies, checkNoUnusedDeps, checkVSCodeEngineVersion, checkPackageVersionFormat, checkCorePackageDependencies } from './checks/package-json.js'
import { checkProjectJsonExt, checkProjectJsonPackaging, checkProjectJsonExternalsConsistency, checkProjectJsonExtExternals, checkProjectJsonLintAndTestTargets, checkProjectJsonLintAndTestTargetsLibs, checkProjectJsonTargetConsistency, checkUniversalTargets } from './checks/project-json.js'
import { checkTsconfigExt, checkTsconfigCore, checkTsconfigShared, checkTsconfigLibPaths } from './checks/tsconfig.js'
import { checkRequiredExtFiles, checkNoDynamicImports, checkNoVSCodeValueImports, checkVSCodeAdaptersInSharedOnly, checkNoDynamicImportsInShared } from './checks/misc.js'
import { checkNoSharedImportsInCoreTests, checkExtensionThinWrapperPrinciple, checkMocklyIntegrationPatterns, checkTestSetupPatterns } from './checks/testing-strategy.js'
import { checkExtensionThinWrapperPrinciple as checkExtThinWrapper, checkCoreDIContainerPatterns, checkAdapterArchitecture, checkNoNodeJsImports, checkBuildDependenciesInDevDeps } from './checks/architecture.js'

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
		else if (aliasData.name) {
			// Handle object aliases like { "name": "ghost-writer", "suffix": "ext" }
			return aliasData.name
		}
	}
	
	return null
}

function showHelp() {
	console.log('AKA - Feature Structure Auditor')
	console.log('')
	console.log('Usage:')
	console.log('  audit [package|alias] [options]')
	console.log('')
	console.log('Options:')
	console.log('  -l, --list     Show detailed output with line/column numbers')
	console.log('  -g, --grouped  Show grouped output (default)')
	console.log('  --warn-only    Do not exit with non-zero code; print findings and exit 0')
	console.log('  -h, --help     Show this help message')
	console.log('')
	console.log('Examples:')
	console.log('  audit                    # Audit all packages and libs (grouped)')
	console.log('  audit ghost-writer       # Audit specific package (grouped)')
	console.log('  audit @fux/ghost-writer-ext  # Audit using full project name')
	console.log('  audit gw                 # Audit using alias (ghost-writer)')
	console.log('  audit gwc                # Audit using alias (ghost-writer-core)')
	console.log('  audit shared             # Audit specific lib (grouped)')
	console.log('  audit -l                 # Audit all packages and libs (detailed)')
	console.log('')
	console.log('Available packages:')

	const packagesDir = path.join(ROOT, 'packages')
	const allPackages = fs.readdirSync(packagesDir, { withFileTypes: true })
		.filter(dirent => dirent.isDirectory() && !dirent.name.startsWith('template-'))
		.map(dirent => dirent.name)
		.sort()
	
	for (const pkg of allPackages) {
		console.log(`  - ${pkg}`)
	}
	
	console.log('')
	console.log('Available libs:')

	const libsDir = path.join(ROOT, 'libs')

	if (fs.existsSync(libsDir)) {
		const allLibs = fs.readdirSync(libsDir, { withFileTypes: true })
			.filter(dirent => dirent.isDirectory() && dirent.name !== 'tools')
			.map(dirent => dirent.name)
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

function main() { //>
	const packagesDir = path.join(ROOT, 'packages')
	const libsDir = path.join(ROOT, 'libs')
	
	// Get all packages
	const allPackages = fs.existsSync(packagesDir)
		? fs.readdirSync(packagesDir, { withFileTypes: true })
			.filter(dirent => dirent.isDirectory() && !dirent.name.startsWith('template-'))
			.map(dirent => dirent.name)
		: []
	
	// Get all libs (excluding tools)
	const allLibs = fs.existsSync(libsDir)
		? fs.readdirSync(libsDir, { withFileTypes: true })
			.filter(dirent => dirent.isDirectory() && dirent.name !== 'tools')
			.map(dirent => dirent.name)
		: []
	
	// Combine all items for checking
	const allItems = [...allPackages, ...allLibs]

	// Parse command line arguments
	const args = process.argv.slice(2)
	let singleItemArg: string | null = null
	let isExpanded = false
	let warnOnly = false

	// Check for help flags first
	if (args.includes('-h') || args.includes('--help')) {
		showHelp()
		process.exit(0)
	}

	for (let i = 0; i < args.length; i++) {
		const arg = args[i]

		if (arg === '-l' || arg === '--list') {
			isExpanded = true
		}
		else if (arg === '--warn-only') {
			warnOnly = true
		}
		else if (!arg.startsWith('-') && !singleItemArg) {
			singleItemArg = arg
		}
	}

	const itemsToAudit = singleItemArg && typeof singleItemArg === 'string' && singleItemArg.trim() ? [singleItemArg.trim()] : allItems

	if (singleItemArg && typeof singleItemArg === 'string' && singleItemArg.trim()) {
		const inputArg = singleItemArg.trim()
		
		// Check if it's already a valid package name
		if (allItems.includes(inputArg)) {
			// It's already a valid package name, use it as is
			itemsToAudit.length = 0
			itemsToAudit.push(inputArg)
		}
		else {
			// Try to resolve as alias or project name
			const resolvedPackage = resolvePackageName(inputArg)

			if (resolvedPackage && allItems.includes(resolvedPackage)) {
				// Use the resolved package name
				itemsToAudit.length = 0
				itemsToAudit.push(resolvedPackage)
			}
			else {
				console.error(`${color(196)}Error: Package/lib '${inputArg}' not found in the 'packages' or 'libs' directories, and is not a valid alias.\x1B[0m`)
				console.error(`${color(196)}Available packages: ${allItems.join(', ')}\x1B[0m`)
				console.error(`${color(196)}Available aliases: ${Object.keys(loadAliases().packages || {}).join(', ')}\x1B[0m`)
				process.exit(1)
			}
		}
	}

	// Show audit list for multiple items
	if (itemsToAudit.length > 1) {
		console.log('Auditing:')
		for (const item of itemsToAudit) {
			console.log(`  - ${item}`)
		}
		console.log() // Blank line before errors
	}

	let ok = true

	// Always audit shared tsconfig and shared-specific rules
	ok = checkTsconfigShared() && ok
	ok = checkNoDynamicImportsInShared() && ok

	for (const item of itemsToAudit) {
		// Check if it's a package or lib
		const isPackage = allPackages.includes(item)
		const isLib = allLibs.includes(item)
		
		if (isPackage) {
			// Run package-specific checks
			ok = checkTsconfigExt(item) && ok
			ok = checkTsconfigCore(item) && ok
			ok = checkTsconfigLibPaths(item) && ok
			ok = checkProjectJsonExt(item) && ok
			ok = checkProjectJsonPackaging(item) && ok
			ok = checkProjectJsonExternalsConsistency(item) && ok
			ok = checkProjectJsonExtExternals(item) && ok
			ok = checkProjectJsonLintAndTestTargets(item) && ok
			ok = checkProjectJsonTargetConsistency(item) && ok
			ok = checkPackageJsonExtDependencies(item) && ok
			ok = checkNoDynamicImports(item) && ok
			ok = checkNoVSCodeValueImports(item) && ok
			ok = checkVSCodeAdaptersInSharedOnly(item) && ok
			ok = checkNoUnusedDeps(item) && ok
			ok = checkVSCodeEngineVersion(item) && ok
			ok = checkPackageVersionFormat(item) && ok
			ok = checkRequiredExtFiles(item) && ok
			ok = checkCorePackageDependencies(item) && ok
			
			// New architectural and testing strategy checks
			ok = checkNoSharedImportsInCoreTests(item) && ok
			ok = checkExtensionThinWrapperPrinciple(item) && ok
			ok = checkMocklyIntegrationPatterns(item) && ok
			ok = checkTestSetupPatterns(item) && ok
			ok = checkExtThinWrapper(item) && ok
			ok = checkCoreDIContainerPatterns(item) && ok
			ok = checkAdapterArchitecture(item) && ok
			ok = checkNoNodeJsImports(item) && ok
			ok = checkBuildDependenciesInDevDeps(item) && ok
			
			// Check universal targets for core and ext
			const coreProjectPath = path.join(ROOT, 'packages', item, 'core', 'project.json')

			if (fs.existsSync(coreProjectPath)) {
				ok = checkUniversalTargets(coreProjectPath, item, 'core') && ok
			}
			
			const extProjectPath = path.join(ROOT, 'packages', item, 'ext', 'project.json')

			if (fs.existsSync(extProjectPath)) {
				ok = checkUniversalTargets(extProjectPath, item, 'ext') && ok
			}
		}
		else if (isLib) {
			// Run lib-specific checks
			ok = checkProjectJsonLintAndTestTargetsLibs(item) && ok
			
			// Check universal targets for libs
			const libProjectPath = path.join(ROOT, 'libs', item, 'project.json')

			if (fs.existsSync(libProjectPath)) {
				ok = checkUniversalTargets(libProjectPath, item, 'lib') && ok
			}
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
			console.log(`${color(214)}Auditor findings present, but --warn-only specified. Exiting 0.[0m`)
			process.exit(0)
		}
		process.exit(1)
	}
} //<

main()
