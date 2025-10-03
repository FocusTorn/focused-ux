import * as path from 'path'
import * as fs from 'fs'
import { execa } from 'execa'
import type { AliasConfig, IAliasManagerService } from '../_types/index.js'
import { loadAliasConfigCached } from '../config.js'
import { detectShellTypeCached } from '../shell.js'

export class AliasManagerService implements IAliasManagerService {

    /**
     * Helper function to remove leading whitespace from template strings
     * Allows for clean, readable template definitions
     */
    private trimTemplate(template: string): string { //>
        const lines = template.split('\n')
        
        // Find the minimum indentation (excluding empty lines)
        let minIndent = Infinity

        for (const line of lines) {
            if (line.trim() === '') continue

            const indent = line.match(/^(\s*)/)?.[1]?.length || 0

            minIndent = Math.min(minIndent, indent)
        }
        
        // Remove the minimum indentation from all lines
        return lines
            .map(line => line.slice(minIndent))
            .join('\n')
            .trim()
    } //<

    /**
     * Main orchestrator function for alias processing
     * Generates local files and installs aliases to native modules
     */
    async processAliases(): Promise<void> { //>
        console.log('🔄 Regenerating PAE aliases...')
        
        try {
            // Step 1: Generate the local files
            this.generateLocalFiles()
            
            // Step 2: Install the aliases
            await this.installAliases()
            
            console.log('✅ PAE aliases regenerated successfully')
        } catch (error) {
            console.log('❌ Failed to process PAE aliases')
            throw error
        }
    }

    /**
     * Generates alias files directly to native module directories
     * Creates PowerShell and Bash scripts in the appropriate system locations
     */
    generateDirectToNativeModules(): void { //>
        const config = loadAliasConfigCached()
        const aliases = Object.keys(config['nxPackages'])
        const isVerbose = process.argv.includes('--verbose') || process.argv.includes('-v')
        const isDebug = process.argv.includes('--debug') || process.argv.includes('-d') || process.env.PAE_DEBUG === '1'
        const isInfo = process.argv.includes('--info') || process.argv.includes('-i') || process.env.PAE_INFO === '1'
        const shell = detectShellTypeCached()

        if (isInfo || isDebug || isVerbose) {
            console.log(`[PAE INFO] Detected shell: ${shell}`)
            console.log(`[PAE INFO] Found ${aliases.length} aliases: ${aliases.join(', ')}`)
            console.log('[PAE INFO] Generating scripts directly to native modules directories')
        }

        const { moduleContent, bashContent } = this.generateScriptContent(aliases)

        // Install PowerShell module directly to modules directory
        try {
            // Get the first PowerShell modules directory from PSModulePath
            const psModulePath = process.env.PSModulePath || ''
            const psModuleDirs = psModulePath.split(';').filter(dir =>
                dir.includes('PowerShell') && dir.includes('Modules') && !dir.includes('WindowsPowerShell'))
            const baseModuleDir = psModuleDirs[0] || path.join(process.env.USERPROFILE || process.env.HOME || '', 'Documents', 'PowerShell', 'Modules')
            const psModuleDir = path.join(baseModuleDir, 'PAE')

            if (!fs.existsSync(psModuleDir)) {
                fs.mkdirSync(psModuleDir, { recursive: true })
            }
            
            // Write the module file directly to the PowerShell modules directory
            fs.writeFileSync(path.join(psModuleDir, 'PAE.psm1'), moduleContent)
            
            if (isInfo || isDebug || isVerbose) {
                console.log(`[PAE INFO] ✅ PowerShell module generated directly to: ${psModuleDir}`)
            }
        } catch (error) {
            if (isInfo || isDebug || isVerbose) {
                console.log(`[PAE INFO] ⚠️  Failed to generate PowerShell module: ${error}`)
            }
        }
        
        // Install GitBash script directly to home directory
        try {
            const homeDir = process.env.HOME || process.env.USERPROFILE || ''
            const bashScriptPath = path.join(homeDir, '.pae-aliases.sh')
            
            // Write the bash script directly to the home directory
            fs.writeFileSync(bashScriptPath, bashContent)
            
            if (isVerbose) {
                console.log(`\x1b[32m✅ Bash script generated directly to: ${bashScriptPath}\x1b[0m`)
            }
        } catch (error) {
            if (isVerbose) {
                console.log(`\x1b[33m⚠️  Failed to generate Bash script: ${error}\x1b[0m`)
            }
        }
    } //<

