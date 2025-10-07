import { spawn, ChildProcess } from 'child_process'
import { execa } from 'execa'

/**
 * Process execution result with enhanced metadata
 */
export interface ProcessResult {
    exitCode: number
    stdout?: string
    stderr?: string
    duration: number
    pid: number
    command: string
    args: string[]
}

/**
 * Process pool configuration
 */
export interface ProcessPoolConfig {
    maxConcurrent: number
    defaultTimeout: number
    killSignal: NodeJS.Signals
    enableMetrics: boolean
}

/**
 * Process metrics for monitoring
 */
export interface ProcessMetrics {
    totalExecutions: number
    activeProcesses: number
    completedProcesses: number
    failedProcesses: number
    averageExecutionTime: number
    maxConcurrentReached: boolean
}

/**
 * Active process tracking
 */
interface ActiveProcess {
    process: any // execa child process
    startTime: number
    command: string
    args: string[]
    timeout?: NodeJS.Timeout
}

/**
 * ProcessPool - Advanced process management with concurrency control and resource pooling
 *
 * Features:
 * - Concurrency control with configurable limits
 * - Automatic process cleanup and resource management
 * - Process metrics and monitoring
 * - Graceful shutdown handling
 * - Timeout management with automatic cleanup
 * - Process leak prevention
 */
export class ProcessPool {
    private activeProcesses = new Map<number, ActiveProcess>()
    private config: ProcessPoolConfig
    private metrics: ProcessMetrics
    private isShuttingDown = false
    private shutdownPromise: Promise<void> | null = null

    constructor(config: Partial<ProcessPoolConfig> = {}) {
        this.config = {
            maxConcurrent: config.maxConcurrent ?? 5,
            defaultTimeout: config.defaultTimeout ?? 300000, // 5 minutes
            killSignal: config.killSignal ?? 'SIGTERM',
            enableMetrics: config.enableMetrics ?? true,
        }

        this.metrics = {
            totalExecutions: 0,
            activeProcesses: 0,
            completedProcesses: 0,
            failedProcesses: 0,
            averageExecutionTime: 0,
            maxConcurrentReached: false,
        }

        // Set up graceful shutdown handlers
        this.setupShutdownHandlers()
    }

    /**
     * Execute a command with concurrency control and resource management
     */
    async execute(
        command: string,
        args: string[],
        options: {
            timeout?: number
            stdio?: 'inherit' | 'pipe'
            cwd?: string
            env?: Record<string, string>
        } = {}
    ): Promise<ProcessResult> {
        if (this.isShuttingDown) {
            throw new Error('ProcessPool is shutting down, cannot execute new commands')
        }

        // Wait for available slot if at capacity
        if (this.activeProcesses.size >= this.config.maxConcurrent) {
            await this.waitForAvailableSlot()
        }

        const startTime = Date.now()
        const timeout = options.timeout ?? this.config.defaultTimeout
        const stdio = options.stdio ?? 'inherit'

        try {
            // Create the process
            const childProcess = execa(command, args, {
                timeout,
                killSignal: this.config.killSignal,
                stdio,
                cwd: options.cwd,
                env: options.env,
            })

            // Set up timeout handling
            const timeoutHandle =
                timeout > 0 ?
                    setTimeout(() => {
                        this.handleProcessTimeout(childProcess, command, args)
                    }, timeout)
                :   undefined

            // Track the process
            const activeProcess: ActiveProcess = {
                process: childProcess,
                startTime,
                command,
                args,
                timeout: timeoutHandle,
            }

            this.activeProcesses.set(childProcess.pid!, activeProcess)
            this.updateMetrics('start')

            // Set up cleanup handlers
            childProcess.on('exit', (code, signal) => {
                this.handleProcessExit(childProcess.pid!, code, signal, startTime)
            })

            childProcess.on('error', (error) => {
                this.handleProcessError(childProcess.pid!, error, startTime)
            })

            // Wait for completion
            const result = await childProcess
            const duration = Date.now() - startTime

            // Clean up timeout
            if (timeoutHandle) {
                clearTimeout(timeoutHandle)
            }

            this.updateMetrics('complete', duration)

            return {
                exitCode: result.exitCode ?? 0,
                stdout: result.stdout,
                stderr: result.stderr,
                duration,
                pid: childProcess.pid!,
                command,
                args,
            }
        } catch (error: any) {
            const duration = Date.now() - startTime

            this.updateMetrics('fail', duration)

            // Clean up the process if it's still tracked
            // Note: childProcess is not available in catch block, so we can't clean up here
            // The process will be cleaned up by the exit/error handlers

            throw error
        }
    }

