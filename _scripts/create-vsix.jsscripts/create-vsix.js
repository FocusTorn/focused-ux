import { execSync } from 'node:child_process'
import { readFileSync, mkdirSync, cpSync, writeFileSync, existsSync } from 'node:fs'
import { resolve, join } from 'node:path'
import process from 'node:process'
import { sync as rimrafSync } from 'rimraf'

// This script creates a self-contained VSIX.
// It uses `execSync` to avoid hangs on Windows that can occur when using
// `spawnSync` with child Node.js processes like npm or vsce.
//
// Usage:
// node scripts/create-vsix.js <path_to_ext_dir> <output_dir> [--dev]

/**
 * Logs a message to the console in bright green.
 * @param {string} message The message to log.
 */
function logSuccess(message) {
    // ANSI escape code for bright green text
    const greenColor = '\x1b[92m'
    // ANSI escape code to reset color
    const resetColor = '\x1b[0m'
    console.log(`\n${greenColor}${message}${resetColor}`)
}

/**
 * Logs a message to the console in bright yellow.
 * @param {string} message The message to log.
 */
function logWarning(message) {
    // ANSI escape code for bright yellow text
    const yellowColor = '\x1b[93m'
    // ANSI escape code to reset color
    const resetColor = '\x1b[0m'
    console.log(`\n${yellowColor}${message}${resetColor}`)
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

console.log(`Preparing to package: ${vsixBaseName}`)
console.log(`Deployment directory: ${deployDir}`)
console.log(`Final output directory: ${finalOutputDir}`)
console.log(`Output VSIX name: ${outputVsixName}`)

let exitCode = 0
try {
    // 1. Clean and create the deployment directory using rimraf for robustness.
    rimrafSync(deployDir)
    mkdirSync(deployDir, { recursive: true })
    mkdirSync(finalOutputDir, { recursive: true })

    // 2. Create a production-only package.json in the deploy directory.
    const prodPackageJson = { ...originalPackageJson }
    delete prodPackageJson.devDependencies
    delete prodPackageJson.scripts
    console.log('Created a production-only package.json manifest.')

    // 3. Handle versioning. Use NX_TASK_HASH for dev builds.
    let finalVersion = originalVersion
    let vsixFilename = `${outputVsixName}-${finalVersion}.vsix`

    if (isDevBuild) {
        const taskHash = process.env.NX_TASK_HASH
        if (!taskHash) {
            throw new Error(
                'NX_TASK_HASH environment variable not found. This script should be run via Nx.'
            )
        }
        const shortHash = taskHash.slice(0, 9)
        finalVersion = `${originalVersion}-dev.${shortHash}`
        vsixFilename = `${outputVsixName}-dev.vsix` // Use a stable filename for caching
        console.log(`Using deterministic dev version: ${finalVersion}`)
        prodPackageJson.version = finalVersion
    }

    if (prodPackageJson.license && prodPackageJson.license.startsWith('SEE LICENSE IN')) {
        prodPackageJson.license = 'SEE LICENSE IN LICENSE.txt'
    }
    writeFileSync(join(deployDir, 'package.json'), JSON.stringify(prodPackageJson, null, 4))

    // 4. Install production dependencies using NPM. execSync throws on error.
    console.log('Installing production dependencies with `npm install --omit=dev`...')
    const npmOutput = execSync('npm install --omit=dev', {
        cwd: deployDir,
        encoding: 'utf-8',
        stdio: 'pipe',
    })
    console.log(npmOutput)
    console.log('Isolated production dependencies installed.')

    // 5. Copy the build artifacts and other necessary assets into the deploy directory.
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
        cpSync(source, dest, { recursive: true, errorOnExist: false, force: true })
    }
    console.log('Copied build artifacts and assets.')

    // 6. Run vsce package. execSync throws on error.
    const vsixOutputPath = join(finalOutputDir, vsixFilename)
    const vsceCommand = `vsce package --no-dependencies -o "${vsixOutputPath}"`

    // Check if the file exists *before* packaging.
    const vsixExistsBefore = existsSync(vsixOutputPath)

    console.log('\nRunning command to package VSIX...')
    execSync(vsceCommand, {
        cwd: deployDir,
        encoding: 'utf-8',
        stdio: 'inherit', // Inherit stdio to see live output from vsce
    })

    // 7. Verify that the VSIX was actually created and provide contextual feedback.
    if (!existsSync(vsixOutputPath)) {
        throw new Error(
            `vsce command completed, but the VSIX file was not found at: ${vsixOutputPath}`
        )
    }

    if (vsixExistsBefore) {
        logWarning(`✅ VSIX already up-to-date (cached): ${vsixOutputPath}`)
    } else {
        logSuccess(`✅ Successfully created self-contained package: ${vsixOutputPath}`)
    }
} catch (error) {
    console.error('❌ An error occurred during the packaging process:', error)
    exitCode = 1
} finally {
    // 8. Clean up the temporary deployment directory using rimraf.
    rimrafSync(deployDir)
    console.log(`Cleaned up temporary directory: ${deployDir}`)
    // 9. Force exit the process to prevent any potential hanging.
    process.exit(exitCode)
}