    /**
     * Generates local alias files in the dist directory
     * Creates PowerShell module and Bash script files for local use
     */
    generateLocalFiles(): void { //>
        const config = loadAliasConfigCached()
        const aliases = Object.keys(config['nxPackages'])
        const isVerbose = process.argv.includes('--verbose') || process.argv.includes('-v')
        const shell = detectShellTypeCached()

        if (isVerbose) {
            console.log(`Detected shell: ${shell}`)
            console.log(`Found ${aliases.length} aliases: ${aliases.join(', ')}`)
            console.log('Generating local files only (build process)')
        }

        const { moduleContent, bashContent } = this.generateScriptContent(aliases)

        // Write files to dist directory
        const distDir = path.join(process.cwd(), 'libs', 'project-alias-expander', 'dist')

        if (!fs.existsSync(distDir)) {
            fs.mkdirSync(distDir, { recursive: true })
        }

        fs.writeFileSync(path.join(distDir, 'pae-functions.psm1'), moduleContent)
        fs.writeFileSync(path.join(distDir, 'pae-aliases.sh'), bashContent)
    } //<
    
    /**
     * Generates both PowerShell module and Bash script content
     * @param aliases Array of alias names to generate
     * @returns Object containing moduleContent and bashContent strings
     */
    private generateScriptContent(aliases: string[]): { moduleContent: string; bashContent: string } { //>
        const moduleContent = this.generatePowerShellModule(aliases)
        const bashContent = this.generateBashScript(aliases)
        
        return { moduleContent, bashContent }
    } //<

    /**
     * Generates complete PowerShell module content
     * @param aliases Array of alias names to generate
     * @returns Complete PowerShell module as string
     */
    private generatePowerShellModule(aliases: string[]): string { //>
        const header = this.getPowerShellHeader()
        const functions = this.generatePowerShellFunctions(aliases)
        const exports = this.generatePowerShellExports(aliases)
        const footer = this.getPowerShellFooter()
        
        return [header, functions, exports, footer].join('\n\n')
    } //<

    /**
     * Generates complete Bash script content
     * @param aliases Array of alias names to generate
     * @returns Complete Bash script as string
     */
    private generateBashScript(aliases: string[]): string { //>
        const header = this.getBashHeader()
        const aliasesList = this.generateBashAliases(aliases)
        const refreshFunction = this.getBashRefreshFunction()
        
        return [header, aliasesList, refreshFunction].join('\n\n')
    } //<

    // POWERSHELL ------------------------------------------------------------->> 
    
    /**
     * Gets the PowerShell module header template
     * @returns PowerShell module header as string
     */
    private getPowerShellHeader(): string { //>
        return this.trimTemplate(`
            # PAE Global Aliases - Auto-generated PowerShell Module
            # Generated from config.json - DO NOT EDIT MANUALLY
            # Simple approach: each alias just calls 'pae <alias> <args>'
        `)
    } //<

    /**
     * Gets the PowerShell module footer template
     * Includes module loading confirmation and cleanup handlers
     * @returns PowerShell module footer as string
     */
    private getPowerShellFooter(): string { //>
        return this.trimTemplate(`
            # Module loaded confirmation
            if ($env:ENABLE_TEST_CONSOLE -ne "false") {
                Write-Host "\`e[1m\`e[32m✔\`e[0m \`e[32mModule loaded: [pwsh] PAE Shorthand Aliases\`e[0m"
            }

            # Module cleanup handlers to prevent COM object accumulation
            $MyInvocation.MyCommand.ScriptBlock.Module.OnRemove = {
                # Clean up any COM objects or event handlers
                try {
                    # Remove any global variables that might hold references
                    Remove-Variable -Name "PAE_ModuleLoaded" -ErrorAction SilentlyContinue
                    
                    # Force garbage collection to clean up any lingering objects
                    [System.GC]::Collect()
                    [System.GC]::WaitForPendingFinalizers()
                    
                    # Cleanup completed silently
                } catch {
                    # Silently handle cleanup errors
                }
            }

            # Set a flag to track module loading
            $Global:PAE_ModuleLoaded = $true
        `)
    } //<

