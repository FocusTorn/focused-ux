// Execution interfaces - consolidated execution and shell interfaces
import type { AliasConfig } from '../_types/index.js'
import type { ShellDetectionResult, ShellType } from '../_types/index.js'
import type {
    ProcessResult,
    ProcessPoolConfig,
    ProcessMetrics,
} from '../services/ProcessPool.service.js'

// Command execution service interfaces
export interface ICommandExecutionService {
    runCommand(command: string, args: string[], timeoutMs?: number): Promise<number>
    runMany(
        runType: 'ext' | 'core' | 'all',
        targets: string[],
        flags: string[],
        config: AliasConfig
    ): Promise<number>
    executeWithPool(
        command: string,
        args: string[],
        options?: {
            timeout?: number
            stdio?: 'inherit' | 'pipe'
            cwd?: string
            env?: Record<string, string>
        }
    ): Promise<ProcessResult>
    getProcessMetrics(): ProcessMetrics
    shutdownProcessPool(): Promise<void>
}

// Shell detection interfaces
export interface IShellDetector {
    detectShell(): ShellDetectionResult
    detectShellType(): ShellType
}

// Process pool interfaces
export interface IProcessPool {
    execute(
        command: string,
        args: string[],
        options?: {
            timeout?: number
            stdio?: 'inherit' | 'pipe'
            cwd?: string
            env?: Record<string, string>
        }
    ): Promise<ProcessResult>
    executeMany(
        commands: Array<{
            command: string
            args: string[]
            options?: {
                timeout?: number
                stdio?: 'inherit' | 'pipe'
                cwd?: string
                env?: Record<string, string>
            }
        }>
    ): Promise<ProcessResult[]>
    getMetrics(): ProcessMetrics
    getActiveProcessCount(): number
    isAtCapacity(): boolean
    shutdown(timeoutMs?: number): Promise<void>
    forceKillAll(): void
}
