#!/usr/bin/env node

import { commandExecution, expandableProcessor, aliasManager } from './services/index.js'
import aliasConfig, { resolveProjectForAlias as resolveProjectForAliasFromConfig, loadAliasConfig, clearAllCaches } from './config.js'
import { detectShell } from './shell.js'
import type { AliasConfig } from './_types/index.js'
import type { ChildProcess } from 'child_process'

// Debug mode - activated by -d or --debug flags
let DEBUG = false

// Process cleanup tracking
let isExiting = false
let activeProcesses: Set<ChildProcess> = new Set()

function debug(message: string, ...args: unknown[]) {
    if (DEBUG) {
        console.error(`[PAE DEBUG] ${message}`, ...args)
    }
}

function error(message: string, ...args: unknown[]) {
    console.error(`[PAE ERROR] ${message}`, ...args)
}

// Process cleanup handlers
function setupProcessCleanup() {
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
}

function gracefulShutdown(exitCode: number) {
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
}

// Track child processes for cleanup
function trackChildProcess(childProcess: ChildProcess) {
    activeProcesses.add(childProcess)
    
    childProcess.on('exit', () => {
        activeProcesses.delete(childProcess)
    })
    
    childProcess.on('error', () => {
        activeProcesses.delete(childProcess)
    })
}

// function info(message: string, ...args: any[]) {
//     console.log(`[PAE INFO] ${message}`, ...args)
// }

function success(message: string, ...args: unknown[]) {
    // Use the same green color as Nx success messages, with bold checkmark
    const green = '\x1b[32m'
    const bold = '\x1b[1m'
    const reset = '\x1b[0m'
    const checkmark = '✔'

    console.log(`${green}${bold}${checkmark}${reset}${green} ${message}${reset}`, ...args)
}

