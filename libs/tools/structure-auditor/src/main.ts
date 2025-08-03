import path from 'node:path'
import fs from 'node:fs'
import process from 'node:process'
import { color, ROOT } from './util/helpers.js'
import { errors, printGroupedErrors } from './util/errors.js'
import { checkPackageJsonExtDependencies, checkNoUnusedDeps, checkVSCodeEngineVersion, checkPackageVersionFormat, checkCorePackageDependencies } from './checks/package-json.js'
import { checkProjectJsonExt, checkProjectJsonPackaging, checkProjectJsonExternalsConsistency, checkProjectJsonExtExternals } from './checks/project-json.js'
import { checkTsconfigExt, checkTsconfigCore, checkTsconfigShared, checkTsconfigLibPaths } from './checks/tsconfig.js'
import { checkRequiredExtFiles, checkNoDynamicImports, checkNoVSCodeValueImports } from './checks/misc.js'

function main() { //>
	const packagesDir = path.join(ROOT, 'packages')
	const allPackages = fs.readdirSync(packagesDir, { withFileTypes: true })
		.filter(dirent => dirent.isDirectory() && !dirent.name.startsWith('template-'))
		.map(dirent => dirent.name)

	const singlePackageArg = process.argv[2] // Get the first argument after script name
	const packagesToAudit = singlePackageArg && typeof singlePackageArg === 'string' && singlePackageArg.trim() ? [singlePackageArg.trim()] : allPackages

	if (singlePackageArg && typeof singlePackageArg === 'string' && !allPackages.includes(singlePackageArg.trim())) {
		console.error(`${color(196)}Error: Package '${singlePackageArg}' not found in the 'packages' directory.\x1B[0m`)
		process.exit(1)
	}

	// Show audit list for multiple packages
	if (packagesToAudit.length > 1) {
		console.log('Auditing:')
		for (const pkg of packagesToAudit) {
			console.log(`  - ${pkg}`)
		}
		console.log() // Blank line before errors
	}

	let ok = true

	ok = checkTsconfigShared() && ok

	for (const pkg of packagesToAudit) {
		ok = checkTsconfigExt(pkg) && ok
		ok = checkTsconfigCore(pkg) && ok
		ok = checkTsconfigLibPaths(pkg) && ok
		ok = checkProjectJsonExt(pkg) && ok
		ok = checkProjectJsonPackaging(pkg) && ok
		ok = checkProjectJsonExternalsConsistency(pkg) && ok
		ok = checkProjectJsonExtExternals(pkg) && ok
		ok = checkPackageJsonExtDependencies(pkg) && ok
		ok = checkNoDynamicImports(pkg) && ok
		ok = checkNoVSCodeValueImports(pkg) && ok
		ok = checkNoUnusedDeps(pkg) && ok
		ok = checkVSCodeEngineVersion(pkg) && ok
		ok = checkPackageVersionFormat(pkg) && ok
		ok = checkRequiredExtFiles(pkg) && ok
		ok = checkCorePackageDependencies(pkg) && ok
	}

	printGroupedErrors()

	if (Object.keys(errors).length > 0) {
		process.exit(1)
	}
} //<

main()
