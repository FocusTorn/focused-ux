import { existsSync, cpSync, unlinkSync, readFileSync } from 'node:fs'
import { join, relative } from 'node:path'
import { execaCommand } from 'execa'
import { logger, workspaceRoot } from '@nx/devkit'
import type { OutputManager } from './OutputManager.service.js'

export interface PackagingOptions {
    stagingDir: string
    outputDir: string
    tarballFilename: string
    debug?: boolean
}

export interface PackagingResult {
    success: boolean
    tarballPath?: string
    error?: string
}

export interface ValidationResult {
    valid: boolean
    contents?: string[]
    error?: string
}

export class PackagingService {

    constructor(private output: OutputManager) {}

    /**
     * Centralized command runner
     */
    private async runCommand(command: string, options: { debug?: boolean; timeout?: number } = {}): Promise<void> {

        const { debug = false, timeout = 60000 } = options

        await execaCommand(command, {
            shell: true,
            windowsHide: true,
            timeout,
            stdio: debug ? 'inherit' : 'ignore',
            reject: true
        })

    }

    /**
     * Create tarball from staging directory
     */
    async createTarball(options: PackagingOptions): Promise<PackagingResult> {

        const { stagingDir, outputDir, tarballFilename, debug = false } = options
        const tarballPath = join(outputDir, tarballFilename)

        try {

            const createCore = async (): Promise<string> => {

                // Use npm pack to create proper tar.gz file
                const npmCommand = `npm pack "${stagingDir}" --pack-destination "${outputDir}"`

                await this.runCommand(npmCommand, { debug })

                // npm pack creates a file with package name and version
                // Find and rename it to our desired filename
                const packageJsonPath = join(stagingDir, 'package.json')

                if (existsSync(packageJsonPath)) {

                    const packageJsonContent = JSON.parse(readFileSync(packageJsonPath, 'utf-8'))
                    const npmPackFilename = `${packageJsonContent.name.replace('@fux/', 'fux-')}-${packageJsonContent.version}.tgz`
                    const npmPackPath = join(outputDir, npmPackFilename)

                    if (existsSync(npmPackPath) && npmPackPath !== tarballPath) {

                        cpSync(npmPackPath, tarballPath)
                        unlinkSync(npmPackPath)

                    }

                }

                if (!existsSync(tarballPath)) {
                    throw new Error(`Tarball was not created at: ${tarballPath}`)
                }

                // Create shortened path for display
                const shortenedPath = relative(workspaceRoot, tarballPath).replace(/\//g, '\\')

                return `Created tarball: ${shortenedPath}`

            }

            await this.output.withProgress(createCore, {
                text: 'Creating tarball...',
                color: 'blue',
                spinner: 'dots',
                successText: (result) => result
            })

            return {
                success: true,
                tarballPath
            }

        } catch (error) {

            const errorMessage = error instanceof Error ? error.message : String(error)
            logger.error(`[PACKAGING] Failed to create tarball: ${errorMessage}`)

            return {
                success: false,
                error: errorMessage
            }

        }

    }

    /**
     * Validate tarball integrity and contents
     */
    async validateTarball(tarballPath: string, debug: boolean = false): Promise<ValidationResult> {

        try {

            if (!existsSync(tarballPath)) {
                return {
                    valid: false,
                    error: `Tarball does not exist: ${tarballPath}`
                }
            }

            // Try to list tarball contents
            let contents: string[] = []

            try {

                const { stdout } = await execaCommand(`tar -tzf "${tarballPath}"`, {
                    shell: true,
                    windowsHide: true
                })

                contents = stdout.trim().split('\n').filter(line => line.length > 0)

            } catch (error) {

                return {
                    valid: false,
                    error: `Failed to inspect tarball: ${error instanceof Error ? error.message : String(error)}`
                }

            }

            if (debug) {
                logger.info('[PACKAGING] Tarball contents:')
                logger.info(contents.join('\n'))
            }

            return {
                valid: true,
                contents
            }

        } catch (error) {

            const errorMessage = error instanceof Error ? error.message : String(error)

            return {
                valid: false,
                error: `Tarball validation failed: ${errorMessage}`
            }

        }

    }

    /**
     * Show tarball contents (for debugging)
     */
    async showTarballContents(tarballPath: string, debug: boolean): Promise<void> {

        if (!debug) {
            return
        }

        try {

            logger.info('[PACKAGING] Tarball contents:')

            await execaCommand(`tar -tzf "${tarballPath}"`, {
                shell: true,
                windowsHide: true,
                stdio: 'inherit'
            })

        } catch (error) {

            logger.warn(`[PACKAGING] Failed to show tarball contents: ${error instanceof Error ? error.message : String(error)}`)

        }

    }

}

