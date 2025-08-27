import { execSync } from 'node:child_process'
import { readFileSync, mkdirSync, cpSync, writeFileSync, existsSync } from 'node:fs'
import { resolve, join } from 'node:path'
import process from 'node:process'
import { sync as rimrafSync } from 'rimraf'

// This script creates a  self-contained VSIX.
// It relies on Nx for caching. By default, it is quiet but always shows vsce output.
// To see all script chatter and npm output, run with VSIX_VERBOSE=1.
// e.g., VSIX_VERBOSE=1 nx run my-ext:package:dev
//
// Usage:
// node scripts/create-vsix.js <path_to_ext_dir> <output_dir> [--dev]

const isVerbose = process.env.VSIX_VERBOSE === '1'

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
const outputVsixName = vsixBaseName.startsWith('fux-') ? vsixBaseName.slice(4) : vsixBaseName

const deployDir = join(workspaceRoot, 'tmp', 'deploy', vsixBaseName)
const finalOutputDir = join(workspaceRoot, outputDir)

if (isVerbose) {
    console.log(`Preparing to package: ${vsixBaseName}`)
    console.log(`Deployment directory: ${deployDir}`)
    console.log(`Final output directory: ${finalOutputDir}`)
    console.log(`Output VSIX name: ${outputVsixName}`)
}

let exitCode = 0
try {
    // 1. Clean and create the deployment directory.
    rimrafSync(deployDir)
    mkdirSync(deployDir, { recursive: true })
    mkdirSync(finalOutputDir, { recursive: true })

    // 2. Copy the original package.json to the deploy directory.
    // This is needed for vsce to read publisher info, etc.
    const finalPackageJson = { ...originalPackageJson }
    let vsixFilename = `${outputVsixName}-${originalVersion}.vsix`
    if (isDevBuild) {
        const taskHash = process.env.NX_TASK_HASH
        if (!taskHash) {
            throw new Error(
                'NX_TASK_HASH environment variable not found. This script should be run via Nx for dev builds.'
            )
        }
        const shortHash = taskHash.slice(0, 9)
        const finalVersion = `${originalVersion}-dev.${shortHash}`
        vsixFilename = `${outputVsixName}-dev.vsix`
        finalPackageJson.version = finalVersion
    }
    // Remove dependencies section, as we are constructing node_modules manually.
    delete finalPackageJson.dependencies
    writeFileSync(join(deployDir, 'package.json'), JSON.stringify(finalPackageJson, null, 4))

    // 3. Copy build artifacts and other assets.
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
        if (existsSync(source)) {
            cpSync(source, dest, { recursive: true, errorOnExist: false, force: true })
        }
    }

    // 4. Get the production dependency graph using `pnpm list`.
    if (isVerbose)
        console.log('\n\n\x1B[1m\x1B[38;5;51mResolving production dependencies...\x1B[0m')
    const pnpmListOutput = execSync(`pnpm list --prod --json --depth=Infinity`, {
        cwd: packageDir,
        encoding: 'utf-8',
    })
    const pnpmList = JSON.parse(pnpmListOutput)

    // 5. Manually construct the node_modules directory by copying resolved dependencies.
    if (isVerbose)
        console.log('\n\n\x1B[1m\x1B[38;5;51mConstructing production node_modules...\x1B[0m')
    const deployNodeModules = join(deployDir, 'node_modules')
    mkdirSync(deployNodeModules, { recursive: true })

    // FIX: The output of `pnpm list --json` is an array. We must access the first element's dependencies.
    const projectDeps = pnpmList.length > 0 ? pnpmList[0].dependencies : undefined
    if (projectDeps) {
        const depCount = Object.keys(projectDeps).length
        if (isVerbose)
            console.log(`Found ${depCount} top-level production dependencies. Starting copy...`)

        // Function to recursively copy dependencies
        function copyDependencyTree(dependencies, processed = new Set()) {
            if (!dependencies) return

            for (const depName in dependencies) {
                const depInfo = dependencies[depName]

                // Skip if already processed
                if (processed.has(depName)) continue
                processed.add(depName)

                // Skip workspace packages (they have 'link:' in version)
                if (depInfo.version && depInfo.version.startsWith('link:')) {
                    if (isVerbose) console.log(`  Skipping workspace package: ${depName}`)
                    continue
                }

                if (depInfo.path) {
                    const destPath = join(deployNodeModules, depName)
                    if (!existsSync(destPath)) {
                        if (isVerbose) console.log(`  Copying ${depName} from ${depInfo.path}`)
                        // Ensure parent directory exists (for scoped packages)
                        mkdirSync(join(destPath, '..'), { recursive: true })
                        cpSync(depInfo.path, destPath, { recursive: true })
                    }

                    // Recursively copy nested dependencies
                    if (depInfo.dependencies) {
                        copyDependencyTree(depInfo.dependencies, processed)
                    }
                }
            }
        }

        // Copy all dependencies recursively
        copyDependencyTree(projectDeps)
    } else {
        if (isVerbose) console.log('No production dependencies found to copy.')
    }

    // 6. Package the VSIX.
    const vsixOutputPath = join(finalOutputDir, vsixFilename)
    const vsceCommand = `vsce package -o "${vsixOutputPath}"`
    if (isVerbose)
        console.log('\n\n\x1B[1m\x1B[38;5;51mRunning command to package VSIX...\x1B[0m\n')
    execSync(vsceCommand, {
        cwd: deployDir,
        encoding: 'utf-8',
        stdio: 'inherit',
    })

    if (!existsSync(vsixOutputPath)) {
        throw new Error(
            `vsce command completed, but the VSIX file was not found at: ${vsixOutputPath}`
        )
    }
} catch (error) {
    console.error('❌ An error occurred during the packaging process:', error)
    exitCode = 1
} finally {
    rimrafSync(deployDir)
    process.exit(exitCode)
}