    /**
     * Generates all PowerShell functions for the given aliases
     * @param aliases Array of alias names to generate functions for
     * @returns Combined PowerShell functions as string
     */
    private generatePowerShellFunctions(aliases: string[]): string { //>
        return aliases.map(alias => this.generatePowerShellFunction(alias)).join('\n\n')
    } //<

    /**
     * Generates a single PowerShell function for an alias
     * @param alias The alias name to generate a function for
     * @returns PowerShell function definition as string
     */
    private generatePowerShellFunction(alias: string): string { //>
        return this.trimTemplate(`
            function Invoke-${alias} { 
                [CmdletBinding()] 
                param([Parameter(Position = 0, ValueFromRemainingArguments = $true)][string[]]$Arguments) 
                
                # Capture short-in command for echo variants
                if ($env:PAE_ECHO -eq "1" -or $env:PAE_ECHO_X -eq "1") {
                    $env:PAE_SHORT_IN = "${alias} $($Arguments -join ' ')"
                }
                
                # Build the command to send to PAE
                $paeCommand = "pae ${alias} $($Arguments -join ' ')"
                
                # Capture short-out command for echo variants
                if ($env:PAE_ECHO -eq "1" -or $env:PAE_ECHO_X -eq "1") {
                    $env:PAE_SHORT_OUT = $paeCommand
                }
                
                # Execute the PAE command
                Invoke-Expression $paeCommand
            }

            # Alias for backward compatibility
            Set-Alias -Name ${alias} -Value Invoke-${alias}
        `)
    } //<

    /**
     * Generates PowerShell module exports for functions and aliases
     * @param aliases Array of alias names to export
     * @returns PowerShell export statements as string
     */
    private generatePowerShellExports(aliases: string[]): string { //>
        const functions = aliases.map(a => `Invoke-${a}`).join(', ')
        const aliasesList = aliases.join(', ')
        
        return this.trimTemplate(`
            # Export all functions and aliases
            Export-ModuleMember -Function ${functions}
            Export-ModuleMember -Alias ${aliasesList}
        `)
    } //<

    //--------------------------------------------------------------------------------------------<<
    
    // BASH ------------------------------------------------------------------->> 
    
    /**
     * Gets the Bash script header template
     * @returns Bash script header as string
     */
    private getBashHeader(): string { //>
        return this.trimTemplate(`
            # PAE Global Aliases - Auto-generated Bash Script
            # Generated from config.json - DO NOT EDIT MANUALLY
            # Simple approach: each alias just calls 'pae <alias> <args>'
        `)
    } //<

    /**
     * Generates Bash alias definitions for all aliases
     * @param aliases Array of alias names to generate
     * @returns Bash alias definitions as string
     */
    private generateBashAliases(aliases: string[]): string { //>
        return aliases.map(alias => `alias ${alias}='pae ${alias}'`).join('\n')
    } //<

    /**
     * Gets the Bash refresh function template
     * Function to reload aliases from the workspace
     * @returns Bash refresh function as string
     */
    private getBashRefreshFunction(): string { //>
        return this.trimTemplate(`
            # Refresh function to reload aliases
            pae-refresh() {
                if [ "$ENABLE_TEST_CONSOLE" != "false" ]; then
                    echo "Refreshing [BASH] PAE aliases..."
                fi
                
                # Find workspace root by looking for nx.json
                WORKSPACE_ROOT="$PWD"
                while [ -n "$WORKSPACE_ROOT" ] && [ ! -f "$WORKSPACE_ROOT/nx.json" ]; do
                    WORKSPACE_ROOT="$(dirname "$WORKSPACE_ROOT")"
                done
                
                if [ -z "$WORKSPACE_ROOT" ]; then
                    echo "Error: Could not find workspace root (nx.json not found)" >&2
                    return 1
                fi
                
                source "$WORKSPACE_ROOT/libs/project-alias-expander/dist/pae-aliases.sh"
                if [ "$ENABLE_TEST_CONSOLE" != "false" ]; then
                    echo "[BASH] PAE aliases refreshed!"
                fi
            }
        `)
    } //<
    
