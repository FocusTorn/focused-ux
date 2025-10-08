import { execSync } from 'node:child_process'
import { execaCommand } from 'execa'
import { logger } from '@nx/devkit'
import ora from 'ora'

export interface InstallationResult {
    success: boolean
    error?: string
    packageName?: string
}

export interface InstallationValidationResult {
    installed: boolean
    version?: string
    location?: string
    error?: string
}

export interface InstallationOptions {
    tarballPath: string
    packageName: string
    debug: boolean
    timeout?: number
}

export class GlobalInstallerService {

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
   * Install tarball globally using pnpm
   */
    async installGlobally(options: InstallationOptions): Promise<InstallationResult> {

        const { tarballPath, packageName, debug, timeout = 60000 } = options
        
        try {

            const installSpinner = ora({
                text: 'Installing tarball globally...',
                spinner: 'dots',
                color: 'green',
                isEnabled: Boolean(process.stderr.isTTY) && !process.env.CI,
                isSilent: false,
                hideCursor: true,
                discardStdin: false,
                stream: process.stderr
            }).start()

            try {

                await this.runCommand(`pnpm add -g "${tarballPath}"`, debug, timeout)

                installSpinner.succeed(`Successfully installed ${packageName}`)

                return {
                    success: true,
                    packageName
                }

            } catch (error) {

                const errorMessage = error instanceof Error ? error.message : String(error)

                installSpinner.fail(`Failed to install globally: ${errorMessage}`)

                return {
                    success: false,
                    error: errorMessage
                }
            
            }

        } catch (error) {

            const errorMessage = error instanceof Error ? error.message : String(error)

            logger.error(`Global installation failed: ${errorMessage}`)
      
            return {
                success: false,
                error: errorMessage
            }
        
        }
    
    }

    /**
   * Validate that package is installed globally
   */
    async validateInstallation(packageName: string): Promise<InstallationValidationResult> {

        try {

            // Try to get package information using pnpm
            const output = execSync(`pnpm list -g ${packageName} --depth=0`, {
                encoding: 'utf-8',
                stdio: 'pipe'
            })

            // Parse the output to extract version and location information
            const lines = output.trim().split('\n')
      
            for (const line of lines) {

                if (line.includes(packageName)) {

                    // Extract version from the output
                    const versionMatch = line.match(/(\d+\.\d+\.\d+.*?)(?:\s|$)/)
                    const version = versionMatch ? versionMatch[1] : undefined

                    return {
                        installed: true,
                        version,
                        location: 'global'
                    }
                
                }
            
            }

            return {
                installed: false,
                error: 'Package not found in global installation'
            }

        } catch (error) {

            // If pnpm list fails, try alternative method
            try {

                // Try using npm list as fallback
                const npmOutput = execSync(`npm list -g ${packageName} --depth=0`, {
                    encoding: 'utf-8',
                    stdio: 'pipe'
                })

                const lines = npmOutput.trim().split('\n')
        
                for (const line of lines) {

                    if (line.includes(packageName)) {

                        const versionMatch = line.match(/(\d+\.\d+\.\d+.*?)(?:\s|$)/)
                        const version = versionMatch ? versionMatch[1] : undefined

                        return {
                            installed: true,
                            version,
                            location: 'global'
                        }
                    
                    }
                
                }

                return {
                    installed: false,
                    error: 'Package not found in global installation'
                }

            } catch (_npmError) {

                const errorMessage = error instanceof Error ? error.message : String(error)

                return {
                    installed: false,
                    error: `Failed to validate installation: ${errorMessage}`
                }
            
            }
        
        }
    
    }

    /**
   * Uninstall package globally
   */
    async uninstallGlobally(packageName: string, debug: boolean = false): Promise<InstallationResult> {

        try {

            if (debug) {

                logger.info(`Uninstalling ${packageName} globally`)
            
            }

            execSync(`pnpm remove -g ${packageName}`, {
                encoding: 'utf-8',
                stdio: debug ? 'inherit' : 'pipe'
            })

            return {
                success: true,
                packageName
            }

        } catch (error) {

            // If pnpm fails, try npm as fallback
            try {

                execSync(`npm uninstall -g ${packageName}`, {
                    encoding: 'utf-8',
                    stdio: debug ? 'inherit' : 'pipe'
                })

                return {
                    success: true,
                    packageName
                }

            } catch (_npmError) {

                const errorMessage = error instanceof Error ? error.message : String(error)

                logger.error(`Failed to uninstall ${packageName} globally: ${errorMessage}`)
        
                return {
                    success: false,
                    error: errorMessage
                }
            
            }
        
        }
    
    }

    /**
   * Check if package manager is available
   */
    checkPackageManager(): { pnpm: boolean; npm: boolean; yarn: boolean } {

        const result = { pnpm: false, npm: false, yarn: false }

        try {

            execSync('pnpm --version', { stdio: 'pipe' })
            result.pnpm = true
        
        } catch {
            // pnpm not available
        }

        try {

            execSync('npm --version', { stdio: 'pipe' })
            result.npm = true
        
        } catch {
            // npm not available
        }

        try {

            execSync('yarn --version', { stdio: 'pipe' })
            result.yarn = true
        
        } catch {
            // yarn not available
        }

        return result
    
    }

    /**
   * Get preferred package manager
   */
    getPreferredPackageManager(): 'pnpm' | 'npm' | 'yarn' | null {

        const managers = this.checkPackageManager()
    
        // Prefer pnpm, then npm, then yarn
        if (managers.pnpm) return 'pnpm'
        if (managers.npm) return 'npm'
        if (managers.yarn) return 'yarn'
    
        return null
    
    }

    /**
   * Install with preferred package manager
   */
    async installWithPreferredManager(options: InstallationOptions): Promise<InstallationResult> {

        const preferredManager = this.getPreferredPackageManager()
    
        if (!preferredManager) {

            return {
                success: false,
                error: 'No package manager (pnpm, npm, yarn) is available'
            }
        
        }

        if (preferredManager === 'pnpm') {

            return this.installGlobally(options)
        
        }

        // For npm and yarn, we need to adapt the command
        try {

            const installSpinner = ora({
                text: 'Installing tarball globally...',
                spinner: 'dots',
                color: 'green',
                isEnabled: true,
                isSilent: false,
                hideCursor: true,
                discardStdin: false
            }).start()

            try {

                let command: string

                if (preferredManager === 'npm') {

                    command = `npm install -g "${options.tarballPath}"`
                
                } else {

                    command = `yarn global add "${options.tarballPath}"`
                
                }

                await this.runCommand(command, options.debug, options.timeout || 60000)

                // Clear the spinner line and show success message with checkmark
                installSpinner.clear()
                installSpinner.succeed(`Successfully installed ${options.packageName} globally`)

                return {
                    success: true,
                    packageName: options.packageName
                }

            } catch (error) {

                const errorMessage = error instanceof Error ? error.message : String(error)

                installSpinner.fail(`Failed to install globally: ${errorMessage}`)
        
                return {
                    success: false,
                    error: errorMessage
                }
            
            }

        } catch (error) {

            const errorMessage = error instanceof Error ? error.message : String(error)

            return {
                success: false,
                error: errorMessage
            }
        
        }
    
    }

}
