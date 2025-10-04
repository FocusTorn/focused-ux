#!/usr/bin/env node

import { commandExecution, expandableProcessor, aliasManager } from './services/index.js'
import { ConfigLoader, clearAllCaches, resolveProjectForAlias as resolveProjectForAliasFromConfig } from './services/ConfigLoader.service.js'
import { detectShell } from './shell.js'
import type { AliasConfig } from './_types/index.js'
import type { ChildProcess } from 'child_process'
import { execa } from 'execa'
import * as fs from 'fs'
import { CommandRouter } from './commands/CommandRouter.js'
import { HelpCommand } from './commands/HelpCommand.js'

// Debug mode - activated by -d or --debug flags
let DEBUG = false

// Process cleanup tracking
let isExiting = false
let activeProcesses: Set<ChildProcess> = new Set()

function debug(message: string, ...args: unknown[]) { //>
    if (DEBUG) {
        console.error(`[PAE DEBUG] ${message}`, ...args)
    }
} //<

function error(message: string, ...args: unknown[]) { //>
    console.error(`[PAE ERROR] ${message}`, ...args)
} //<

// Helper function to get context-aware flags based on target
function getContextAwareFlags(config: AliasConfig, target: string, expandedTarget: string): Record<string, import('./_types/expandable.types.js').ExpandableValue> { //>
    const expandableFlags = { ...config['expandable-flags'] }
    
    // Merge expandable-templates into expandable-flags for processing
    if (config['expandable-templates']) {
        Object.assign(expandableFlags, config['expandable-templates'])
    }
    
    // Apply context-aware flag overrides if they exist
    if (config['context-aware-flags']) {
        const contextAwareFlags = config['context-aware-flags']
        
        Object.keys(contextAwareFlags).forEach(flagKey => {
            const flagDef = contextAwareFlags[flagKey]
            
            // Check for exact target match first
            if (flagDef[target]) {
                expandableFlags[flagKey] = flagDef[target]
            }
            // Check for expanded target match
            else if (flagDef[expandedTarget]) {
                expandableFlags[flagKey] = flagDef[expandedTarget]
            }
            // Use default if available
            else if (flagDef.default) {
                expandableFlags[flagKey] = flagDef.default
            }
            
            debug(`Context-aware flag ${flagKey} for target ${target}/${expandedTarget}:`, {
                original: config['expandable-flags']?.[flagKey],
                contextAware: expandableFlags[flagKey]
            })
        })
    }
    
    return expandableFlags
} //<

// Process cleanup handlers
function setupProcessCleanup() { //>
    // Only set up cleanup handlers in production, not during testing
    if (process.env.NODE_ENV === 'test' || process.env.VITEST === 'true') {
        return
    }

    // Handle graceful shutdown signals
    process.on('SIGTERM', () => {
        debug('Received SIGTERM, initiating graceful shutdown')
        gracefulShutdown(0)
    })

    process.on('SIGINT', () => {
        debug('Received SIGINT (Ctrl+C), initiating graceful shutdown')
        gracefulShutdown(0)
    })

    // Handle uncaught exceptions
    process.on('uncaughtException', (err) => {
        error('Uncaught Exception:', err)
        gracefulShutdown(1)
    })

    // Handle unhandled promise rejections
    process.on('unhandledRejection', (reason, promise) => {
        error('Unhandled Rejection at:', promise, 'reason:', reason)
        gracefulShutdown(1)
    })
} //<

function gracefulShutdown(exitCode: number) { //>
    if (isExiting) {
        debug('Already shutting down, forcing exit')
        process.exit(exitCode)
    }
    
    isExiting = true
    debug('Initiating graceful shutdown, cleaning up resources')
    
    // Kill any active child processes
    for (const childProcess of activeProcesses) {
        try {
            if (childProcess && !childProcess.killed) {
                childProcess.kill('SIGTERM')
            }
        } catch (err) {
            debug('Error killing child process:', err)
        }
    }
    
    // Clear the set
    activeProcesses.clear()
    
    debug('Cleanup complete, exiting with code:', exitCode)
    process.exit(exitCode)
} //<

// Track child processes for cleanup
function trackChildProcess(childProcess: ChildProcess) { //>
    activeProcesses.add(childProcess)
    
    childProcess.on('exit', () => {
        activeProcesses.delete(childProcess)
    })
    
    childProcess.on('error', () => {
        activeProcesses.delete(childProcess)
    })
} //<