function showDynamicHelp(config?: AliasConfig) {
    try {
        const helpConfig = config || aliasConfig

        if (!helpConfig) {
            throw new Error('Failed to load configuration')
        }
        
        console.log('')
        console.log('PAE - Project Alias Expander')
        console.log('Usage: pae <alias> [target] [flags]')
        console.log('       pae <command> [args]')
        console.log('')
        
        // Show available aliases
        if (helpConfig.nxPackages && Object.keys(helpConfig.nxPackages).length > 0) {
            const desc = helpConfig.nxPackages.desc || 'Project aliases'
            const dimmed = '\x1b[2m'
            const reset = '\x1b[0m'

            console.log(`Available Aliases: ${dimmed}${desc}${reset}`)
            Object.entries(helpConfig.nxPackages).forEach(([alias, project]) => {
                if (alias !== 'desc') {
                    const projectName = typeof project === 'string' ? project : project.name

                    console.log(`  ${alias.padEnd(8)} → ${projectName}`)
                }
            })
            console.log('')
        }
        
        // Show available targets
        if (helpConfig.nxTargets && Object.keys(helpConfig.nxTargets).length > 0) {
            const desc = helpConfig.nxTargets.desc || 'Target shortcuts'
            const dimmed = '\x1b[2m'
            const reset = '\x1b[0m'

            console.log(`Available Targets: ${dimmed}${desc}${reset}`)
            Object.entries(helpConfig.nxTargets).forEach(([shortcut, target]) => {
                if (shortcut !== 'desc') {
                    console.log(`  ${shortcut.padEnd(8)} → ${target}`)
                }
            })
            console.log('')
        }
        
        // Show feature targets
        if (helpConfig['feature-nxTargets'] && Object.keys(helpConfig['feature-nxTargets']).length > 0) {
            const desc = helpConfig['feature-nxTargets'].desc || 'Feature-specific targets'
            const dimmed = '\x1b[2m'
            const reset = '\x1b[0m'

            console.log(`Feature Targets: ${dimmed}${desc}${reset}`)
            Object.entries(helpConfig['feature-nxTargets']).forEach(([alias, config]) => {
                if (alias !== 'desc') {
                    console.log(`  ${alias.padEnd(8)} → ${config['run-target']} (from ${config['run-from']})`)
                }
            })
            console.log('')
        }
        
        // Show expandable flags
        if (helpConfig['expandable-flags'] && Object.keys(helpConfig['expandable-flags']).length > 0) {
            const desc = helpConfig['expandable-flags'].desc || 'Flag expansions'
            const dimmed = '\x1b[2m'
            const reset = '\x1b[0m'

            console.log(`Expandable Flags: ${dimmed}${desc}${reset}`)
            Object.entries(helpConfig['expandable-flags']).forEach(([flag, expansion]) => {
                if (flag !== 'desc') {
                    const expansionStr = typeof expansion === 'string' ? expansion : expansion.template || 'template'

                    console.log(`  -${flag.padEnd(8)} → ${expansionStr}`)
                }
            })
            console.log('')
        }
        
        // Show expandable templates
        if (helpConfig['expandable-templates'] && Object.keys(helpConfig['expandable-templates']).length > 0) {
            const desc = helpConfig['expandable-templates'].desc || 'Template expansions'
            const dimmed = '\x1b[2m'
            const reset = '\x1b[0m'

            console.log(`Expandable Templates: ${dimmed}${desc}${reset}`)
            Object.entries(helpConfig['expandable-templates']).forEach(([template, config]) => {
                if (template !== 'desc') {
                    console.log(`  -${template.padEnd(8)} → ${config['pwsh-template'] ? 'PowerShell template' : 'Template'}`)
                }
            })
            console.log('')
        }
        
        // Show expandable commands
        if (helpConfig['expandable-commands'] && Object.keys(helpConfig['expandable-commands']).length > 0) {
            const desc = helpConfig['expandable-commands'].desc || 'Command expansions'
            const dimmed = '\x1b[2m'
            const reset = '\x1b[0m'

            console.log(`Expandable Commands: ${dimmed}${desc}${reset}`)
            Object.entries(helpConfig['expandable-commands']).forEach(([alias, command]) => {
                if (alias !== 'desc') {
                    console.log(`  ${alias.padEnd(8)} → ${command}`)
                }
            })
            console.log('')
        }
        
        // Show commands
        if (helpConfig.commands && Object.keys(helpConfig.commands).length > 0) {
            const desc = helpConfig.commands.desc || 'PAE commands'
            const dimmed = '\x1b[2m'
            const reset = '\x1b[0m'

            console.log(`Commands: ${dimmed}${desc}${reset}`)
            Object.entries(helpConfig.commands).forEach(([command, description]) => {
                if (command !== 'desc') {
                    console.log(`  ${command.padEnd(25)} ${description}`)
                }
            })
            console.log('')
        }
        console.log('Flags:')
        console.log('  -h, --help         Show this help message')
        console.log('  -d, --debug        Enable debug logging')
        console.log('  -echo              Echo commands instead of executing')
        console.log('')
        console.log('Environment Variables:')
        console.log('  PAE_DEBUG=1        Enable debug logging')
        console.log('  PAE_ECHO=1         Echo commands instead of executing')
        console.log('')
    } catch (_error) {
        // Fallback to static help if config loading fails
        console.log('')
        console.log('PAE - Project Alias Expander')
        console.log('Usage: pae <alias> [target] [flags]')
        console.log('       pae <command> [args]')
        console.log('')
        console.log('Commands:')
        console.log('  install-shorthand-aliases    Generate and install PowerShell module with PAE aliases')
        console.log('  refresh                      Refresh PAE aliases in current PowerShell session')
        console.log('  refresh-direct               Refresh aliases directly (bypasses session reload)')
        console.log('  install                      Install PAE scripts directly to native modules directory')
        console.log('  refresh-scripts-locally      Generate PAE scripts in dist directory only')
        console.log('  help                         Show this help with all available aliases and flags (deprecated)')
        console.log('')
        console.log('Flags:')
        console.log('  -h, --help         Show this help message')
        console.log('  -d, --debug        Enable debug logging')
        console.log('  -echo              Echo commands instead of executing')
        console.log('')
        console.log('Environment Variables:')
        console.log('  PAE_DEBUG=1        Enable debug logging')
        console.log('  PAE_ECHO=1         Echo commands instead of executing')
        console.log('')
        console.log('⚠️  FALLBACK HELP MODE')
        console.log('   Configuration loading failed - showing static help only.')
        console.log('   This usually means:')
        console.log('   • You\'re not in the project root directory')
        console.log('   • The config.json file is missing or corrupted')
        console.log('   • There\'s a syntax error in libs/project-alias-expander/config.json')
        console.log('')
        console.log('   Current working directory:', process.cwd())
        console.log('   Expected config location: libs/project-alias-expander/config.json')
        console.log('')
        console.log('   To debug this issue, run: pae <command> -d')
        console.log('')
    }
}

