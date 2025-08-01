import { spawnSync } from 'node:child_process'
import { readFileSync, mkdirSync, cpSync, writeFileSync } from 'node:fs'
import { resolve, join } from 'node:path'
import process from 'node:process'
import { sync as rimrafSync } from 'rimraf'

// This script creates a self-contained VSIX.
// It now uses `stdio: 'pipe'` with `spawnSync` to manually handle I/O,
// preventing the process from hanging on Windows due to unclosed streams.
//
// Usage:
// node scripts/create-vsix.js <path_to_ext_dir> <output_dir> [--dev]

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

const deployDir = join(workspaceRoot, 'tmp', 'deploy', vsixBaseName)
const finalOutputDir = join(workspaceRoot, outputDir)

console.log(`Preparing to package: ${vsixBaseName}`)
console.log(`Deployment directory: ${deployDir}`)
console.log(`Final output directory: ${finalOutputDir}`)

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
    let vsixFilename = `${vsixBaseName}-${finalVersion}.vsix`

    if (isDevBuild) {
        const taskHash = process.env.NX_TASK_HASH
        if (!taskHash) {
            throw new Error(
                'NX_TASK_HASH environment variable not found. This script should be run via Nx.'
            )
        }
        const shortHash = taskHash.slice(0, 9)
        finalVersion = `${originalVersion}-dev.${shortHash}`
        vsixFilename = `${vsixBaseName}-dev.vsix` // Use a stable filename for caching
        console.log(`Using deterministic dev version: ${finalVersion}`)
        prodPackageJson.version = finalVersion
    }

    if (prodPackageJson.license && prodPackageJson.license.startsWith('SEE LICENSE IN')) {
        prodPackageJson.license = 'SEE LICENSE IN LICENSE.txt'
    }
    writeFileSync(join(deployDir, 'package.json'), JSON.stringify(prodPackageJson, null, 4))

    // 4. Install production dependencies using PNPM with proper stdio handling.
    console.log('Installing production dependencies with `pnpm install --prod`...')
    const pnpmResult = spawnSync('pnpm', ['install', '--prod'], {
        cwd: deployDir,
        encoding: 'utf-8',
        stdio: 'inherit', // Use inherit to allow pnpm to display progress
        timeout: 300000, // 5 minute timeout
    })
    if (pnpmResult.status !== 0) {
        console.error('pnpm install failed with status:', pnpmResult.status)
        console.error('pnpm error:', pnpmResult.error)
        throw new Error(`pnpm install failed with status ${pnpmResult.status}`)
    }
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

    // 6. Run vsce package, capturing output manually.
    const vsixOutputPath = join(finalOutputDir, vsixFilename)
    const vsceResult = spawnSync('vsce', ['package', '--no-dependencies', '-o', vsixOutputPath], {
        cwd: deployDir,
        encoding: 'utf-8',
        shell: true,
    })
    if (vsceResult.status !== 0) {
        console.error(vsceResult.stderr)
        throw new Error(`vsce package failed with status ${vsceResult.status}`)
    }
    console.log(vsceResult.stdout) // Print vsce output
    console.log(`✅ Successfully created self-contained package: ${vsixOutputPath}`)
} catch (error) {
    console.error('❌ An error occurred during the packaging process:', error)
    exitCode = 1
} finally {
    // 7. Clean up the temporary deployment directory using rimraf.
    rimrafSync(deployDir)
    console.log(`Cleaned up temporary directory: ${deployDir}`)
    // 8. Force exit the process to prevent any potential hanging.
    process.exit(exitCode)
}
