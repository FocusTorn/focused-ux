import type { AliasConfig, AliasValue, ICommandExecutionService } from '../_types/index.js'
import { ProcessUtils, ConfigUtils } from './CommonUtils.service.js'

export function setChildProcessTracker(tracker: (childProcess: any) => void) {
    ProcessUtils.setChildProcessTracker(tracker)
}

export class CommandExecutionService implements ICommandExecutionService {

    async runNx(argv: string[], timeoutMs?: number): Promise<number> {
        return ProcessUtils.executeNxCommand(argv, timeoutMs)
    }

    async runCommand(command: string, args: string[]): Promise<number> {
        return ProcessUtils.executeCommand(command, args)
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