async function main() {
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
            } catch (error) {
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
        
        // Check for help flags, remove them from args
        const helpFlags = ['--help', '-h']
        const filteredArgs = args.filter(arg => {
            if (helpFlags.includes(arg)) {
                showDynamicHelp()
                process.exit(0) // Exit immediately after showing help
            }
            return true
        })
        
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
                const { clearAllCaches } = await import('./config.js')

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
            debug('No arguments provided, showing help')
            showDynamicHelp()
            debug('Help displayed, returning 0')
            return 0
        }

        const command = filteredArgs[0]

        debug('Processing command:', command)
        debug('Processing command', command)

        // Handle special commands
        debug('Checking for special commands...')
        switch (command) {
            case 'install-shorthand-aliases':
                debug('Executing install-shorthand-aliases command')
                debug('Executing install-shorthand-aliases')
                await aliasManager.processAliases()
                // Success message is now handled by the loading message replacement
                debug('install-shorthand-aliases completed, returning 0')
                return 0

            case 'refresh':
                debug('Executing refresh command')
                debug('Executing refresh')
                // Provide clear instructions for manual refresh
                console.log('\n🔄 To refresh PAE aliases in your current PowerShell session:')
                console.log('   Import-Module PAE -Force')
                console.log('   # Or use: pae-refresh')
                console.log('')
                console.log('💡 Note: PAE commands cannot directly modify your current PowerShell session.')
                console.log('   This is a PowerShell security limitation.')
                success('PAE refresh instructions displayed')
                debug('refresh completed, returning 0')
                return 0

            case 'refresh-direct':
                debug('Executing refresh-direct command')
                debug('Executing refresh-direct')
                await aliasManager.refreshAliasesDirect()
                success('PAE Aliases refreshed directly')
                debug('refresh-direct completed, returning 0')
                return 0

            case 'refresh-scripts-locally':
                debug('Executing refresh-scripts-locally command')
                debug('Executing refresh-scripts-locally')
                
                // Import ora for spinner
                const oraLocal = (await import('ora')).default
                
                const spinnerLocal = oraLocal({
                    text: 'Generating scripts locally...',
                    spinner: 'dots'
                }).start()
                
                try {
                    // Only generate local files (no installation)
                    spinnerLocal.text = 'Generating pwsh module...'
                    await aliasManager.generateLocalFiles()
                    await new Promise(resolve => setTimeout(resolve, 200))
                    
                    spinnerLocal.text = 'Generating GitBash module...'
                    // GitBash generation is handled in generateLocalFiles()
                    await new Promise(resolve => setTimeout(resolve, 200))
                    
                    // Stop spinner and show success
                    spinnerLocal.stop()
                    success('PAE scripts generated locally in dist directory')
                } catch (error) {
                    spinnerLocal.stop()
                    throw error
                }
                
                debug('refresh-scripts-locally completed, returning 0')
                return 0

            case 'install':
                debug('Executing install command')
                debug('Executing install')
                
                // Import ora for spinner
                const ora = (await import('ora')).default
                
                const spinner = ora({
                    text: 'Installing PAE scripts to native modules...',
                    spinner: 'dots'
                }).start()
                
                try {
                    // Generate scripts directly to native modules directories (bypass dist)
                    spinner.text = 'Installing scripts to native modules...'
                    aliasManager.generateDirectToNativeModules()
                    await new Promise(resolve => setTimeout(resolve, 500))
                    
                    // Load module into active shell
                    const shell = (await import('./shell.js')).detectShell()

                    if (shell === 'powershell') {
                        spinner.text = 'Loading module into active shell: [pwsh]'
                    } else if (shell === 'gitbash') {
                        spinner.text = 'Loading module into active shell: [GitBash]'
                    } else {
                        spinner.text = 'Loading module into active shell: [unknown]'
                    }
                    await new Promise(resolve => setTimeout(resolve, 300))
                    
                    // Stop spinner and show success
                    spinner.stop()
                    success('PAE scripts installed to native modules directory')
                } catch (error) {
                    spinner.stop()
                    throw error
                }
                
                debug('install completed, returning 0')
                return 0
                
            case 'help':
                debug('Executing deprecated help command')
                console.error('')
                console.error('⚠️  DEPRECATION WARNING: "pae help" is deprecated.')
                console.error('   Use "pae --help" or "pae -h" instead.')
                console.error('')
                showDynamicHelp()
                debug('help completed, returning 0')
                return 0
        }

        // Load configuration once
        debug('Loading configuration...')
        debug('Loading configuration')

        let config: AliasConfig

        try {
            debug('Calling loadAliasConfig()...')
            config = loadAliasConfig()
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
            console.error('The config.json file should be located at: libs/project-alias-expander/config.json')
            console.error('')
            console.error('Current working directory:', process.cwd())
            console.error('')
            console.error('To debug this issue, run: pae <command> -d')
            debug('Returning error code 1 due to config failure')
            return 1
        }

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
                    const result = await main()

                    return result
                } finally {
                    // Restore original argv
                    process.argv = originalArgv
                }
            }
        } catch (error) {
            debug('Error checking expandable commands:', error)
        }
        
        // Handle alias resolution and command execution
        debug('Configuration loaded, handling alias command...')
        debug('Handling alias command', { alias: filteredArgs[0], remainingArgs: filteredArgs.slice(1) })

        const result = await handleAliasCommand(filteredArgs, config)

        debug('Alias command handled, result:', result)
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

