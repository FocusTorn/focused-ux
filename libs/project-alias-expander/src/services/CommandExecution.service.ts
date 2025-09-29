import { execa } from 'execa'
import type { AliasConfig, AliasValue, ICommandExecutionService } from '../_types/index.js'
import { resolveProjectForAlias } from '../config.js'

// Track child processes for cleanup (will be set by CLI)
let trackChildProcess: ((childProcess: any) => void) | null = null

export function setChildProcessTracker(tracker: (childProcess: any) => void) {
    trackChildProcess = tracker
}

// Debug mode - check environment variable or debug flag
const DEBUG = process.env.PAE_DEBUG === '1' || process.argv.includes('-d') || process.argv.includes('--debug')

function debug(message: string, ...args: any[]) {
    if (DEBUG) {
        console.error(`[COMMAND DEBUG] ${message}`, ...args)
    }
}

export class CommandExecutionService implements ICommandExecutionService {

    async runNx(argv: string[], timeoutMs?: number): Promise<number> {
        if (process.env.PAE_ECHO === '1') {
            // Print the command with -> prefix for echo mode
            console.log(`-> ${argv.join(' ')}`)
            return 0
        }

        try {
            // Check if the first argument is a PowerShell command (starts with $)
            if (argv[0]?.startsWith('$')) {
                // Execute PowerShell command
                const childProcess = execa('powershell', ['-Command', argv.join(' ')], {
                    timeout: timeoutMs || 300000, // Use provided timeout or default 5 minutes
                    killSignal: 'SIGTERM',
                    stdio: 'inherit'
                })
                
                // Track the child process for cleanup
                if (trackChildProcess) {
                    trackChildProcess(childProcess)
                }

                const result = await childProcess
                return result.exitCode ?? 0
            }

            // Check if the first argument is a start expansion (like timeout, node, etc.)
            const startCommands = ['timeout', 'npm', 'npx', 'yarn', 'pnpm']
            const hasStartCommand = startCommands.some(cmd => argv[0]?.startsWith(cmd))
            
            if (hasStartCommand) {
                // For start commands, execute them directly
                const childProcess = execa(argv[0], argv.slice(1), {
                    timeout: timeoutMs || 300000, // Use provided timeout or default 5 minutes
                    killSignal: 'SIGTERM',
                    stdio: 'inherit'
                })
                
                // Track the child process for cleanup
                if (trackChildProcess) {
                    trackChildProcess(childProcess)
                }

                const result = await childProcess
                return result.exitCode ?? 0
            }

            debug('CommandExecution: About to execute nx with argv:', argv)

            const childProcess = execa('nx', argv.slice(1), {
                timeout: 300000, // 5 minute timeout
                killSignal: 'SIGTERM',
                stdio: 'inherit'
            })
            
            // Track the child process for cleanup
            if (trackChildProcess) {
                trackChildProcess(childProcess)
            }

            const result = await childProcess
            return result.exitCode ?? 0
        } catch (error: any) {
            debug('CommandExecution error:', error)
            return error.exitCode || 1
        }
    }

    async runCommand(command: string, args: string[]): Promise<number> {
        try {
            const childProcess = execa(command, args, {
                timeout: 300000, // 5 minute timeout
                killSignal: 'SIGTERM',
                stdio: 'inherit'
            })
            
            // Track the child process for cleanup
            if (trackChildProcess) {
                trackChildProcess(childProcess)
            }

            const result = await childProcess
            return result.exitCode ?? 0
        } catch (error: any) {
            debug('CommandExecution error:', error)
            return error.exitCode || 1
        }
    }

    async runMany(runType: 'ext' | 'core' | 'all', targets: string[], flags: string[], config: AliasConfig): Promise<number> {
        const projects: string[] = []
        const suffix = runType === 'all' ? null : `-${runType}`

        for (const key of Object.keys(config['nxPackages'])) {
            const v = config['nxPackages'][key]
            const { project } = resolveProjectForAlias(v)

            if (runType === 'all') {
                projects.push(project)
            } else if (typeof v === 'object' && v.suffix === runType) {
                projects.push(project)
            }
        }

        if (projects.length === 0) {
            console.error(`No ${runType} projects found.`)
            return 1
        }

        console.log(`Running ${targets.join(', ')} for ${projects.length} ${runType} projects:`)
        projects.forEach(p => console.log(`  ${p}`))

        let exitCode = 0

        for (const project of projects) {
            for (const target of targets) {
                const args = [target, project, ...flags]
                const code = await this.runNx(args)

                if (code !== 0) {
                    exitCode = code
                }
            }
        }

        return exitCode
    }

}

// Export a singleton instance for convenience
export const commandExecution = new CommandExecutionService()