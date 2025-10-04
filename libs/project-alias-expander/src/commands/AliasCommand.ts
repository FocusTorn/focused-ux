import type { AliasConfig } from '../_types/index.js'
import { commandExecution, expandableProcessor } from '../services/index.js'
import { resolveProjectForAlias as resolveProjectForAliasFromConfig } from '../config.js'
import { HelpCommand } from './HelpCommand.js'

export class AliasCommand {
    private debug: (message: string, ...args: unknown[]) => void
    private error: (message: string, ...args: unknown[]) => void
    private getContextAwareFlags: (config: AliasConfig, target: string, expandedTarget: string) => Record<string, any>
    private helpCommand: HelpCommand

    constructor(
        debug: (message: string, ...args: unknown[]) => void,
        error: (message: string, ...args: unknown[]) => void,
        getContextAwareFlags: (config: AliasConfig, target: string, expandedTarget: string) => Record<string, any>
    ) {
        this.debug = debug
        this.error = error
        this.getContextAwareFlags = getContextAwareFlags
        this.helpCommand = new HelpCommand()
    }

    async execute(args: string[], config: AliasConfig): Promise<number> {
        try {
            const alias = args[0]
            const remainingArgs = args.slice(1)
            
            this.debug('Processing alias command', { alias, remainingArgs })
            
            // Check if it's a package alias
            if (config['nxPackages'][alias]) {
                this.debug('Found package alias', { alias, config: config['nxPackages'][alias] })
                return await this.handlePackageAlias(alias, remainingArgs, config)
            }
            
            // Check if it's a feature alias
            if (config['feature-nxTargets']?.[alias]) {
                this.debug('Found feature alias', { alias, config: config['feature-nxTargets'][alias] })
                return await this.handleFeatureAlias(alias, remainingArgs, config)
            }
            
            // Check if it's a not-nx target
            if (config['not-nxTargets']?.[alias]) {
                this.debug('Found not-nx target', { alias, config: config['not-nxTargets'][alias] })
                return await this.handleNotNxTarget(alias, remainingArgs, config)
            }
            
            // Check if it's an expandable command
            if (config['expandable-commands']?.[alias]) {
                this.debug('Found expandable command', { alias, config: config['expandable-commands'][alias] })
                return await this.handleExpandableCommand(alias, remainingArgs, config)
            }
            
            // Unknown alias
            this.error(`Unknown alias: ${alias}`)
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
            this.error('Error handling alias command:', err)
            return 1
        }
    }

