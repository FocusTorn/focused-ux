import { readFileSync, writeFileSync, existsSync, mkdirSync } from 'node:fs'
import { join } from 'node:path'
import process from 'node:process'

const [sourcePackageJsonPath, targetDir] = process.argv.slice(2)

if (!sourcePackageJsonPath || !targetDir) {
    console.error(
        'Usage: node generate-dist-package-json.js <source-package-json-path> <target-dir>'
    )
    process.exit(1)
}

if (!existsSync(sourcePackageJsonPath)) {
    console.error(`Error: Source package.json not found at ${sourcePackageJsonPath}`)
    process.exit(1)
}

try {
    const sourcePackageJson = JSON.parse(readFileSync(sourcePackageJsonPath, 'utf-8'))

    // Create a new object with only the fields required for a production package
    const distPackageJson = {
        name: sourcePackageJson.name,
        displayName: sourcePackageJson.displayName,
        description: sourcePackageJson.description,
        publisher: sourcePackageJson.publisher,
        version: sourcePackageJson.version,
        repository: sourcePackageJson.repository,
        license: 'MIT',
        icon: 'assets/gw-logo.png', // <-- Correct path to icon
        categories: sourcePackageJson.categories,
        keywords: sourcePackageJson.keywords,
        engines: sourcePackageJson.engines,
        main: 'extension.cjs', // <-- Correct path to entrypoint
        contributes: sourcePackageJson.contributes,
        activationEvents: sourcePackageJson.activationEvents,
        dependencies: sourcePackageJson.dependencies,
    }

    // Ensure the target directory exists
    if (!existsSync(targetDir)) {
        mkdirSync(targetDir, { recursive: true })
    }

    const targetPackageJsonPath = join(targetDir, 'package.json')
    writeFileSync(targetPackageJsonPath, JSON.stringify(distPackageJson, null, 4))

    console.log(`Successfully created clean package.json at: ${targetPackageJsonPath}`)
} catch (error) {
    console.error('Failed to generate dist package.json:', error)
    process.exit(1)
}