// function info(message: string, ...args: any[]) {
//     console.log(`[PAE INFO] ${message}`, ...args)
// }

async function loadPAEModule() { //>
    try {
        console.log('🔄 Setting up PAE module auto-load...')
        
        // Add to PowerShell profile - get the actual profile path from PowerShell
        let profilePath: string

        try {
            const { stdout } = await execa('pwsh', ['-Command', '$PROFILE.CurrentUserAllHosts'], { stdio: 'pipe' })

            profilePath = stdout.trim()
        } catch (_error) {
            // Fallback to default path
            profilePath = `${process.env.USERPROFILE}\\Documents\\PowerShell\\profile.ps1`
        }

        const loadCommand = `
# PAE Module Auto-Load
Import-Module -Name "PAE" -Force

# PAE Refresh Function
`
        
        // Ensure profile exists
        if (!fs.existsSync(profilePath)) {
            fs.writeFileSync(profilePath, '# PowerShell Profile\n')
        }
        
        // Check if already added
        const profileContent = fs.readFileSync(profilePath, 'utf8')
        
        if (!profileContent.includes('Import-Module -Name "PAE"')) {
            fs.appendFileSync(profilePath, loadCommand)
            console.log('✅ PAE module added to PowerShell profile')
        } else {
            console.log('✅ PAE module already in PowerShell profile')
        }
        
        // Try to load immediately
        try {
            await execa('powershell', ['-Command', '. $PROFILE'], { stdio: 'pipe' })
            console.log('✅ PowerShell profile reloaded - PAE module should now be available')
        } catch (_profileError) {
            console.log('⚠️  Could not reload profile automatically')
            console.log('   Please run: . $PROFILE')
            console.log('   Or restart your PowerShell session')
        }
    } catch (error) {
        console.log('⚠️  Could not set up PAE module auto-load')
        console.log('   Please run: Import-Module -Name "PAE" -Force')
        
        if (DEBUG) {
            console.error('Load error details:', error)
        }
    }
} //<

