import { execSync } from 'node:child_process'
import { readFileSync, mkdirSync, existsSync, writeFileSync } from 'node:fs'
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
const packageJson = JSON.parse(readFileSync(packageJsonPath, 'utf-8'))
const originalVersion = packageJson.version
const vsixBaseName = packageJson.name
const projectName = `@fux/${packagePath.replace('/', '-')}`

let devVersion
let versionChanged = false
try {
    // 1. Run the build to prepare the 'dist' directory.
    const buildCommand = `nx run ${projectName}:build`
    console.log(`Running build step: ${buildCommand}`)
    execSync(buildCommand, { stdio: 'inherit' })

    // 2. Generate the dev version string in memory.
    const baseVersion = originalVersion.split('-')
    devVersion = `${baseVersion}-dev.${Date.now()}`
    console.log(`Using temporary version: ${devVersion}`)

    // 2.1. Write the dev version to package.json
    packageJson.version = devVersion
    writeFileSync(packageJsonPath, JSON.stringify(packageJson, null, 2))
    versionChanged = true

    // 3. Ensure the final VSIX output directory exists.
    mkdirSync(vsixOutputDir, { recursive: true })

    // 4. Run the vsce package command from the project directory, passing the version directly.
    const vsixOutputPath = join(vsixOutputDir, `${vsixBaseName}-${devVersion}.vsix`)
    const vsceCommand = `vsce package --no-dependencies -o "${vsixOutputPath}"`

    console.log(`Running: ${vsceCommand} in ${packageDir}`)
    execSync(vsceCommand, { cwd: packageDir, stdio: 'inherit' })
    console.log(`Successfully created dev package: ${vsixOutputPath}`)
} catch (error) {
    console.error('An error occurred during the packaging process:', error)
    process.exitCode = 1
} finally {
    // Always revert the version number
    if (versionChanged) {
        packageJson.version = originalVersion
        writeFileSync(packageJsonPath, JSON.stringify(packageJson, null, 2))
        console.log(`Reverted version in package.json to ${originalVersion}`)
    }
}
