import * as path from 'path'
import * as fs from 'fs'
import { execa } from 'execa'
import ora from 'ora'
import type { AliasConfig, IAliasManagerService } from '../_types/index.js'
import { loadAliasConfigCached } from '../config.js'
import { detectShellTypeCached } from '../shell.js'

export class AliasManagerService implements IAliasManagerService {

    async processAliases(): Promise<void> {
        // Main orchestrator function for alias processing
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

    generateLocalFiles(): void {
        const config = loadAliasConfigCached()
        const aliases = Object.keys(config['nxPackages'])
        const isVerbose = process.argv.includes('--verbose') || process.argv.includes('-v')
        const shell = detectShellTypeCached()

        if (isVerbose) {
            console.log(`Detected shell: ${shell}`)
            console.log(`Found ${aliases.length} aliases: ${aliases.join(', ')}`)
            console.log('Generating local files only (build process)')
        }

        // Generate PowerShell module content - Simple approach
        const moduleContent = `# PAE Global Aliases - Auto-generated PowerShell Module
# Generated from config.json - DO NOT EDIT MANUALLY
# Simple approach: each alias just calls 'pae <alias> <args>'

${aliases.map(alias =>
    `function Invoke-${alias} { 
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
Set-Alias -Name ${alias} -Value Invoke-${alias}`).join('\n\n')}

# Refresh function to reload aliases
function Invoke-PaeRefresh {
    if ($env:ENABLE_TEST_CONSOLE -ne "false") {
        Write-Host "Refreshing [PWSH] PAE aliases..." -ForegroundColor Yellow
    }
    
    # Find workspace root by looking for nx.json
    $workspaceRoot = $PWD
    while ($workspaceRoot -and -not (Test-Path (Join-Path $workspaceRoot "nx.json"))) {
        $workspaceRoot = Split-Path $workspaceRoot -Parent
    }
    
    if (-not $workspaceRoot) {
        Write-Error "Could not find workspace root (nx.json not found)"
        return 1
    }
    
    $modulePath = Join-Path $workspaceRoot "libs\\project-alias-expander\\dist\\pae-functions.psm1"
    Import-Module $modulePath -Force
    if ($env:ENABLE_TEST_CONSOLE -ne "false") {
        Write-Host "[PWSH] PAE aliases refreshed!" -ForegroundColor Green
    }
}

# Alias for backward compatibility
Set-Alias -Name pae-refresh -Value Invoke-PaeRefresh

# Export all functions and aliases
Export-ModuleMember -Function ${aliases.map(a => `Invoke-${a}`).join(', ')}, Invoke-PaeRefresh
Export-ModuleMember -Alias ${aliases.join(', ')}, pae-refresh

# Module loaded confirmation
if ($env:ENABLE_TEST_CONSOLE -ne "false") {
    Write-Host "Module loaded: PAE Shorthand Aliases" -ForegroundColor Green
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
        
        if ($env:ENABLE_TEST_CONSOLE -ne "false") {
            Write-Host "PAE module cleanup completed" -ForegroundColor Yellow
        }
    } catch {
        # Silently handle cleanup errors
    }
}

# Set a flag to track module loading
$Global:PAE_ModuleLoaded = $true
`

        // Generate Bash aliases content
        const bashContent = `# PAE Global Aliases - Auto-generated Bash Script
# Generated from config.json - DO NOT EDIT MANUALLY
# Simple approach: each alias just calls 'pae <alias> <args>'

${aliases.map(alias => `alias ${alias}='pae ${alias}'`).join('\n')}

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
`

        // Write files
        const distDir = path.join(process.cwd(), 'libs', 'project-alias-expander', 'dist')

        if (!fs.existsSync(distDir)) {
            fs.mkdirSync(distDir, { recursive: true })
        }

        fs.writeFileSync(path.join(distDir, 'pae-functions.psm1'), moduleContent)
        fs.writeFileSync(path.join(distDir, 'pae-aliases.sh'), bashContent)
    }

    async installAliases(): Promise<void> {
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
            const psModuleDir = path.join(process.env.USERPROFILE || process.env.HOME || '', 'Documents', 'WindowsPowerShell', 'Modules', 'PAE')

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
        
        // Try to execute PowerShell command in the current session
        // The issue is that execa creates a child process, not executing in current session
        // For now, provide clear instructions for manual loading
        console.log('\n🔄 To load aliases in current PowerShell session:')
        console.log('   pae-refresh')
        console.log('   # Or: Import-Module PAE -Force')
        console.log('')
        console.log('💡 Note: Aliases are installed but need to be loaded in your current session.')
    }

    async autoRefreshAliases(): Promise<void> {
        const shell = detectShellTypeCached()
        
        // Auto-refresh (load module into current session)
        if (shell === 'powershell') {
            // For PowerShell, we need to load the module into the current session
            // Since we can't directly modify the parent session from Node.js,
            // we'll provide clear instructions and try to make it as easy as possible
            try {
                // Try to execute the import command in the current PowerShell session
                // This might work if we're running from within PowerShell
                const psCommand = 'Import-Module PAE -Force'
                
                console.log('\n🔄 Loading aliases into current PowerShell session...')
                
                // Use execa to run the command in the current shell context
                await execa('powershell', ['-Command', psCommand], {
                    cwd: process.cwd(),
                    timeout: 5000,
                    shell: true,
                    stdio: 'inherit' // This will show the output in the current terminal
                })
                
                console.log('✅ PAE aliases loaded successfully!')
            } catch (error) {
                console.log('\n⚠️  Could not auto-load aliases into current session.')
                console.log('📋 To load aliases manually, run:')
                console.log('   Import-Module PAE -Force')
                console.log('   # Or use: pae-refresh')
                
                const isVerbose = process.argv.includes('--verbose') || process.argv.includes('-v')

                if (isVerbose) {
                    console.log(`\nDebug info: ${error}`)
                }
                
                // Don't throw error - this is expected behavior in some environments
                console.log('\n💡 Tip: Add "Import-Module PAE" to your PowerShell profile for automatic loading.')
            }
        } else if (shell === 'gitbash') {
            // For Git Bash, source the aliases and then run pae-refresh
            try {
                const aliasFile = path.resolve('libs/project-alias-expander/dist/pae-aliases.sh').replace(/\\/g, '/')

                console.log('\n🔄 Loading aliases into current Git Bash session...')
                
                await execa('bash', ['-c', `source '${aliasFile}' && pae-refresh`], {
                    cwd: process.cwd(),
                    timeout: 5000,
                    shell: true,
                    stdio: 'inherit'
                })
                
                console.log('✅ PAE aliases loaded successfully!')
            } catch (_error) {
                console.log('\n⚠️  Could not auto-load aliases into current session.')
                console.log('📋 To load aliases manually, run:')
                console.log('   source libs/project-alias-expander/dist/pae-aliases.sh')
                console.log('   # Or use: pae-refresh')
            }
        } else {
            console.log('\n⚠️  Unknown shell. Manual loading required.')
            console.log('📋 To load aliases manually:')
            console.log('   PowerShell: Import-Module PAE -Force')
            console.log('   Git Bash: source libs/project-alias-expander/dist/pae-aliases.sh')
        }
    }

    async refreshAliasesDirect(): Promise<void> {
        const shell = detectShellTypeCached()
        
        try {
            if (shell === 'powershell') {
                // Execute pae-refresh in PowerShell (load module first)
                const modulePath = path.resolve('libs/project-alias-expander/dist/pae-functions.psm1')

                await execa('powershell', ['-Command', `Import-Module '${modulePath}' -Force; pae-refresh`], {
                    cwd: process.cwd(),
                    timeout: 5000
                })
            } else if (shell === 'gitbash') {
                // Execute pae-refresh in Git Bash
                await execa('pae-refresh', [], {
                    cwd: process.cwd(),
                    timeout: 5000
                })
            } else {
                console.log('\n\x1b[33m⚠️  Unknown shell. Manual refresh required.\x1b[0m')
            }
        } catch (_error) {
            console.log('\x1b[31m❌ Refresh failed. Manual refresh required.\x1b[0m')
            console.log('\x1b[90m   PowerShell: pae-refresh\x1b[0m')
            console.log('\x1b[90m   Git Bash: pae-refresh\x1b[0m')
        }
    }

}

// Export a singleton instance for convenience
export const aliasManager = new AliasManagerService()