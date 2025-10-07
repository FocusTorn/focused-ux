import type { AliasConfig } from '../_types/config.types.js'
import { commandExecution, expandableProcessor } from '../services/index.js'
import {
    CommandResolutionService,
    type CommandResolution,
} from '../services/CommandResolutionService.js'
import { PackageResolutionService } from '../services/PackageResolutionService.js'
import { TargetResolutionService } from '../services/TargetResolutionService.js'
import { ConfigurationValidator } from '../services/ConfigurationValidator.js'
import { TemplateUtils } from '../services/CommonUtils.service.js'
import { HelpCommand } from './HelpCommand.js'

export class AliasCommand {

    private debug: (message: string, ...args: unknown[]) => void
    private error: (message: string, ...args: unknown[]) => void
    private getContextAwareFlags: (
        config: AliasConfig,
        target: string,
        expandedTarget: string
    ) => Record<string, any>
    private helpCommand: HelpCommand
    private commandResolver: CommandResolutionService
    private packageResolver: PackageResolutionService
    private targetResolver: TargetResolutionService
    private configValidator: ConfigurationValidator

    constructor(
        debug: (message: string, ...args: unknown[]) => void,
        error: (message: string, ...args: unknown[]) => void,
        getContextAwareFlags: (
            config: AliasConfig,
            target: string,
            expandedTarget: string
        ) => Record<string, any>
    ) {

        this.debug = debug
        this.error = error
        this.getContextAwareFlags = getContextAwareFlags
        this.helpCommand = new HelpCommand()
        this.commandResolver = new CommandResolutionService()
        this.packageResolver = new PackageResolutionService({ nxPackages: {} } as AliasConfig)
        this.targetResolver = new TargetResolutionService()
        this.configValidator = new ConfigurationValidator()
    
    }

    async execute(args: string[], config: AliasConfig): Promise<number> {

        try {

            // Initialize package resolver with actual config
            this.packageResolver = new PackageResolutionService(config)

            // Validate configuration first
            const validation = this.configValidator.validate(config)

            if (!validation.isValid) {

                this.error('Configuration validation failed:')
                validation.errors.forEach((error) => this.error(`  - ${error}`))
                return 1
            
            }

            // Note: We support both old and new formats during transition
            // The services will handle format detection and fallback automatically

            const alias = args[0]
            const remainingArgs = args.slice(1)

            this.debug('Processing alias command', { alias, remainingArgs })

            // Use new command resolution system
            const resolution = this.commandResolver.resolveCommand(alias, config)

            switch (resolution.type) {
                case 'reserved':
                    return await this.handleReservedCommand(
                        resolution.command,
                        remainingArgs,
                        config
                    )
                case 'expandable':
                    return await this.handleExpandableCommand(
                        resolution.execution!,
                        remainingArgs,
                        config
                    )
                case 'package':
                    return await this.handlePackageAlias(resolution.command, remainingArgs, config)
                default:
                    this.error(`Unknown alias: ${alias}`)
                    this.showAvailableAliases(config)
                    return 1
            }
        
        } catch (err) {

            this.error('Error handling alias command:', err)
            return 1
        
        }
    
    }

    private async handleReservedCommand(
        command: string,
        args: string[],
        config: AliasConfig
    ): Promise<number> {

        this.debug('Handling reserved command', { command, args })

        switch (command) {
            case 'help':
                this.helpCommand.execute()
                return 0
            case 'install':
                // Handle PAE module installation
                this.error('Install command not yet implemented in new system')
                return 1
            case 'remove':
                // Handle PAE module removal
                this.error('Remove command not yet implemented in new system')
                return 1
            case 'refresh':
                // Handle alias refresh
                this.error('Refresh command not yet implemented in new system')
                return 1
            case 'load':
                // Handle module loading
                this.error('Load command not yet implemented in new system')
                return 1
            default:
                this.error(`Unknown reserved command: ${command}`)
                return 1
        }
    
    }

    private async handleExpandableCommand(
        execution: string,
        args: string[],
        config: AliasConfig
    ): Promise<number> {

        this.debug('Handling expandable command', { execution, args })

        // Process only PAE internal flags (no alias/target processing)
        const { remainingArgs, timeout } = this.processInternalFlags(args, config)

        // Execute the command directly
        const fullCommand = `${execution} ${remainingArgs.join(' ')}`.trim()

        this.debug('Executing direct command', { fullCommand })

        return await commandExecution.runCommand(execution, [], timeout)
    
    }

