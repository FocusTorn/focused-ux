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
        if (process.env.PAE_ECHO === '1') {
            // Print the command with -> prefix for echo mode
            console.log(`-> ${argv.join(' ')}`)
            return 0
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
            return variables[varName] || match
        })
    }

    static applyMutation(value: any, mutation: string): any {
        try {
            // Create a safe evaluation context with the value
            const context = { value }
            
            // Only replace 'value' with context.value, leave other identifiers as-is
            const mutatedExpression = mutation.replace(/\bvalue\b/g, 'context.value')
            
            // Evaluate the mutation expression
            return eval(`(function(context) { return ${mutatedExpression}; })(context)`)
        } catch (error) {
            console.warn(`Mutation failed for value "${value}" with expression "${mutation}":`, error)
            return value // Return original value if mutation fails
        }
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
