import { execSync } from 'node:child_process'
import { readFileSync, writeFileSync, mkdirSync } from 'node:fs'
import { resolve, join } from 'node:path'
import process from 'node:process'


const [packageName] = process.argv.slice(2)
if (!packageName) {
    console.error('Error: Package name argument is required.')
    process.exit(1)
}

const workspaceRoot = resolve(process.cwd())
const packageDir = join(workspaceRoot, 'packages/ghost-writer/ext')
const packageJsonPath = join(packageDir, 'package.json')
const vsixOutputDir = join(workspaceRoot, 'vsix_packages')

const packageJson = JSON.parse(readFileSync(packageJsonPath, 'utf-8'))
const originalVersion = packageJson.version

try {
    // 1. Generate and apply the temporary dev version
    const baseVersion = originalVersion.split('-')[0]
    const devVersion = `${baseVersion}-dev.${Date.now()}`
    packageJson.version = devVersion
    writeFileSync(packageJsonPath, JSON.stringify(packageJson, null, 4) + '\n')
    console.log(`Temporarily set version to: ${devVersion}`)

    // 2. Ensure the output directory exists
    mkdirSync(vsixOutputDir, { recursive: true })

    // 3. Run the vsce package command
    const vsixOutputPath = join(vsixOutputDir, `${packageName}-${devVersion}.vsix`)
    const vsceCommand = `vsce package --no-dependencies -o ${vsixOutputPath}`
    console.log(`Running: ${vsceCommand}`)
    execSync(vsceCommand, { cwd: packageDir, stdio: 'inherit' })
    console.log(`Successfully created dev package: ${vsixOutputPath}`)
} catch (error) {
    console.error('An error occurred during the packaging process:', error)
    process.exit(1)
} finally {
    // 4. ALWAYS revert package.json to its original state
    packageJson.version = originalVersion
    writeFileSync(packageJsonPath, JSON.stringify(packageJson, null, 4) + '\n')
    console.log(`Reverted version to: ${originalVersion}`)
}
