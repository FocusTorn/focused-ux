import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { ProcessPool, processPool } from '../services/ProcessPool.service.js'
import type { ProcessResult, ProcessMetrics } from '../services/ProcessPool.service.js'

describe('ProcessPool', () => {
    let pool: ProcessPool

    beforeEach(() => {
        // Create a new ProcessPool instance for each test
        pool = new ProcessPool({
            maxConcurrent: 3,
            defaultTimeout: 5000,
            enableMetrics: true
        })
    })

    afterEach(async () => {
        // Clean up after each test
        await pool.shutdown(1000)
    })

    describe('Basic Execution', () => {
        it('should execute a simple command successfully', async () => {
            const result = await pool.execute('echo', ['hello world'], {
                stdio: 'pipe'
            })

            expect(result.exitCode).toBe(0)
            expect(result.command).toBe('echo')
            expect(result.args).toEqual(['hello world'])
            expect(result.duration).toBeGreaterThan(0)
            expect(result.pid).toBeGreaterThan(0)
        })

        it('should handle command failures', async () => {
            const result = await pool.execute('false', [], {
                stdio: 'pipe'
            })

            expect(result.exitCode).toBe(1)
            expect(result.command).toBe('false')
        })

        it('should handle timeout', async () => {
            const result = await pool.execute('sleep', ['10'], {
                timeout: 100, // 100ms timeout
                stdio: 'pipe'
            })

            expect(result.exitCode).toBe(1) // Should be killed due to timeout
        }, 10000)
    })

    describe('Concurrency Control', () => {
        it('should respect max concurrent limit', async () => {
            const startTime = Date.now()
            
            // Start 5 processes but only 3 should run concurrently
            const promises = Array.from({ length: 5 }, (_, i) => 
                pool.execute('sleep', ['1'], { stdio: 'pipe' })
            )

            const results = await Promise.all(promises)
            const endTime = Date.now()

            // All should complete successfully
            results.forEach(result => {
                expect(result.exitCode).toBe(0)
            })

            // Should take at least 2 seconds (2 batches of 3 and 2)
            expect(endTime - startTime).toBeGreaterThanOrEqual(1900)
        }, 10000)

        it('should track active process count correctly', async () => {
            expect(pool.getActiveProcessCount()).toBe(0)
            expect(pool.isAtCapacity()).toBe(false)

            // Start a process
            const promise = pool.execute('sleep', ['2'], { stdio: 'pipe' })
            
            // Give it a moment to start
            await new Promise(resolve => setTimeout(resolve, 100))
            
            expect(pool.getActiveProcessCount()).toBe(1)
            expect(pool.isAtCapacity()).toBe(false)

            await promise
            expect(pool.getActiveProcessCount()).toBe(0)
        }, 5000)
    })

    describe('Process Metrics', () => {
        it('should track execution metrics', async () => {
            const initialMetrics = pool.getMetrics()
            expect(initialMetrics.totalExecutions).toBe(0)
            expect(initialMetrics.completedProcesses).toBe(0)
            expect(initialMetrics.failedProcesses).toBe(0)

            // Execute a successful command
            await pool.execute('echo', ['test'], { stdio: 'pipe' })

            const metricsAfterSuccess = pool.getMetrics()
            expect(metricsAfterSuccess.totalExecutions).toBe(1)
            expect(metricsAfterSuccess.completedProcesses).toBe(1)
            expect(metricsAfterSuccess.failedProcesses).toBe(0)
            expect(metricsAfterSuccess.averageExecutionTime).toBeGreaterThan(0)

            // Execute a failing command
            await pool.execute('false', [], { stdio: 'pipe' })

            const metricsAfterFailure = pool.getMetrics()
            expect(metricsAfterFailure.totalExecutions).toBe(2)
            expect(metricsAfterFailure.completedProcesses).toBe(1)
            expect(metricsAfterFailure.failedProcesses).toBe(1)
        })

        it('should track max concurrent reached', async () => {
            const initialMetrics = pool.getMetrics()
            expect(initialMetrics.maxConcurrentReached).toBe(false)

            // Start processes up to the limit
            const promises = Array.from({ length: 3 }, () => 
                pool.execute('sleep', ['1'], { stdio: 'pipe' })
            )

            // Give them time to start
            await new Promise(resolve => setTimeout(resolve, 100))

            const metricsAtCapacity = pool.getMetrics()
            expect(metricsAtCapacity.maxConcurrentReached).toBe(true)

            await Promise.all(promises)
        }, 5000)
    })

    describe('Parallel Execution', () => {
        it('should execute multiple commands in parallel', async () => {
            const commands = [
                { command: 'echo', args: ['hello'], options: { stdio: 'pipe' as const } },
                { command: 'echo', args: ['world'], options: { stdio: 'pipe' as const } },
                { command: 'echo', args: ['test'], options: { stdio: 'pipe' as const } }
            ]

            const startTime = Date.now()
            const results = await pool.executeMany(commands)
            const endTime = Date.now()

            expect(results).toHaveLength(3)
            results.forEach(result => {
                expect(result.exitCode).toBe(0)
            })

            // Should complete quickly since they're simple echo commands
            expect(endTime - startTime).toBeLessThan(1000)
        })

        it('should handle mixed success and failure in parallel execution', async () => {
            const commands = [
                { command: 'echo', args: ['success'], options: { stdio: 'pipe' as const } },
                { command: 'false', args: [], options: { stdio: 'pipe' as const } },
                { command: 'echo', args: ['another success'], options: { stdio: 'pipe' as const } }
            ]

            const results = await pool.executeMany(commands)

            expect(results).toHaveLength(3)
            expect(results[0].exitCode).toBe(0) // echo success
            expect(results[1].exitCode).toBe(1) // false failure
            expect(results[2].exitCode).toBe(0) // echo success
        })
    })

    describe('Graceful Shutdown', () => {
        it('should shutdown gracefully', async () => {
            // Start a long-running process
            const promise = pool.execute('sleep', ['5'], { stdio: 'pipe' })

            // Give it time to start
            await new Promise(resolve => setTimeout(resolve, 100))

            // Shutdown should complete quickly
            const shutdownStart = Date.now()
            await pool.shutdown(2000) // 2 second timeout
            const shutdownEnd = Date.now()

            expect(shutdownEnd - shutdownStart).toBeLessThan(3000)

            // The process should be killed
            try {
                await promise
            } catch (error) {
                // Expected - process was killed
                expect(error).toBeDefined()
            }
        }, 10000)

        it('should prevent new executions after shutdown', async () => {
            await pool.shutdown()

            await expect(
                pool.execute('echo', ['test'], { stdio: 'pipe' })
            ).rejects.toThrow('ProcessPool is shutting down')
        })

        it('should force kill all processes', async () => {
            // Start multiple processes
            const promises = Array.from({ length: 3 }, () => 
                pool.execute('sleep', ['10'], { stdio: 'pipe' })
            )

            // Give them time to start
            await new Promise(resolve => setTimeout(resolve, 100))

            expect(pool.getActiveProcessCount()).toBe(3)

            // Force kill all
            pool.forceKillAll()

            expect(pool.getActiveProcessCount()).toBe(0)

            // All processes should be killed
            for (const promise of promises) {
                try {
                    await promise
                } catch (error) {
                    // Expected - processes were killed
                    expect(error).toBeDefined()
                }
            }
        }, 15000)
    })

    describe('Error Handling', () => {
        it('should handle process errors gracefully', async () => {
            // This should fail because 'nonexistentcommand' doesn't exist
            await expect(
                pool.execute('nonexistentcommand', [], { stdio: 'pipe' })
            ).rejects.toThrow()
        })

        it('should clean up resources on error', async () => {
            const initialCount = pool.getActiveProcessCount()

            try {
                await pool.execute('nonexistentcommand', [], { stdio: 'pipe' })
            } catch (error) {
                // Expected error
            }

            // Should not have any active processes after error
            expect(pool.getActiveProcessCount()).toBe(initialCount)
        })
    })

    describe('Singleton Instance', () => {
        it('should provide a singleton instance', () => {
            expect(processPool).toBeInstanceOf(ProcessPool)
            expect(processPool.getActiveProcessCount()).toBe(0)
        })

        it('should have default configuration', () => {
            const metrics = processPool.getMetrics()
            expect(metrics.totalExecutions).toBe(0)
            expect(processPool.isAtCapacity()).toBe(false)
        })
    })

    describe('Process Result Interface', () => {
        it('should return complete process result', async () => {
            const result = await pool.execute('echo', ['test'], {
                stdio: 'pipe'
            })

            // Check all required fields
            expect(result).toHaveProperty('exitCode')
            expect(result).toHaveProperty('stdout')
            expect(result).toHaveProperty('stderr')
            expect(result).toHaveProperty('duration')
            expect(result).toHaveProperty('pid')
            expect(result).toHaveProperty('command')
            expect(result).toHaveProperty('args')

            // Check types
            expect(typeof result.exitCode).toBe('number')
            expect(typeof result.duration).toBe('number')
            expect(typeof result.pid).toBe('number')
            expect(typeof result.command).toBe('string')
            expect(Array.isArray(result.args)).toBe(true)
        })
    })

    describe('Configuration Options', () => {
        it('should respect custom timeout', async () => {
            const startTime = Date.now()
            
            await pool.execute('sleep', ['2'], {
                timeout: 1000, // 1 second timeout
                stdio: 'pipe'
            })

            const endTime = Date.now()
            
            // Should complete quickly due to timeout
            expect(endTime - startTime).toBeLessThan(2000)
        }, 5000)

        it('should respect stdio configuration', async () => {
            const result = await pool.execute('echo', ['test'], {
                stdio: 'pipe'
            })

            expect(result.stdout).toBeDefined()
            expect(result.stdout?.trim()).toBe('test')
        })

        it('should handle inherit stdio', async () => {
            // This test just ensures it doesn't crash with inherit
            const result = await pool.execute('echo', ['test'], {
                stdio: 'inherit'
            })

            expect(result.exitCode).toBe(0)
        })
    })
})
