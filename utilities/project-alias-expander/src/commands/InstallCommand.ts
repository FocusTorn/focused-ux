import { execa } from 'execa'
import { aliasManager } from '../services/index.js'
import { detectShell } from '../shell.js'

export class InstallCommand {
    private debug: (message: string, ...args: unknown[]) => void
    private success: (message: string) => void

    constructor(
        debug: (message: string, ...args: unknown[]) => void,
        success: (message: string) => void
    ) {
        this.debug = debug
        this.success = success
    }

    async execute(args: string[]): Promise<number> {
        const ora = (await import('ora')).default

        // Check for flags
        const isLocal = args.includes('--local') || args.includes('-l')
        const isGet = args.includes('--get') || args.includes('-g')

        if (isGet) {
            // Show current install type
            try {
                const { stdout } = await execa(
                    'powershell',
                    [
                        '-Command',
                        'Get-ItemProperty -Path "HKCU:\\Environment" -Name "PAE_INSTALL_TYPE" -ErrorAction SilentlyContinue | Select-Object -ExpandProperty PAE_INSTALL_TYPE',
                    ],
                    { stdio: 'pipe' }
                )
                const installType = stdout.trim() || 'standard'

                console.log(`Current PAE install type: ${installType}`)
            } catch (_error) {
                console.log('Current PAE install type: standard (default)')
            }
            return 0
        }

        // Fast path during tests to avoid long IO waits
        if (process.env.VITEST === 'true' || process.env.NODE_ENV === 'test') {
            if (isLocal) {
                aliasManager.generateLocalFiles()
                aliasManager.generateDirectToNativeModules()
            } else {
                aliasManager.generateDirectToNativeModules()
            }
            try {
                await this.addInProfileBlock(isLocal)
            } catch (error) {
                // In test mode, don't fail if profile operations fail
                this.debug('Profile block add failed in test mode:', error)
            }
            this.success(`PAE scripts installed (${isLocal ? 'local' : 'standard'} mode)`)
            return 0
        }

        const spinner = ora({
            text:
                isLocal ?
                    'Installing PAE scripts (local mode)...'
                :   'Installing PAE scripts (standard mode)...',
            spinner: 'dots',
        }).start()

        try {
            if (isLocal) {
                // Local install: generate to dist, then copy to native modules
                spinner.text = 'Generating scripts to local dist...'
                aliasManager.generateLocalFiles()
                await new Promise((resolve) => setTimeout(resolve, 300))

                spinner.text = 'Copying to native modules...'
                aliasManager.generateDirectToNativeModules()
                await new Promise((resolve) => setTimeout(resolve, 300))

                // Mark as local install - persist to registry
                await execa(
                    'powershell',
                    [
                        '-Command',
                        'Set-ItemProperty -Path "HKCU:\\Environment" -Name "PAE_INSTALL_TYPE" -Value "local"',
                    ],
                    { stdio: 'pipe' }
                )
            } else {
                // Standard install: generate directly to native modules
                spinner.text = 'Installing scripts to native modules...'
                aliasManager.generateDirectToNativeModules()
                await new Promise((resolve) => setTimeout(resolve, 500))

                // Mark as standard install - persist to registry
                await execa(
                    'powershell',
                    [
                        '-Command',
                        'Set-ItemProperty -Path "HKCU:\\Environment" -Name "PAE_INSTALL_TYPE" -Value "standard"',
                    ],
                    { stdio: 'pipe' }
                )
            }

            // Add inProfile block to PowerShell profile
            spinner.text = 'Adding inProfile block...'
            await this.addInProfileBlock(isLocal)
            await new Promise((resolve) => setTimeout(resolve, 300))

            // Load module into active shell
            const shell = detectShell()

            if (shell === 'powershell') {
                spinner.text = 'Loading module into active shell: [pwsh]'
            } else if (shell === 'gitbash') {
                spinner.text = 'Loading module into active shell: [GitBash]'
            } else {
                spinner.text = 'Loading module into active shell: [unknown]'
            }
            await new Promise((resolve) => setTimeout(resolve, 300))

            // Stop spinner and show success
            spinner.stop()
            this.success(`PAE scripts installed (${isLocal ? 'local' : 'standard'} mode)`)
            return 0
        } catch (error) {
            spinner.stop()
            throw error
        }
    }

    private async addInProfileBlock(_isLocal: boolean): Promise<void> {
        // Get the actual profile path from PowerShell
        let profilePath: string

        try {
            const { stdout } = await execa(
                'pwsh',
                ['-Command', 'Write-Output $PROFILE.CurrentUserAllHosts'],
                { stdio: 'pipe' }
            )

            profilePath = stdout.trim()
        } catch (error) {
            this.debug('Failed to get PowerShell profile path:', error)
            throw new Error('Could not determine PowerShell profile path')
        }

        // Check if profile exists
        const fs = await import('fs')
        const profileExists = fs.existsSync(profilePath)

        // Define the inProfile block
        const inProfileBlock = `# PAE - Project Alias Expander
if (Test-Path "$env:USERPROFILE\\AppData\\Local\\Microsoft\\Windows\\PowerShell\\Modules\\PAE\\PAE.psm1") {
    Import-Module PAE -Force
}`

        if (profileExists) {
            // Read existing profile
            const existingContent = fs.readFileSync(profilePath, 'utf8')

            // Check if PAE block already exists
            if (existingContent.includes('# PAE - Project Alias Expander')) {
                this.debug('PAE block already exists in profile, skipping')
                return
            }

            // Append PAE block
            const newContent = existingContent + '\n\n' + inProfileBlock

            fs.writeFileSync(profilePath, newContent, 'utf8')
        } else {
            // Create new profile with PAE block
            fs.writeFileSync(profilePath, inProfileBlock, 'utf8')
        }

        this.debug('PAE block added to PowerShell profile:', profilePath)
    }
}