    /**
     * Execute multiple commands in parallel (up to concurrency limit)
     */
    async executeMany(
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
    ): Promise<ProcessResult[]> {
        const results: ProcessResult[] = []
        const promises: Promise<ProcessResult>[] = []

        for (const cmd of commands) {
            const promise = this.execute(cmd.command, cmd.args, cmd.options)

            promises.push(promise)
        }

        // Wait for all to complete
        const settledResults = await Promise.allSettled(promises)

        for (const result of settledResults) {
            if (result.status === 'fulfilled') {
                results.push(result.value)
            } else {
                // Create a failed result for rejected promises
                results.push({
                    exitCode: 1,
                    duration: 0,
                    pid: 0,
                    command: 'unknown',
                    args: [],
                    stderr: result.reason?.message ?? 'Unknown error',
                })
            }
        }

        return results
    }

    /**
     * Get current process metrics
     */
    getMetrics(): ProcessMetrics {
        return { ...this.metrics }
    }

    /**
     * Get active process count
     */
    getActiveProcessCount(): number {
        return this.activeProcesses.size
    }

    /**
     * Check if pool is at capacity
     */
    isAtCapacity(): boolean {
        return this.activeProcesses.size >= this.config.maxConcurrent
    }

    /**
     * Gracefully shutdown the process pool
     */
    async shutdown(timeoutMs: number = 10000): Promise<void> {
        if (this.isShuttingDown) {
            return this.shutdownPromise!
        }

        this.isShuttingDown = true
        this.shutdownPromise = this.performShutdown(timeoutMs)
        return this.shutdownPromise
    }

    /**
     * Force kill all active processes
     */
    forceKillAll(): void {
        for (const [pid, activeProcess] of this.activeProcesses) {
            try {
                if (activeProcess.timeout) {
                    clearTimeout(activeProcess.timeout)
                }
                if (!activeProcess.process.killed) {
                    activeProcess.process.kill('SIGKILL')
                }
            } catch (error) {
                console.warn(`Failed to kill process ${pid}:`, error)
            }
        }
        this.activeProcesses.clear()
    }

    /**
     * Wait for an available slot in the process pool
     */
    private async waitForAvailableSlot(): Promise<void> {
        return new Promise((resolve) => {
            const checkSlot = () => {
                if (this.activeProcesses.size < this.config.maxConcurrent) {
                    resolve()
                } else {
                    setTimeout(checkSlot, 100)
                }
            }

            checkSlot()
        })
    }

    /**
     * Handle process exit
     */
    private handleProcessExit(
        pid: number,
        code: number | null,
        signal: string | null,
        startTime: number
    ): void {
        const activeProcess = this.activeProcesses.get(pid)

        if (!activeProcess) return

        // Clean up timeout
        if (activeProcess.timeout) {
            clearTimeout(activeProcess.timeout)
        }

        // Remove from active processes
        this.activeProcesses.delete(pid)

        const duration = Date.now() - startTime

        this.updateMetrics('complete', duration)

        if (this.config.enableMetrics) {
            console.debug(
                `Process ${pid} exited with code ${code}, signal ${signal}, duration ${duration}ms`
            )
        }
    }

