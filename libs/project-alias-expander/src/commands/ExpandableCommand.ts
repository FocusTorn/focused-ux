import type { AliasConfig } from '../_types/index.js'
import { expandableProcessor } from '../services/index.js'

export class ExpandableCommand {

    private debug: (message: string, ...args: unknown[]) => void

    constructor(debug: (message: string, ...args: unknown[]) => void) {
        this.debug = debug
    }

    async execute(alias: string, args: string[], config: AliasConfig): Promise<number> {
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

}
