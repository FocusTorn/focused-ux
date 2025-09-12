import { execSync, spawnSync } from 'node:child_process'
import { readFileSync, mkdirSync, cpSync, writeFileSync, existsSync, unlinkSync } from 'node:fs'
import { resolve, join } from 'node:path'
import process from 'node:process'
import { sync as rimrafSync } from 'rimraf'

// Increase max listeners to prevent warnings during Nx task execution
// This is necessary because Nx's run-commands executor adds multiple exit listeners
// for task management, cleanup, and graceful shutdown handling
process.setMaxListeners(50) // Increased to accommodate Nx's task management and VSIX packaging needs

// This script creates a self-contained VSIX.
// It relies on Nx for caching. By default, it is quiet but always shows vsce output.
// To see all script chatter and npm output, run with VSIX_VERBOSE=1.
// e.g., VSIX_VERBOSE=1 nx run my-ext:package:dev
//
// Usage:
// node scripts/create-vsix.js <path_to_ext_dir> <output_dir> [--dev]

// Enable verbose mode when explicitly set
const isVerbose = process.env.VSIX_VERBOSE === '1'

const steps = [
	'Preparing deployment directory',
	'Preparing package.json',
	'Copying build artifacts',
	'Resolving dependencies',
	'Constructing node_modules',
	'Packaging VSIX',
	'Cleanup',
]

function updateProgress(step, message = '') {
	const stepName = steps[step - 1] || 'Unknown'

	if (isVerbose) {
		// In verbose mode, show detailed progress with ora
		if (message) {
			console.log(`[${step}/${steps.length}] ${stepName}: ${message}`)
		}
	} else {
		// In non-verbose mode, show a simple progress indicator
		const percentage = Math.round((step / steps.length) * 100)
		const progressBar
            = '█'.repeat(Math.floor(percentage / 10)) + '░'.repeat(10 - Math.floor(percentage / 10))
		const progressText = `VSIX Packaging |${progressBar}| ${percentage}% | ${step}/${steps.length} | ${stepName}`

		// Use stderr to avoid Nx buffering issues
		process.stderr.write(`\r${progressText.padEnd(80)}`)
	}
}

function completeStep(message = '') {
	if (isVerbose && message) {
		console.log(`✓ ${message}`)
	}
	// In non-verbose mode, we do nothing; the bar updates on the next `updateProgress` call.
}

function finishProgress() {
	if (isVerbose) {
		console.log('✓ Finished packaging process.')
	} else {
		// Clear the entire line and move to the next for subsequent output.
		process.stderr.write(`\r${' '.repeat(120)}\r\n`)
		// process.stderr.write('\r' + ' '.repeat(120) + '\r\n')
	}
}

const [packagePath, outputDir, devFlag] = process.argv.slice(2)
const isDevBuild = devFlag === '--dev'

if (!packagePath || !outputDir) {
	console.error('Error: Package path and output directory arguments are required.')
	process.exit(1)
}

const workspaceRoot = resolve(process.cwd())
const packageDir = join(workspaceRoot, packagePath)
const packageJsonPath = join(packageDir, 'package.json')
const originalPackageJson = JSON.parse(readFileSync(packageJsonPath, 'utf-8'))
const originalVersion = originalPackageJson.version
const vsixBaseName = originalPackageJson.name
const outputVsixName = vsixBaseName.startsWith('fux-') ? vsixBaseName.slice(4) : vsixBaseName

const deployDir = join(workspaceRoot, 'tmp', 'deploy', vsixBaseName)
const finalOutputDir = join(workspaceRoot, outputDir)

if (isVerbose) {
	console.log(`Preparing to package: ${vsixBaseName}`)
	console.log(`Deployment directory: ${deployDir}`)
	console.log(`Final output directory: ${finalOutputDir}`)
	console.log(`Output VSIX name: ${outputVsixName}`)
}

let exitCode = 0

