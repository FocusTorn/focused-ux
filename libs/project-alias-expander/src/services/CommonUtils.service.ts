// Centralized error handling and common utilities
import { execa } from 'execa'

// Debug mode - check environment variable or debug flag
const DEBUG = process.env.PAE_DEBUG === '1' || process.argv.includes('-d') || process.argv.includes('--debug')

export function debug(message: string, ...args: any[]) {
    if (DEBUG) {
        console.error(`[PAE DEBUG] ${message}`, ...args)
    }
}

// Centralized error handling
export class ErrorHandler {

    static handleExecutionError(error: any, context: string): number {
        debug(`${context} error:`, error)
        return error.exitCode || 1
    }

    static handleConfigError(error: any, context: string): never {
        console.error(`Configuration error in ${context}:`, error)
        throw error
    }

    static handleTemplateError(error: any, template: string, variables: Record<string, string>): string {
        console.warn(`Template processing failed for "${template}" with variables:`, variables, error)
        return template // Return original template if processing fails
    }

}

// Common process execution utilities
export class ProcessUtils {

    // Track child processes for cleanup (will be set by CLI)
    private static trackChildProcess: ((childProcess: any) => void) | null = null

    static setChildProcessTracker(tracker: (childProcess: any) => void) {
        ProcessUtils.trackChildProcess = tracker
    }

    static async executeCommand(
        command: string,
        args: string[],
        options: { timeout?: number; stdio?: 'inherit' | 'pipe' } = {}
    ): Promise<number> {
        const { timeout = 300000, stdio = 'inherit' } = options

        try {
            const childProcess = execa(command, args, {
                timeout,
                killSignal: 'SIGTERM',
                stdio
            })
            
            // Track the child process for cleanup
            if (ProcessUtils.trackChildProcess) {
                ProcessUtils.trackChildProcess(childProcess)
            }

            const result = await childProcess

            return result.exitCode ?? 0
        } catch (error: any) {
            return ErrorHandler.handleExecutionError(error, 'ProcessUtils.executeCommand')
        }
    }

    static async executeNxCommand(argv: string[], timeoutMs?: number): Promise<number> {
        // Handle echo modes - output as they occur
        if (process.env.PAE_ECHO === '1' || process.env.PAE_ECHO_X === '1') {
            const echoVariant = process.env.PAE_ECHO_VARIANT
            const command = argv.join(' ')
            
            // Output echo variants as they occur
            if (!echoVariant) {
                // Show all variants
                if (process.env.PAE_SHORT_IN) {
                    console.log(`[short-in] -> ${process.env.PAE_SHORT_IN}`)
                }
                if (process.env.PAE_SHORT_OUT) {
                    console.log(`[short-out] -> ${process.env.PAE_SHORT_OUT}`)
                }
                if (process.env.PAE_GLOBAL_IN) {
                    console.log(`[global-in] -> ${process.env.PAE_GLOBAL_IN}`)
                }
                console.log(`[global-out] -> ${command}`)
            } else {
                // Handle specific echo variants
                switch (echoVariant) {
                    case 'short-in':
                        if (process.env.PAE_SHORT_IN) {
                            console.log(`[short-in] -> ${process.env.PAE_SHORT_IN}`)
                        }
                        break
                    case 'short-out':
                        if (process.env.PAE_SHORT_OUT) {
                            console.log(`[short-out] -> ${process.env.PAE_SHORT_OUT}`)
                        }
                        break
                    case 'global-in':
                        if (process.env.PAE_GLOBAL_IN) {
                            console.log(`[global-in] -> ${process.env.PAE_GLOBAL_IN}`)
                        }
                        break
                    case 'global-out':
                        console.log(`[global-out] -> ${command}`)
                        break
                    default:
                        // Unknown variant, show all
                        if (process.env.PAE_SHORT_IN) {
                            console.log(`[short-in] -> ${process.env.PAE_SHORT_IN}`)
                        }
                        if (process.env.PAE_SHORT_OUT) {
                            console.log(`[short-out] -> ${process.env.PAE_SHORT_OUT}`)
                        }
                        if (process.env.PAE_GLOBAL_IN) {
                            console.log(`[global-in] -> ${process.env.PAE_GLOBAL_IN}`)
                        }
                        console.log(`[global-out] -> ${command}`)
                        break
                }
            }
            
            // If PAE_ECHO_X is set, continue execution; otherwise exit
            if (process.env.PAE_ECHO_X === '1') {
                // Continue with normal execution
            } else {
                return 0
            }
        }

        try {
            // Check if the first argument is a PowerShell command (starts with $)
            if (argv[0]?.startsWith('$')) {
                return ProcessUtils.executeCommand('powershell', ['-Command', argv.join(' ')], { timeout: timeoutMs })
            }

            // Check if the first argument is a start expansion (like timeout, node, etc.)
            const startCommands = ['timeout', 'npm', 'npx', 'yarn', 'pnpm']
            const hasStartCommand = startCommands.some(cmd => argv[0]?.startsWith(cmd))
            
            if (hasStartCommand) {
                return ProcessUtils.executeCommand(argv[0], argv.slice(1), { timeout: timeoutMs })
            }

            debug('ProcessUtils: About to execute nx with argv:', argv)
            return ProcessUtils.executeCommand('nx', argv.slice(1), { timeout: timeoutMs })
        } catch (error: any) {
            return ErrorHandler.handleExecutionError(error, 'ProcessUtils.executeNxCommand')
        }
    }

}