async function _addInProfileBlock(_isLocal: boolean) { //>
    // Get the actual profile path from PowerShell
    let profilePath: string

    try {
        const { stdout } = await execa('pwsh', ['-Command', 'Write-Output $PROFILE.CurrentUserAllHosts'], { stdio: 'pipe' })

        profilePath = stdout.trim()
        if (DEBUG) {
            console.log(`Profile path: ${profilePath}`)
        }
    } catch (_error) {
        // Fallback to default path
        profilePath = `${process.env.USERPROFILE}\\Documents\\PowerShell\\profile.ps1`
        if (DEBUG) {
            console.log(`Using fallback profile path: ${profilePath}`)
        }
    }
    
    const inProfileBlock = `
# PAE inProfile Block - Auto-generated
# DO NOT EDIT MANUALLY - Use 'pae-remove' to uninstall

# PAE Module Auto-Load
Import-Module -Name "PAE" -Force

# PAE Functions
function Invoke-PaeRefresh {
    # Find workspace root by looking for nx.json
    $workspaceRoot = $PWD
    while ($workspaceRoot -and -not (Test-Path (Join-Path $workspaceRoot "nx.json"))) {
        $workspaceRoot = Split-Path $workspaceRoot -Parent
    }
    
    if (-not $workspaceRoot) {
        Write-Error "Could not find workspace root (nx.json not found)"
        return 1
    }
    
    # Generate the alias scripts directly into the native modules directories for the respective shells
    & pae install
    
    # Force load the module into the shell
    Import-Module -Name "PAE" -Force
}

function Invoke-PaeRefresh-Local {
    # Find workspace root by looking for nx.json
    $workspaceRoot = $PWD
    while ($workspaceRoot -and -not (Test-Path (Join-Path $workspaceRoot "nx.json"))) {
        $workspaceRoot = Split-Path $workspaceRoot -Parent
    }
    
    if (-not $workspaceRoot) {
        Write-Error "Could not find workspace root (nx.json not found)"
        return 1
    }
    
    # Generate the alias scripts into the local dist
    & pae install --local
    
    # Force load the module into the shell
    Import-Module -Name "PAE" -Force
}

function pae-refresh {
    # Check install type and call appropriate refresh function
    if ($env:PAE_INSTALL_TYPE -eq "local") {
        Invoke-PaeRefresh-Local
    } else {
        Invoke-PaeRefresh
    }
}

function pae-remove {
    
    # Remove from current session
    Remove-Module -Name "PAE" -Force -ErrorAction SilentlyContinue
    
    # Find and delete module files
    $module = Get-Module -ListAvailable -Name "PAE"
    if ($module) {
        Write-Host "Deleting module from: $($module.ModuleBase)" -ForegroundColor Yellow
        Remove-Item -Path $module.ModuleBase -Recurse -Force
        
        # Verify deletion
        Write-Host "Verifying deletion..." -ForegroundColor Gray
        Start-Sleep -Milliseconds 500
        $verifyModule = Get-Module -ListAvailable -Name "PAE"
        if (-not $verifyModule) {
            Write-Host "\`e[32m✔\`e[0m Module files deleted" -ForegroundColor Green
        } else {
            Write-Host "\`e[31m✗\`e[0m Module files still exist" -ForegroundColor Red
        }
    }
    
    # Remove from current session
    Write-Host "Removing PAE from current shell" -ForegroundColor Yellow
    Remove-Module -Name "PAE" -Force -ErrorAction SilentlyContinue
    
    # Verify removal from session
    Write-Host "Verifying removal..." -ForegroundColor Gray
    Start-Sleep -Milliseconds 500
    $verifyLoaded = Get-Module -Name "PAE"
    if (-not $verifyLoaded) {
        Write-Host "\`e[32m✔\`e[0m PAE removed from current shell" -ForegroundColor Green
    } else {
        Write-Host "\`e[31m✗\`e[0m PAE still loaded in current shell" -ForegroundColor Red
    }
    
    # Remove environment variables
    Write-Host "Removing PAE environment variables" -ForegroundColor Yellow
    $envVars = Get-ChildItem Env: | Where-Object { $_.Name -like "PAE_*" }
    if ($envVars) {
        Remove-Item Env:PAE_* -ErrorAction SilentlyContinue
    }
    
    # Verify environment variable removal
    Write-Host "Verifying removal..." -ForegroundColor Gray
    Start-Sleep -Milliseconds 500
    $verifyEnvVars = Get-ChildItem Env: | Where-Object { $_.Name -like "PAE_*" }
    if (-not $verifyEnvVars) {
        Write-Host "\`e[32m✔\`e[0m PAE environment variables removed" -ForegroundColor Green
    } else {
        Write-Host "\`e[31m✗\`e[0m PAE environment variables still exist" -ForegroundColor Red
    }
    
    # Remove this inProfile block
    if (Test-Path $PROFILE.CurrentUserAllHosts) {
        $profileContent = Get-Content $PROFILE.CurrentUserAllHosts
        $filteredContent = $profileContent | Where-Object { 
            $_ -notmatch "PAE inProfile Block" -and 
            $_ -notmatch "Import-Module -Name PAE" -and
            $_ -notmatch "function pae-refresh" -and
            $_ -notmatch "function pae-remove" -and
            $_ -notmatch "function Invoke-PaeRefresh" -and
            $_ -notmatch "DO NOT EDIT MANUALLY" -and
            $_ -notmatch "End PAE inProfile Block"
        }
        $filteredContent | Set-Content $PROFILE.CurrentUserAllHosts
    }
    
    # Remove any remaining PAE aliases from current session
    Get-Alias | Where-Object { $_.Name -like "pae*" -or $_.Name -like "*pae*" } | ForEach-Object {
        Remove-Item Alias:$($_.Name) -Force -ErrorAction SilentlyContinue
    }
    
    # Remove any remaining PAE functions from current session
    Get-ChildItem Function: | Where-Object { $_.Name -like "pae*" -or $_.Name -like "*pae*" } | ForEach-Object {
        Remove-Item Function:$($_.Name) -Force -ErrorAction SilentlyContinue
    }
    
    Write-Host "\`e[32m✔\`e[0m PAE removed" -ForegroundColor Green
}

# End PAE inProfile Block
`
    
    // Ensure profile exists
    if (!fs.existsSync(profilePath)) {
        fs.writeFileSync(profilePath, '# PowerShell Profile\n')
    }
    
    // Check if inProfile block already exists and remove it if found
    const profileContent = fs.readFileSync(profilePath, 'utf8')

    if (DEBUG) {
        console.log(`Profile content length: ${profileContent.length}`)
        console.log(`Contains PAE block: ${profileContent.includes('PAE inProfile Block')}`)
    }

    if (profileContent.includes('PAE inProfile Block')) {
        if (DEBUG) {
            console.log('Removing existing PAE inProfile block...')
        }

        const lines = profileContent.split('\n')
        const filteredLines = lines.filter(line =>
            !line.includes('PAE inProfile Block')
            && !line.includes('Import-Module -Name PAE')
            && !line.includes('function pae-refresh')
            && !line.includes('function pae-remove')
            && !line.includes('function Invoke-PaeRefresh')
            && !line.includes('DO NOT EDIT MANUALLY')
            && !line.includes('End PAE inProfile Block'))

        fs.writeFileSync(profilePath, filteredLines.join('\n'))
        if (DEBUG) {
            console.log('Existing PAE inProfile block removed')
        }
    }

    if (DEBUG) {
        console.log('Adding PAE inProfile block...')
    }
    fs.appendFileSync(profilePath, inProfileBlock)
    if (DEBUG) {
        console.log('PAE inProfile block added successfully')
    }
} //<

