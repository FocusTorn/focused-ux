#!/usr/bin/env node

import { paeManager } from './services/index.js'
import { loadAliasConfig, resolveProjectForAlias as resolveProjectForAliasFromConfig } from './config.js'
import { detectShell } from './shell.js'
import type { AliasConfig } from './_types/index.js'

// Debug mode - activated by -d or --debug flags
let DEBUG = false

function debug(message: string, ...args: any[]) {
    if (DEBUG) {
        console.error(`[PAE DEBUG] ${message}`, ...args)
    }
}

function error(message: string, ...args: any[]) {
    console.error(`[PAE ERROR] ${message}`, ...args)
}

function info(message: string, ...args: any[]) {
    console.log(`[PAE INFO] ${message}`, ...args)
}

function success(message: string, ...args: any[]) {
    // Use the same green color as Nx success messages, with bold checkmark
    const green = '\x1b[32m'
    const bold = '\x1b[1m'
    const reset = '\x1b[0m'
    const checkmark = '✔'
    console.log(`${green}${bold}${checkmark}${reset}${green} ${message}${reset}`, ...args)
}

function showDynamicHelp() {
    try {
        const config = loadAliasConfig()
        
        console.log('PAE - Project Alias Expander')
        console.log('Usage: pae <alias> [target] [flags]')
        console.log('       pae <command> [args]')
        console.log('')
        
        // Show available aliases
        if (config.nxPackages && Object.keys(config.nxPackages).length > 0) {
            console.log('Available Aliases:')
            Object.entries(config.nxPackages).forEach(([alias, project]) => {
                const projectName = typeof project === 'string' ? project : project.name
                console.log(`  ${alias.padEnd(8)} → ${projectName}`)
            })
            console.log('')
        }
        
        // Show available targets
        if (config.nxTargets && Object.keys(config.nxTargets).length > 0) {
            console.log('Available Targets:')
            Object.entries(config.nxTargets).forEach(([shortcut, target]) => {
                console.log(`  ${shortcut.padEnd(8)} → ${target}`)
            })
            console.log('')
        }
        
        // Show feature targets
        if (config['feature-nxTargets'] && Object.keys(config['feature-nxTargets']).length > 0) {
            console.log('Feature Targets:')
            Object.entries(config['feature-nxTargets']).forEach(([alias, config]) => {
                console.log(`  ${alias.padEnd(8)} → ${config['run-target']} (from ${config['run-from']})`)
            })
            console.log('')
        }
        
        // Show expandable flags
        if (config['expandable-flags'] && Object.keys(config['expandable-flags']).length > 0) {
            console.log('Expandable Flags:')
            Object.entries(config['expandable-flags']).forEach(([flag, expansion]) => {
                const expansionStr = typeof expansion === 'string' ? expansion : expansion.template || 'template'
                console.log(`  -${flag.padEnd(8)} → ${expansionStr}`)
            })
            console.log('')
        }
        
        // Show expandable templates
        if (config['expandable-templates'] && Object.keys(config['expandable-templates']).length > 0) {
            console.log('Expandable Templates:')
            Object.entries(config['expandable-templates']).forEach(([template, config]) => {
                console.log(`  -${template.padEnd(8)} → ${config['pwsh-template'] ? 'PowerShell template' : 'Template'}`)
            })
            console.log('')
        }
        
        console.log('Commands:')
        console.log('  install-aliases    Install PAE aliases')
        console.log('  refresh            Refresh PAE aliases')
        console.log('  refresh-direct     Refresh aliases directly')
        console.log('  help               Show this help')
        console.log('')
        console.log('Flags:')
        console.log('  -d, --debug        Enable debug logging')
        console.log('  -echo              Echo commands instead of executing')
        console.log('')
        console.log('Environment Variables:')
        console.log('  PAE_DEBUG=1        Enable debug logging')
        console.log('  PAE_ECHO=1         Echo commands instead of executing')
        
    } catch (error) {
        // Fallback to static help if config loading fails
        console.log('PAE - Project Alias Expander')
        console.log('Usage: pae <alias> [target] [flags]')
        console.log('       pae <command> [args]')
        console.log('')
        console.log('Commands:')
        console.log('  install-aliases    Install PAE aliases')
        console.log('  refresh            Refresh PAE aliases')
        console.log('  refresh-direct     Refresh aliases directly')
        console.log('  help               Show this help')
        console.log('')
        console.log('Flags:')
        console.log('  -d, --debug        Enable debug logging')
        console.log('  -echo              Echo commands instead of executing')
        console.log('')
        console.log('Environment Variables:')
        console.log('  PAE_DEBUG=1        Enable debug logging')
        console.log('  PAE_ECHO=1         Echo commands instead of executing')
        console.log('')
        console.log('Note: Unable to load configuration for dynamic help')
    }
}

