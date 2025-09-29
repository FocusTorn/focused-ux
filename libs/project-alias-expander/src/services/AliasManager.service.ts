import * as path from 'path'
import * as fs from 'fs'
import { execa } from 'execa'
import ora from 'ora'
import type { AliasConfig, IAliasManagerService } from '../_types/index.js'
import { loadAliasConfig } from '../config.js'
import { detectShell } from '../shell.js'

export class AliasManagerService implements IAliasManagerService {

    generateLocalFiles(): void {
        const config = loadAliasConfig()
        const aliases = Object.keys(config['nxPackages'])
        const isVerbose = process.argv.includes('--verbose') || process.argv.includes('-v')
        const shell = detectShell()

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
    pae ${alias} @Arguments
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
        
        // Silent during build - if files aren't generated, build will fail
    }

    async installAliases(): Promise<void> {
        // Prevent multiple installations during the same process
        if (process.env.PAE_INSTALLING === '1') {
            return
        }
        process.env.PAE_INSTALLING = '1'
        
        let config: any
        let aliases: string[] = []
        
        try {
            config = loadAliasConfig()
            aliases = Object.keys(config['nxPackages'])
        } catch (error) {
            console.error('Warning: Could not load config file. Install-aliases will create empty aliases.')
            console.error('Make sure you are running from the project root directory.')
            aliases = []
        }
        
        const isVerbose = process.argv.includes('--verbose') || process.argv.includes('-v')
        const autoRefresh = process.argv.includes('--auto-refresh')
        const shell = detectShell()
    	
        if (isVerbose) {
            console.log(`Detected shell: ${shell}`)
            console.log(`Found ${aliases.length} aliases: ${aliases.join(', ')}`)
            if (autoRefresh) {
                console.log('Auto-refresh enabled')
            }
        }
    	
        // Generate PowerShell module content - Simple approach
        const moduleContent = `# PAE Global Aliases - Auto-generated PowerShell Module
# Generated from config.json - DO NOT EDIT MANUALLY
# Simple approach: each alias just calls 'pae <alias> <args>'

${aliases.map(alias =>
    `function Invoke-${alias} { 
    [CmdletBinding()] 
    param([Parameter(Position = 0, ValueFromRemainingArguments = $true)][string[]]$Arguments) 
    pae ${alias} @Arguments
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
        
        // Install PowerShell module to modules directory
        try {
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
                console.log('\x1b[36m   PowerShell:\x1b[0m')
                console.log('   Import-Module libs/project-alias-expander/dist/pae-functions.psm1 -Force')
                console.log('   # Or use: pae-refresh')
            } else if (shell === 'gitbash') {
                console.log('\x1b[36m   Git Bash:\x1b[0m')
                console.log('   source libs/project-alias-expander/dist/pae-aliases.sh')
                console.log('   # Or use: pae-refresh')
            } else {
                console.log('\x1b[36m   PowerShell:\x1b[0m Import-Module libs/project-alias-expander/dist/pae-functions.psm1 -Force')
                console.log('\x1b[36m   Git Bash:\x1b[0m source libs/project-alias-expander/dist/pae-aliases.sh')
            }
            
            console.log('\n\x1b[33m🔄 Auto-refresh:\x1b[0m')
            console.log('   pae install-aliases --auto-refresh')
            console.log('\n\x1b[33m🔄 Manual refresh:\x1b[0m')
            console.log('   pae refresh')
        }
        
        // Always auto-refresh (load module into current session)
        const spinner = ora('Installing PowerShell module...').start()
        
        try {
            if (shell === 'powershell') {
                // Try to auto-refresh PowerShell module
                try {
                    // Use dot-sourcing to execute in the current session
                    const psCommand = '. { Import-Module PAE -Force }'
                    
                    await execa('powershell', ['-Command', psCommand], {
                        cwd: process.cwd(),
                        timeout: 5000,
                        shell: true
                    })
                    
                    spinner.succeed('Successfully installed: PAE Shorthand Aliases (module)')
                } catch (error) {
                    spinner.fail('Auto-load failed. Manual load required.')
                    console.log('\x1b[36m   Run: pae-refresh\x1b[0m')
                    console.log('\x1b[90m   Or: Import-Module PAE -Force\x1b[0m')
                    if (isVerbose) {
                        console.log(`Error: ${error}`)
                    }
                }
            } else if (shell === 'gitbash') {
                // For Git Bash, source the aliases and then run pae-refresh
                try {
                    const aliasFile = path.resolve('libs/project-alias-expander/dist/pae-aliases.sh').replace(/\\/g, '/')

                    await execa('bash', ['-c', `source '${aliasFile}' && pae-refresh`], {
                        cwd: process.cwd(),
                        timeout: 5000,
                        shell: true
                    })
                    
                    spinner.succeed('Successfully installed: PAE Shorthand Aliases (module)')
                } catch (_error) {
                    spinner.fail('Auto-load failed. Manual load required.')
                    console.log('\x1b[36m   Run: pae-refresh\x1b[0m')
                    console.log('\x1b[90m   Or: source libs/project-alias-expander/dist/pae-aliases.sh\x1b[0m')
                }
            } else {
                spinner.fail('Unknown shell - manual load required.')
            }
        } catch (error) {
            spinner.fail('Auto-load failed. Manual load required.')
            if (isVerbose) {
                console.log(`Error: ${error}`)
            }
        }
    }

    refreshAliases(): void {
        const shell = detectShell()
        const isVerbose = process.argv.includes('--verbose') || process.argv.includes('-v')
        
        if (isVerbose) {
            console.log(`Detected shell: ${shell}`)
        }
        
        // Regenerate the alias files
        this.installAliases()
        
        // Now try to reload them in the current session
        if (shell === 'powershell') {
            console.log('\n\x1b[33m⚠️  PowerShell refresh requires manual reload:\x1b[0m')
            console.log('\x1b[36m   Import-Module libs/project-alias-expander/dist/pae-functions.psm1 -Force\x1b[0m\n')
        } else if (shell === 'gitbash') {
            console.log('\n\x1b[33m⚠️  Git Bash refresh requires manual reload:\x1b[0m')
            console.log('\x1b[36m   source libs/project-alias-expander/dist/pae-aliases.sh\x1b[0m\n')
        } else {
            console.log('\n\x1b[33m⚠️  Unknown shell. Manual reload required:\x1b[0m')
            console.log('\x1b[90m   PowerShell: Import-Module libs/project-alias-expander/dist/pae-functions.psm1 -Force\x1b[0m')
            console.log('\x1b[90m   Git Bash: source libs/project-alias-expander/dist/pae-aliases.sh\x1b[0m\n')
        }
    }

    async refreshAliasesDirect(): Promise<void> {
        const shell = detectShell()
        
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
                console.log('\x1b[33m⚠️  Unknown shell. Manual refresh required.\x1b[0m')
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