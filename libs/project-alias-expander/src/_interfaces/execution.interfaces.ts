// Execution interfaces - consolidated execution and shell interfaces
import type { AliasConfig } from '../_types/index.js'
import type { ShellDetectionResult, ShellType } from '../_types/index.js'

// Command execution service interfaces
export interface ICommandExecutionService {
    runNx(argv: string[]): Promise<number>
    runCommand(command: string, args: string[]): Promise<number>
    runMany(runType: 'ext' | 'core' | 'all', targets: string[], flags: string[], config: AliasConfig): Promise<number>
}

// Shell detection interfaces
export interface IShellDetector {
    detectShell(): ShellDetectionResult
    detectShellType(): ShellType
}