function main() {
    try {
        debug('Main function called')
        debug('Starting PAE CLI execution')
        debug('Starting PAE CLI', { argv: process.argv, cwd: process.cwd() })
        
        const args = process.argv.slice(2)
        debug('Arguments parsed:', args)
        
        // Check for debug flags and remove them from args
        const debugFlags = ['-d', '--debug']
        const filteredArgs = args.filter(arg => {
            if (debugFlags.includes(arg)) {
                DEBUG = true
                return false
            }
            return true
        })
        
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
            case 'install-aliases':
                debug('Executing install-aliases command')
                debug('Executing install-aliases')
                paeManager.installAliases()
                success('PAE Aliases installed successfully')
                debug('install-aliases completed, returning 0')
        return 0

            case 'refresh':
                debug('Executing refresh command')
                debug('Executing refresh')
                paeManager.refreshAliases()
                success('PAE Aliases refreshed successfully')
                debug('refresh completed, returning 0')
    return 0

            case 'refresh-direct':
                debug('Executing refresh-direct command')
                debug('Executing refresh-direct')
                paeManager.refreshAliasesDirect()
                success('PAE Aliases refreshed directly')
                debug('refresh-direct completed, returning 0')
    return 0
                
            case 'help':
                debug('Executing help command')
                showDynamicHelp()
                debug('help completed, returning 0')
                return 0
        }

        // Load configuration
        debug('Not a special command, loading configuration...')
        debug('Loading configuration')
        let config: AliasConfig
        try {
            debug('Calling loadAliasConfig()...')
            config = loadAliasConfig()
            debug('Configuration loaded successfully')
            debug('Configuration loaded successfully', { 
                packages: Object.keys(config['nxPackages'] || {}),
                targets: Object.keys(config['nxTargets'] || {}),
                features: Object.keys(config['feature-nxTargets'] || {})
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
        
        // Handle alias resolution and command execution
        debug('Configuration loaded, handling alias command...')
        debug('Handling alias command', { alias: filteredArgs[0], remainingArgs: filteredArgs.slice(1) })
        const result = handleAliasCommand(filteredArgs, config)
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

function handleAliasCommand(args: string[], config: AliasConfig): number {
    try {
        const alias = args[0]
        const remainingArgs = args.slice(1)
        
        debug('Processing alias command', { alias, remainingArgs })
        
        // Check if it's a package alias
        if (config['nxPackages'][alias]) {
            debug('Found package alias', { alias, config: config['nxPackages'][alias] })
            return handlePackageAlias(alias, remainingArgs, config)
        }
        
        // Check if it's a feature alias
        if (config['feature-nxTargets']?.[alias]) {
            debug('Found feature alias', { alias, config: config['feature-nxTargets'][alias] })
            return handleFeatureAlias(alias, remainingArgs, config)
        }
        
        // Check if it's a not-nx target
        if (config['not-nxTargets']?.[alias]) {
            debug('Found not-nx target', { alias, config: config['not-nxTargets'][alias] })
            return handleNotNxTarget(alias, remainingArgs, config)
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
        console.error('')
        console.error('Use "pae help" for more information.')
        return 1
    } catch (err) {
        error('Error handling alias command:', err)
        return 1
    }
}

function handlePackageAlias(alias: string, args: string[], config: AliasConfig): number {
    try {
        debug('Handling package alias', { alias, args })
        
        const packageConfig = config['nxPackages'][alias]
        const { project } = resolveProjectForAlias(packageConfig)
        
        debug('Resolved project', { alias, project })
        
        // Merge expandable-templates into expandable-flags for processing
        const expandableFlags = { ...config['expandable-flags'] }
        if (config['expandable-templates']) {
            Object.assign(expandableFlags, config['expandable-templates'])
        }
        
        debug('Processing expandable flags', { expandableFlags })
        
        // Process expandable flags
        const { start, prefix, preArgs, suffix, end, remainingArgs } = paeManager.expandFlags(args, expandableFlags)
        
        debug('Expanded flags', { start, prefix, preArgs, suffix, end, remainingArgs })
        
        // Determine target
        let target = 'build' // default
        if (remainingArgs.length > 0 && !remainingArgs[0].startsWith('-')) {
            target = remainingArgs[0]
            remainingArgs.shift()
        }
        
        // Expand target shortcuts
        const targetExpansions: Record<string, string> = {
            'b': 'build',
            't': 'test',
            'l': 'lint',
            'c': 'clean',
            'd': 'dev',
            's': 'serve',
            'e': 'e2e'
        }
        
        const expandedTarget = targetExpansions[target] || target
        debug('Target expansion', { original: target, expanded: expandedTarget })
        
        debug('Final target', { target: expandedTarget })
        
        // Build command
        const baseCommand = ['nx', 'run', `${project}:${expandedTarget}`, ...prefix, ...preArgs, ...suffix, ...remainingArgs]
        
        debug('Base command', { baseCommand })
        
        // Wrap with start/end templates if needed
        const finalCommand = paeManager.constructWrappedCommand(baseCommand, start, end)
        
        debug('Final command', { finalCommand })
        
        // Execute command
        debug(`Executing: ${finalCommand.join(' ')}`)
        return paeManager.runNx(finalCommand)
    } catch (err) {
        error(`Error handling package alias ${alias}:`, err)
        return 1
    }
}

function handleFeatureAlias(alias: string, args: string[], config: AliasConfig): number {
    const featureTarget = config['feature-nxTargets']![alias]
    const { project } = resolveProjectForAlias({ name: alias, suffix: featureTarget['run-from'] })
    
    // Merge expandable-templates into expandable-flags for processing
    const expandableFlags = { ...config['expandable-flags'] }
    if (config['expandable-templates']) {
        Object.assign(expandableFlags, config['expandable-templates'])
    }
    
    // Process expandable flags
    const { start, prefix, preArgs, suffix, end, remainingArgs } = paeManager.expandFlags(args, expandableFlags)
    
    // Build command
    const baseCommand = ['nx', 'run', `${project}:${featureTarget['run-target']}`, ...prefix, ...preArgs, ...suffix, ...remainingArgs]
    
    // Wrap with start/end templates if needed
    const finalCommand = paeManager.constructWrappedCommand(baseCommand, start, end)
    
    // Execute command
    return paeManager.runNx(finalCommand)
}

function handleNotNxTarget(alias: string, args: string[], config: AliasConfig): number {
    const command = config['not-nxTargets']![alias]
    const allArgs = [command, ...args]
    
    // Execute non-nx command
    return paeManager.runCommand(allArgs[0], allArgs.slice(1))
}

function resolveProjectForAlias(aliasValue: any): { project: string, full?: boolean } {
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
    paeManager
}

// Service functions are available through paeManager
// Tests should import and use paeManager directly or mock the services

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
const isMainModule = normalizedImportUrl === normalizedArgvPath ||
                     process.argv[1] === process.argv[0] ||
                     process.argv[1].endsWith('cli.js') ||
                     process.argv[1].endsWith('cli')

debug('Is main module:', isMainModule)

if (isMainModule) {
    debug('This is the main module, calling main()...')
    const exitCode = main()
    debug('Main function returned:', exitCode)
    debug('Exiting with code:', exitCode)
    process.exit(exitCode)
} else {
    debug('This is not the main module, not calling main()')
}