// Common template processing utilities
export class TemplateUtils {

    static expandTemplate(template: string, variables: Record<string, string>): string {
        return template.replace(/\{(\w+)\}/g, (match, varName) => {
            const value = variables[varName]
            // If value is undefined, null, or empty string, keep the original placeholder
            if (value === undefined || value === null || value === '') {
                return match
            }
            return value
        })
    }

    static applyMutation(value: any, mutation: string): any {
        try {
            // Handle PowerShell-style -replace operations
            if (mutation.includes('-replace')) {
                return this.applyPowerShellReplacements(value, mutation)
            }
            
            // Handle common JavaScript expressions without eval()
            return this.evaluateExpression(value, mutation)
        } catch (error) {
            console.warn(`Mutation failed for value "${value}" with expression "${mutation}":`, error)
            return value // Return original value if mutation fails
        }
    }

    private static evaluateExpression(value: any, expression: string): any {
        // Handle common patterns without using eval()
        
        // Pattern: value >= 100 ? value : parseInt(value.toString() + '000')
        if (expression.includes('value >= 100 ? value : parseInt(value.toString() + \'000\')')) {
            return value >= 100 ? value : parseInt(value.toString() + '000')
        }
        
        // Pattern: Math.round(parseFloat(value) || 0)
        if (expression.includes('Math.round(parseFloat(value) || 0)')) {
            return Math.round(parseFloat(value) || 0)
        }
        
        // Pattern: Math.round(parseFloat(bailOn) || 0) - handle variable name substitution
        if (expression.includes('Math.round(parseFloat(') && expression.includes('|| 0)')) {
            const match = expression.match(/Math\.round\(parseFloat\((\w+)\) \|\| 0\)/)
            if (match) {
                return Math.round(parseFloat(value) || 0)
            }
        }
        
        // Pattern: time >= 100 ? time : parseInt(time.toString() + '000') - handle variable name substitution
        if (expression.includes('>= 100 ?') && expression.includes('parseInt(') && expression.includes('+ \'000\')')) {
            return value >= 100 ? value : parseInt(value.toString() + '000')
        }
        
        // For any other expressions, log a warning and return the original value
        console.warn(`Unsupported mutation expression: "${expression}". Please add support for this pattern.`)
        return value
    }

    static applyPowerShellReplacements(value: any, mutation: string): any {
        let result = String(value)
        
        console.log(`[DEBUG] applyPowerShellReplacements: value="${value}", mutation="${mutation}"`)
        
        // Parse PowerShell-style -replace operations
        // Format: "value -replace 'pattern', 'replacement' -replace 'pattern2', 'replacement2'"
        const replaceRegex = /-replace\s+'([^']+)',\s*'([^']*)'/g
        let match
        
        while ((match = replaceRegex.exec(mutation)) !== null) {
            const pattern = match[1]
            const replacement = match[2]
            
            console.log(`[DEBUG] Processing replacement: pattern="${pattern}", replacement="${replacement}"`)
            
            // Convert PowerShell regex to JavaScript regex
            // PowerShell uses ^ and $ for start/end, JavaScript uses ^ and $
            const jsPattern = pattern.replace(/\^/g, '^').replace(/\$/g, '$')
            
            try {
                const regex = new RegExp(jsPattern)
                const beforeReplace = result
                result = result.replace(regex, replacement)
                console.log(`[DEBUG] Replacement result: "${beforeReplace}" -> "${result}"`)
            } catch (regexError) {
                console.warn(`Invalid regex pattern "${pattern}":`, regexError)
            }
        }
        
        console.log(`[DEBUG] Final result: "${result}"`)
        return result
    }

    static mergeTemplateVariables(baseVariables: Record<string, string>, templateDefaults?: Record<string, string>): Record<string, string> {
        const templateVariables = { ...baseVariables }

        if (templateDefaults) {
            // Check for conflicts between top-level and template-level defaults
            for (const key of Object.keys(templateDefaults)) {
                if (key in templateVariables) {
                    throw new Error(`Variable conflict: '${key}' is defined in both top-level and template-level defaults`)
                }
            }
            // Merge template defaults into variables
            Object.assign(templateVariables, templateDefaults)
        }

        return templateVariables
    }

}

// Common configuration utilities
export class ConfigUtils {

    static resolveProjectForAlias(aliasValue: string | { name: string, suffix?: 'core' | 'ext', full?: boolean }): { project: string, isFull: boolean } {
        if (typeof aliasValue === 'string') {
            const project = aliasValue.startsWith('@fux/') ? aliasValue : `@fux/${aliasValue}`

            return { project, isFull: false }
        }
        
        const { name, suffix, full } = aliasValue

        if (full) {
            // When full is true, we still need to consider the suffix
            const projectName = suffix ? `${name}-${suffix}` : name
            const project = projectName.startsWith('@fux/') ? projectName : `@fux/${projectName}`

            return { project, isFull: true }
        }
        
        const projectName = suffix ? `${name}-${suffix}` : name
        const project = projectName.startsWith('@fux/') ? projectName : `@fux/${projectName}`

        return { project, isFull: false }
    }

}