async function main(): Promise<number> {
    try {
        // Set up process cleanup handlers
        setupProcessCleanup()
        
        // Set up child process tracking in CommandExecution service
        const { setChildProcessTracker } = await import('./services/CommandExecution.service.js')

        setChildProcessTracker(trackChildProcess)
        
        // Set up ProcessPool shutdown on exit
        const { commandExecution } = await import('./services/CommandExecution.service.js')
        
        process.on('exit', async () => {
            try {
                await commandExecution.shutdownProcessPool()
            } catch (_error) {
                debug('Error shutting down ProcessPool:', error)
            }
        })
        
        debug('Main function called')
        debug('Starting PAE CLI execution')
        debug('Starting PAE CLI', { argv: process.argv, cwd: process.cwd() })
        
        const args = process.argv.slice(2)

        debug('Arguments parsed:', args)
        
        // Capture global-in command for echo variants
        if (process.env.PAE_ECHO === '1' || process.env.PAE_ECHO_X === '1') {
            process.env.PAE_GLOBAL_IN = `pae ${args.join(' ')}`
        }
        
        // Check for help flags, do not exit process (return 0 for tests/stability)
        const helpFlags = ['--help', '-h']

        if (args.some(arg => helpFlags.includes(arg))) {
            const helpCommand = new HelpCommand()

            helpCommand.execute()
            return 0
        }

        const filteredArgs = args
        
        // Check for debug flags but don't remove them - let them be processed by internal flags
        const debugFlags = ['-db', '--debug', '--pae-debug']

        for (const arg of filteredArgs) {
            if (debugFlags.includes(arg)) {
                DEBUG = true
                break
            }
        }
        
        // Check for cache clearing flag
        const cacheFlags = ['--clear-cache', '--clear-caches']

        for (const arg of filteredArgs) {
            if (cacheFlags.includes(arg)) {
                const { clearAllCaches } = await import('./services/ConfigLoader.service.js')

                clearAllCaches()
                debug('All caches cleared')
                break
            }
        }
        
        // Also check environment variable
        if (process.env.PAE_DEBUG === '1') {
            DEBUG = true
        }
        
        debug('Parsed arguments', filteredArgs)
        
        if (filteredArgs.length === 0) {
            debug('No arguments provided, exiting')
            return 1
        }

        const command = filteredArgs[0]

        debug('Processing command:', command)
        debug('Processing command', command)

        // Handle special commands
        debug('Checking for special commands...')
        switch (command) {
            case 'load':
                debug('Executing load command')
                await loadPAEModule()
                debug('load completed, returning 0')
                return 0
        }

        // Load configuration once
        debug('Loading configuration...')
        debug('Loading configuration')

        let config: AliasConfig

        try {
            debug('Calling ConfigLoader.getInstance().loadConfig()...')
            config = await ConfigLoader.getInstance().loadConfig()
            debug('Configuration loaded successfully')
            debug('Configuration loaded successfully', {
                packages: Object.keys(config['nxPackages'] || {}),
                targets: Object.keys(config['nxTargets'] || {}),
                features: Object.keys(config['feature-nxTargets'] || {}),
                internalFlags: Object.keys(config['internal-flags'] || {}),
                expandableFlags: Object.keys(config['expandable-flags'] || {})
            })
        } catch (configError) {
            debug('Configuration loading failed:', configError)
            error('Failed to load configuration:', configError)
            console.error('')
            console.error('Make sure you are running from the project root directory.')
            console.error('The .pae.json file should be located at: .pae.json')
            console.error('')
            console.error('Current working directory:', process.cwd())
            console.error('')
            console.error('To debug this issue, run: pae <command> -d')
            debug('Returning error code 1 due to config failure')
            return 1
        }

        // Create command router
        const commandRouter = new CommandRouter(debug, error, getContextAwareFlags)

        // Check for expandable commands
        debug('Checking for expandable commands...')
        try {
            if (config['expandable-commands'] && config['expandable-commands'][command]) {
                const fullCommand = config['expandable-commands'][command]

                debug('Found expandable command:', command, '->', fullCommand)
                
                console.log(`[Executing] ${command}: ${fullCommand}`)
                
                // Parse the full command and execute it
                const commandArgs = fullCommand.split(' ').filter(arg => arg.length > 0)
                
                // If the command starts with 'pae', remove it since we're already in the pae CLI
                if (commandArgs[0] === 'pae') {
                    commandArgs.shift()
                }
                
                const newArgs = [...commandArgs, ...filteredArgs.slice(1)]
                
                debug('Executing expandable command with args:', newArgs)
                
                // Set up new process.argv for the command execution
                const originalArgv = process.argv

                process.argv = ['node', 'cli.js', ...newArgs]
                
                try {
                    const result: number = await main()

                    return result
                } finally {
                    // Restore original argv
                    process.argv = originalArgv
                }
            }
        } catch (_error) {
            debug('Error checking expandable commands:', error)
        }
        
        // Route command through CommandRouter
        debug('Configuration loaded, routing command...')
        debug('Routing command', { command: filteredArgs[0], remainingArgs: filteredArgs.slice(1) })

        const result = await commandRouter.routeCommand(command, filteredArgs.slice(1), config)

        debug('Command routed, result:', result)
        return result
    } catch (err) {
        debug('Unexpected error caught in main:', err)
        error('Unexpected CLI error:', err)
        console.error('')
        console.error('This is an unexpected error. Please report this issue.')
        console.error('To debug this issue, run: pae <command> -d')
        debug('Returning error code 1 due to unexpected error')
        return 1
    }
}

