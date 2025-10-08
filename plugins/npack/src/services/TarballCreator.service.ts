import { existsSync, cpSync, unlinkSync, statSync, readdirSync, readFileSync } from 'node:fs'
import { join, relative } from 'node:path'
import { execSync } from 'node:child_process'
import { execaCommand } from 'execa'
import { logger, workspaceRoot } from '@nx/devkit'
import ora, { oraPromise } from 'ora'

export interface TarballCreationResult {
    success: boolean
    tarballPath?: string
    error?: string
}

export interface TarballValidationResult {
    valid: boolean
    error?: string
    contents?: string[]
}

export interface TarballOptions {
    packageDir: string
    outputDir: string
    tarballFilename: string
    debug: boolean
}

export class TarballCreatorService {

    private async runCommand(command: string, debug: boolean, timeoutMs: number, cwd?: string): Promise<void> {

        await execaCommand(command, {
            shell: true,
            cwd,
            windowsHide: true,
            timeout: timeoutMs,
            stdio: debug ? 'inherit' : 'ignore',
            reject: true
        })

    }

    /**
     * Test ora functionality
     */
    async testOra(): Promise<void> {

        // Set TERM environment variable for Windows compatibility
        if (!process.env.TERM) {

            process.env.TERM = 'xterm-256color'
        
        }

        const spinner = ora({
            text: 'Testing ora functionality...',
            spinner: 'dots',
            color: 'blue',
            isEnabled: true,
            isSilent: false,
            stream: process.stdout
        })

        spinner.start()

        await new Promise(resolve => setTimeout(resolve, 1000))
        
        spinner.color = 'yellow'
        spinner.text = 'Loading unicorns'
        await new Promise(resolve => setTimeout(resolve, 1000))
        
        spinner.text = 'Loading rainbows'
        await new Promise(resolve => setTimeout(resolve, 1000))

        spinner.succeed('Ora test completed successfully!')
    
    }

    /**
   * Create tarball from package directory
   */
    async createTarball(options: TarballOptions): Promise<TarballCreationResult> {

        const { packageDir, outputDir, tarballFilename, debug } = options
        const tarballPath = join(outputDir, tarballFilename)

        try {

            // Set TERM environment variable for Windows compatibility
            if (!process.env.TERM) {

                process.env.TERM = 'xterm-256color'
            
            }

            const canAnimate = Boolean(process.stderr.isTTY) && !process.env.CI && !process.env.NX_TASK_HASH

            if (!canAnimate) {

                logger.info('Creating tarball...')
            
            }

            // Use oraPromise for better terminal handling
            await oraPromise(async (_spinner) => {

                const startTime = Date.now()
        
                // Use npm pack to create proper tar.gz file
                const npmCommand = `npm pack "${packageDir}" --pack-destination "${outputDir}"`

                // Run without blocking to allow spinner animation
                await this.runCommand(npmCommand, debug, 60000, join(packageDir, '..'))
        
                // npm pack creates a file with the package name and version
                // We need to find and rename it to our desired filename
                const packageJsonPath = join(packageDir, 'package.json')

                if (existsSync(packageJsonPath)) {

                    const packageJsonContent = JSON.parse(readFileSync(packageJsonPath, 'utf-8'))
                    const npmPackFilename = `${packageJsonContent.name.replace('@fux/', 'fux-')}-${packageJsonContent.version}.tgz`
                    const npmPackPath = join(outputDir, npmPackFilename)
          
                    if (existsSync(npmPackPath) && npmPackPath !== tarballPath) {

                        // Move the npm pack file to our desired location
                        cpSync(npmPackPath, tarballPath)
                        unlinkSync(npmPackPath)
                    
                    }
                
                }
        
                if (!existsSync(tarballPath)) {

                    throw new Error(`Tarball was not created at: ${tarballPath}`)
                
                }
        
                // Ensure spinner shows for at least 500ms so users can see the animation
                const elapsed = Date.now() - startTime

                if (elapsed < 500) {

                    await new Promise(resolve => setTimeout(resolve, 500 - elapsed))
                
                }

                // Create shortened path for display (use backslashes on Windows for consistency)
                const shortenedPath = relative(workspaceRoot, tarballPath).replace(/\//g, '\\')
                
                if (!canAnimate) {

                    logger.info(`Created tarball: ${shortenedPath}`)
                
                }

                return `Created tarball: ${shortenedPath}`

            }, {
                text: 'Creating tarball...',
                spinner: 'dots',
                color: 'blue',
                stream: process.stderr,
                isEnabled: canAnimate,
                isSilent: false,
                hideCursor: true,
                discardStdin: false,
                successText: (result) => result
            })

            return {
                success: true,
                tarballPath
            }
      
        } catch (error) {

            const errorMessage = error instanceof Error ? error.message : String(error)

            logger.error(`Tarball creation failed: ${errorMessage}`)
            return {
                success: false,
                error: errorMessage
            }
        
        }
    
    }

    /**
   * Validate tarball integrity and contents
   */
    async validateTarball(tarballPath: string, debug: boolean = false): Promise<TarballValidationResult> {

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

                const tarOutput = execSync(`tar -tzf "${tarballPath}"`, {
                    encoding: 'utf-8',
                    stdio: 'pipe'
                })

                contents = tarOutput.trim().split('\n').filter(line => line.length > 0)
            
            } catch (error) {

                // If tar fails, try npm pack inspection
                const packageDir = join(tarballPath, '..', 'temp-package') // This would need to be passed in

                try {

                    execSync(`npm pack --dry-run "${packageDir}"`, {
                        encoding: 'utf-8',
                        stdio: 'pipe'
                    })
                
                } catch (_npmError) {

                    return {
                        valid: false,
                        error: `Failed to inspect tarball contents: ${error instanceof Error ? error.message : String(error)}`
                    }
                
                }
            
            }

            if (debug) {

                logger.info('Tarball contents:')
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
   * Show tarball contents for debugging
   */
    async showTarballContents(tarballPath: string, packageDir: string, debug: boolean): Promise<void> {

        if (!debug) {

            return
        
        }

        try {

            logger.info('Tarball contents:')
      
            // Try tar command first
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
                    cwd: join(packageDir, '..')
                })
            
            }
        
        } catch (error) {

            logger.warn(`Failed to show tarball contents: ${error instanceof Error ? error.message : String(error)}`)
        
        }
    
    }

    /**
   * Get tarball size information
   */
    getTarballInfo(tarballPath: string): { size: number; exists: boolean } {

        if (!existsSync(tarballPath)) {

            return { size: 0, exists: false }
        
        }

        try {

            const stats = statSync(tarballPath)

            return {
                size: stats.size,
                exists: true
            }
        
        } catch (_error) {

            return { size: 0, exists: false }
        
        }
    
    }

    /**
   * Clean up failed tarball creation artifacts
   */
    cleanupFailedCreation(outputDir: string, expectedFilename: string): void {

        try {

            // Look for any .tgz files that might be leftover from failed creation
            const files = readdirSync(outputDir)
      
            for (const file of files) {

                if (file.endsWith('.tgz') && file !== expectedFilename) {

                    const filePath = join(outputDir, file)

                    try {

                        unlinkSync(filePath)
                        logger.debug(`Cleaned up leftover tarball: ${file}`)
                    
                    } catch (error) {

                        logger.warn(`Failed to clean up leftover tarball ${file}: ${error}`)
                    
                    }
                
                }
            
            }
        
        } catch (error) {

            logger.warn(`Failed to cleanup failed creation artifacts: ${error}`)
        
        }
    
    }

}
