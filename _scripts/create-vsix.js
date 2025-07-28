import { execSync } from 'node:child_process'
import { readFileSync, mkdirSync, rmSync, cpSync, writeFileSync } from 'node:fs'
import { resolve, join } from 'node:path'
import process from 'node:process'

// This script creates a self-contained VSIX by building a clean, production-only
// package in a temporary directory and allowing vsce to run its standard validation.
//
// The key steps are:
// 1. Create a temporary directory.
// 2. Create a modified package.json in it that *only* contains `dependencies`.
// 3. Run `npm install --omit=dev` to create a clean, npm-compatible node_modules.
// 4. Copy the build artifacts (`dist/`) and other assets.
// 5. Run `vsce package` *without* --no-dependencies, allowing it to validate the clean environment.
//
// Usage:
// node _scripts/create-vsix.js <path_to_ext_dir> [--dev]

const [packagePath, devFlag] = process.argv.slice(2)
const isDevBuild = devFlag === '--dev'

if (!packagePath) {
    console.error('Error: Package path argument (relative to packages dir) is required.')
    process.exit(1)
}

const workspaceRoot = resolve(process.cwd())
const packageDir = join(workspaceRoot, packagePath)
const packageJsonPath = join(packageDir, 'package.json')
const originalPackageJson = JSON.parse(readFileSync(packageJsonPath, 'utf-8'))
const originalVersion = originalPackageJson.version
const vsixBaseName = originalPackageJson.name

const deployDir = join(workspaceRoot, 'tmp', 'deploy', vsixBaseName)

console.log(`Preparing to package: ${vsixBaseName}`)
console.log(`Deployment directory: ${deployDir}`)

try {
    // 1. Clean and create the deployment directory.
    rmSync(deployDir, { recursive: true, force: true })
    mkdirSync(deployDir, { recursive: true })

    // 2. Create a production-only package.json in the deploy directory.
    const prodPackageJson = { ...originalPackageJson }
    delete prodPackageJson.devDependencies
    delete prodPackageJson.scripts
    console.log('Created a production-only package.json manifest.')

    // 3. Handle versioning for dev builds and fix license path.
    let finalVersion = originalVersion
    if (isDevBuild) {
        const baseVersion = originalVersion.split('-')
        finalVersion = `${baseVersion}-dev.${Date.now()}`
        console.log(`Using temporary dev version: ${finalVersion}`)
        prodPackageJson.version = finalVersion
    }
    if (prodPackageJson.license && prodPackageJson.license.startsWith('SEE LICENSE IN')) {
        prodPackageJson.license = 'SEE LICENSE IN LICENSE.txt'
    }
    writeFileSync(join(deployDir, 'package.json'), JSON.stringify(prodPackageJson, null, 4))

    // 4. Install production dependencies using NPM for a standard node_modules structure.
    console.log('Installing production dependencies with `npm install --omit=dev`...')
    const installCommand = 'npm install --omit=dev'
    execSync(installCommand, { cwd: deployDir, stdio: 'inherit' })
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

    // 6. Run vsce package from within the clean, prepared directory.
    // By *not* using --no-dependencies, we allow vsce to run its validation,
    // which should now pass in this clean environment.
    const vsixOutputDir = join(workspaceRoot, 'vsix_packages')
    mkdirSync(vsixOutputDir, { recursive: true })
    const vsixOutputPath = join(vsixOutputDir, `${vsixBaseName}-${finalVersion}.vsix`)
    const vsceCommand = `vsce package -o "${vsixOutputPath}"`

    console.log(`Running: ${vsceCommand} in ${deployDir}`)
    execSync(vsceCommand, { cwd: deployDir, stdio: 'inherit' })
    console.log(`✅ Successfully created self-contained package: ${vsixOutputPath}`)
} catch (error) {
    console.error('❌ An error occurred during the packaging process:', error)
    process.exitCode = 1
} finally {
    // 7. Clean up the temporary deployment directory.
    rmSync(deployDir, { recursive: true, force: true })
    console.log(`Cleaned up temporary directory: ${deployDir}`)
}
