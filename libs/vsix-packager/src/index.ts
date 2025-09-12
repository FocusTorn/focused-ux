import { resolve, join } from 'node:path'
import { existsSync, mkdirSync, readFileSync, writeFileSync, cpSync, unlinkSync } from 'node:fs'
import { execSync, spawnSync } from 'node:child_process'

export interface PackagerOptions {
    extensionDir: string
    outputDir: string
    dev?: boolean
}

export interface PackagerResult {
    vsixPath: string
}

const steps = [
    'Preparing deployment directory',
    'Preparing package.json',
    'Copying build artifacts',
    'Resolving dependencies',
    'Constructing node_modules',
    'Packaging VSIX',
    'Cleanup',
]

function updateProgress(step: number, message = ''): void {
    const stepName = steps[step - 1] || 'Unknown'
    const percentage = Math.round((step / steps.length) * 100)
    const bar = '█'.repeat(Math.floor(percentage / 10)) + '░'.repeat(10 - Math.floor(percentage / 10))
    const text = `VSIX Packaging |${bar}| ${percentage}% | ${step}/${steps.length} | ${stepName}`
    process.stderr.write(`\r${text.padEnd(80)}`)
    if (message) {
        // Write an additional short note in verbose scenarios if needed later
    }
}

function finishProgress(): void {
    process.stderr.write(`\r${' '.repeat(120)}\r\n`)
}

export function packageExtension(options: PackagerOptions): PackagerResult {
    const workspaceRoot = resolve(process.cwd())
    const packageDir = join(workspaceRoot, options.extensionDir)
    const packageJsonPath = join(packageDir, 'package.json')
    const originalPackageJson = JSON.parse(readFileSync(packageJsonPath, 'utf-8'))
    const originalVersion: string = originalPackageJson.version
    const vsixBaseName: string = originalPackageJson.name
    const outputVsixName = vsixBaseName.startsWith('fux-') ? vsixBaseName.slice(4) : vsixBaseName

    const deployDir = join(workspaceRoot, 'tmp', 'deploy', vsixBaseName)
    const finalOutputDir = join(workspaceRoot, options.outputDir)

    let vsixFilename = `${outputVsixName}-${originalVersion}.vsix`

    updateProgress(1, 'Cleaning and creating directories')
    // Clean handled by caller if needed; ensure directories exist
    mkdirSync(deployDir, { recursive: true })
    mkdirSync(finalOutputDir, { recursive: true })

    updateProgress(2, 'Prepare package.json for staging')
    const finalPackageJson = { ...originalPackageJson }
    if (options.dev) {
        const taskHash = process.env.NX_TASK_HASH
        if (!taskHash) {
            throw new Error('NX_TASK_HASH environment variable not found for dev build.')
        }
        const shortHash = taskHash.slice(0, 9)
        const finalVersion = `${originalVersion}-dev.${shortHash}`
        vsixFilename = `${outputVsixName}-dev.vsix`
        finalPackageJson.version = finalVersion
    }
    delete finalPackageJson.dependencies
    writeFileSync(join(deployDir, 'package.json'), JSON.stringify(finalPackageJson, null, 4))

    updateProgress(3, 'Copy build artifacts and assets')
    const assetsToCopy = ['dist', 'assets', 'README.md', 'LICENSE.txt', 'CHANGELOG.md', '.vscodeignore']
    for (const asset of assetsToCopy) {
        const source = join(packageDir, asset)
        const dest = join(deployDir, asset)
        if (existsSync(source)) {
            cpSync(source, dest, { recursive: true, errorOnExist: false, force: true })
        }
    }

    updateProgress(4, 'Resolve production dependency tree via pnpm list')
    const pnpmListOutput = execSync(`pnpm list --prod --json --depth=Infinity`, {
        cwd: packageDir,
        encoding: 'utf-8',
        timeout: 60000,
    })
    const pnpmList = JSON.parse(pnpmListOutput)

    updateProgress(5, 'Construct node_modules from resolved deps (skip link:)')
    const deployNodeModules = join(deployDir, 'node_modules')
    mkdirSync(deployNodeModules, { recursive: true })
    const projectDeps = pnpmList.length > 0 ? pnpmList[0].dependencies : undefined
    function copyDependencyTree(dependencies: any, processed = new Set<string>()) {
        if (!dependencies) return
        for (const depName in dependencies) {
            const depInfo = dependencies[depName]
            if (processed.has(depName)) continue
            processed.add(depName)
            if (depInfo?.version?.startsWith('link:')) continue
            if (depInfo?.path) {
                const destPath = join(deployNodeModules, depName)
                if (!existsSync(destPath)) {
                    mkdirSync(join(destPath, '..'), { recursive: true })
                    try {
                        cpSync(depInfo.path, destPath, { recursive: true })
                    } catch (err: any) {
                        if (err?.code !== 'ENOENT' && err?.code !== 'ENOTDIR') {
                            throw err
                        }
                    }
                }
                if (depInfo.dependencies) copyDependencyTree(depInfo.dependencies, processed)
            }
        }
    }
    copyDependencyTree(projectDeps)

    updateProgress(6, 'Package with vsce')
    const vsixOutputPath = join(finalOutputDir, vsixFilename)
    const vscodeignorePath = join(deployDir, '.vscodeignore')
    const originalVscodeignore = existsSync(vscodeignorePath) ? readFileSync(vscodeignorePath, 'utf-8') : ''
    const tempVscodeignore = `${originalVscodeignore}\nnode_modules/**\n`
    writeFileSync(vscodeignorePath, tempVscodeignore)

    let result = spawnSync('vsce', ['package', '--no-dependencies', '-o', vsixOutputPath], {
        cwd: deployDir,
        encoding: 'utf-8',
        stdio: ['pipe', 'pipe', 'pipe'],
        env: { ...process.env, VSCE_SILENT: 'true', NODE_NO_WARNINGS: '1', NODE_OPTIONS: '--no-warnings' },
        timeout: 300000,
    })
    if (result.error || result.status !== 0) {
        const vsceCommand = `vsce package --no-dependencies -o "${vsixOutputPath}" 2>&1`
        try {
            execSync(vsceCommand, { cwd: deployDir, encoding: 'utf-8', timeout: 300000, env: { ...process.env, NODE_NO_WARNINGS: '1', NODE_OPTIONS: '--no-warnings' } })
        } catch (err) {
            finishProgress()
            throw err
        }
    }

    if (!existsSync(vsixOutputPath)) {
        finishProgress()
        throw new Error(`vsce completed but VSIX was not created at: ${vsixOutputPath}`)
    }

    // Restore .vscodeignore
    if (originalVscodeignore !== '') {
        writeFileSync(vscodeignorePath, originalVscodeignore)
    } else if (existsSync(vscodeignorePath)) {
        try { unlinkSync(vscodeignorePath) } catch {}
    }

    updateProgress(7, 'Done')
    finishProgress()
    return { vsixPath: vsixOutputPath }
}

export default { packageExtension }


