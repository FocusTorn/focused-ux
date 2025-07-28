import { execSync } from 'node:child_process'
import { readFileSync, writeFileSync } from 'node:fs'
import { join } from 'node:path'
import process from 'node:process'

// This script is designed to be run from the workspace root.
// It takes one argument: the relative path to the extension's directory.
// e.g., node _scripts/package-dev-vsix.js packages/project-butler/ext

const [packageDir] = process.argv.slice(2)
if (!packageDir) {
    console.error('Error: Path to the extension package directory is required.')
    process.exit(1)
}

const workspaceRoot = process.cwd()
const extensionPath = join(workspaceRoot, packageDir)
const packageJsonPath = join(extensionPath, 'package.json')

console.log(`Processing extension package at: ${extensionPath}`)

const packageJson = JSON.parse(readFileSync(packageJsonPath, 'utf-8'))
const originalVersion = packageJson.version
const vsixBaseName = packageJson.name

console.log(`Original version: ${originalVersion}`)

// Use a finally block to ensure the version is always reverted.
try {
    // 1. Generate the dev version string.
    const baseVersion = originalVersion.split('-')
    const devVersion = `${baseVersion}-dev.${Date.now()}`
    console.log(`Using temporary dev version: ${devVersion}`)

    // 2. Temporarily update package.json with the dev version.
    packageJson.version = devVersion
    writeFileSync(packageJsonPath, JSON.stringify(packageJson, null, 4))

    // 3. Define the output path for the VSIX.
    const vsixOutputDir = join(workspaceRoot, 'vsix_packages')
    const vsixOutputPath = join(vsixOutputDir, `${vsixBaseName}-${devVersion}.vsix`)

    // 4. Run vsce package. It will use the temporary version.
    // We run this from within the extension directory.
    const vsceCommand = `vsce package --no-dependencies -o "${vsixOutputPath}"`
    console.log(`Running command: ${vsceCommand}`)
    execSync(vsceCommand, { cwd: extensionPath, stdio: 'inherit' })

    console.log(`✅ Successfully created dev package: ${vsixOutputPath}`)
} catch (error) {
    console.error('❌ An error occurred during the dev packaging process:', error)
    process.exit(1) // Exit with an error code.
} finally {
    // 5. ALWAYS revert the version number in the original package.json.
    console.log(`Reverting version in package.json to ${originalVersion}...`)
    packageJson.version = originalVersion
    writeFileSync(packageJsonPath, JSON.stringify(packageJson, null, 4))
    console.log('Reversion complete.')
}
