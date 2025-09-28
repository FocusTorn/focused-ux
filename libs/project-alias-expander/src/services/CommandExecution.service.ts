import { spawnSync } from 'child_process'
import type { AliasConfig, AliasValue, ICommandExecutionService } from '../_types/index.js'
import { resolveProjectForAlias } from '../config.js'

// Debug mode - check environment variable or debug flag
const DEBUG = process.env.PAE_DEBUG === '1' || process.argv.includes('-d') || process.argv.includes('--debug')

function debug(message: string, ...args: any[]) {
    if (DEBUG) {
        console.error(`[COMMAND DEBUG] ${message}`, ...args)
    }
}

export class CommandExecutionService implements ICommandExecutionService {
    runNx(argv: string[]): number {
        if (process.env.PAE_ECHO === '1') {
            // Print the command with -> prefix for echo mode
            console.log(`-> ${argv.join(' ')}`)
            return 0
        }

        // Check if the first argument is a PowerShell command (starts with $)
        if (argv[0]?.startsWith('$')) {
            // Execute PowerShell command
            const res = spawnSync('powershell', ['-Command', argv.join(' ')], {
                stdio: 'inherit',
                shell: false,
                timeout: 300000, // 5 minute timeout
                killSignal: 'SIGTERM'
            })
            return res.status ?? 1
        }

        // Check if the first argument is a start expansion (like timeout, node, etc.)
        const startCommands = ['timeout', 'npm', 'npx', 'yarn', 'pnpm']
        const hasStartCommand = startCommands.some(cmd => argv[0]?.startsWith(cmd))
        
        if (hasStartCommand) {
            // For start commands, execute them directly
            const res = spawnSync(argv[0], argv.slice(1), {
                stdio: 'inherit',
                shell: process.platform === 'win32',
                timeout: 300000, // 5 minute timeout
                killSignal: 'SIGTERM'
            })
            return res.status ?? 1
        }

        debug('CommandExecution: About to execute nx with argv:', argv)
        const res = spawnSync('nx', argv.slice(1), {
            stdio: 'inherit',
            shell: process.platform === 'win32',
            timeout: 300000, // 5 minute timeout
            killSignal: 'SIGTERM'
        })

        return res.status ?? 1
    }

    runCommand(command: string, args: string[]): number {
        const res = spawnSync(command, args, {
            stdio: 'inherit',
            shell: process.platform === 'win32',
            timeout: 300000, // 5 minute timeout
            killSignal: 'SIGTERM'
        })
        return res.status ?? 1
    }

    runMany(runType: 'ext' | 'core' | 'all', targets: string[], flags: string[], config: AliasConfig): number {
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
                const code = this.runNx(args)
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