    private async handlePackageAlias(alias: string, args: string[], config: AliasConfig): Promise<number> {
        try {
            this.debug('Handling package alias', { alias, args })
            
            const packageConfig = config['nxPackages'][alias]
            const { project } = this.resolveProjectForAlias(packageConfig)
            
            this.debug('Resolved project', { alias, project })
            
            // Special handling for help command with package aliases
            if (args.length > 0 && args[0] === 'help') {
                this.debug('Help command detected for package alias, showing PAE help')
                this.helpCommand.execute()
                return 0
            }
            
            // Extract target BEFORE processing flags for context-aware behavior
            let target = 'b' // default

            if (args.length > 0 && !args[0].startsWith('-')) {
                target = args[0]

                // Don't modify the original args array - create a new array without the target
                args = args.slice(1)
            }
            
            // Expand target shortcuts using config.nxTargets
            const expandedTarget = config['nxTargets']?.[target] || target
            
            this.debug('Target extraction (pre-flag processing)', { original: target, expanded: expandedTarget })
            
            // Get context-aware flags based on target
            const expandableFlags = this.getContextAwareFlags(config, target, expandedTarget)
            
            // Process internal flags first (these affect PAE behavior, not the command)
            let timeoutMs: number | undefined = undefined

            // Process env-setting-flags FIRST - these set environment variables before any expansion or execution
            this.debug('About to check env-setting-flags', { hasEnvSettingFlags: !!config['env-setting-flags'], envSettingFlagsKeys: config['env-setting-flags'] ? Object.keys(config['env-setting-flags']) : [] })
            
            if (config['env-setting-flags']) {
                this.debug('Processing env-setting flags', { envSettingFlags: config['env-setting-flags'] })

                const envSettingFlags = { ...config['env-setting-flags'] }
                
                // Process env-setting flags first to set environment variables
                this.debug('About to process env-setting flags', { args, envSettingFlags })

                const { start: envStart, prefix: envPrefix, preArgs: envPreArgs, suffix: envSuffix, end: envEnd, remainingArgs: envRemainingArgs } = expandableProcessor.expandFlags(args, envSettingFlags)

                this.debug('Env-setting flags processed', { envStart, envPrefix, envPreArgs, envSuffix, envEnd, envRemainingArgs })
                
                // Check for PAE-specific env-setting flags and set environment variables
                const allEnvProcessedArgs = [...envStart, ...envPrefix, ...envPreArgs, ...envSuffix, ...envEnd, ...envRemainingArgs]
                
                // Filter out echo flags from the processed args for clean command capture
                const _cleanArgs = allEnvProcessedArgs.filter(arg =>
                    !arg.startsWith('--pae-echo')
                    && !arg.startsWith('-sto=')
                    && !arg.startsWith('-stoX='))

                for (const arg of allEnvProcessedArgs) {
                    if (arg === '--pae-debug') {
                        process.env.PAE_DEBUG = '1'
                        this.debug('Debug mode enabled via --pae-debug flag')
                    } else if (arg === '--pae-verbose') {
                        process.env.PAE_VERBOSE = '1'
                        this.debug('Verbose mode enabled via --pae-verbose flag')
                    } else if (arg.startsWith('--pae-echo=')) {
                        const variant = arg.split('=')[1]?.replace(/['"]/g, '') || ''

                        process.env.PAE_ECHO = '1'
                        if (variant) {
                            process.env.PAE_ECHO_VARIANT = variant
                            this.debug(`echo mode enabled via --pae-echo flag with variant: ${variant}`)
                        } else {
                            this.debug('Echo mode enabled via --pae-echo flag (no variant - will show all)')
                        }
                    } else if (arg === '--pae-echo') {
                        process.env.PAE_ECHO = '1'
                        // No variant set - will show all 6 variants
                        this.debug('Echo mode enabled via --pae-echo flag')
                    } else if (arg.startsWith('--pae-echoX=')) {
                        const variant = arg.split('=')[1]?.replace(/['"]/g, '')

                        process.env.PAE_ECHO_X = '1'
                        if (variant) {
                            process.env.PAE_ECHO_VARIANT = variant
                            this.debug(`echoX mode enabled via --pae-echoX flag with variant: ${variant}`)
                        } else {
                            this.debug('EchoX mode enabled via --pae-echoX flag (no variant - will show all)')
                        }
                    } else if (arg === '--pae-echoX') {
                        process.env.PAE_ECHO_X = '1'
                        // No variant set - will show all 6 variants
                        this.debug('EchoX mode enabled via --pae-echoX flag')
                    }
                }
                
                // Update args to use the processed env-setting flags
                args = envRemainingArgs
            }

            this.debug('About to check internal-flags', { hasInternalFlags: !!config['internal-flags'], internalFlagsKeys: config['internal-flags'] ? Object.keys(config['internal-flags']) : [] })
            
            if (config['internal-flags']) {
                this.debug('Processing internal flags', { internalFlags: config['internal-flags'] })

                const internalFlags = { ...config['internal-flags'] }

                if (config['expandable-templates']) {
                    Object.assign(internalFlags, config['expandable-templates'])
                }
                
                // Check for help flags before processing other internal flags
                for (const arg of args) {
                    if (arg === '-h' || arg === '--help') {
                        this.debug('Help flag detected in package alias, showing PAE help')
                        this.helpCommand.execute()
                        return 0
                    }
                }
                
                // Process internal flags
                this.debug('About to process internal flags', { args, internalFlags })

                const { start, prefix, preArgs, suffix, end, remainingArgs: internalRemainingArgs } = expandableProcessor.expandFlags(args, internalFlags)

                this.debug('Internal flags processed', { start, prefix, preArgs, suffix, end, internalRemainingArgs })
                
                // Check for PAE-specific flags in the processed args and expanded flags
                const allProcessedArgs = [...start, ...prefix, ...preArgs, ...suffix, ...end, ...internalRemainingArgs]

                for (const arg of allProcessedArgs) {
                    if (arg.startsWith('--pae-execa-timeout=')) {
                        timeoutMs = parseInt(arg.split('=')[1])
                        this.debug('Detected PAE timeout flag', { timeoutMs })
                    }
                }
                
                // Update args to use the processed internal flags
                args = internalRemainingArgs
            }
            
            this.debug('Processing expandable flags', { expandableFlags })
            
            // Process expandable flags
            const { start, prefix, preArgs, suffix, end, remainingArgs } = expandableProcessor.expandFlags(args, expandableFlags)
            
            this.debug('Expanded flags', { start, prefix, preArgs, suffix, end, remainingArgs })
            
            // Build command
            const baseCommand = ['nx', 'run', `${project}:${expandedTarget}`, ...prefix, ...preArgs, ...suffix, ...remainingArgs]
            
            this.debug('Base command', { baseCommand })
            
            // Wrap with start/end templates if needed
            const finalCommand = expandableProcessor.constructWrappedCommand(baseCommand, start, end)
            
            this.debug('Final command', { finalCommand })
            
            // Execute command
            this.debug(`executing: ${finalCommand.join(' ')}${timeoutMs ? ` (timeout: ${timeoutMs}ms)` : ''}`)
            return await commandExecution.runNx(finalCommand, timeoutMs)
        } catch (err) {
            this.error(`error handling package alias ${alias}:`, err)
            return 1
        }
    }

    private async handleFeatureAlias(alias: string, args: string[], config: AliasConfig): Promise<number> {
        const featureTarget = config['feature-nxTargets']![alias]
        const { project } = this.resolveProjectForAlias({ name: alias, suffix: featureTarget['run-from'] })
        
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

    private async handleNotNxTarget(alias: string, args: string[], config: AliasConfig): Promise<number> {
        const command = config['not-nxTargets']![alias]
        const allArgs = [command, ...args]
        
        // Execute non-nx command
        return await commandExecution.runCommand(allArgs[0], allArgs.slice(1))
    }

    private async handleExpandableCommand(alias: string, args: string[], config: AliasConfig): Promise<number> {
        const command = config['expandable-commands']![alias]
        
        this.debug('Processing expandable command', { alias, command, args })
        
        // Process internal flags first (these affect PAE behavior, not the command)
        let timeoutMs: number | undefined = undefined

        // Process env-setting-flags FIRST - these set environment variables before any expansion or execution
        this.debug('About to check env-setting-flags', { hasEnvSettingFlags: !!config['env-setting-flags'], envSettingFlagsKeys: config['env-setting-flags'] ? Object.keys(config['env-setting-flags']) : [] })
        
        if (config['env-setting-flags']) {
            this.debug('Processing env-setting flags', { envSettingFlags: config['env-setting-flags'] })

            const envSettingFlags = { ...config['env-setting-flags'] }
            
            // Process env-setting flags first to set environment variables
            this.debug('About to process env-setting flags', { args, envSettingFlags })

            const { start: envStart, prefix: envPrefix, preArgs: envPreArgs, suffix: envSuffix, end: envEnd, remainingArgs: envRemainingArgs } = expandableProcessor.expandFlags(args, envSettingFlags)

            this.debug('Env-setting flags processed', { envStart, envPrefix, envPreArgs, envSuffix, envEnd, envRemainingArgs })
            
            // Check for PAE-specific env-setting flags and set environment variables
            const allEnvProcessedArgs = [...envStart, ...envPrefix, ...envPreArgs, ...envSuffix, ...envEnd, ...envRemainingArgs]

            for (const arg of allEnvProcessedArgs) {
                if (arg === '--pae-debug') {
                    process.env.PAE_DEBUG = '1'
                    this.debug('Debug mode enabled via --pae-debug flag')
                } else if (arg === '--pae-verbose') {
                    process.env.PAE_VERBOSE = '1'
                    this.debug('Verbose mode enabled via --pae-verbose flag')
                } else if (arg.startsWith('--pae-echo=')) {
                    const variant = arg.split('=')[1]?.replace(/['"]/g, '')

                    process.env.PAE_ECHO = '1'
                    if (variant) {
                        process.env.PAE_ECHO_VARIANT = variant
                        this.debug(`echo mode enabled via --pae-echo flag with variant: ${variant}`)
                    } else {
                        this.debug('Echo mode enabled via --pae-echo flag (no variant - will show all)')
                    }
                } else if (arg === '--pae-echo') {
                    process.env.PAE_ECHO = '1'
                    // No variant set - will show all 6 variants
                    this.debug('Echo mode enabled via --pae-echo flag')
                } else if (arg.startsWith('--pae-echoX=')) {
                    const variant = arg.split('=')[1]?.replace(/['"]/g, '')

                    process.env.PAE_ECHO_X = '1'
                    if (variant) {
                        process.env.PAE_ECHO_VARIANT = variant
                        this.debug(`echoX mode enabled via --pae-echoX flag with variant: ${variant}`)
                    } else {
                        this.debug('EchoX mode enabled via --pae-echoX flag (no variant - will show all)')
                    }
                } else if (arg === '--pae-echoX') {
                    process.env.PAE_ECHO_X = '1'
                    // No variant set - will show all 6 variants
                    this.debug('EchoX mode enabled via --pae-echoX flag')
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
                    this.debug('Detected PAE timeout flag', { timeoutMs })
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
        
        this.debug('Final expandable command to execute', { fullCommand, timeoutMs })
        
        // Add explicit console logging to debug the issue
        console.log(`[DEBUG] About to execute expandable command: ${fullCommand}`)
        
        try {
            // Use ProcessPool for better resource management
            const { commandExecution } = await import('../services/CommandExecution.service.js')
            
            console.log(`[DEBUG] About to execute expandable command: ${fullCommand}`)
            
            const result = await commandExecution.executeWithPool('cmd', ['/c', fullCommand], {
                timeout: timeoutMs || 300000,
                stdio: 'inherit'
            })
            
            console.log(`[DEBUG] Command completed with exit code: ${result.exitCode}`)
            return result.exitCode
        } catch (error: unknown) {
            this.debug('Expandable command execution error:', error)
            console.log(`[DEBUG] Command failed with error:`, error)
            return (error as { exitCode?: number }).exitCode || 1
        }
    }

    private resolveProjectForAlias(aliasValue: string | { name: string, suffix?: 'core' | 'ext', full?: boolean }): { project: string, full?: boolean } {
        const result = resolveProjectForAliasFromConfig(aliasValue)

        return { project: result.project, full: result.isFull }
    }
}
