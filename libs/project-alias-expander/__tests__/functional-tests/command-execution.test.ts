import { describe, it, expect, beforeEach, vi } from 'vitest'
import { CommandExecutionService } from '../../src/services/CommandExecution.service.js'
import type { AliasConfig } from '../../src/_types/index.js'

// Mock child_process
vi.mock('child_process', () => ({
    spawnSync: vi.fn()
}))

// Mock config resolution
vi.mock('../../src/config.js', () => ({
    resolveProjectForAlias: vi.fn()
}))

import { spawnSync } from 'child_process'
import { resolveProjectForAlias } from '../../src/config.js'

describe('CommandExecutionService', () => {
    let service: CommandExecutionService
    let mockSpawnSync: ReturnType<typeof vi.mocked>
    let mockResolveProjectForAlias: ReturnType<typeof vi.mocked>

    beforeEach(() => {
        service = new CommandExecutionService()
        mockSpawnSync = vi.mocked(spawnSync)
        mockResolveProjectForAlias = vi.mocked(resolveProjectForAlias)
        
        // Reset environment
        delete process.env.PAE_ECHO
    })

    describe('runNx', () => {
        it('should echo command when PAE_ECHO is set', () => {
            // Arrange
            process.env.PAE_ECHO = '1'
            const argv = ['nx', 'run', 'test:build']
            const consoleSpy = vi.spyOn(console, 'log').mockImplementation(() => {})

            // Act
            const result = service.runNx(argv)

            // Assert
            expect(result).toBe(0)
            expect(consoleSpy).toHaveBeenCalledWith('-> nx run test:build')
            expect(mockSpawnSync).not.toHaveBeenCalled()

            // Cleanup
            consoleSpy.mockRestore()
        })

        it('should execute PowerShell command when first arg starts with $', () => {
            // Arrange
            const argv = ['$Get-Process', 'node']
            mockSpawnSync.mockReturnValue({
                status: 0,
                signal: null,
                output: [''],
                pid: 123,
                stdout: Buffer.from(''),
                stderr: Buffer.from(''),
                error: undefined
            })

            // Act
            const result = service.runNx(argv)

            // Assert
            expect(result).toBe(0)
            expect(mockSpawnSync).toHaveBeenCalledWith('powershell', ['-Command', '$Get-Process node'], {
                stdio: 'inherit',
                shell: false,
                timeout: 300000,
                killSignal: 'SIGTERM'
            })
        })

        it('should execute start commands directly', () => {
            // Arrange
            const argv = ['timeout', '10', 'nx', 'run', 'test']
            mockSpawnSync.mockReturnValue({
                status: 0,
                signal: null,
                output: [''],
                pid: 123,
                stdout: Buffer.from(''),
                stderr: Buffer.from(''),
                error: undefined
            })

            // Act
            const result = service.runNx(argv)

            // Assert
            expect(result).toBe(0)
            expect(mockSpawnSync).toHaveBeenCalledWith('timeout', ['10', 'nx', 'run', 'test'], {
                stdio: 'inherit',
                shell: process.platform === 'win32',
                timeout: 300000,
                killSignal: 'SIGTERM'
            })
        })

        it('should execute npm commands directly', () => {
            // Arrange
            const argv = ['npm', 'run', 'test']
            mockSpawnSync.mockReturnValue({
                status: 0,
                signal: null,
                output: [''],
                pid: 123,
                stdout: Buffer.from(''),
                stderr: Buffer.from(''),
                error: undefined
            })

            // Act
            const result = service.runNx(argv)

            // Assert
            expect(result).toBe(0)
            expect(mockSpawnSync).toHaveBeenCalledWith('npm', ['run', 'test'], {
                stdio: 'inherit',
                shell: process.platform === 'win32',
                timeout: 300000,
                killSignal: 'SIGTERM'
            })
        })

        it('should execute nx commands normally', () => {
            // Arrange
            const argv = ['nx', 'run', 'test:build']
            mockSpawnSync.mockReturnValue({
                status: 0,
                signal: null,
                output: [''],
                pid: 123,
                stdout: Buffer.from(''),
                stderr: Buffer.from(''),
                error: undefined
            })

            // Act
            const result = service.runNx(argv)

            // Assert
            expect(result).toBe(0)
            expect(mockSpawnSync).toHaveBeenCalledWith('nx', ['run', 'test:build'], {
                stdio: 'inherit',
                shell: process.platform === 'win32',
                timeout: 300000,
                killSignal: 'SIGTERM'
            })
        })

        it('should return error code when command fails', () => {
            // Arrange
            const argv = ['nx', 'run', 'test:build']
            mockSpawnSync.mockReturnValue({
                status: 1,
                signal: null,
                output: [''],
                pid: 123,
                stdout: Buffer.from(''),
                stderr: Buffer.from('error'),
                error: undefined
            })

            // Act
            const result = service.runNx(argv)

            // Assert
            expect(result).toBe(1)
        })

        it('should return 1 when status is null', () => {
            // Arrange
            const argv = ['nx', 'run', 'test:build']
            mockSpawnSync.mockReturnValue({
                status: null,
                signal: null,
                output: [''],
                pid: 123,
                stdout: Buffer.from(''),
                stderr: Buffer.from(''),
                error: undefined
            })

            // Act
            const result = service.runNx(argv)

            // Assert
            expect(result).toBe(1)
        })
    })

    describe('runCommand', () => {
        it('should execute command with args', () => {
            // Arrange
            const command = 'npm'
            const args = ['run', 'test']
            mockSpawnSync.mockReturnValue({
                status: 0,
                signal: null,
                output: [''],
                pid: 123,
                stdout: Buffer.from(''),
                stderr: Buffer.from(''),
                error: undefined
            })

            // Act
            const result = service.runCommand(command, args)

            // Assert
            expect(result).toBe(0)
            expect(mockSpawnSync).toHaveBeenCalledWith('npm', ['run', 'test'], {
                stdio: 'inherit',
                shell: process.platform === 'win32',
                timeout: 300000,
                killSignal: 'SIGTERM'
            })
        })

        it('should return error code when command fails', () => {
            // Arrange
            const command = 'npm'
            const args = ['run', 'test']
            mockSpawnSync.mockReturnValue({
                status: 1,
                signal: null,
                output: [''],
                pid: 123,
                stdout: Buffer.from(''),
                stderr: Buffer.from('error'),
                error: undefined
            })

            // Act
            const result = service.runCommand(command, args)

            // Assert
            expect(result).toBe(1)
        })

        it('should handle empty args array', () => {
            // Arrange
            const command = 'npm'
            const args: string[] = []
            mockSpawnSync.mockReturnValue({
                status: 0,
                signal: null,
                output: [''],
                pid: 123,
                stdout: Buffer.from(''),
                stderr: Buffer.from(''),
                error: undefined
            })

            // Act
            const result = service.runCommand(command, args)

            // Assert
            expect(result).toBe(0)
            expect(mockSpawnSync).toHaveBeenCalledWith('npm', [], {
                stdio: 'inherit',
                shell: process.platform === 'win32',
                timeout: 300000,
                killSignal: 'SIGTERM'
            })
        })
    })

    describe('runMany', () => {
        it('should run targets for all projects when runType is all', () => {
            // Arrange
            const config: AliasConfig = {
                'nxPackages': {
                    'pbc': { name: 'project-butler', suffix: 'core' },
                    'pbe': { name: 'project-butler', suffix: 'ext' }
                }
            }
            const runType = 'all' as const
            const targets = ['build', 'test']
            const flags = ['--verbose']

            mockResolveProjectForAlias
                .mockReturnValueOnce({ project: '@fux/project-butler-core', isFull: false })
                .mockReturnValueOnce({ project: '@fux/project-butler-ext', isFull: false })

            mockSpawnSync.mockReturnValue({
                status: 0,
                signal: null,
                output: [''],
                pid: 123,
                stdout: Buffer.from(''),
                stderr: Buffer.from(''),
                error: undefined
            })

            const consoleSpy = vi.spyOn(console, 'log').mockImplementation(() => {})

            // Act
            const result = service.runMany(runType, targets, flags, config)

            // Assert
            expect(result).toBe(0)
            expect(consoleSpy).toHaveBeenCalledWith('Running build, test for 2 all projects:')
            expect(consoleSpy).toHaveBeenCalledWith('  @fux/project-butler-core')
            expect(consoleSpy).toHaveBeenCalledWith('  @fux/project-butler-ext')
            
            // Should call nx 4 times (2 projects × 2 targets)
            expect(mockSpawnSync).toHaveBeenCalledTimes(4)

            // Cleanup
            consoleSpy.mockRestore()
        })

        it('should run targets only for core projects when runType is core', () => {
            // Arrange
            const config: AliasConfig = {
                'nxPackages': {
                    'pbc': { name: 'project-butler', suffix: 'core' },
                    'pbe': { name: 'project-butler', suffix: 'ext' }
                }
            }
            const runType = 'core' as const
            const targets = ['build']
            const flags: string[] = []

            mockResolveProjectForAlias.mockReturnValue({ project: '@fux/project-butler-core', isFull: false })

            mockSpawnSync.mockReturnValue({
                status: 0,
                signal: null,
                output: [''],
                pid: 123,
                stdout: Buffer.from(''),
                stderr: Buffer.from(''),
                error: undefined
            })

            const consoleSpy = vi.spyOn(console, 'log').mockImplementation(() => {})

            // Act
            const result = service.runMany(runType, targets, flags, config)

            // Assert
            expect(result).toBe(0)
            expect(consoleSpy).toHaveBeenCalledWith('Running build for 1 core projects:')
            expect(consoleSpy).toHaveBeenCalledWith('  @fux/project-butler-core')
            
            // Should call nx once (1 project × 1 target)
            expect(mockSpawnSync).toHaveBeenCalledTimes(1)

            // Cleanup
            consoleSpy.mockRestore()
        })

        it('should run targets only for ext projects when runType is ext', () => {
            // Arrange
            const config: AliasConfig = {
                'nxPackages': {
                    'pbc': { name: 'project-butler', suffix: 'core' },
                    'pbe': { name: 'project-butler', suffix: 'ext' }
                }
            }
            const runType = 'ext' as const
            const targets = ['build']
            const flags: string[] = []

            mockResolveProjectForAlias.mockReturnValue({ project: '@fux/project-butler-ext', isFull: false })

            mockSpawnSync.mockReturnValue({
                status: 0,
                signal: null,
                output: [''],
                pid: 123,
                stdout: Buffer.from(''),
                stderr: Buffer.from(''),
                error: undefined
            })

            const consoleSpy = vi.spyOn(console, 'log').mockImplementation(() => {})

            // Act
            const result = service.runMany(runType, targets, flags, config)

            // Assert
            expect(result).toBe(0)
            expect(consoleSpy).toHaveBeenCalledWith('Running build for 1 ext projects:')
            expect(consoleSpy).toHaveBeenCalledWith('  @fux/project-butler-ext')
            
            // Should call nx once (1 project × 1 target)
            expect(mockSpawnSync).toHaveBeenCalledTimes(1)

            // Cleanup
            consoleSpy.mockRestore()
        })

        it('should return error when no projects found', () => {
            // Arrange
            const config: AliasConfig = {
                'nxPackages': {
                    'pbc': { name: 'project-butler', suffix: 'core' }
                }
            }
            const runType = 'ext' as const
            const targets = ['build']
            const flags: string[] = []

            const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {})

            // Act
            const result = service.runMany(runType, targets, flags, config)

            // Assert
            expect(result).toBe(1)
            expect(consoleSpy).toHaveBeenCalledWith('No ext projects found.')

            // Cleanup
            consoleSpy.mockRestore()
        })

        it('should return error code when any command fails', () => {
            // Arrange
            const config: AliasConfig = {
                'nxPackages': {
                    'pbc': { name: 'project-butler', suffix: 'core' }
                }
            }
            const runType = 'core' as const
            const targets = ['build', 'test']
            const flags: string[] = []

            mockResolveProjectForAlias.mockReturnValue({ project: '@fux/project-butler-core', isFull: false })

            mockSpawnSync
                .mockReturnValueOnce({
                    status: 0,
                    signal: null,
                    output: [''],
                    pid: 123,
                    stdout: Buffer.from(''),
                    stderr: Buffer.from(''),
                    error: undefined
                })
                .mockReturnValueOnce({
                    status: 1,
                    signal: null,
                    output: [''],
                    pid: 123,
                    stdout: Buffer.from(''),
                    stderr: Buffer.from('error'),
                    error: undefined
                })

            const consoleSpy = vi.spyOn(console, 'log').mockImplementation(() => {})

            // Act
            const result = service.runMany(runType, targets, flags, config)

            // Assert
            expect(result).toBe(1)

            // Cleanup
            consoleSpy.mockRestore()
        })

        it('should handle string package aliases', () => {
            // Arrange
            const config: AliasConfig = {
                'nxPackages': {
                    'pb': '@fux/project-butler'
                }
            }
            const runType = 'all' as const
            const targets = ['build']
            const flags: string[] = []

            mockResolveProjectForAlias.mockReturnValue({ project: '@fux/project-butler', isFull: false })

            mockSpawnSync.mockReturnValue({
                status: 0,
                signal: null,
                output: [''],
                pid: 123,
                stdout: Buffer.from(''),
                stderr: Buffer.from(''),
                error: undefined
            })

            const consoleSpy = vi.spyOn(console, 'log').mockImplementation(() => {})

            // Act
            const result = service.runMany(runType, targets, flags, config)

            // Assert
            expect(result).toBe(0)
            expect(consoleSpy).toHaveBeenCalledWith('Running build for 1 all projects:')
            expect(consoleSpy).toHaveBeenCalledWith('  @fux/project-butler')

            // Cleanup
            consoleSpy.mockRestore()
        })
    })
})
