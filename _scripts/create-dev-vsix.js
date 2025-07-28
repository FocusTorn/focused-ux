import { execSync } from 'node:child_process'
import { readFileSync, mkdirSync, existsSync, writeFileSync, rmSync } from 'node:fs'
import { resolve, join } from 'node:path'
import process from 'node:process'

const [packagePath] = process.argv.slice(2)
if (!packagePath) {
    console.error('Error: Package path argument (relative to packages dir) is required.')
    process.exit(1)
}

const workspaceRoot = resolve(process.cwd())
const packageDir = join(workspaceRoot, 'packages', packagePath)
const packageJsonPath = join(packageDir, 'package.json')

if (!existsSync(packageJsonPath)) {
    console.error(`Error: Could not find package.json at '${packageDir}'`)
    process.exit(1)
}

console.log(`Located package directory: ${packageDir}`)

const vsixOutputDir = join(workspaceRoot, 'vsix_packages')
const deployDir = join(packageDir, 'dist', 'pnpm-deploy')
const packageJson = JSON.parse(readFileSync(packageJsonPath, 'utf-8'))
const originalVersion = packageJson.version
const vsixBaseName = packageJson.name

let devVersion
let versionChanged = false
try {
    // 1. Generate the dev version string.
    const baseVersion = originalVersion.split('-')[0] // Get just the base version without any existing suffix
    devVersion = `${baseVersion}-dev.${Date.now()}`
    console.log(`Using temporary version: ${devVersion}`)

    // 2. Temporarily update package.json version for vsce.
    packageJson.version = devVersion
    writeFileSync(packageJsonPath, JSON.stringify(packageJson, null, 2))
    versionChanged = true

    // 3. Create a clean, deployable copy of the extension.
    console.log(`Creating deployment package in: ${deployDir}`)
    rmSync(deployDir, { recursive: true, force: true })
    const deployCommand = `pnpm deploy --legacy --prod --filter . "${deployDir}"`
    execSync(deployCommand, { cwd: packageDir, stdio: 'inherit' })

    // 4. Ensure the final VSIX output directory exists.
    mkdirSync(vsixOutputDir, { recursive: true })

    // 5. Ensure awilix is available in the deployed package
    console.log('Ensuring awilix dependency is available...')
    const awilixInstallCommand = `pnpm add awilix@^12.0.5`
    execSync(awilixInstallCommand, { cwd: deployDir, stdio: 'inherit' })

    // 6. Run vsce package from within the deployed directory.
    const vsixOutputPath = join(vsixOutputDir, `${vsixBaseName}-${devVersion}.vsix`)
    const vsceCommand = `vsce package --no-dependencies -o "${vsixOutputPath}"`

    console.log(`Running: ${vsceCommand} in ${deployDir}`)
    execSync(vsceCommand, { cwd: deployDir, stdio: 'inherit' })
    console.log(`Successfully created dev package: ${vsixOutputPath}`)

    // 7. Extract the VSIX and add node_modules to it
    console.log('Adding node_modules to the VSIX package...')
    const extractDir = join(vsixOutputDir, 'temp-extract')
    rmSync(extractDir, { recursive: true, force: true })
    mkdirSync(extractDir, { recursive: true })

    // Extract the VSIX (it's just a zip file)
    const extractCommand = `powershell -command "Expand-Archive -Path '${vsixOutputPath}' -DestinationPath '${extractDir}' -Force"`
    execSync(extractCommand, { stdio: 'inherit' })

    // Copy the entire node_modules directory to the extension directory
    const nodeModulesSource = join(deployDir, 'node_modules')
    const nodeModulesDest = join(extractDir, 'extension', 'node_modules')
    mkdirSync(nodeModulesDest, { recursive: true })
    const copyNodeModulesCommand = `powershell -command "Copy-Item -Path '${nodeModulesSource}\*' -Destination '${nodeModulesDest}' -Recurse -Force"`
    execSync(copyNodeModulesCommand, { stdio: 'inherit' })

    // Recreate the VSIX
    const recreateCommand = `powershell -command "Compress-Archive -Path '${extractDir}\\*' -DestinationPath '${vsixOutputPath}' -Force"`
    execSync(recreateCommand, { stdio: 'inherit' })

    // Clean up
    rmSync(extractDir, { recursive: true, force: true })
    console.log(`Successfully created dev package with node_modules: ${vsixOutputPath}`)
} catch (error) {
    console.error('An error occurred during the packaging process:', error)
    process.exitCode = 1
} finally {
    // 6. Always revert the version number in the original package.json.
    if (versionChanged) {
        packageJson.version = originalVersion
        writeFileSync(packageJsonPath, JSON.stringify(packageJson, null, 2))
        console.log(`Reverted version in package.json to ${originalVersion}`)
    }
    // 7. Clean up the temporary deployment directory.
    rmSync(deployDir, { recursive: true, force: true })
    console.log(`Cleaned up temporary directory: ${deployDir}`)
}
