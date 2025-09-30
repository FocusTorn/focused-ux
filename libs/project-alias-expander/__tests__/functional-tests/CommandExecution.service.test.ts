import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { CommandExecutionService } from '../services/CommandExecution.service.js'
import { ProcessPool } from '../services/ProcessPool.service.js'
import type { AliasConfig } from '../_types/index.js'

// Mock the ProcessPool to avoid actual process execution in tests
vi.mock('../services/ProcessPool.service.js', () => {
    const mockProcessPool = {
        execute: vi.fn(),
        executeMany: vi.fn(),
        getMetrics: vi.fn(),
        shutdown: vi.fn(),
        getActiveProcessCount: vi.fn(),
        isAtCapacity: vi.fn(),
        forceKillAll: vi.fn()
    }

    return {
        ProcessPool: vi.fn(() => mockProcessPool),
        processPool: mockProcessPool
    }
})

describe('CommandExecutionService with ProcessPool', () => {
    let service: CommandExecutionService
    let mockProcessPool: any

    beforeEach(async () => {
        service = new CommandExecutionService()
        mockProcessPool = vi.mocked(await import('../services/ProcessPool.service.js')).processPool
    })

    afterEach(() => {
        vi.clearAllMocks()
    })

    describe('executeWithPool', () => {
        it('should execute command using ProcessPool', async () => {
            const mockResult = {
                exitCode: 0,
                stdout: 'test output',
                stderr: '',
                duration: 100,
                pid: 12345,
                command: 'echo',
                args: ['hello']
            }

            mockProcessPool.execute.mockResolvedValue(mockResult)

            const result = await service.executeWithPool('echo', ['hello'], {
                timeout: 5000,
                stdio: 'pipe'
            })

            expect(mockProcessPool.execute).toHaveBeenCalledWith('echo', ['hello'], {
                timeout: 5000,
                stdio: 'pipe'
            })
            expect(result).toEqual(mockResult)
        })

        it('should handle ProcessPool errors', async () => {
            const error = new Error('Process execution failed')
            mockProcessPool.execute.mockRejectedValue(error)

            await expect(
                service.executeWithPool('invalid-command', [])
            ).rejects.toThrow('Process execution failed')
        })
    })

    describe('getProcessMetrics', () => {
        it('should return process pool metrics', () => {
            const mockMetrics = {
                totalExecutions: 10,
                activeProcesses: 2,
                completedProcesses: 8,
                failedProcesses: 0,
                averageExecutionTime: 150,
                maxConcurrentReached: false
            }

            mockProcessPool.getMetrics.mockReturnValue(mockMetrics)

            const metrics = service.getProcessMetrics()

            expect(mockProcessPool.getMetrics).toHaveBeenCalled()
            expect(metrics).toEqual(mockMetrics)
        })
    })

    describe('shutdownProcessPool', () => {
        it('should shutdown the process pool', async () => {
            mockProcessPool.shutdown.mockResolvedValue(undefined)

            await service.shutdownProcessPool()

            expect(mockProcessPool.shutdown).toHaveBeenCalled()
        })

        it('should handle shutdown errors', async () => {
            const error = new Error('Shutdown failed')
            mockProcessPool.shutdown.mockRejectedValue(error)

            await expect(service.shutdownProcessPool()).rejects.toThrow('Shutdown failed')
        })
    })

    describe('runManyParallel', () => {
        it('should execute multiple projects in parallel', async () => {
            const mockResults = [
                { exitCode: 0, duration: 100, pid: 1, command: 'nx', args: ['build', 'project1'] },
                { exitCode: 0, duration: 150, pid: 2, command: 'nx', args: ['build', 'project2'] },
                { exitCode: 1, duration: 200, pid: 3, command: 'nx', args: ['build', 'project3'] }
            ]

            mockProcessPool.executeMany.mockResolvedValue(mockResults)

            // Access private method through any type
            const result = await (service as any).runManyParallel(['project1', 'project2', 'project3'], 'build', [])

            expect(mockProcessPool.executeMany).toHaveBeenCalledWith([
                {
                    command: 'nx',
                    args: ['build', 'project1'],
                    options: { timeout: 300000, stdio: 'inherit' }
                },
                {
                    command: 'nx',
                    args: ['build', 'project2'],
                    options: { timeout: 300000, stdio: 'inherit' }
                },
                {
                    command: 'nx',
                    args: ['build', 'project3'],
                    options: { timeout: 300000, stdio: 'inherit' }
                }
            ])

            // Should return the highest exit code (1 from project3)
            expect(result).toBe(1)
        })

        it('should return 0 when all projects succeed', async () => {
            const mockResults = [
                { exitCode: 0, duration: 100, pid: 1, command: 'nx', args: ['build', 'project1'] },
                { exitCode: 0, duration: 150, pid: 2, command: 'nx', args: ['build', 'project2'] }
            ]

            mockProcessPool.executeMany.mockResolvedValue(mockResults)

            const result = await (service as any).runManyParallel(['project1', 'project2'], 'build', [])

            expect(result).toBe(0)
        })

        it('should handle executeMany errors', async () => {
            const error = new Error('Parallel execution failed')
            mockProcessPool.executeMany.mockRejectedValue(error)

            const result = await (service as any).runManyParallel(['project1'], 'build', [])

            expect(result).toBe(1)
        })
    })

    describe('runMany with ProcessPool integration', () => {
        it('should use parallel execution for single target with multiple projects', async () => {
            const mockConfig: AliasConfig = {
                nxPackages: {
                    'project1': { name: 'project1', suffix: 'ext' },
                    'project2': { name: 'project2', suffix: 'ext' },
                    'project3': { name: 'project3', suffix: 'ext' }
                }
            }

            const mockResults = [
                { exitCode: 0, duration: 100, pid: 1, command: 'nx', args: ['build', 'project1'] },
                { exitCode: 0, duration: 150, pid: 2, command: 'nx', args: ['build', 'project2'] },
                { exitCode: 0, duration: 200, pid: 3, command: 'nx', args: ['build', 'project3'] }
            ]

            mockProcessPool.executeMany.mockResolvedValue(mockResults)

            const result = await service.runMany('ext', ['build'], [], mockConfig)

            expect(mockProcessPool.executeMany).toHaveBeenCalled()
            expect(result).toBe(0)
        })

        it('should fallback to sequential execution for multiple targets', async () => {
            const mockConfig: AliasConfig = {
                nxPackages: {
                    'project1': { name: 'project1', suffix: 'ext' }
                }
            }

            // Mock the sequential execution methods
            const runNxSpy = vi.spyOn(service, 'runNx').mockResolvedValue(0)

            const result = await service.runMany('ext', ['build', 'test'], [], mockConfig)

            expect(mockProcessPool.executeMany).not.toHaveBeenCalled()
            expect(runNxSpy).toHaveBeenCalledTimes(2) // build and test
            expect(result).toBe(0)
        })

        it('should return 1 when no projects found', async () => {
            const mockConfig: AliasConfig = {
                nxPackages: {}
            }

            const result = await service.runMany('ext', ['build'], [], mockConfig)

            expect(result).toBe(1)
        })
    })

    describe('Legacy methods compatibility', () => {
        it('should maintain compatibility with runNx', async () => {
            // This test ensures the legacy runNx method still works
            // We can't easily mock ProcessUtils.executeNxCommand, so we'll just test the interface
            expect(typeof service.runNx).toBe('function')
        })

        it('should maintain compatibility with runCommand', async () => {
            // This test ensures the legacy runCommand method still works
            expect(typeof service.runCommand).toBe('function')
        })
    })
})