    //--------------------------------------------------------------------------------------------<<
    
    /**
     * Installs PAE aliases to the user's shell profile
     * Adds the PAE inProfile block to the appropriate profile file
     */
    async refreshAliasesDirect(): Promise<void> { //>
        // Direct refresh without installation - just regenerate local files
        console.log('🔄 Refreshing PAE aliases...')
        
        try {
            this.generateLocalFiles()
            console.log('✅ PAE aliases refreshed successfully')
        } catch (error) {
            console.error('❌ Failed to refresh PAE aliases:', error)
            throw error
        }
    } //<

    async installAliases(): Promise<void> { //>
        // Prevent multiple installations during the same process
        if (process.env.PAE_INSTALLING === '1') {
            return
        }
        process.env.PAE_INSTALLING = '1'
        
        const isVerbose = process.argv.includes('--verbose') || process.argv.includes('-v')
        const shell = detectShellTypeCached()
        
        // Install PowerShell module to modules directory
        try {
            const distDir = path.join(process.cwd(), 'libs', 'project-alias-expander', 'dist')
            const psModuleDir = path.join(process.env.USERPROFILE || process.env.HOME || '', 'Documents', 'PowerShell', 'Modules', 'PAE')

            if (!fs.existsSync(psModuleDir)) {
                fs.mkdirSync(psModuleDir, { recursive: true })
            }
            
            // Copy the module file to the PowerShell modules directory
            fs.copyFileSync(
                path.join(distDir, 'pae-functions.psm1'),
                path.join(psModuleDir, 'PAE.psm1')
            )
            
            if (isVerbose) {
                console.log(`\x1b[32m✅ PowerShell module installed to: ${psModuleDir}\x1b[0m`)
            }
        } catch (error) {
            if (isVerbose) {
                console.log(`\x1b[33m⚠️  Failed to install PowerShell module: ${error}\x1b[0m`)
            }
        }
        
        if (isVerbose) {
            console.log('\n\x1b[32m✅ PAE alias files generated successfully!\x1b[0m')
            console.log('\x1b[36m📁 PowerShell Module:\x1b[0m libs/project-alias-expander/dist/pae-functions.psm1')
            console.log('\x1b[36m📁 Bash Script:\x1b[0m libs/project-alias-expander/dist/pae-aliases.sh')
            console.log('\n\x1b[33m📋 Next Steps:\x1b[0m')
            
            if (shell === 'powershell') {
                console.log('\n\x1b[36m   PowerShell:\x1b[0m')
                console.log('   Import-Module libs/project-alias-expander/dist/pae-functions.psm1 -Force')
                console.log('   # Or use: pae-refresh')
            } else if (shell === 'gitbash') {
                console.log('\n\x1b[36m   Git Bash:\x1b[0m')
                console.log('   source libs/project-alias-expander/dist/pae-aliases.sh')
                console.log('   # Or use: pae-refresh')
            } else {
                console.log('\n\x1b[36m   PowerShell:\x1b[0m Import-Module libs/project-alias-expander/dist/pae-functions.psm1 -Force')
                console.log('\n\x1b[36m   Git Bash:\x1b[0m source libs/project-alias-expander/dist/pae-aliases.sh')
            }
            
            console.log('\n\x1b[33m🔄 Auto-refresh:\x1b[0m')
            console.log('   pae install-aliases --auto-refresh')
            console.log('\n\x1b[33m🔄 Manual refresh:\x1b[0m')
            console.log('   pae refresh')
        }
    } //<

}

// Export a singleton instance for convenience
export const aliasManager = new AliasManagerService()