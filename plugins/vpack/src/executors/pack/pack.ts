import { ExecutorContext, logger, workspaceRoot } from '@nx/devkit'
import { existsSync, mkdirSync, readFileSync, writeFileSync, cpSync, unlinkSync, readdirSync } from 'node:fs'
import { join, resolve, isAbsolute } from 'node:path'
// CommonJS requires are used for cjs-compatible build output
import { execSync, spawnSync } from 'node:child_process'
import type { PackExecutorSchema } from './schema'

interface Result { success: boolean }

function resolveExtensionDir(options: PackExecutorSchema, context: ExecutorContext): string { //>
    if (options.targetPath) {
        return isAbsolute(options.targetPath) ? options.targetPath : join(workspaceRoot, options.targetPath)
    }
    if (options.targetName) {
        const proj = context.projectGraph?.nodes?.[options.targetName]

        if (!proj) throw new Error(`Project not found: ${options.targetName}`)
        return join(workspaceRoot, proj.data.root)
    }
    if (context.projectName) {
        const proj = context.projectGraph?.nodes?.[context.projectName]

        if (!proj) throw new Error(`Project not found in context: ${context.projectName}`)
        return join(workspaceRoot, proj.data.root)
    }
    throw new Error('Either options.targetPath, options.targetName or context.projectName must be provided')
} //<

