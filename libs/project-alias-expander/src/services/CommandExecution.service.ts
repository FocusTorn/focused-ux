import type { AliasConfig, AliasValue, ICommandExecutionService } from '../_types/index.js'
import { ProcessUtils, ConfigUtils } from './CommonUtils.service.js'
import { processPool, type ProcessResult, type ProcessMetrics } from './ProcessPool.service.js'

export function setChildProcessTracker(tracker: (childProcess: any) => void) {
    ProcessUtils.setChildProcessTracker(tracker)
}

export class CommandExecutionService implements ICommandExecutionService {

    async runNx(argv: string[], timeoutMs?: number): Promise<number> {
        return ProcessUtils.executeNxCommand(argv, timeoutMs)
    }

    async runCommand(command: string, args: string[], timeoutMs?: number): Promise<number> {
        return ProcessUtils.executeCommand(command, args, { timeout: timeoutMs })
    }

    /**
     * Execute command using the ProcessPool for better resource management
     */
    async executeWithPool(
        command: string, 
        args: string[], 
        options?: {
            timeout?: number
            stdio?: 'inherit' | 'pipe'
            cwd?: string
            env?: Record<string, string>
        }
    ): Promise<ProcessResult> {
        return processPool.execute(command, args, options)
    }

    /**
     * Get current process pool metrics
     */
    getProcessMetrics(): ProcessMetrics {
        return processPool.getMetrics()
    }

    /**
     * Shutdown the process pool gracefully
     */
    async shutdownProcessPool(): Promise<void> {
        return processPool.shutdown()
    }

    async runMany(runType: 'ext' | 'core' | 'all', targets: string[], flags: string[], config: AliasConfig): Promise<number> {
        const projects: string[] = []
        const suffix = runType === 'all' ? null : `-${runType}`

        for (const key of Object.keys(config['nxPackages'])) {
            const v = config['nxPackages'][key]
            const { project } = ConfigUtils.resolveProjectForAlias(v)

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

        // Use ProcessPool for parallel execution when possible
        if (projects.length > 1 && targets.length === 1) {
            return this.runManyParallel(projects, targets[0], flags)
        }

        // Fallback to sequential execution
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

    /**
     * Run multiple projects in parallel using ProcessPool
     */
    private async runManyParallel(projects: string[], target: string, flags: string[]): Promise<number> {
        const commands = projects.map(project => ({
            command: 'nx',
            args: [target, project, ...flags],
            options: {
                timeout: 300000, // 5 minutes per project
                stdio: 'inherit' as const
            }
        }))

        try {
            const results = await processPool.executeMany(commands)
            
            // Return the highest exit code (non-zero takes precedence)
            return results.reduce((maxCode, result) => {
                return result.exitCode !== 0 ? result.exitCode : maxCode
            }, 0)

        } catch (error) {
            console.error('Error running parallel commands:', error)
            return 1
        }
    }

}

// Export a singleton instance for convenience
export const commandExecution = new CommandExecutionService()