try {
	// 1. Clean and create the deployment directory.
	updateProgress(1, 'Cleaning existing deployment directory')
	rimrafSync(deployDir)
	completeStep('Cleaned existing deployment directory')

	updateProgress(1, 'Creating deployment directory')
	mkdirSync(deployDir, { recursive: true })
	completeStep('Created deployment directory')

	updateProgress(1, 'Creating output directory')
	mkdirSync(finalOutputDir, { recursive: true })
	completeStep('Created output directory')

	// 2. Copy the original package.json to the deploy directory.
	updateProgress(2, 'Reading original package.json')

	const finalPackageJson = { ...originalPackageJson }
	let vsixFilename = `${outputVsixName}-${originalVersion}.vsix`

	if (isDevBuild) {
		const taskHash = process.env.NX_TASK_HASH

		if (!taskHash) {
			throw new Error(
				'NX_TASK_HASH environment variable not found. This script should be run via Nx for dev builds.',
			)
		}

		const shortHash = taskHash.slice(0, 9)
		const finalVersion = `${originalVersion}-dev.${shortHash}`

		vsixFilename = `${outputVsixName}-dev.vsix`
		finalPackageJson.version = finalVersion
		completeStep(`Using dev version: ${finalVersion}`)
	}
	// Remove dependencies section, as we are constructing node_modules manually.
	delete finalPackageJson.dependencies
	writeFileSync(join(deployDir, 'package.json'), JSON.stringify(finalPackageJson, null, 4))
	completeStep('Package.json prepared for deployment')

	// 3. Copy build artifacts and other assets.
	updateProgress(3, 'Copying build artifacts')

	const assetsToCopy = [
		'dist',
		'assets',
		'README.md',
		'LICENSE.txt',
		'CHANGELOG.md',
		'.vscodeignore',
	]

	for (const asset of assetsToCopy) {
		const source = join(packageDir, asset)
		const dest = join(deployDir, asset)

		if (existsSync(source)) {
			updateProgress(3, `Copying ${asset}`)
			cpSync(source, dest, { recursive: true, errorOnExist: false, force: true })
			completeStep(`Copied ${asset}`)
		} else {
			updateProgress(3, `Skipping ${asset} (not found)`)
			completeStep(`Skipped ${asset}`)
		}
	}
	completeStep('Build artifacts copied')

	// 4. Get the production dependency graph using `pnpm list`.
	updateProgress(4, 'Running pnpm list to get dependency tree')

	const pnpmListOutput = execSync(`pnpm list --prod --json --depth=Infinity`, {
		cwd: packageDir,
		encoding: 'utf-8',
		timeout: 60000, // 1 minute timeout
	})
	const pnpmList = JSON.parse(pnpmListOutput)

	completeStep('Dependency tree resolved')

	// 5. Manually construct the node_modules directory by copying resolved dependencies.
	updateProgress(5, 'Creating node_modules directory')

	const deployNodeModules = join(deployDir, 'node_modules')

	mkdirSync(deployNodeModules, { recursive: true })
	completeStep('Created node_modules directory')

	// The output of `pnpm list --json` is an array. We must access the first element's dependencies.
	const projectDeps = pnpmList.length > 0 ? pnpmList[0].dependencies : undefined

	if (projectDeps) {
		const depCount = Object.keys(projectDeps).length

		updateProgress(5, `Found ${depCount} top-level production dependencies`)

		let copiedCount = 0
		let skippedCount = 0

		// Function to recursively copy dependencies
		function copyDependencyTree(dependencies, processed = new Set()) {
			if (!dependencies)
				return

			for (const depName in dependencies) {
				const depInfo = dependencies[depName]

				// Skip if already processed
				if (processed.has(depName))
					continue
				processed.add(depName)

				// Skip workspace packages (they have 'link:' in version)
				if (depInfo.version && depInfo.version.startsWith('link:')) {
					updateProgress(5, `Skipping workspace package: ${depName}`)
					completeStep(`Skipped ${depName}`)
					skippedCount++
					continue
				}

				if (depInfo.path) {
					const destPath = join(deployNodeModules, depName)

					if (!existsSync(destPath)) {
						// Show which module is being constructed
						updateProgress(5, `Constructing node_modules: ${depName}`)
						// Ensure parent directory exists (for scoped packages)
						mkdirSync(join(destPath, '..'), { recursive: true })
						try {
							cpSync(depInfo.path, destPath, { recursive: true })
							copiedCount++
							completeStep(`Copied ${depName}`)
						} catch (copyError) {
							// Skip broken symlinks or missing files
							if (copyError.code === 'ENOENT' || copyError.code === 'ENOTDIR') {
								updateProgress(5, `Skipping broken dependency: ${depName}`)
								completeStep(`Skipped broken ${depName}`)
								skippedCount++
							} else {
								throw copyError
							}
						}
					}

					// Recursively copy nested dependencies
					if (depInfo.dependencies) {
						copyDependencyTree(depInfo.dependencies, processed)
					}
				}
			}
		}

		// Copy all dependencies recursively
		copyDependencyTree(projectDeps)
		completeStep(`Dependencies processed: ${copiedCount} copied, ${skippedCount} skipped`)
	} else {
		updateProgress(5, 'No production dependencies found to copy')
		completeStep('No dependencies to copy')
	}

	// 6. Package the VSIX.
	updateProgress(6, 'Running vsce package command')

	const vsixOutputPath = join(finalOutputDir, vsixFilename)

	// Create a temporary .vscodeignore to suppress bundling warnings
	const vscodeignorePath = join(deployDir, '.vscodeignore')
	const originalVscodeignore
        = existsSync(vscodeignorePath) ? readFileSync(vscodeignorePath, 'utf-8') : ''
	const tempVscodeignore = `${originalVscodeignore}\nnode_modules/**\n`

	writeFileSync(vscodeignorePath, tempVscodeignore)

	// Capture vsce output, suppressing bundling warnings
	let vsceOutput = ''

	try {
		// Use spawnSync to have more control over output handling
		const result = spawnSync('vsce', ['package', '-o', vsixOutputPath], {
			cwd: deployDir,
			encoding: 'utf-8',
			stdio: ['pipe', 'pipe', 'pipe'],
			env: {
				...process.env,
				VSCE_SILENT: 'true',
				NODE_NO_WARNINGS: '1', // Suppress Node.js warnings in child process
				NODE_OPTIONS: '--no-warnings', // Additional Node.js warning suppression
			},
			timeout: 300000, // 5 minute timeout
		})

		// Check for command not found or execution errors
		if (result.error) {
			throw new Error(`Failed to execute vsce: ${result.error.message}`)
		}

		if (result.status !== 0) {
			const errorMsg = result.stderr || result.stdout || 'Unknown error'

			throw new Error(`vsce failed with status ${result.status}: ${errorMsg}`)
		}

		// Clear the progress bar immediately after vsce completes
		process.stderr.write(`\r${' '.repeat(120)}\r\n`)

		// Combine stdout and stderr, filtering out bundling warnings
		const allOutput = (result.stdout || '') + (result.stderr || '')

		vsceOutput = allOutput
			.split('\n')
			.filter((line) => {
				// Filter out bundling warnings since we intentionally include node_modules
				return (
					!line.includes('For performance reasons, you should bundle your extension')
					&& !line.includes(
						'You should also exclude unnecessary files by adding them to your .vscodeignore',
					)
					&& !line.includes('This extension consists of')
					&& !line.includes('JavaScript files')
					&& !line.includes('VSIX packaging completed successfully!')
				)
			})
			.join('\n')
			.trim()
	} catch (_error) {
		// Fallback to execSync if spawnSync fails
		try {
			const vsceCommand = `vsce package -o "${vsixOutputPath}" 2>&1`

			vsceOutput = execSync(vsceCommand, {
				cwd: deployDir,
				encoding: 'utf-8',
				timeout: 300000, // 5 minute timeout
				env: {
					...process.env,
					NODE_NO_WARNINGS: '1', // Suppress Node.js warnings in child process
					NODE_OPTIONS: '--no-warnings', // Additional Node.js warning suppression
				},
			})

			// Clear the progress bar immediately after vsce completes
			process.stderr.write(`\r${' '.repeat(120)}\r\n`)

			// Filter the output after capture
			vsceOutput = vsceOutput
				.split('\n')
				.filter((line) => {
					// Filter out bundling warnings since we intentionally include node_modules
					return (
						!line.includes(
							'For performance reasons, you should bundle your extension',
						)
						&& !line.includes(
							'You should also exclude unnecessary files by adding them to your .vscodeignore',
						)
						&& !line.includes('This extension consists of')
						&& !line.includes('JavaScript files')
						&& !line.includes('VSIX packaging completed successfully!')
					)
				})
				.join('\n')
				.trim()
		} catch (fallbackError) {
			// If both approaches fail, combine stdout and stderr from the error object before re-throwing.
			vsceOutput = (fallbackError.stdout || '') + (fallbackError.stderr || '')
			throw fallbackError
		}
	}

	if (!existsSync(vsixOutputPath)) {
		throw new Error(
			`vsce command completed, but the VSIX file was not found at: ${vsixOutputPath}`,
		)
	}

	completeStep(`VSIX packaged successfully: ${vsixFilename}`)

	// Restore original .vscodeignore
	if (originalVscodeignore !== '') {
		writeFileSync(vscodeignorePath, originalVscodeignore)
	} else {
		// Remove the temporary file if it didn't exist originally
		if (existsSync(vscodeignorePath)) {
			unlinkSync(vscodeignorePath)
		}
	}

	// 7. Cleanup
	updateProgress(7, 'Cleaning up deployment directory')
	// rimrafSync(deployDir) // Temporarily disabled for debugging
	completeStep('Cleanup completed')

	// Clear the progress bar first
	finishProgress()

	// Show the filtered vsce output after the progress bar is complete
	if (vsceOutput.trim()) {
		console.log(vsceOutput)
	}

	// This is redundant with vsce output, so only show in verbose mode.
	if (isVerbose) {
		console.log(`Output: ${vsixOutputPath}`)
	}

	// Add a blank line for padding before the terminal prompt returns.
	console.log()
} catch (error) {
	if (isVerbose) {
		console.error('❌ A step failed during packaging.')
	}
	finishProgress()
	console.error(`\n❌ An error occurred during the packaging process:`, error)
	exitCode = 1
} finally {
	process.exit(exitCode)
}
