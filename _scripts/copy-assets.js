import { cpSync, existsSync, mkdirSync } from 'node:fs'
import { join, resolve } from 'node:path'
import process from 'node:process'

const [packageDir] = process.argv.slice(2)

if (!packageDir) {
    console.error('Usage: node copy-assets.js <package-dir>')
    process.exit(1)
}

const sourceDir = resolve(process.cwd(), packageDir)
const targetDir = join(sourceDir, 'dist')

const assets = ['README.md', 'LICENSE.txt', '.vscodeignore', 'assets', 'package.json']

console.log(`Copying assets for ${packageDir} to ${targetDir}...`)

if (!existsSync(targetDir)) {
    mkdirSync(targetDir, { recursive: true })
}

for (const asset of assets) {
    const sourcePath = join(sourceDir, asset)
    const destPath = join(targetDir, asset)
    if (existsSync(sourcePath)) {
        cpSync(sourcePath, destPath, { recursive: true })
        console.log(`  - Copied ${asset}`)
    } else {
        console.warn(`  - Warning: Asset not found, skipping: ${sourcePath}`)
    }
}

console.log('Asset copying complete.')
