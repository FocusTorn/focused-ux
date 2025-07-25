import { execSync } from 'node:child_process'
import { readFileSync, writeFileSync, mkdirSync, existsSync } from 'node:fs'
import { resolve, join } from 'node:path'
import process from 'node:process'

const [packagePath] = process.argv.slice(2)
if (!packagePath) {
    console.error('Error: Package path argument (relative to packages dir) is required.')
    process.exit(1)
}

const workspaceRoot = resolve(process.cwd())
const packageDir = join(workspaceRoot, 'packages', packagePath)

if (!existsSync(join(packageDir, 'package.json'))) {
    console.error(`Error: Could not find package.json at '${packageDir}'`)
    process.exit(1)
}

console.log(`Located package directory: ${packageDir}`)

const packageJsonPath = join(packageDir, 'package.json')
const vsixOutputDir = join(workspaceRoot, 'vsix_packages')

const packageJson = JSON.parse(readFileSync(packageJsonPath, 'utf-8'))
const originalVersion = packageJson.version
const vsixBaseName = packageJson.name

const projectName = `@fux/${packagePath.replace('/', '-')}`

try {
    // 1. Generate and apply the temporary dev version
    const baseVersion = originalVersion.split('-')
    const devVersion = `${baseVersion}-dev.${Date.now()}`
    packageJson.version = devVersion
    writeFileSync(packageJsonPath, `${JSON.stringify(packageJson, null, 4)}\n`)
    console.log(`Temporarily set version to: ${devVersion}`)

    // 2. Run the full build and package preparation steps
    const buildCommand = `nx run ${projectName}:prepare-package`
    console.log(`Running build and preparation step: ${buildCommand}`)
    execSync(buildCommand, { stdio: 'inherit' })

    // 3. Ensure the final VSIX output directory exists
    mkdirSync(vsixOutputDir, { recursive: true })

    // 4. Run the vsce package command on the prepared 'dist' directory
    const vsixOutputPath = join(vsixOutputDir, `${vsixBaseName}-${devVersion}.vsix`)
    const packageDistDir = join(packageDir, 'dist')
    const vsceCommand = `vsce package --no-dependencies -o "${vsixOutputPath}"`

    console.log(`Running: ${vsceCommand} in ${packageDistDir}`)
    execSync(vsceCommand, { cwd: packageDistDir, stdio: 'inherit' })
    console.log(`Successfully created dev package: ${vsixOutputPath}`)
} catch (error) {
    console.error('An error occurred during the packaging process:', error)
    throw error
} finally {
    // 5. ALWAYS revert package.json to its original state
    packageJson.version = originalVersion
    writeFileSync(packageJsonPath, `${JSON.stringify(packageJson, null, 4)}\n`)
    console.log(`Reverted version to: ${originalVersion}`)
}
