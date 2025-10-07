import { ExecutorContext, logger, workspaceRoot } from '@nx/devkit'
import { existsSync, mkdirSync, readFileSync, writeFileSync, cpSync, unlinkSync, readdirSync, statSync } from 'node:fs'
import { rm } from 'node:fs/promises'
import { join, resolve, isAbsolute, relative } from 'node:path'
import { execSync } from 'node:child_process'
// ora will be imported dynamically to avoid conflicts
import type { PackExecutorSchema } from './schema'

interface Result { success: boolean }

function debugLog(message: string, debug: boolean): void {

    if (debug) {

        logger.info(`[DEBUG] ${message}`)
    
    }

}

function resolvePackageDir(options: PackExecutorSchema, context: ExecutorContext): string { //>

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

function _shouldIncludeFile(filePath: string, packageDir: string, includeFiles: string[], excludeFiles: string[]): boolean { //>

    const relativePath = relative(packageDir, filePath)
    
    // Check exclusions first
    for (const exclude of excludeFiles) {

        if (relativePath === exclude || relativePath.startsWith(exclude + '/')) {

            return false
        
        }
    
    }
    
    // Check inclusions
    for (const include of includeFiles) {

        if (relativePath === include || relativePath.startsWith(include + '/')) {

            return true
        
        }
    
    }
    
    return false

} //<

function getFilesFromPackageJson(packageJson: Record<string, unknown>, packageDir: string): string[] {

    const files: string[] = []

    // Always include package.json
    files.push('package.json')
    
    // Include files specified in package.json "files" field
    if (packageJson.files && Array.isArray(packageJson.files)) {

        files.push(...packageJson.files)
    
    }
    
    // Include README.md if it exists
    if (existsSync(join(packageDir, 'README.md'))) {

        files.push('README.md')
    
    }
    
    // Include LICENSE files if they exist
    const licenseFiles = ['LICENSE', 'LICENSE.txt', 'LICENSE.md']

    for (const licenseFile of licenseFiles) {

        if (existsSync(join(packageDir, licenseFile))) {

            files.push(licenseFile)
        
        }
    
    }
    
    return files

}

export default async function runExecutor(options: PackExecutorSchema, context: ExecutorContext): Promise<Result> {

    try {

        const debug = options.debug ?? false
        const packageDir = resolvePackageDir(options, context)
        
        debugLog(`Resolved package directory: ${packageDir}`, debug)
        
        const packageJsonPath = join(packageDir, 'package.json')

        if (!existsSync(packageJsonPath)) {

            throw new Error(`package.json not found at: ${packageJsonPath}`)
        
        }
        
        const originalPackageJson = JSON.parse(readFileSync(packageJsonPath, 'utf-8'))
        const originalVersion: string = originalPackageJson.version
        const packageName: string = originalPackageJson.name
        const tarballBaseName = packageName.replace('@fux/', 'fux-')
        
        const baseHash = process.env.NX_TASK_HASH ? process.env.NX_TASK_HASH.slice(0, 9) : 'local'
        const uniqueId = `${baseHash}-${process.pid}-${Math.floor(Math.random() * 1_000_000)}`
        
        // Configuration
        const _pluginRoot = join(__dirname, '../../..') // Go up from executors/pack/pack.ts to plugins/npack
        const tempBase = options.tempPath || join(packageDir, '.npack')
        const overwrite = options.freshTemp ?? true
        const keepTemp = options.keepTemp ?? false
        const finalOutputDir = options.outputPath ? join(workspaceRoot, options.outputPath) : packageDir
        
        const tempDirName = overwrite ? `${tarballBaseName}-local` : `${tarballBaseName}-${uniqueId}`
        const tempDir = join(tempBase, tempDirName)
        
        let tarballFilename = `${tarballBaseName}-${originalVersion}.tgz`
        const finalPackageJson = { ...originalPackageJson }
        
        if (options.dev) {

            const taskHash = process.env.NX_TASK_HASH

            if (!taskHash) throw new Error('NX_TASK_HASH environment variable not found for dev build.')
            
            const shortHash = taskHash.slice(0, 9)
            const finalVersion = `${originalVersion}-dev.${shortHash}`
            
            tarballFilename = `${tarballBaseName}-dev.tgz`
            ;(finalPackageJson as Record<string, unknown>).version = finalVersion
        
        }
        
        // Prepare directories
        if (overwrite) {

            try {

                const { sync: rimrafSync } = await import('rimraf')
                const tempRoot = tempBase
                
                if (existsSync(tempRoot)) {

                    const entries = readdirSync(tempRoot, { withFileTypes: true })
                    
                    for (const entry of entries) {

                        if (entry.isDirectory() && entry.name.startsWith(`${tarballBaseName}-`)) {

                            try { rimrafSync(join(tempRoot, entry.name)) } catch {}
                        
                        }
                    
                    }
                
                }
            
            } catch {}
        
        }
        
        mkdirSync(tempDir, { recursive: true })
        mkdirSync(finalOutputDir, { recursive: true })
        
        // Create package subdirectory (npm pack structure)
        const packageSubDir = join(tempDir, 'package')

        mkdirSync(packageSubDir, { recursive: true })
        
        // Write package.json
        writeFileSync(join(packageSubDir, 'package.json'), JSON.stringify(finalPackageJson, null, 4))
        
        // Get files to include
        const includeFiles = getFilesFromPackageJson(originalPackageJson, packageDir)
        const additionalIncludeFiles = options.includeFiles || []
        const _excludeFiles = options.excludeFiles || []
        
        const allIncludeFiles = [...includeFiles, ...additionalIncludeFiles]
        
        // Copy files
        for (const filePattern of allIncludeFiles) {

            const sourcePath = join(packageDir, filePattern)
            const destPath = join(packageSubDir, filePattern)
            
            if (existsSync(sourcePath)) {

                const stat = statSync(sourcePath)

                if (stat.isDirectory()) {

                    // Copy directory recursively
                    cpSync(sourcePath, destPath, { recursive: true, errorOnExist: false, force: true })
                
                } else {

                    // Copy file
                    mkdirSync(join(destPath, '..'), { recursive: true })
                    cpSync(sourcePath, destPath, { force: true })
                
                }
            
            }
        
        }
        
        // Create tarball
        const tarballPath = join(finalOutputDir, tarballFilename)
        
        // Import ora dynamically to avoid conflicts
        const ora = (await import('ora')).default
        const spinner = ora({
            text: 'Creating tarball...',
            spinner: 'dots'
        }).start()
        
        try {

            // Create proper tar.gz file using npm pack
            const packageDir = join(tempDir, 'package')

            // Use npm pack to create proper tar.gz file
            const npmCommand = `npm pack "${packageDir}" --pack-destination "${finalOutputDir}"`
            
            execSync(npmCommand, {
                encoding: 'utf-8',
                timeout: 60000,
                stdio: debug ? 'inherit' : 'pipe',
                cwd: tempDir,
                shell: process.platform === 'win32' ? 'cmd.exe' : '/bin/sh'
            })
            
            // npm pack creates a file with the package name and version
            // We need to rename it to our desired filename
            const npmPackFilename = `${originalPackageJson.name.replace('@fux/', 'fux-')}-${originalPackageJson.version}.tgz`
            const npmPackPath = join(finalOutputDir, npmPackFilename)
            
            if (existsSync(npmPackPath) && npmPackPath !== tarballPath) {

                // Move the npm pack file to our desired location
                cpSync(npmPackPath, tarballPath)
                unlinkSync(npmPackPath)
            
            }
            
            if (!existsSync(tarballPath)) {

                throw new Error(`Tarball was not created at: ${tarballPath}`)
            
            }
            
            // Create shortened path for display
            const shortenedPath = relative(workspaceRoot, tarballPath).replace(/\\/g, '\\')

            // Show success message using ora's built-in method
            spinner.succeed(`Created tarball: ${shortenedPath}`)
            
            // Show tarball contents only in debug mode
            if (debug) {

                logger.info('Tarball contents:')
                try {

                    execSync(`tar -tzf "${tarballPath}"`, {
                        encoding: 'utf-8',
                        stdio: 'inherit'
                    })
                
                } catch {

                    // Fallback to npm pack inspection
                    logger.info('Using npm pack inspection:')
                    execSync(`npm pack --dry-run "${packageDir}"`, {
                        encoding: 'utf-8',
                        stdio: 'inherit',
                        cwd: tempDir
                    })
                
                }
            
            }
        
        } catch (error) {

            spinner.fail(`Failed to create tarball: ${error instanceof Error ? error.message : String(error)}`)
            throw new Error(`Failed to create tarball: ${error instanceof Error ? error.message : String(error)}`)
        
        }
        
        // Cleanup based on configuration
        if (!keepTemp) {

            try {

                debugLog(`Cleaning up temp directory: ${tempDir}`, debug)
                await rm(tempDir, { recursive: true, force: true })
                debugLog(`Successfully cleaned up temp directory: ${tempDir}`, debug)
            
            } catch (err) {

                logger.error(`Failed to clean up temp directory: ${err}`)
            
            }
        
        }
        
        debugLog(`Final tarball: ${tarballPath}`, debug)
        
        // Install globally if requested (defaults to true)
        if (options.install !== false) {

            const installSpinner = ora({
                text: 'Installing tarball globally...',
                spinner: 'dots'
            }).start()
            
            try {

                debugLog(`Installing tarball globally with pnpm...`, debug)
                
                execSync(`pnpm add -g "${tarballPath}"`, {
                    encoding: 'utf-8',
                    timeout: 60000,
                    stdio: debug ? 'inherit' : 'pipe'
                })
                
                // Show success message using ora's built-in method
                installSpinner.succeed(`Successfully installed ${packageName} globally`)
            
            } catch (error) {

                installSpinner.fail(`Failed to install globally: ${error instanceof Error ? error.message : String(error)}`)
                return { success: false }
            
            }
        
        }
        
        return { success: true }
    
    } catch (err) {

        logger.error(`Packaging failed: ${err instanceof Error ? err.message : String(err)}`)
        return { success: false }
    
    }

}