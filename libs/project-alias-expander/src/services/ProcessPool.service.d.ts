/**
 * @fileoverview ProcessPool - Advanced process management with concurrency control and resource pooling
 * 
 * The ProcessPool provides sophisticated process management capabilities including:
 * - Concurrency control with configurable limits
 * - Automatic process cleanup and resource management
 * - Process metrics and monitoring
 * - Graceful shutdown handling
 * - Timeout management with automatic cleanup
 * - Process leak prevention
 * 
 * @example
 * ```typescript
 * import { ProcessPool } from './ProcessPool.service.js'
 * 
 * const pool = new ProcessPool({
 *     maxConcurrent: 5,
 *     defaultTimeout: 300000,
 *     enableMetrics: true
 * })
 * 
 * // Execute a single command
 * const result = await pool.execute('echo', ['hello world'], {
 *     stdio: 'pipe',
 *     timeout: 5000
 * })
 * 
 * // Execute multiple commands in parallel
 * const results = await pool.executeMany([
 *     { command: 'echo', args: ['hello'], options: { stdio: 'pipe' } },
 *     { command: 'echo', args: ['world'], options: { stdio: 'pipe' } }
 * ])
 * 
 * // Get metrics
 * const metrics = pool.getMetrics()
 * console.log(`Total executions: ${metrics.totalExecutions}`)
 * 
 * // Graceful shutdown
 * await pool.shutdown()
 * ```
 * 
 * @author FocusedUX Team
 * @version 1.0.0
 */

/**
 * Process execution result with enhanced metadata
 * 
 * @interface ProcessResult
 * @property {number} exitCode - The exit code of the process (0 for success)
 * @property {string} [stdout] - Standard output from the process
 * @property {string} [stderr] - Standard error from the process
 * @property {number} duration - Execution duration in milliseconds
 * @property {number} pid - Process ID
 * @property {string} command - The command that was executed
 * @property {string[]} args - Command arguments
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
 * Process pool configuration options
 * 
 * @interface ProcessPoolConfig
 * @property {number} [maxConcurrent=5] - Maximum number of concurrent processes
 * @property {number} [defaultTimeout=300000] - Default timeout in milliseconds (5 minutes)
 * @property {NodeJS.Signals} [killSignal='SIGTERM'] - Signal to use for process termination
 * @property {boolean} [enableMetrics=true] - Whether to enable performance metrics
 */
export interface ProcessPoolConfig {
    maxConcurrent: number
    defaultTimeout: number
    killSignal: NodeJS.Signals
    enableMetrics: boolean
}

/**
 * Process metrics for monitoring and performance analysis
 * 
 * @interface ProcessMetrics
 * @property {number} totalExecutions - Total number of processes executed
 * @property {number} activeProcesses - Number of currently active processes
 * @property {number} completedProcesses - Number of successfully completed processes
 * @property {number} failedProcesses - Number of failed processes
 * @property {number} averageExecutionTime - Average execution time in milliseconds
 * @property {boolean} maxConcurrentReached - Whether the concurrency limit was ever reached
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
 * Active process tracking information
 * 
 * @interface ActiveProcess
 * @property {ExecaChildProcess} process - The child process instance
 * @property {number} startTime - Process start time timestamp
 * @property {string} command - The command being executed
 * @property {string[]} args - Command arguments
 * @property {NodeJS.Timeout} [timeout] - Timeout handle for automatic cleanup
 */
interface ActiveProcess {
    process: ExecaChildProcess
    startTime: number
    command: string
    args: string[]
    timeout?: NodeJS.Timeout
}

/**
 * ProcessPool - Advanced process management with concurrency control and resource pooling
 * 
 * The ProcessPool class provides sophisticated process management capabilities designed for
 * high-performance CLI tools and applications that need to execute multiple processes
 * efficiently while maintaining resource control and preventing process leaks.
 * 
 * Key Features:
 * - Concurrency control with configurable limits
 * - Automatic process cleanup and resource management
 * - Process metrics and monitoring
 * - Graceful shutdown handling
 * - Timeout management with automatic cleanup
 * - Process leak prevention
 * - Parallel execution support
 * 
 * @class ProcessPool
 * @example
 * ```typescript
 * const pool = new ProcessPool({
 *     maxConcurrent: 10,
 *     defaultTimeout: 60000,
 *     enableMetrics: true
 * })
 * 
 * // Execute commands with automatic resource management
 * const result = await pool.execute('npm', ['install'], {
 *     timeout: 300000,
 *     stdio: 'inherit'
 * })
 * ```
 */
export class ProcessPool {
    private activeProcesses = new Map<number, ActiveProcess>()
    private config: ProcessPoolConfig
    private metrics: ProcessMetrics
    private isShuttingDown = false
    private shutdownPromise: Promise<void> | null = null

    /**
     * Creates a new ProcessPool instance
     * 
     * @param {Partial<ProcessPoolConfig>} [config={}] - Configuration options
     * @example
     * ```typescript
     * const pool = new ProcessPool({
     *     maxConcurrent: 5,
     *     defaultTimeout: 300000,
     *     killSignal: 'SIGTERM',
     *     enableMetrics: true
     * })
     * ```
     */
    constructor(config: Partial<ProcessPoolConfig> = {}) {
        this.config = {
            maxConcurrent: config.maxConcurrent ?? 5,
            defaultTimeout: config.defaultTimeout ?? 300000, // 5 minutes
            killSignal: config.killSignal ?? 'SIGTERM',
            enableMetrics: config.enableMetrics ?? true
        }

        this.metrics = {
            totalExecutions: 0,
            activeProcesses: 0,
            completedProcesses: 0,
            failedProcesses: 0,
            averageExecutionTime: 0,
            maxConcurrentReached: false
        }

        // Set up graceful shutdown handlers
        this.setupShutdownHandlers()
    }

