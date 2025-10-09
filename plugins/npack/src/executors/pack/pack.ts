import { ExecutorContext, logger } from '@nx/devkit'
import { join } from 'node:path'
import { existsSync, mkdirSync } from 'node:fs'
import type { PackExecutorSchema } from './schema.js'
import {
    StagingService,
    PackagingService,
    InstallationService,
    PackageResolverService,
    OutputManager
} from '../../services/index.js'

interface Result { success: boolean }

function debugLog(message: string, debug: boolean): void {

    if (debug) {

        logger.info(`[DEBUG] ${message}`)
    
    }

}

export default async function runExecutor(options: PackExecutorSchema, context: ExecutorContext): Promise<Result> {

    const keepTemp = options.keepTemp ?? false

    // Shared output manager for all services
    const output = new OutputManager()
    
    // Initialize services with shared output manager
    const staging = new StagingService()
    const packaging = new PackagingService(output)
    const installation = new InstallationService(output)
    const resolver = new PackageResolverService()

    let stagingDir: string | undefined

    try {

        // Resolve configuration
        const config = resolver.resolveConfiguration(options, context)

        debugLog(`Package directory: ${config.packageDir}`, config.debug)

        // Validate package.json exists
        const packageJsonPath = join(config.packageDir, 'package.json')

        if (!existsSync(packageJsonPath)) {

            throw new Error(`package.json not found at: ${packageJsonPath}`)
        
        }

        // Read and parse package.json in one operation (optimized)
        const { json: originalPackageJson, metadata } = await resolver.readPackageJson(config.packageDir)

        debugLog(`Package: ${metadata.name} v${metadata.version}`, config.debug)

        // Prepare package.json with dev version if needed
        const finalPackageJson = { ...originalPackageJson }

        if (config.dev) {

            const taskHash = process.env.NX_TASK_HASH

            if (!taskHash) {

                throw new Error('NX_TASK_HASH environment variable not found for dev build.')
            
            }

            const shortHash = taskHash.slice(0, 9)
            const finalVersion = `${metadata.version}-dev.${shortHash}`

            ;(finalPackageJson as Record<string, unknown>).version = finalVersion

        }

        // Clean up old staging directories if requested
        if (config.freshTemp) {

            staging.cleanupOldStaging(config.tempBase, metadata.tarballBaseName, config.debug)
        
        }

        // Create staging directory and populate with files (parallel copying)
        const stagingResult = await staging.createStaging({
            packageDir: config.packageDir,
            packageJson: finalPackageJson,
            includeFiles: options.includeFiles,
            tempBasePath: config.tempBase,
            debug: config.debug
        })

        if (!stagingResult.success || !stagingResult.stagingDir) {

            throw new Error(`Failed to create staging directory: ${stagingResult.error}`)
        
        }

        stagingDir = stagingResult.stagingDir
        debugLog(`Staging directory: ${stagingDir}`, config.debug)

        // Create output directory if needed
        if (!existsSync(config.finalOutputDir)) {

            mkdirSync(config.finalOutputDir, { recursive: true })
        
        }

        // Determine tarball filename
        let tarballFilename = `${metadata.tarballBaseName}-${metadata.version}.tgz`

        if (config.dev) {

            tarballFilename = `${metadata.tarballBaseName}-dev.tgz`
        
        }

        // Create tarball
        const packagingResult = await packaging.createTarball({
            stagingDir,
            outputDir: config.finalOutputDir,
            tarballFilename,
            debug: config.debug
        })

        if (!packagingResult.success || !packagingResult.tarballPath) {

            throw new Error(`Failed to create tarball: ${packagingResult.error}`)
        
        }

        debugLog(`Tarball: ${packagingResult.tarballPath}`, config.debug)

        // OPTIMIZATION: Clean up staging IMMEDIATELY after tarball creation
        if (!keepTemp && stagingDir) {

            staging.cleanupStaging(stagingDir, config.debug)
            stagingDir = undefined // Mark as cleaned
        
        }

        // Show tarball contents in debug mode
        if (config.debug && packagingResult.tarballPath) {

            await packaging.showTarballContents(packagingResult.tarballPath, config.debug)
        
        }

        // Install globally if requested (defaults to true)
        if (config.install && packagingResult.tarballPath) {

            const installResult = await installation.installGlobally({
                tarballPath: packagingResult.tarballPath,
                packageName: metadata.name,
                debug: config.debug
            })

            if (!installResult.success) {

                logger.error(`Installation failed: ${installResult.error}`)
                return { success: false }
            
            }

        }

        return { success: true }

    } catch (err) {

        logger.error(`Packaging failed: ${err instanceof Error ? err.message : String(err)}`)
        return { success: false }

    } finally {

        // Final cleanup (only if not already cleaned)
        if (!keepTemp && stagingDir) {

            staging.cleanupStaging(stagingDir)
        
        }

    }

}
