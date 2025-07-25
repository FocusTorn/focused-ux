import { existsSync, mkdirSync, cpSync } from 'node:fs'
import { readFileSync } from 'node:fs'
import { resolve, join } from 'node:path'
import process from 'node:process'

const [distDir] = process.argv.slice(2)

if (!distDir) {
    console.error('Usage: node copy-prod-deps.js <dist-dir>')
    process.exit(1)
}

const workspaceRoot = resolve(process.cwd())
const distPackageJsonPath = join(distDir, 'package.json')
const rootNodeModules = join(workspaceRoot, 'node_modules')
const distNodeModules = join(distDir, 'node_modules')

if (!existsSync(distPackageJsonPath)) {
    console.error(`Error: package.json not found in dist directory: ${distPackageJsonPath}`)
    process.exit(1)
}

try {
    const packageJson = JSON.parse(readFileSync(distPackageJsonPath, 'utf-8'))
    const prodDeps = Object.keys(packageJson.dependencies || {})

    if (prodDeps.length === 0) {
        console.log('No production dependencies to copy.')
        process.exit(0)
    }

    console.log('Copying production dependencies:', prodDeps.join(', '))

    // Ensure the target node_modules directory exists
    if (!existsSync(distNodeModules)) {
        mkdirSync(distNodeModules, { recursive: true })
    }

    for (const dep of prodDeps) {
        const sourcePath = join(rootNodeModules, dep)
        const destPath = join(distNodeModules, dep)
        if (existsSync(sourcePath)) {
            cpSync(sourcePath, destPath, { recursive: true })
        } else {
            console.warn(`Warning: Could not find dependency '${dep}' in root node_modules.`)
        }
    }

    console.log('Successfully copied production dependencies.')
} catch (error) {
    console.error('Failed to copy production dependencies:', error)
    process.exit(1)
}