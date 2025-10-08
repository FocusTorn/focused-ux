import { execaCommand } from 'execa'
import { logger } from '@nx/devkit'
import { OutputManager } from './OutputManager.service.js'

export interface InstallationOptions {
    tarballPath: string
    packageName: string
    debug?: boolean
    timeout?: number
}

export interface InstallationResult {
    success: boolean
    packageName?: string
    error?: string
}

export interface ValidationResult {
    installed: boolean
    version?: string
    location?: string
    error?: string
}

export class InstallationService {

    private output = new OutputManager()

    /**
     * Install package globally
     */
    async installGlobally(options: InstallationOptions): Promise<InstallationResult> {

        const { tarballPath, packageName, debug = false, timeout = 60000 } = options

        try {

            const installCore = async (): Promise<string> => {

                await execaCommand(`pnpm add -g "${tarballPath}"`, {
                    shell: true,
                    windowsHide: true,
                    timeout,
                    stdio: debug ? 'inherit' : 'pipe',
                    reject: true
                })

                return `Successfully installed ${packageName}`

            }

            await this.output.withProgress(installCore, {
                text: 'Installing tarball globally...',
                color: 'green',
                spinner: 'dots',
                successText: (result) => result
            })

            return {
                success: true,
                packageName
            }

        } catch (error) {

            const errorMessage = error instanceof Error ? error.message : String(error)
            logger.error(`[INSTALLATION] Failed: ${errorMessage}`)

            return {
                success: false,
                error: errorMessage
            }

        }

    }

    /**
     * Verify package is installed globally
     */
    async verifyInstallation(packageName: string): Promise<ValidationResult> {

        try {

            // Try to get package information using pnpm
            const { stdout } = await execaCommand(`pnpm list -g ${packageName} --depth=0`, {
                shell: true,
                windowsHide: true,
                timeout: 30000,
                reject: true
            })

            // Parse output to extract version
            const lines = (stdout || '').trim().split('\n')

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

        } catch (error) {

            // Try npm as fallback
            try {

                const { stdout } = await execaCommand(`npm list -g ${packageName} --depth=0`, {
                    shell: true,
                    windowsHide: true,
                    timeout: 30000,
                    reject: true
                })

                const lines = (stdout || '').trim().split('\n')

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

            } catch {

                const errorMessage = error instanceof Error ? error.message : String(error)

                return {
                    installed: false,
                    error: `Failed to verify installation: ${errorMessage}`
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
                logger.info(`[INSTALLATION] Uninstalling ${packageName} globally`)
            }

            await execaCommand(`pnpm remove -g ${packageName}`, {
                shell: true,
                windowsHide: true,
                timeout: 60000,
                stdio: debug ? 'inherit' : 'pipe',
                reject: true
            })

            return {
                success: true,
                packageName
            }

        } catch (error) {

            // Try npm as fallback
            try {

                await execaCommand(`npm uninstall -g ${packageName}`, {
                    shell: true,
                    windowsHide: true,
                    timeout: 60000,
                    stdio: debug ? 'inherit' : 'pipe',
                    reject: true
                })

                return {
                    success: true,
                    packageName
                }

            } catch {

                const errorMessage = error instanceof Error ? error.message : String(error)
                logger.error(`[INSTALLATION] Failed to uninstall: ${errorMessage}`)

                return {
                    success: false,
                    error: errorMessage
                }

            }

        }

    }

}