async function handleAliasCommand(args: string[], config: AliasConfig): Promise<number> {
    try {
        const alias = args[0]
        const remainingArgs = args.slice(1)
        
        debug('Processing alias command', { alias, remainingArgs })
        
        // Check if it's a package alias
        if (config['nxPackages'][alias]) {
            debug('Found package alias', { alias, config: config['nxPackages'][alias] })
            return await handlePackageAlias(alias, remainingArgs, config)
        }
        
        // Check if it's a feature alias
        if (config['feature-nxTargets']?.[alias]) {
            debug('Found feature alias', { alias, config: config['feature-nxTargets'][alias] })
            return await handleFeatureAlias(alias, remainingArgs, config)
        }
        
        // Check if it's a not-nx target
        if (config['not-nxTargets']?.[alias]) {
            debug('Found not-nx target', { alias, config: config['not-nxTargets'][alias] })
            return await handleNotNxTarget(alias, remainingArgs, config)
        }
        
        // Check if it's an expandable command
        if (config['expandable-commands']?.[alias]) {
            debug('Found expandable command', { alias, config: config['expandable-commands'][alias] })
            return await handleExpandableCommand(alias, remainingArgs, config)
        }
        
        // Unknown alias
        error(`Unknown alias: ${alias}`)
        console.error('')
        console.error('Available aliases:')
        console.error('  Packages:', Object.keys(config['nxPackages']).join(', '))
        if (config['feature-nxTargets']) {
            console.error('  Features:', Object.keys(config['feature-nxTargets']).join(', '))
        }
        if (config['not-nxTargets']) {
            console.error('  Not-NX:', Object.keys(config['not-nxTargets']).join(', '))
        }
        if (config['expandable-commands']) {
            console.error('  Commands:', Object.keys(config['expandable-commands']).join(', '))
        }
        console.error('')
        console.error('Use "pae help" for more information.')
        return 1
    } catch (err) {
        error('Error handling alias command:', err)
        return 1
    }
}

