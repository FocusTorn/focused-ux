import { mkdtempSync, mkdirSync, existsSync, rmSync, readdirSync, statSync, readFileSync, writeFileSync } from 'node:fs'
import { cp } from 'node:fs/promises'
import { join, basename } from 'node:path'
import { logger } from '@nx/devkit'

export interface StagingOptions {
    packageDir: string
    packageJson: Record<string, unknown>
    includeFiles?: string[]
    tempBasePath?: string
    keepTemp?: boolean
    debug?: boolean
}

export interface StagingResult {
    success: boolean
    stagingDir?: string
    error?: string
}

export class StagingService {

    /**
     * Create a staging directory and populate it with package files
     */
    async createStaging(options: StagingOptions): Promise<StagingResult> {

        const { packageDir, packageJson, includeFiles = [], tempBasePath, debug = false } = options

        try {

            // Determine temp base directory
            const tempBase = tempBasePath || join(packageDir, '.npack')

            // Ensure temp base exists
            if (!existsSync(tempBase)) {
                mkdirSync(tempBase, { recursive: true })
            }

            // Create unique staging directory
            const packageName = String(packageJson.name || 'package').replace('@fux/', 'fux-')
            const timestamp = Date.now()
            const random = Math.floor(Math.random() * 100000)
            const tempDirPrefix = join(tempBase, `${packageName}-${timestamp}-${random}-`)
            
            const stagingDir = mkdtempSync(tempDirPrefix)

            if (debug) {
                logger.info(`[STAGING] Created staging directory: ${stagingDir}`)
            }

            // Write package.json
            const packageJsonPath = join(stagingDir, 'package.json')
            writeFileSync(packageJsonPath, JSON.stringify(packageJson, null, 2))

            if (debug) {
                logger.info(`[STAGING] Wrote package.json`)
            }

            // Get files to include from package.json "files" field
            const filesFromPackageJson = this.getFilesFromPackageJson(packageJson, packageDir)
            const allFiles = [...filesFromPackageJson, ...includeFiles]

            if (debug) {
                logger.info(`[STAGING] Copying ${allFiles.length} files/directories in parallel`)
            }

            // Copy files in parallel for speed
            await Promise.all(
                allFiles.map(async (file) => {
                    const sourcePath = join(packageDir, file)
                    const destPath = join(stagingDir, file)

                    if (!existsSync(sourcePath)) {
                        if (debug) {
                            logger.warn(`[STAGING] Skipping missing file: ${file}`)
                        }
                        return
                    }

                    // Create parent directory if needed
                    const destDir = join(destPath, '..')
                    if (!existsSync(destDir)) {
                        mkdirSync(destDir, { recursive: true })
                    }

                    // Copy file or directory asynchronously
                    await cp(sourcePath, destPath, { recursive: true })

                    if (debug) {
                        logger.info(`[STAGING] Copied: ${file}`)
                    }
                })
            )

            return {
                success: true,
                stagingDir
            }

        } catch (error) {

            const errorMessage = error instanceof Error ? error.message : String(error)
            logger.error(`[STAGING] Failed to create staging directory: ${errorMessage}`)

            return {
                success: false,
                error: errorMessage
            }

        }

    }

    /**
     * Clean up staging directory
     */
    cleanupStaging(stagingDir: string, debug: boolean = false): void {

        try {

            if (existsSync(stagingDir)) {

                const parentDir = join(stagingDir, '..')

                rmSync(stagingDir, { recursive: true, force: true, maxRetries: 3, retryDelay: 100 })

                if (debug) {
                    logger.info(`[STAGING] Cleaned up staging directory: ${stagingDir}`)
                }

                // Remove parent .npack directory if it's empty
                if (existsSync(parentDir) && basename(parentDir) === '.npack') {

                    const entries = readdirSync(parentDir)

                    if (entries.length === 0) {

                        rmSync(parentDir, { recursive: true, force: true })

                        if (debug) {
                            logger.info(`[STAGING] Removed empty .npack directory: ${parentDir}`)
                        }

                    }

                }

            }

        } catch (error) {

            const errorMessage = error instanceof Error ? error.message : String(error)
            logger.warn(`[STAGING] Failed to cleanup staging directory: ${errorMessage}`)

        }

    }

    /**
     * Clean up old staging directories
     */
    cleanupOldStaging(tempBasePath: string, packageBaseName: string, debug: boolean = false): void {

        try {

            if (!existsSync(tempBasePath)) {
                return
            }

            const entries = readdirSync(tempBasePath)

            for (const entry of entries) {

                if (entry.startsWith(packageBaseName)) {

                    const fullPath = join(tempBasePath, entry)
                    const stats = statSync(fullPath)

                    if (stats.isDirectory()) {

                        rmSync(fullPath, { recursive: true, force: true, maxRetries: 3, retryDelay: 100 })

                        if (debug) {
                            logger.info(`[STAGING] Cleaned up old staging: ${entry}`)
                        }

                    }

                }

            }

            // After cleanup, remove .npack directory if it's empty
            if (existsSync(tempBasePath) && basename(tempBasePath) === '.npack') {

                const remainingEntries = readdirSync(tempBasePath)

                if (remainingEntries.length === 0) {

                    rmSync(tempBasePath, { recursive: true, force: true })

                    if (debug) {
                        logger.info(`[STAGING] Removed empty .npack directory: ${tempBasePath}`)
                    }

                }

            }

        } catch (error) {

            const errorMessage = error instanceof Error ? error.message : String(error)
            logger.warn(`[STAGING] Failed to cleanup old staging directories: ${errorMessage}`)

        }

    }

    /**
     * Extract files list from package.json
     */
    private getFilesFromPackageJson(packageJson: Record<string, unknown>, packageDir: string): string[] {

        const files: string[] = []

        // Get files from package.json "files" field
        if (Array.isArray(packageJson.files)) {
            files.push(...packageJson.files.filter(f => typeof f === 'string') as string[])
        }

        // Always include README if exists
        const readmeFiles = ['README.md', 'README', 'readme.md', 'readme']
        for (const readme of readmeFiles) {
            if (existsSync(join(packageDir, readme)) && !files.includes(readme)) {
                files.push(readme)
            }
        }

        // Always include LICENSE if exists
        const licenseFiles = ['LICENSE', 'LICENSE.md', 'LICENSE.txt', 'license', 'license.md', 'license.txt']
        for (const license of licenseFiles) {
            if (existsSync(join(packageDir, license)) && !files.includes(license)) {
                files.push(license)
            }
        }

        return files

    }

}

