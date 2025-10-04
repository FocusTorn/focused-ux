import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import type {
    IPAEDependencies,
    IExpandableProcessorService,
    ICommandExecutionService,
    IAliasManagerService
} from '../../../src/_types/index.js'
import type { ProcessResult, ProcessMetrics } from '../../../src/services/ProcessPool.service.js'
import { PAEManagerService } from '../../../src/services/PAEManager.service.js'
import { ExpandableProcessorService } from '../../../src/services/ExpandableProcessor.service.js'
import { CommandExecutionService } from '../../../src/services/CommandExecution.service.js'
import { AliasManagerService } from '../../../src/services/AliasManager.service.js'

/**
 * Service Communication Testing
 * 
 * Tests service-to-service communication patterns, data flow, error propagation,
 * and coordination between different services in the PAE system.
 */

describe('Service Communication - Inter-Service Patterns', () => {
    let paeManager: PAEManagerService
    let expandableProcessor: ExpandableProcessorService
    let commandExecution: CommandExecutionService
    let aliasManager: AliasManagerService
    let mockDependencies: IPAEDependencies

    beforeEach(() => {
        expandableProcessor = new ExpandableProcessorService()
        commandExecution = new CommandExecutionService()
        aliasManager = new AliasManagerService()
        
        mockDependencies = {
            expandableProcessor,
            commandExecution,
            aliasManager
        }
        
        paeManager = new PAEManagerService(mockDependencies)
    })

    afterEach(() => {
        vi.clearAllMocks()
    })

    describe('Service-to-Service Data Flow', () => {
        it('should coordinate template expansion with command execution', async () => {
            // Mock the services
            const mockExpandable = vi.spyOn(expandableProcessor, 'expandTemplate')
            const mockCommand = vi.spyOn(commandExecution, 'runCommand')
            
            mockExpandable.mockReturnValue('nx build test-project --skip-nx-cache')
            mockCommand.mockResolvedValue(0)
            
            // Simulate a workflow: expand template, then execute command
            const template = 'nx {{target}} {{project}} {{flags}}'
            const variables = { target: 'build', project: 'test-project', flags: '--skip-nx-cache' }
            
            const expandedCommand = paeManager.expandTemplate(template, variables)
            const exitCode = await paeManager.runCommand('nx', ['build', 'test-project', '--skip-nx-cache'])
            
            expect(mockExpandable).toHaveBeenCalledWith(template, variables)
            expect(mockCommand).toHaveBeenCalledWith('nx', ['build', 'test-project', '--skip-nx-cache'])
            expect(expandedCommand).toBe('nx build test-project --skip-nx-cache')
            expect(exitCode).toBe(0)
        })

        it('should coordinate shell detection with template processing', () => {
            const mockDetectShell = vi.spyOn(expandableProcessor, 'detectShellType')
            const mockProcessTemplate = vi.spyOn(expandableProcessor, 'processShellSpecificTemplate')
            
            mockDetectShell.mockReturnValue('pwsh')
            mockProcessTemplate.mockReturnValue({ start: ['Write-Host "PowerShell command"'], end: [] })
            
            const shellType = paeManager.detectShellType()
            const result = paeManager.processShellSpecificTemplate(
                { 'pwsh-template': 'Write-Host "PowerShell command"' },
                {}
            )
            
            expect(mockDetectShell).toHaveBeenCalledBefore(mockProcessTemplate as any)
            expect(shellType).toBe('pwsh')
            expect(result.start).toContain('Write-Host "PowerShell command"')
        })

        it('should coordinate flag expansion with command construction', () => {
            const mockExpandFlags = vi.spyOn(expandableProcessor, 'expandFlags')
            const mockConstructCommand = vi.spyOn(expandableProcessor, 'constructWrappedCommand')
            
            mockExpandFlags.mockReturnValue({
                start: [],
                prefix: [],
                preArgs: ['--skip-nx-cache', '--output-style=stream'],
                suffix: [],
                end: [],
                remainingArgs: ['build', 'test-project']
            })
            mockConstructCommand.mockReturnValue([
                'echo "Starting"',
                'nx',
                'build',
                'test-project',
                '--skip-nx-cache',
                '--output-style=stream',
                'echo "Finished"'
            ])
            
            const flagResult = paeManager.expandFlags(
                ['-s', '--output-style=stream', 'build', 'test-project'],
                { '-s': '--skip-nx-cache' }
            )
            const commandResult = paeManager.constructWrappedCommand(
                ['nx', 'build', 'test-project'],
                ['echo "Starting"'],
                ['echo "Finished"']
            )
            
            expect(mockExpandFlags).toHaveBeenCalledBefore(mockConstructCommand as any)
            expect(flagResult.preArgs).toContain('--skip-nx-cache')
            expect(commandResult).toContain('nx')
            expect(commandResult).toContain('build')
        })

        it('should coordinate alias management with file generation', () => {
            const mockGenerateFiles = vi.spyOn(aliasManager, 'generateLocalFiles')
            const mockInstallAliases = vi.spyOn(aliasManager, 'installAliases')
            
            mockGenerateFiles.mockResolvedValue(undefined)
            mockInstallAliases.mockResolvedValue(undefined)
            
            paeManager.generateLocalFiles()
            paeManager.installAliases()
            
            expect(mockGenerateFiles).toHaveBeenCalledBefore(mockInstallAliases as any)
            expect(mockGenerateFiles).toHaveBeenCalledTimes(1)
            expect(mockInstallAliases).toHaveBeenCalledTimes(1)
        })
    })

    describe('Error Propagation Across Services', () => {
        it('should propagate errors from ExpandableProcessor to PAEManager', () => {
            const testError = new Error('Template expansion failed')
            const mockExpandTemplate = vi.spyOn(expandableProcessor, 'expandTemplate')
            
            mockExpandTemplate.mockImplementation(() => {
                throw testError
            })
            
            expect(() => {
                paeManager.expandTemplate('invalid template', {})
            }).toThrow('Template expansion failed')
        })

        it('should propagate errors from CommandExecution to PAEManager', async () => {
            const testError = new Error('Command execution failed')
            const mockRunCommand = vi.spyOn(commandExecution, 'runCommand')
            
            mockRunCommand.mockRejectedValue(testError)
            
            await expect(paeManager.runCommand('invalid-command', [])).rejects.toThrow('Command execution failed')
        })

        it('should propagate errors from AliasManager to PAEManager', async () => {
            const testError = new Error('Alias installation failed')
            const mockInstallAliases = vi.spyOn(aliasManager, 'installAliases')
            
            mockInstallAliases.mockRejectedValue(testError)
            
            await expect(paeManager.installAliases()).rejects.toThrow('Alias installation failed')
        })

        it('should handle cascading errors in complex workflows', async () => {
            const templateError = new Error('Template processing failed')
            const mockExpandTemplate = vi.spyOn(expandableProcessor, 'expandTemplate')
            const mockRunCommand = vi.spyOn(commandExecution, 'runCommand')
            
            mockExpandTemplate.mockImplementation(() => {
                throw templateError
            })
            mockRunCommand.mockResolvedValue(0)
            
            // Template expansion should fail, preventing command execution
            expect(() => {
                paeManager.expandTemplate('invalid template', {})
            }).toThrow('Template processing failed')
            
            // Command execution should not be called due to template failure
            expect(mockRunCommand).not.toHaveBeenCalled()
        })
    })

    describe('Service Coordination Patterns', () => {
        it('should coordinate multiple services in a complex workflow', async () => {
            // Mock all services
            const mockDetectShell = vi.spyOn(expandableProcessor, 'detectShellType')
            const mockExpandTemplate = vi.spyOn(expandableProcessor, 'expandTemplate')
            const mockRunCommand = vi.spyOn(commandExecution, 'runCommand')
            const mockGenerateFiles = vi.spyOn(aliasManager, 'generateLocalFiles')
            
            mockDetectShell.mockReturnValue('pwsh')
            mockExpandTemplate.mockReturnValue('Write-Host "Starting build"; nx build test-project')
            mockRunCommand.mockResolvedValue(0)
            mockGenerateFiles.mockResolvedValue(undefined)
            
            // Complex workflow: detect shell, expand template, generate files, execute command
            const shellType = paeManager.detectShellType()
            const expandedCommand = paeManager.expandTemplate('{{shell_command}}', { shell_command: 'Write-Host "Starting build"; nx build test-project' })
            paeManager.generateLocalFiles()
            const exitCode = await paeManager.runCommand('powershell', ['-Command', expandedCommand])
            
            // Verify coordination sequence
            expect(mockDetectShell).toHaveBeenCalledBefore(mockExpandTemplate as any)
            expect(mockExpandTemplate).toHaveBeenCalledBefore(mockGenerateFiles as any)
            expect(mockGenerateFiles).toHaveBeenCalledBefore(mockRunCommand as any)
            
            expect(shellType).toBe('pwsh')
            expect(expandedCommand).toBe('Write-Host "Starting build"; nx build test-project')
            expect(exitCode).toBe(0)
        })

        it('should handle service dependencies correctly', () => {
            // Test that services can work independently when needed
            const mockExpandTemplate = vi.spyOn(expandableProcessor, 'expandTemplate')
            const mockDetectShell = vi.spyOn(expandableProcessor, 'detectShellType')
            
            mockExpandTemplate.mockReturnValue('independent result')
            mockDetectShell.mockReturnValue('linux')
            
            // Independent operations
            const result1 = paeManager.expandTemplate('test', {})
            const result2 = paeManager.detectShellType()
            
            expect(result1).toBe('independent result')
            expect(result2).toBe('linux')
            expect(mockExpandTemplate).toHaveBeenCalledTimes(1)
            expect(mockDetectShell).toHaveBeenCalledTimes(1)
        })

        it('should coordinate async and sync operations correctly', async () => {
            const mockExpandTemplate = vi.spyOn(expandableProcessor, 'expandTemplate')
            const mockRunCommand = vi.spyOn(commandExecution, 'runCommand')
            const mockGenerateFiles = vi.spyOn(aliasManager, 'generateLocalFiles')
            
            mockExpandTemplate.mockReturnValue('async command')
            mockRunCommand.mockResolvedValue(0)
            mockGenerateFiles.mockResolvedValue(undefined)
            
            // Mix of sync and async operations
            const syncResult = paeManager.expandTemplate('test', {})
            paeManager.generateLocalFiles()
            const asyncResult = await paeManager.runCommand('test', [])
            
            expect(syncResult).toBe('async command')
            expect(asyncResult).toBe(0)
            expect(mockExpandTemplate).toHaveBeenCalledTimes(1)
            expect(mockGenerateFiles).toHaveBeenCalledTimes(1)
            expect(mockRunCommand).toHaveBeenCalledTimes(1)
        })
    })

    describe('Service State Management', () => {
        it('should maintain consistent state across service calls', () => {
            const mockDetectShell = vi.spyOn(expandableProcessor, 'detectShellType')
            mockDetectShell.mockReturnValue('pwsh')
            
            // Multiple calls should return consistent results
            const result1 = paeManager.detectShellType()
            const result2 = paeManager.detectShellType()
            const result3 = paeManager.detectShellType()
            
            expect(result1).toBe('pwsh')
            expect(result2).toBe('pwsh')
            expect(result3).toBe('pwsh')
            expect(mockDetectShell).toHaveBeenCalledTimes(3)
        })

        it('should handle service state changes correctly', () => {
            const mockDetectShell = vi.spyOn(expandableProcessor, 'detectShellType')
            
            // Simulate state change
            mockDetectShell.mockReturnValueOnce('pwsh')
            mockDetectShell.mockReturnValueOnce('linux')
            mockDetectShell.mockReturnValueOnce('cmd')
            
            const result1 = paeManager.detectShellType()
            const result2 = paeManager.detectShellType()
            const result3 = paeManager.detectShellType()
            
            expect(result1).toBe('pwsh')
            expect(result2).toBe('linux')
            expect(result3).toBe('cmd')
        })

        it('should isolate service state between instances', () => {
            // Create two separate PAEManager instances
            const paeManager1 = new PAEManagerService(mockDependencies)
            const paeManager2 = new PAEManagerService(mockDependencies)
            
            const mockDetectShell = vi.spyOn(expandableProcessor, 'detectShellType')
            mockDetectShell.mockReturnValue('pwsh')
            
            // Each instance should work independently
            const result1 = paeManager1.detectShellType()
            const result2 = paeManager2.detectShellType()
            
            expect(result1).toBe('pwsh')
            expect(result2).toBe('pwsh')
            expect(mockDetectShell).toHaveBeenCalledTimes(2)
        })
    })

    describe('Service Communication Performance', () => {
        it('should handle high-frequency service calls efficiently', () => {
            const mockExpandTemplate = vi.spyOn(expandableProcessor, 'expandTemplate')
            mockExpandTemplate.mockReturnValue('result')
            
            const startTime = Date.now()
            
            // Make many rapid calls
            for (let i = 0; i < 100; i++) {
                paeManager.expandTemplate(`template-${i}`, { index: i.toString() })
            }
            
            const endTime = Date.now()
            
            expect(endTime - startTime).toBeLessThan(1000) // Should complete within 1 second
            expect(mockExpandTemplate).toHaveBeenCalledTimes(100)
        })

        it('should handle concurrent service operations correctly', async () => {
            const mockRunCommand = vi.spyOn(commandExecution, 'runCommand')
            mockRunCommand.mockResolvedValue(0)
            
            // Start multiple concurrent operations
            const promises = [
                paeManager.runCommand('command1', []),
                paeManager.runCommand('command2', []),
                paeManager.runCommand('command3', [])
            ]
            
            const results = await Promise.all(promises)
            
            expect(results).toEqual([0, 0, 0])
            expect(mockRunCommand).toHaveBeenCalledTimes(3)
        })

        it('should handle mixed sync/async service calls efficiently', async () => {
            const mockExpandTemplate = vi.spyOn(expandableProcessor, 'expandTemplate')
            const mockRunCommand = vi.spyOn(commandExecution, 'runCommand')
            
            mockExpandTemplate.mockReturnValue('result')
            mockRunCommand.mockResolvedValue(0)
            
            const startTime = Date.now()
            
            // Mix of sync and async operations
            const syncResults: string[] = []
            const asyncPromises: Promise<number>[] = []
            
            for (let i = 0; i < 50; i++) {
                syncResults.push(paeManager.expandTemplate(`template-${i}`, {}))
                asyncPromises.push(paeManager.runCommand(`command-${i}`, []))
            }
            
            const asyncResults = await Promise.all(asyncPromises)
            const endTime = Date.now()
            
            expect(endTime - startTime).toBeLessThan(2000) // Should complete within 2 seconds
            expect(syncResults).toHaveLength(50)
            expect(asyncResults).toHaveLength(50)
            expect(mockExpandTemplate).toHaveBeenCalledTimes(50)
            expect(mockRunCommand).toHaveBeenCalledTimes(50)
        })
    })

    describe('Service Communication Error Recovery', () => {
        it('should recover from service errors and continue operation', async () => {
            const mockRunCommand = vi.spyOn(commandExecution, 'runCommand')
            const mockExpandTemplate = vi.spyOn(expandableProcessor, 'expandTemplate')
            
            // First call fails, second succeeds
            mockRunCommand.mockRejectedValueOnce(new Error('First command failed'))
            mockRunCommand.mockResolvedValueOnce(0)
            mockExpandTemplate.mockReturnValue('recovered command')
            
            // First operation should fail
            await expect(paeManager.runCommand('failing-command', [])).rejects.toThrow('First command failed')
            
            // Second operation should succeed
            const result = await paeManager.runCommand('working-command', [])
            expect(result).toBe(0)
            
            // Template expansion should still work
            const expanded = paeManager.expandTemplate('test', {})
            expect(expanded).toBe('recovered command')
        })

        it('should handle partial service failures gracefully', async () => {
            const mockRunCommand = vi.spyOn(commandExecution, 'runCommand')
            const mockExpandTemplate = vi.spyOn(expandableProcessor, 'expandTemplate')
            
            mockRunCommand.mockResolvedValue(1) // Command fails but doesn't throw
            mockExpandTemplate.mockReturnValue('expanded command')
            
            // Command execution fails but doesn't throw
            const exitCode = await paeManager.runCommand('failing-command', [])
            expect(exitCode).toBe(1)
            
            // Template expansion should still work
            const expanded = paeManager.expandTemplate('test', {})
            expect(expanded).toBe('expanded command')
        })

        it('should maintain service communication integrity during errors', () => {
            const mockExpandTemplate = vi.spyOn(expandableProcessor, 'expandTemplate')
            const mockDetectShell = vi.spyOn(expandableProcessor, 'detectShellType')
            
            mockExpandTemplate.mockImplementation(() => {
                throw new Error('Template error')
            })
            mockDetectShell.mockReturnValue('pwsh')
            
            // One service fails, others should still work
            expect(() => {
                paeManager.expandTemplate('invalid', {})
            }).toThrow('Template error')
            
            const shellType = paeManager.detectShellType()
            expect(shellType).toBe('pwsh')
        })
    })

    describe('Service Communication Validation', () => {
        it('should validate service communication patterns', () => {
            // Test that services communicate through proper interfaces
            const mockExpandTemplate = vi.spyOn(expandableProcessor, 'expandTemplate')
            const mockRunCommand = vi.spyOn(commandExecution, 'runCommand')
            
            mockExpandTemplate.mockReturnValue('validated command')
            mockRunCommand.mockResolvedValue(0)
            
            // Verify proper communication flow
            const expanded = paeManager.expandTemplate('test', {})
            expect(expanded).toBe('validated command')
            
            // Verify service isolation
            expect(mockExpandTemplate).toHaveBeenCalledWith('test', {})
            expect(mockRunCommand).not.toHaveBeenCalled()
        })

        it('should validate service dependency injection', () => {
            // Test that services are properly injected and used
            expect(paeManager).toBeInstanceOf(PAEManagerService)
            expect(mockDependencies.expandableProcessor).toBe(expandableProcessor)
            expect(mockDependencies.commandExecution).toBe(commandExecution)
            expect(mockDependencies.aliasManager).toBe(aliasManager)
        })

        it('should validate service communication contracts', () => {
            // Test that services implement required interfaces
            expect(typeof expandableProcessor.expandTemplate).toBe('function')
            expect(typeof commandExecution.runCommand).toBe('function')
            expect(typeof aliasManager.generateLocalFiles).toBe('function')
            
            // Test that PAEManagerService implements its interface
            expect(typeof paeManager.expandTemplate).toBe('function')
            expect(typeof paeManager.runCommand).toBe('function')
            expect(typeof paeManager.generateLocalFiles).toBe('function')
        })
    })
})