async function handlePackageAlias(alias: string, args: string[], config: AliasConfig): Promise<number> {
    try {
        debug('Handling package alias', { alias, args })
        
        const packageConfig = config['nxPackages'][alias]
        const { project } = resolveProjectForAlias(packageConfig)
        
        debug('Resolved project', { alias, project })
        
        // Special handling for help command with package aliases
        if (args.length > 0 && args[0] === 'help') {
            debug('Help command detected for package alias, showing PAE help')
            showDynamicHelp()
            return 0
        }
        
        // Merge expandable-templates into expandable-flags for processing
        const expandableFlags = { ...config['expandable-flags'] }

        if (config['expandable-templates']) {
            Object.assign(expandableFlags, config['expandable-templates'])
        }
        
        // Process internal flags first (these affect PAE behavior, not the command)
        let timeoutMs: number | undefined = undefined

        // Process env-setting-flags FIRST - these set environment variables before any expansion or execution
        debug('About to check env-setting-flags', { hasEnvSettingFlags: !!config['env-setting-flags'], envSettingFlagsKeys: config['env-setting-flags'] ? Object.keys(config['env-setting-flags']) : [] })
        
        if (config['env-setting-flags']) {
            debug('Processing env-setting flags', { envSettingFlags: config['env-setting-flags'] })

            const envSettingFlags = { ...config['env-setting-flags'] }
            
            // Process env-setting flags first to set environment variables
            debug('About to process env-setting flags', { args, envSettingFlags })

            const { start: envStart, prefix: envPrefix, preArgs: envPreArgs, suffix: envSuffix, end: envEnd, remainingArgs: envRemainingArgs } = expandableProcessor.expandFlags(args, envSettingFlags)

            debug('Env-setting flags processed', { envStart, envPrefix, envPreArgs, envSuffix, envEnd, envRemainingArgs })
            
            // Check for PAE-specific env-setting flags and set environment variables
            const allEnvProcessedArgs = [...envStart, ...envPrefix, ...envPreArgs, ...envSuffix, ...envEnd, ...envRemainingArgs]
            
            // Filter out echo flags from the processed args for clean command capture
            const _cleanArgs = allEnvProcessedArgs.filter(arg =>
                !arg.startsWith('--pae-echo')
                && !arg.startsWith('-sto=')
                && !arg.startsWith('-stoX='))

            for (const arg of allEnvProcessedArgs) {
                if (arg === '--pae-debug') {
                    DEBUG = true
                    process.env.PAE_DEBUG = '1'
                    debug('Debug mode enabled via --pae-debug flag')
                } else if (arg === '--pae-verbose') {
                    process.env.PAE_VERBOSE = '1'
                    debug('Verbose mode enabled via --pae-verbose flag')
                } else if (arg.startsWith('--pae-echo=')) {
                    const variant = arg.split('=')[1]?.replace(/['"]/g, '') || ''

                    process.env.PAE_ECHO = '1'
                    if (variant) {
                        process.env.PAE_ECHO_VARIANT = variant
                        debug(`Echo mode enabled via --pae-echo flag with variant: ${variant}`)
                    } else {
                        debug('Echo mode enabled via --pae-echo flag (no variant - will show all)')
                    }
                } else if (arg === '--pae-echo') {
                    process.env.PAE_ECHO = '1'
                    // No variant set - will show all 6 variants
                    debug('Echo mode enabled via --pae-echo flag')
                } else if (arg.startsWith('--pae-echoX=')) {
                    const variant = arg.split('=')[1]?.replace(/['"]/g, '')

                    process.env.PAE_ECHO_X = '1'
                    if (variant) {
                        process.env.PAE_ECHO_VARIANT = variant
                        debug(`EchoX mode enabled via --pae-echoX flag with variant: ${variant}`)
                    } else {
                        debug('EchoX mode enabled via --pae-echoX flag (no variant - will show all)')
                    }
                } else if (arg === '--pae-echoX') {
                    process.env.PAE_ECHO_X = '1'
                    // No variant set - will show all 6 variants
                    debug('EchoX mode enabled via --pae-echoX flag')
                }
            }
            
            // Update args to use the processed env-setting flags
            args = envRemainingArgs
        }

        debug('About to check internal-flags', { hasInternalFlags: !!config['internal-flags'], internalFlagsKeys: config['internal-flags'] ? Object.keys(config['internal-flags']) : [] })
        
        if (config['internal-flags']) {
            debug('Processing internal flags', { internalFlags: config['internal-flags'] })

            const internalFlags = { ...config['internal-flags'] }

            if (config['expandable-templates']) {
                Object.assign(internalFlags, config['expandable-templates'])
            }
            
            // Check for help flags before processing other internal flags
            for (const arg of args) {
                if (arg === '-h' || arg === '--help') {
                    debug('Help flag detected in package alias, showing PAE help')
                    showDynamicHelp()
                    return 0
                }
            }
            
            // Process internal flags
            debug('About to process internal flags', { args, internalFlags })

            const { start, prefix, preArgs, suffix, end, remainingArgs: internalRemainingArgs } = expandableProcessor.expandFlags(args, internalFlags)

            debug('Internal flags processed', { start, prefix, preArgs, suffix, end, internalRemainingArgs })
            
            // Check for PAE-specific flags in the processed args and expanded flags
            const allProcessedArgs = [...start, ...prefix, ...preArgs, ...suffix, ...end, ...internalRemainingArgs]

            for (const arg of allProcessedArgs) {
                if (arg.startsWith('--pae-execa-timeout=')) {
                    timeoutMs = parseInt(arg.split('=')[1])
                    debug('Detected PAE timeout flag', { timeoutMs })
                }
            }
            
            // Update args to use the processed internal flags
            args = internalRemainingArgs
        }
        
        debug('Processing expandable flags', { expandableFlags })
        
        // Process expandable flags
        const { start, prefix, preArgs, suffix, end, remainingArgs } = expandableProcessor.expandFlags(args, expandableFlags)
        
        debug('Expanded flags', { start, prefix, preArgs, suffix, end, remainingArgs })
        
        // Determine target - use 'b' as default (expands to 'build')
        let target = 'b' // default

        if (remainingArgs.length > 0 && !remainingArgs[0].startsWith('-')) {
            target = remainingArgs[0]
            remainingArgs.shift()
        }
        
        // Expand target shortcuts using config.nxTargets
        const expandedTarget = config['nxTargets']?.[target] || target

        debug('Target expansion', { original: target, expanded: expandedTarget })
        
        debug('Final target', { target: expandedTarget })
        
        // Build command
        const baseCommand = ['nx', 'run', `${project}:${expandedTarget}`, ...prefix, ...preArgs, ...suffix, ...remainingArgs]
        
        debug('Base command', { baseCommand })
        
        // Wrap with start/end templates if needed
        const finalCommand = expandableProcessor.constructWrappedCommand(baseCommand, start, end)
        
        debug('Final command', { finalCommand })
        
        // Execute command
        debug(`Executing: ${finalCommand.join(' ')}${timeoutMs ? ` (timeout: ${timeoutMs}ms)` : ''}`)
        return await commandExecution.runNx(finalCommand, timeoutMs)
    } catch (err) {
        error(`Error handling package alias ${alias}:`, err)
        return 1
    }
}

async function handleFeatureAlias(alias: string, args: string[], config: AliasConfig): Promise<number> {
    const featureTarget = config['feature-nxTargets']![alias]
    const { project } = resolveProjectForAlias({ name: alias, suffix: featureTarget['run-from'] })
    
    // Merge expandable-templates into expandable-flags for processing
    const expandableFlags = { ...config['expandable-flags'] }

    if (config['expandable-templates']) {
        Object.assign(expandableFlags, config['expandable-templates'])
    }
    
    // Process expandable flags
    const { start, prefix, preArgs, suffix, end, remainingArgs } = expandableProcessor.expandFlags(args, expandableFlags)
    
    // Build command
    const baseCommand = ['nx', 'run', `${project}:${featureTarget['run-target']}`, ...prefix, ...preArgs, ...suffix, ...remainingArgs]
    
    // Wrap with start/end templates if needed
    const finalCommand = expandableProcessor.constructWrappedCommand(baseCommand, start, end)
    
    // Execute command
    return await commandExecution.runNx(finalCommand)
}

async function handleNotNxTarget(alias: string, args: string[], config: AliasConfig): Promise<number> {
    const command = config['not-nxTargets']![alias]
    const allArgs = [command, ...args]
    
    // Execute non-nx command
    return await commandExecution.runCommand(allArgs[0], allArgs.slice(1))
}

async function handleExpandableCommand(alias: string, args: string[], config: AliasConfig): Promise<number> {
    const command = config['expandable-commands']![alias]
    
    debug('Processing expandable command', { alias, command, args })
    
    // Process internal flags first (these affect PAE behavior, not the command)
    let timeoutMs: number | undefined = undefined

    // Process env-setting-flags FIRST - these set environment variables before any expansion or execution
    debug('About to check env-setting-flags', { hasEnvSettingFlags: !!config['env-setting-flags'], envSettingFlagsKeys: config['env-setting-flags'] ? Object.keys(config['env-setting-flags']) : [] })
    
    if (config['env-setting-flags']) {
        debug('Processing env-setting flags', { envSettingFlags: config['env-setting-flags'] })

        const envSettingFlags = { ...config['env-setting-flags'] }
        
        // Process env-setting flags first to set environment variables
        debug('About to process env-setting flags', { args, envSettingFlags })

        const { start: envStart, prefix: envPrefix, preArgs: envPreArgs, suffix: envSuffix, end: envEnd, remainingArgs: envRemainingArgs } = expandableProcessor.expandFlags(args, envSettingFlags)

        debug('Env-setting flags processed', { envStart, envPrefix, envPreArgs, envSuffix, envEnd, envRemainingArgs })
        
        // Check for PAE-specific env-setting flags and set environment variables
        const allEnvProcessedArgs = [...envStart, ...envPrefix, ...envPreArgs, ...envSuffix, ...envEnd, ...envRemainingArgs]

        for (const arg of allEnvProcessedArgs) {
            if (arg === '--pae-debug') {
                DEBUG = true
                process.env.PAE_DEBUG = '1'
                debug('Debug mode enabled via --pae-debug flag')
            } else if (arg === '--pae-verbose') {
                process.env.PAE_VERBOSE = '1'
                debug('Verbose mode enabled via --pae-verbose flag')
            } else if (arg.startsWith('--pae-echo=')) {
                const variant = arg.split('=')[1]?.replace(/['"]/g, '')

                process.env.PAE_ECHO = '1'
                if (variant) {
                    process.env.PAE_ECHO_VARIANT = variant
                    debug(`Echo mode enabled via --pae-echo flag with variant: ${variant}`)
                } else {
                    debug('Echo mode enabled via --pae-echo flag (no variant - will show all)')
                }
            } else if (arg === '--pae-echo') {
                process.env.PAE_ECHO = '1'
                // No variant set - will show all 6 variants
                debug('Echo mode enabled via --pae-echo flag')
            } else if (arg.startsWith('--pae-echoX=')) {
                const variant = arg.split('=')[1]?.replace(/['"]/g, '')

                process.env.PAE_ECHO_X = '1'
                if (variant) {
                    process.env.PAE_ECHO_VARIANT = variant
                    debug(`EchoX mode enabled via --pae-echoX flag with variant: ${variant}`)
                } else {
                    debug('EchoX mode enabled via --pae-echoX flag (no variant - will show all)')
                }
            } else if (arg === '--pae-echoX') {
                process.env.PAE_ECHO_X = '1'
                // No variant set - will show all 6 variants
                debug('EchoX mode enabled via --pae-echoX flag')
            }
        }
        
        // Update args to use the processed env-setting flags
        args = envRemainingArgs
    }

    if (config['internal-flags']) {
        const internalFlags = { ...config['internal-flags'] }

        if (config['expandable-templates']) {
            Object.assign(internalFlags, config['expandable-templates'])
        }
        
        // Process internal flags
        const { remainingArgs: internalRemainingArgs } = expandableProcessor.expandFlags(args, internalFlags)
        
        // Check for PAE-specific flags in the processed args
        for (const arg of internalRemainingArgs) {
            if (arg.startsWith('--pae-execa-timeout=')) {
                timeoutMs = parseInt(arg.split('=')[1])
                debug('Detected PAE timeout flag', { timeoutMs })
            }
        }
        
        // Update args to use the processed internal flags
        args = internalRemainingArgs
    }
    
    // Process expandable flags
    const expandableFlags = { ...config['expandable-flags'] }

    if (config['expandable-templates']) {
        Object.assign(expandableFlags, config['expandable-templates'])
    }
    
    const { start: _start, prefix, preArgs, suffix, end: _end, remainingArgs } = expandableProcessor.expandFlags(args, expandableFlags)
    
    // Build the final command with processed flags
    const processedArgs = [...prefix, ...preArgs, ...suffix, ...remainingArgs]
    const fullCommand = [command, ...processedArgs].join(' ')
    
    debug('Final expandable command to execute', { fullCommand, timeoutMs })
    
    // Add explicit console logging to debug the issue
    console.log(`[DEBUG] About to execute expandable command: ${fullCommand}`)
    
    try {
        // Use ProcessPool for better resource management
        const { commandExecution } = await import('./services/CommandExecution.service.js')
        
        console.log(`[DEBUG] About to execute expandable command: ${fullCommand}`)
        
        const result = await commandExecution.executeWithPool('cmd', ['/c', fullCommand], {
            timeout: timeoutMs || 300000,
            stdio: 'inherit'
        })
        
        console.log(`[DEBUG] Command completed with exit code: ${result.exitCode}`)
        return result.exitCode
    } catch (error: unknown) {
        debug('Expandable command execution error:', error)
        console.log(`[DEBUG] Command failed with error:`, error)
        return (error as { exitCode?: number }).exitCode || 1
    }
}

function resolveProjectForAlias(aliasValue: string | { name: string, suffix?: 'core' | 'ext', full?: boolean }): { project: string, full?: boolean } {
    const result = resolveProjectForAliasFromConfig(aliasValue)

    return { project: result.project, full: result.isFull }
}

// Export functions for testing compatibility
export {
    main,
    handleAliasCommand,
    handlePackageAlias,
    handleFeatureAlias,
    handleNotNxTarget,
    resolveProjectForAlias,
    loadAliasConfig,
    detectShell,
    commandExecution,
    expandableProcessor,
    aliasManager
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

if (isMainModule) {
    debug('This is the main module, calling main()...')

    main().then(exitCode => {
        debug('Main function returned:', exitCode)
        debug('Exiting with code:', exitCode)
        process.exit(exitCode)
    }).catch(error => {
        debug('Main function error:', error)
        console.error('Error:', error)
        process.exit(1)
    })
} else {
    debug('This is not the main module, not calling main()')
}