export default async function runExecutor(options: PackExecutorSchema, context: ExecutorContext): Promise<Result> {
    try {
        const extensionDir = resolveExtensionDir(options, context)

        const packageJsonPath = join(extensionDir, 'package.json')
        const originalPackageJson = JSON.parse(readFileSync(packageJsonPath, 'utf-8'))
        const originalVersion: string = originalPackageJson.version
        const vsixBaseName: string = originalPackageJson.name
        const outputVsixName = vsixBaseName.startsWith('fux-') ? vsixBaseName.slice(4) : vsixBaseName

        const baseHash = process.env.NX_TASK_HASH ? process.env.NX_TASK_HASH.slice(0, 9) : 'local'
        const uniqueId = `${baseHash}-${process.pid}-${Math.floor(Math.random() * 1_000_000)}`

        // Self-standing defaults (mirroring previous config.json):
        // deployPath: staging/deploy, keepDeploy (persistent): true, freshDeploy (overwrite): true,
        // extractContents: true, contentsPath: staging/contents, outputPath: staging/vsix_packages
        const pluginRoot = join(__dirname, '../../..') // Go up from executors/pack/pack.ts to plugins/vpack
        const deployBase = options.deployPath || join(pluginRoot, 'staging/deploy')
        const overwrite = options.freshDeploy ?? true
        const keepDeploy = options.keepDeploy ?? true
        const extract = options.extractContents ?? true
        const extractBase = options.contentsPath || join(pluginRoot, 'staging/contents')
        const finalOutputDir = options.outputPath ? join(workspaceRoot, options.outputPath) : join(pluginRoot, 'staging/vsix_packages')

        const deployDirName = overwrite ? `${vsixBaseName}-local` : `${vsixBaseName}-${uniqueId}`
        const deployDir = join(deployBase, deployDirName)

        let vsixFilename = `${outputVsixName}-${originalVersion}.vsix`
        const finalPackageJson = { ...originalPackageJson }

        if (options.dev) {
            const taskHash = process.env.NX_TASK_HASH

            if (!taskHash) throw new Error('NX_TASK_HASH environment variable not found for dev build.')

            const shortHash = taskHash.slice(0, 9)
            const finalVersion = `${originalVersion}-dev.${shortHash}`

            vsixFilename = `${outputVsixName}-dev.vsix`
            ;(finalPackageJson as Record<string, unknown>).version = finalVersion
        }
        try { delete (finalPackageJson as Record<string, unknown>).dependencies } catch {}
        try { delete (finalPackageJson as Record<string, unknown>).devDependencies } catch {}

        // Prepare dirs
        if (overwrite) {
            try {
                const { sync: rimrafSync } = await import('rimraf')
                const deployRoot = deployBase

                if (existsSync(deployRoot)) {
                    const entries = readdirSync(deployRoot, { withFileTypes: true })

                    for (const entry of entries) {
                        if (entry.isDirectory() && entry.name.startsWith(`${vsixBaseName}-`)) {
                            try { rimrafSync(join(deployRoot, entry.name)) } catch {}
                        }
                    }
                }
            } catch {}
        }
        mkdirSync(deployDir, { recursive: true })
        mkdirSync(finalOutputDir, { recursive: true })

        // Write package.json
        writeFileSync(join(deployDir, 'package.json'), JSON.stringify(finalPackageJson, null, 4))

        // Copy assets
        for (const asset of ['dist', 'assets', 'README.md', 'LICENSE.txt', 'CHANGELOG.md', '.vscodeignore']) {
            const source = join(extensionDir, asset)
            const dest = join(deployDir, asset)

            if (existsSync(source)) {
                cpSync(source, dest, { recursive: true, errorOnExist: false, force: true })
            }
        }

        // Resolve deps and construct node_modules
        const pnpmListOutput = execSync(`pnpm list --prod --json --depth=Infinity`, {
            cwd: extensionDir,
            encoding: 'utf-8',
            timeout: 60000,
        })
        const pnpmList = JSON.parse(pnpmListOutput)
        const deployNodeModules = join(deployDir, 'node_modules')

        mkdirSync(deployNodeModules, { recursive: true })

        const projectDeps = pnpmList.length > 0 ? pnpmList[0].dependencies : undefined

        function copyDependencyTree(dependencies: Record<string, unknown>, processed = new Set<string>()) {
            if (!dependencies) return
            for (const depName in dependencies) {
                const depInfo = dependencies[depName] as Record<string, unknown>

                if (processed.has(depName)) continue
                processed.add(depName)
                if ((depInfo?.version as string)?.startsWith('link:')) continue
                if (depInfo?.path) {
                    const destPath = join(deployNodeModules, depName)

                    if (!existsSync(destPath)) {
                        mkdirSync(join(destPath, '..'), { recursive: true })
                        try { cpSync(depInfo.path as string, destPath, { recursive: true }) } catch (err: unknown) {
                            if ((err as { code?: string })?.code !== 'ENOENT' && (err as { code?: string })?.code !== 'ENOTDIR') throw err
                        }
                    }
                    if (depInfo.dependencies) copyDependencyTree(depInfo.dependencies as Record<string, unknown>, processed)
                }
            }
        }
        copyDependencyTree(projectDeps)

        // Prepare .vscodeignore to include dist and node_modules
        const vsixOutputPath = join(finalOutputDir, vsixFilename)
        const vscodeignorePath = join(deployDir, '.vscodeignore')
        const originalVscodeignore = existsSync(vscodeignorePath) ? readFileSync(vscodeignorePath, 'utf-8') : ''

        if (originalVscodeignore !== '') {
            const lines = originalVscodeignore.split(/\r?\n/)
            const kept = lines.filter((line) => {
                const trimmed = line.trim()

                if (trimmed === '' || trimmed.startsWith('#')) return true
                if (/^dist\/?(\*\*)?$/.test(trimmed)) return false
                if (/^node_modules\/?(\*\*)?$/.test(trimmed)) return false
                return true
            })
            const ensure = ['!dist/**', '!node_modules/**']
            const merged = [...kept, ...ensure]

            writeFileSync(vscodeignorePath, merged.join('\n'))
        } else {
            writeFileSync(vscodeignorePath, ['!dist/**', '!node_modules/**'].join('\n'))
        }

        // Package
        let result = spawnSync('vsce', ['package', '-o', vsixOutputPath], {
            cwd: deployDir,
            encoding: 'utf-8',
            stdio: ['pipe', 'pipe', 'pipe'],
            env: { ...process.env, VSCE_SILENT: 'true', NODE_NO_WARNINGS: '1', NODE_OPTIONS: '--no-warnings' },
            timeout: 300000,
        })

        if (result.error || result.status !== 0) {
            const vsceCommand = `vsce package -o "${vsixOutputPath}" 2>&1`

            try {
                execSync(vsceCommand, { cwd: deployDir, encoding: 'utf-8', timeout: 300000, env: { ...process.env, NODE_NO_WARNINGS: '1', NODE_OPTIONS: '--no-warnings' } })
            } catch (err) {
                throw err
            }
        }

        if (!existsSync(vsixOutputPath)) {
            throw new Error(`vsce completed but VSIX was not created at: ${vsixOutputPath}`)
        }

        // Restore .vscodeignore
        if (originalVscodeignore !== '') {
            writeFileSync(vscodeignorePath, originalVscodeignore)
        } else if (existsSync(vscodeignorePath)) {
            try { unlinkSync(vscodeignorePath) } catch {}
        }

        // Optional extraction
        if (extract) {
            try {
                const AdmZip = await import('adm-zip')
                const zip = new AdmZip.default(vsixOutputPath)
                const extractDir = join(workspaceRoot, extractBase, `${outputVsixName}`)

                mkdirSync(extractDir, { recursive: true })
                zip.extractAllTo(extractDir, true)
            } catch {}
        }

        // Cleanup deploy
        if (!keepDeploy) {
            try {
                const { sync: rimrafSync } = await import('rimraf')

                rimrafSync(deployDir)
            } catch {}
        }

        logger.info(vsixOutputPath)
        return { success: true }
    } catch (err) {
        logger.error(`Packaging failed: ${err instanceof Error ? err.message : String(err)}`)
        return { success: false }
    }
}
