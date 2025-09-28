// Command execution service interfaces
import type { AliasConfig } from '../_types/index.js'

export interface ICommandExecutionService {
    runNx(argv: string[]): number
    runCommand(command: string, args: string[]): number
    runMany(runType: 'ext' | 'core' | 'all', targets: string[], flags: string[], config: AliasConfig): number
}