    /**
     * Execute a command with concurrency control and resource management
     * 
     * This method handles the complete lifecycle of process execution including:
     * - Concurrency control (waiting for available slots)
     * - Process creation and tracking
     * - Timeout management
     * - Automatic cleanup
     * - Error handling
     * 
     * @param {string} command - The command to execute
     * @param {string[]} args - Command arguments
     * @param {Object} [options={}] - Execution options
     * @param {number} [options.timeout] - Timeout in milliseconds (overrides default)
     * @param {'inherit'|'pipe'} [options.stdio='inherit'] - Standard I/O handling
     * @param {string} [options.cwd] - Working directory for the process
     * @param {Record<string, string>} [options.env] - Environment variables
     * @returns {Promise<ProcessResult>} Process execution result with metadata
     * 
     * @throws {Error} When ProcessPool is shutting down
     * @throws {Error} When process execution fails
     * 
     * @example
     * ```typescript
     * // Simple command execution
     * const result = await pool.execute('echo', ['hello world'], {
     *     stdio: 'pipe'
     * })
     * console.log(result.stdout) // "hello world"
     * 
     * // Command with timeout and custom environment
     * const result = await pool.execute('npm', ['install'], {
     *     timeout: 300000,
     *     stdio: 'inherit',
     *     cwd: '/path/to/project',
     *     env: { NODE_ENV: 'production' }
     * })
     * ```
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
                env: options.env
            })

            // Set up timeout handling
            const timeoutHandle = timeout > 0 ? setTimeout(() => {
                this.handleProcessTimeout(childProcess, command, args)
            }, timeout) : undefined

            // Track the process
            const activeProcess: ActiveProcess = {
                process: childProcess,
                startTime,
                command,
                args,
                timeout: timeoutHandle
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
                args
            }

        } catch (error: any) {
            const duration = Date.now() - startTime
            this.updateMetrics('fail', duration)
            
            // Clean up the process if it's still tracked
            const activeProcess = this.activeProcesses.get(childProcess.pid!)
            if (activeProcess?.timeout) {
                clearTimeout(activeProcess.timeout)
            }
            this.activeProcesses.delete(childProcess.pid!)

            throw error
        }
    }

    /**
     * Execute multiple commands in parallel (up to concurrency limit)
     * 
     * This method efficiently executes multiple commands while respecting the
     * concurrency limit. Commands are executed in parallel up to the maximum
     * concurrent limit, with additional commands queued until slots become available.
     * 
     * @param {Array} commands - Array of command specifications
     * @param {string} commands[].command - The command to execute
     * @param {string[]} commands[].args - Command arguments
     * @param {Object} [commands[].options] - Execution options for this command
     * @returns {Promise<ProcessResult[]>} Array of process execution results
     * 
     * @example
     * ```typescript
     * const commands = [
     *     { command: 'echo', args: ['hello'], options: { stdio: 'pipe' } },
     *     { command: 'echo', args: ['world'], options: { stdio: 'pipe' } },
     *     { command: 'echo', args: ['test'], options: { stdio: 'pipe' } }
     * ]
     * 
     * const results = await pool.executeMany(commands)
     * results.forEach(result => {
     *     console.log(`${result.command}: ${result.stdout}`)
     * })
     * ```
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
                    stderr: result.reason?.message ?? 'Unknown error'
                })
            }
        }

        return results
    }

    /**
     * Get current process metrics
     * 
     * Returns a snapshot of the current process pool metrics for monitoring
     * and performance analysis.
     * 
     * @returns {ProcessMetrics} Current process metrics
     * 
     * @example
     * ```typescript
     * const metrics = pool.getMetrics()
     * console.log(`Total executions: ${metrics.totalExecutions}`)
     * console.log(`Active processes: ${metrics.activeProcesses}`)
     * console.log(`Average execution time: ${metrics.averageExecutionTime}ms`)
     * ```
     */
    getMetrics(): ProcessMetrics {
        return { ...this.metrics }
    }

    /**
     * Get active process count
     * 
     * @returns {number} Number of currently active processes
     */
    getActiveProcessCount(): number {
        return this.activeProcesses.size
    }

    /**
     * Check if pool is at capacity
     * 
     * @returns {boolean} True if pool is at maximum concurrency
     */
    isAtCapacity(): boolean {
        return this.activeProcesses.size >= this.config.maxConcurrent
    }

    /**
     * Gracefully shutdown the process pool
     * 
     * This method initiates a graceful shutdown of the process pool:
     * 1. Prevents new process execution
     * 2. Sends SIGTERM to all active processes
     * 3. Waits for processes to exit gracefully
     * 4. Force kills any remaining processes after timeout
     * 
     * @param {number} [timeoutMs=10000] - Timeout for graceful shutdown in milliseconds
     * @returns {Promise<void>} Resolves when shutdown is complete
     * 
     * @example
     * ```typescript
     * // Graceful shutdown with 5 second timeout
     * await pool.shutdown(5000)
     * 
     * // Default 10 second timeout
     * await pool.shutdown()
     * ```
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
     * 
     * Immediately terminates all active processes using SIGKILL.
     * This should only be used as a last resort when graceful shutdown fails.
     * 
     * @example
     * ```typescript
     * // Emergency cleanup
     * pool.forceKillAll()
     * ```
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

    // ... (private methods continue with JSDoc comments)
}