function resolveProjectForAlias(aliasValue: string | { name: string, suffix?: 'core' | 'ext', full?: boolean }): { project: string, full?: boolean } {
    const result = resolveProjectForAliasFromConfig(aliasValue)

    return { project: result.project, full: result.isFull }
}

// Export functions for testing compatibility
export {
    main, debug, error, getContextAwareFlags, setupProcessCleanup,
    gracefulShutdown, trackChildProcess, loadPAEModule, resolveProjectForAlias,
    ConfigLoader, detectShell, commandExecution, expandableProcessor, aliasManager
}

// Service functions are available directly for optimal performance

// Run if this is the main module
debug('Checking if this is the main module...')
debug('import.meta.url:', import.meta.url)
debug('process.argv[1]:', process.argv[1])

// Normalize paths for comparison
const normalizedImportUrl = import.meta.url.replace(/\\/g, '/').toLowerCase()
const normalizedArgvPath = `file:///${process.argv[1].replace(/\\/g, '/').toLowerCase()}`

debug('Normalized import URL:', normalizedImportUrl)
debug('Normalized argv path:', normalizedArgvPath)
debug('Match:', normalizedImportUrl === normalizedArgvPath)

// Also check if this is being run directly (not imported)
const isMainModule = normalizedImportUrl === normalizedArgvPath
                     || process.argv[1] === process.argv[0]
                     || process.argv[1].endsWith('cli.js')
                     || process.argv[1].endsWith('cli')

debug('Is main module:', isMainModule)

// Don't auto-execute main() during tests - let tests call it explicitly
if (isMainModule && process.env.NODE_ENV !== 'test' && process.env.VITEST !== 'true') {
    debug('This is the main module, calling main()...')

    main().then((exitCode: number) => {
        debug('Main function returned:', exitCode)
        debug('Exiting with code:', exitCode)
        process.exit(exitCode)
    }).catch((error: any) => {
        debug('Main function error:', error)
        console.error('Error:', error)
        process.exit(1)
    })
} else {
    debug('This is not the main module, not calling main()')
}