    /**
     * Handle process error
     */
    private handleProcessError(pid: number, error: Error, startTime: number): void {
        const activeProcess = this.activeProcesses.get(pid)

        if (!activeProcess) return

        // Clean up timeout
        if (activeProcess.timeout) {
            clearTimeout(activeProcess.timeout)
        }

        // Remove from active processes
        this.activeProcesses.delete(pid)

        const duration = Date.now() - startTime

        this.updateMetrics('fail', duration)

        if (this.config.enableMetrics) {
            console.debug(`Process ${pid} failed:`, error.message)
        }
    }

    /**
     * Handle process timeout
     */
    private handleProcessTimeout(process: any, command: string, args: string[]): void {
        try {
            if (!process.killed) {
                process.kill(this.config.killSignal)
                console.warn(`Process timed out and was killed: ${command} ${args.join(' ')}`)
            }
        } catch (error) {
            console.warn(`Failed to kill timed out process:`, error)
        }
    }

    /**
     * Update process metrics
     */
    private updateMetrics(event: 'start' | 'complete' | 'fail', duration?: number): void {
        if (!this.config.enableMetrics) return

        switch (event) {
            case 'start':
                this.metrics.totalExecutions++
                this.metrics.activeProcesses = this.activeProcesses.size
                if (this.activeProcesses.size >= this.config.maxConcurrent) {
                    this.metrics.maxConcurrentReached = true
                }
                break

            case 'complete':
                this.metrics.completedProcesses++
                this.metrics.activeProcesses = this.activeProcesses.size
                if (duration) {
                    this.metrics.averageExecutionTime =
                        (this.metrics.averageExecutionTime * (this.metrics.completedProcesses - 1) +
                            duration) /
                        this.metrics.completedProcesses
                }
                break

            case 'fail':
                this.metrics.failedProcesses++
                this.metrics.activeProcesses = this.activeProcesses.size
                break
        }
    }

    /**
     * Set up graceful shutdown handlers
     */
    private setupShutdownHandlers(): void {
        // Only set up in production, not during testing
        if (process.env.NODE_ENV === 'test' || process.env.VITEST === 'true') {
            return
        }

        const gracefulShutdown = async (signal: string) => {
            console.log(`Received ${signal}, shutting down ProcessPool gracefully...`)
            await this.shutdown(5000) // 5 second timeout
            process.exit(0)
        }

        process.on('SIGTERM', () => gracefulShutdown('SIGTERM'))
        process.on('SIGINT', () => gracefulShutdown('SIGINT'))
        process.on('SIGHUP', () => gracefulShutdown('SIGHUP'))
    }

    /**
     * Perform the actual shutdown
     */
    private async performShutdown(timeoutMs: number): Promise<void> {
        if (this.activeProcesses.size === 0) {
            return
        }

        console.log(`Shutting down ${this.activeProcesses.size} active processes...`)

        // First, try graceful shutdown
        const shutdownPromises = Array.from(this.activeProcesses.values()).map(
            async (activeProcess) => {
                try {
                    if (!activeProcess.process.killed) {
                        activeProcess.process.kill('SIGTERM')
                    }
                } catch (error) {
                    console.warn(`Failed to gracefully shutdown process:`, error)
                }
            }
        )

        // Wait for graceful shutdown with timeout
        const shutdownPromise = Promise.allSettled(shutdownPromises)
        const timeoutPromise = new Promise<void>((resolve) => {
            setTimeout(() => {
                console.log('Graceful shutdown timeout reached, force killing processes...')
                this.forceKillAll()
                resolve()
            }, timeoutMs)
        })

        await Promise.race([shutdownPromise, timeoutPromise])
        console.log('ProcessPool shutdown complete')
    }
}

// Export singleton instance for convenience
export const processPool = new ProcessPool({
    maxConcurrent: 5,
    defaultTimeout: 300000,
    enableMetrics: true,
})
