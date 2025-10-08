import { ExecutorContext, logger } from '@nx/devkit'
import { join } from 'node:path'
import type { PackExecutorSchema } from './schema.js'
import {
    FileOperationsService,
    PackageResolverService,
    TarballCreatorService,
    GlobalInstallerService
} from '../../services/index.js'
import * as temp from 'temp'
import ora from 'ora'

interface Result { success: boolean }

function debugLog(message: string, debug: boolean): void {

    if (debug) {

        logger.info(`[DEBUG] ${message}`)
    
    }

}

export default async function runExecutor(options: PackExecutorSchema, context: ExecutorContext): Promise<Result> {

    try {

        // Initialize services
        const fileOps = new FileOperationsService()
        const packageResolver = new PackageResolverService()
        const tarballCreator = new TarballCreatorService()
        const globalInstaller = new GlobalInstallerService()

        // Test ora functionality (disabled - causes issues in Nx build context)
        // await tarballCreator.testOra()

        // Resolve configuration
        const config = packageResolver.resolveConfiguration(options, context)

        debugLog(`Resolved package directory: ${config.packageDir}`, config.debug)

        // Validate package.json exists
        const packageJsonPath = join(config.packageDir, 'package.json')

        if (!fileOps.exists(packageJsonPath)) {

            throw new Error(`package.json not found at: ${packageJsonPath}`)
        
        }

        // Read and parse package.json
        const packageJsonContent = fileOps.readFile(packageJsonPath)
        const originalPackageJson = JSON.parse(packageJsonContent)
        const metadata = packageResolver.getPackageMetadata(config.packageDir, packageJsonContent)
    
        // Update configuration with package metadata
        const finalConfig = packageResolver.updateConfigurationWithMetadata(config, metadata)
    
        debugLog(`Package: ${metadata.name} v${metadata.version}`, finalConfig.debug)
        debugLog(`Tarball: ${finalConfig.tarballFilename}`, finalConfig.debug)

        // Prepare final package.json with dev version if needed
        const finalPackageJson = { ...originalPackageJson }

        if (finalConfig.dev) {

            const taskHash = process.env.NX_TASK_HASH

            if (!taskHash) {

                throw new Error('NX_TASK_HASH environment variable not found for dev build.')
            
            }

            const shortHash = taskHash.slice(0, 9)
            const finalVersion = `${metadata.version}-dev.${shortHash}`

      ;(finalPackageJson as Record<string, unknown>).version = finalVersion
        
        }

        // Clean up old temp directories if requested
        if (finalConfig.freshTemp) {

            const cleanupResult = await fileOps.cleanupOldTempDirs(finalConfig.tempBase, metadata.tarballBaseName)

            if (!cleanupResult.success) {

                debugLog(`Warning: Failed to cleanup old temp directories: ${cleanupResult.error}`, finalConfig.debug)
            
            }
        
        }

        // Ensure TERM for Windows terminals so ora can render
        if (!process.env.TERM) {

            process.env.TERM = 'xterm-256color'
        
        }

        // Create temp directory with spinner
        const tempSpinner = ora({
            text: 'Creating temp directory...',
            spinner: 'dots',
            color: 'blue',
            isEnabled: Boolean(process.stderr.isTTY) && !process.env.CI,
            isSilent: false,
            stream: process.stderr,
            hideCursor: true,
            discardStdin: false
        }).start()

        const tempCreateResult = fileOps.createDirectories([finalConfig.tempDir])

        if (!tempCreateResult.success) {

            tempSpinner.fail(`Failed to create temp directory: ${tempCreateResult.error}`)
            throw new Error(`Failed to create temp directory: ${tempCreateResult.error}`)
        
        }

        tempSpinner.succeed(`Created temp directory: ${finalConfig.tempDir}`)

        // Create final output directory (no spinner)
        const outDirResult = fileOps.createDirectories([finalConfig.finalOutputDir])

        if (!outDirResult.success) {

            throw new Error(`Failed to create output directory: ${outDirResult.error}`)
        
        }

        // Create package subdirectory (npm pack structure)
        const packageSubDir = join(finalConfig.tempDir, 'package')
        const packageDirResult = fileOps.createDirectories([packageSubDir])

        if (!packageDirResult.success) {

            throw new Error(`Failed to create package directory: ${packageDirResult.error}`)
        
        }

        // Write package.json to temp directory
        const packageJsonWriteResult = fileOps.writeFile(
            join(packageSubDir, 'package.json'),
            JSON.stringify(finalPackageJson, null, 4)
        )

        if (!packageJsonWriteResult.success) {

            throw new Error(`Failed to write package.json: ${packageJsonWriteResult.error}`)
        
        }

        // Get files to include and copy them
        const includeFiles = fileOps.getFilesFromPackageJson(originalPackageJson, config.packageDir)
        const additionalIncludeFiles = options.includeFiles || []
        const allIncludeFiles = [...includeFiles, ...additionalIncludeFiles]

        debugLog(`Copying ${allIncludeFiles.length} files/directories`, finalConfig.debug)

        const copyResult = fileOps.copyFiles(config.packageDir, packageSubDir, allIncludeFiles)

        if (!copyResult.success) {

            throw new Error(`Failed to copy files: ${copyResult.error}`)
        
        }

        // Create tarball
        const tarballOptions = {
            packageDir: packageSubDir,
            outputDir: finalConfig.finalOutputDir,
            tarballFilename: finalConfig.tarballFilename,
            debug: finalConfig.debug
        }

        const tarballResult = await tarballCreator.createTarball(tarballOptions)

        if (!tarballResult.success) {

            throw new Error(`Failed to create tarball: ${tarballResult.error}`)
        
        }

        // Show tarball contents in debug mode
        if (finalConfig.debug && tarballResult.tarballPath) {

            await tarballCreator.showTarballContents(tarballResult.tarballPath, packageSubDir, finalConfig.debug)
        
        }

        // Cleanup temp directory if not keeping it
        if (!finalConfig.keepTemp) {

            debugLog(`Cleaning up temp directory: ${finalConfig.tempDir}`, finalConfig.debug)

            // Use temp package cleanup - no fallbacks
            temp.cleanupSync()
            debugLog(`Successfully cleaned up temp directory using temp package: ${finalConfig.tempDir}`, finalConfig.debug)
        
        }

        debugLog(`Final tarball: ${tarballResult.tarballPath}`, finalConfig.debug)

        // Install globally if requested (defaults to true)
        if (finalConfig.install && tarballResult.tarballPath) {

            const installOptions = {
                tarballPath: tarballResult.tarballPath,
                packageName: metadata.name,
                debug: finalConfig.debug
            }

            const installResult = await globalInstaller.installGlobally(installOptions)

            if (!installResult.success) {

                logger.error(`Global installation failed: ${installResult.error}`)
                return { success: false }
            
            }
        
        }

        return { success: true }

    } catch (err) {

        logger.error(`Packaging failed: ${err instanceof Error ? err.message : String(err)}`)
        return { success: false }
    
    }

}