    private async handlePackageAlias(
        alias: string,
        args: string[],
        config: AliasConfig
    ): Promise<number> {

        try {

            this.debug('Handling package alias', { alias, args })

            // Update package resolver with current config
            this.packageResolver = new PackageResolutionService(config)

            const packageResolution = this.packageResolver.resolvePackage(alias)

            this.debug('Resolved package', { alias, resolution: packageResolution })

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
                args = args.slice(1)
            
            }

            // Determine if this is a feature-level alias (package has variants defined)
            const packageDef = config.nxPackages?.[packageResolution.packageName]
            const isFeatureLevel = !!(
                packageDef
                && typeof packageDef === 'object'
                && packageDef.variants
            )

            // Resolve target using new target resolution
            const targetResolution = this.targetResolver.resolveTarget(
                target,
                config,
                isFeatureLevel
            )
            const expandedTarget = targetResolution.target
            const targetFlags = targetResolution.flags
            
            // Check if this is a not-nx-target command BEFORE processing
            const isNotNxTarget = !!config.targets?.['not-nx-target']?.[target]

            // For feature-level aliases, we need to determine which project to run against
            if (isFeatureLevel) {

                const featureTarget = config['feature-nxTargets']?.[target]

                if (featureTarget) {

                    // Package has variants - use the run-from variant
                    packageResolution.variant = featureTarget['run-from']

                    // Extract package name without @fux/ prefix for string references
                    const basePackageName
                        = packageResolution.packageName.startsWith('@fux/')
                            ? packageResolution.packageName.substring(5) // Remove '@fux/' prefix
                            :   packageResolution.packageName

                    packageResolution.fullName = `@fux/${basePackageName}-${featureTarget['run-from']}`
                
                }
            
            }

            this.debug('Target extraction (pre-flag processing)', {
                original: target,
                expanded: expandedTarget,
                targetFlags,
            })

            // Get context-aware flags based on target
            const expandableFlags = this.getContextAwareFlags(config, target, expandedTarget)

            // Process flags and execute command
            return await this.processFlagsAndExecute(
                packageResolution,
                expandedTarget,
                targetFlags,
                args,
                config,
                expandableFlags,
                isNotNxTarget,
                target
            )
        
        } catch (err) {

            this.error('Error handling package alias:', err)
            return 1
        
        }
    
    }

    private async processFlagsAndExecute(
        packageResolution: any,
        target: string,
        targetFlags: string[],
        args: string[],
        config: AliasConfig,
        expandableFlags: Record<string, any>,
        isNotNxTarget?: boolean,
        originalTarget?: string
    ): Promise<number> {

        // Process env-setting flags first
        let processedArgs = args
        let expandedFlags: string[] = []

        if (config['env-setting-flags']) {

            const expansion = expandableProcessor.expandFlags(args, config['env-setting-flags'])

            processedArgs = expansion.remainingArgs
            expandedFlags = [
                ...expandedFlags,
                ...expansion.start,
                ...expansion.prefix,
                ...expansion.preArgs,
                ...expansion.suffix,
                ...expansion.end,
            ]
            this.processEnvironmentFlags(args)
        
        }

        // Process internal flags
        let timeoutMs: number | undefined = undefined

        if (config['internal-flags']) {

            const { remainingArgs, timeout } = this.processInternalFlags(processedArgs, config)

            processedArgs = remainingArgs
            timeoutMs = timeout
        
        }

        // Process expandable flags (including context-aware flags)
        if (expandableFlags && Object.keys(expandableFlags).length > 0) {

            this.debug('Processing expandable flags', { processedArgs, expandableFlags })
            try {

                const expansion = expandableProcessor.expandFlags(processedArgs, expandableFlags)

                this.debug('Expandable flags expansion result', { expansion })
                processedArgs = expansion.remainingArgs
                expandedFlags = [
                    ...expandedFlags,
                    ...expansion.start,
                    ...expansion.prefix,
                    ...expansion.preArgs,
                    ...expansion.suffix,
                    ...expansion.end,
                ]
                this.debug('Updated expanded flags', { expandedFlags, processedArgs })
            
            } catch (err) {

                this.error(
                    'Flag processing error:',
                    err instanceof Error ? err.message : String(err)
                )
                return 1
            
            }
        
        }

        // Combine all arguments: expanded flags + target flags + remaining args
        const finalArgs = [...expandedFlags, ...targetFlags, ...processedArgs]

        // Determine if this is a tool (direct string reference) or a package with variants
        const isTool = !packageResolution.variant // Tools don't have variants

        // Handle not-nx-target commands early
        if (isNotNxTarget && originalTarget) {

            const notNxTargetCommand = config.targets?.['not-nx-target']?.[originalTarget] || originalTarget

            // Execute not-nx-target command directly
            this.debug('Executing not-nx-target command', { target, expandedTarget: notNxTargetCommand, finalArgs })
            
            // Process template variables in the command
            const templateVariables = {
                value: finalArgs[0] || '', // First argument is the value to substitute
                nxPackages: packageResolution.fullName // The resolved package name
            }
            
            const processedCommand = TemplateUtils.expandTemplate(notNxTargetCommand, templateVariables)

            this.debug('Processed template command', { original: notNxTargetCommand, processed: processedCommand, variables: templateVariables })
            
            // Parse the processed command and arguments
            const commandParts = processedCommand.split(' ')
            const command = commandParts[0]
            const commandArgs = [...commandParts.slice(1), ...finalArgs.slice(1)] // Skip first arg as it's used for {{value}}
            
            return await commandExecution.runCommand(command, commandArgs, timeoutMs)
        
        }

        // Build and execute nx command
        let command: string
        let commandArgs: string[]

        if (isTool) {

            // For tools, use nx run @fux/package:target
            command = `nx run ${packageResolution.fullName}:${target} ${finalArgs.join(' ')}`.trim()
            commandArgs = ['run', `${packageResolution.fullName}:${target}`, ...finalArgs]
        
        } else {

            // For packages with variants, use nx target @fux/package-variant
            command = `nx ${target} ${packageResolution.fullName} ${finalArgs.join(' ')}`.trim()
            commandArgs = [target, packageResolution.fullName, ...finalArgs]
        
        }

        this.debug('Executing nx command', { command, isTool, packageResolution })

        return await commandExecution.runCommand('nx', commandArgs, timeoutMs)
    
    }

    private processInternalFlags(
        args: string[],
        config: AliasConfig
    ): { remainingArgs: string[]; timeout?: number } {

        const remainingArgs: string[] = []
        let timeout: number | undefined = undefined

        // Process internal flags using the expandable processor to handle mutations
        if (config['internal-flags']) {

            this.debug('Processing internal flags', {
                args,
                internalFlags: config['internal-flags'],
            })

            try {

                const expansion = expandableProcessor.expandFlags(args, config['internal-flags'])

                this.debug('Internal flags expansion result', { expansion })

                // Extract timeout from expanded flags
                const allExpandedFlags = [
                    ...expansion.start,
                    ...expansion.prefix,
                    ...expansion.preArgs,
                    ...expansion.suffix,
                    ...expansion.end,
                ]

                for (const flag of allExpandedFlags) {

                    if (flag.startsWith('--pae-execa-timeout=')) {

                        const timeoutValue = parseInt(flag.split('=')[1])

                        timeout = timeoutValue

                        // Show timeout message to user
                        const timeoutSeconds = Math.round(timeoutValue / 1000)

                        console.log(
                            `⏱️  PAE: Command timeout set to ${timeoutSeconds}s (${timeoutValue}ms)`
                        )
                        break
                    
                    }
                
                }

                // Return remaining args (internal flags are consumed)
                return { remainingArgs: expansion.remainingArgs, timeout }
            
            } catch (err) {

                this.error(
                    'Internal flag processing error:',
                    err instanceof Error ? err.message : String(err)
                )
                return { remainingArgs: args, timeout: undefined }
            
            }
        
        }

        // Fallback to old hardcoded logic if no internal-flags config
        for (const arg of args) {

            if (arg === '--help' || arg === '-h') {

                this.helpCommand.execute()
                process.exit(0)
            
            } else if (arg.startsWith('-sto=')) {

                const timeoutValue = parseInt(arg.split('=')[1])

                timeout
                    = timeoutValue >= 100 ? timeoutValue : parseInt(timeoutValue.toString() + '000')
            
            } else {

                remainingArgs.push(arg)
            
            }
        
        }

        return { remainingArgs, timeout }
    
    }

    private processEnvironmentFlags(args: string[]): void {

        for (const arg of args) {

            if (arg === '--pae-debug') {

                process.env.PAE_DEBUG = '1'
                this.debug('Debug mode enabled via --pae-debug flag')
            
            } else if (arg === '--pae-verbose') {

                process.env.PAE_VERBOSE = '1'
                this.debug('Verbose mode enabled via --pae-verbose flag')
            
            } else if (arg.startsWith('--pae-echo=')) {

                const variant = arg.split('=')[1]?.replace(/['"]/g, '') || ''

                process.env.PAE_ECHO = '1'
                process.env.PAE_ECHO_VARIANT = variant
                this.debug('Echo mode enabled', { variant })
            
            }
        
        }
    
    }

    private showAvailableAliases(config: AliasConfig): void {

        this.error('')
        this.error('Available aliases:')

        // Show package aliases
        const packageAliases = Object.keys(config.nxPackages || {})

        if (packageAliases.length > 0) {

            this.error('  Packages:', packageAliases.join(', '))
        
        }

        // Show feature aliases
        if (config['feature-nxTargets']) {

            this.error('  Features:', Object.keys(config['feature-nxTargets']).join(', '))
        
        }

        // Show expandable commands
        if (config['expandable-commands']) {

            this.error('  Commands:', Object.keys(config['expandable-commands']).join(', '))
        
        }

        this.error('')
        this.error('Use "pae help" for more information.')
    
    }

}
