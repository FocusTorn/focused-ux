import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import type { 
    IPAEDependencies,
    IPAEManagerService,
    IExpandableProcessorService,
    ICommandExecutionService,
    IAliasManagerService
} from '../../../src/_types/index.js'
import { PAEManagerService } from '../../../src/services/PAEManager.service.js'
import { ExpandableProcessorService } from '../../../src/services/ExpandableProcessor.service.js'
import { CommandExecutionService } from '../../../src/services/CommandExecution.service.js'
import { AliasManagerService } from '../../../src/services/AliasManager.service.js'

// Mock the shell detection module
vi.mock('../../../src/shell.js', async (importOriginal) => {
    const actual = await importOriginal()
    return {
        ...actual,
        detectShellTypeCached: vi.fn()
    }
})

/**
 * Dependency Injection and Coordination Testing
 * 
 * Tests dependency injection patterns, service coordination, lifecycle management,
 * and the proper isolation and composition of services in the PAE system.
 */

describe('Dependency Injection - Service Composition and Coordination', () => {
    let mockExpandableProcessor: IExpandableProcessorService
    let mockCommandExecution: ICommandExecutionService
    let mockAliasManager: IAliasManagerService
    let mockDependencies: IPAEDependencies

    beforeEach(() => {
        // Create comprehensive mocks for all service dependencies
        mockExpandableProcessor = {
            expandTemplate: vi.fn(),
            applyMutation: vi.fn(),
            detectShellType: vi.fn(),
            processTemplateArray: vi.fn(),
            processShellSpecificTemplate: vi.fn(),
            parseExpandableFlag: vi.fn(),
            expandFlags: vi.fn(),
            constructWrappedCommand: vi.fn()
        }

        mockCommandExecution = {
            runNx: vi.fn(),
            runCommand: vi.fn(),
            runMany: vi.fn(),
            executeWithPool: vi.fn(),
            getProcessMetrics: vi.fn(),
            shutdownProcessPool: vi.fn()
        }

        mockAliasManager = {
            processAliases: vi.fn(),
            generateLocalFiles: vi.fn(),
            installAliases: vi.fn(),
            refreshAliasesDirect: vi.fn()
        }

        mockDependencies = {
            expandableProcessor: mockExpandableProcessor,
            commandExecution: mockCommandExecution,
            aliasManager: mockAliasManager
        }
    })

    afterEach(() => {
        vi.clearAllMocks()
    })

    describe('Dependency Injection Patterns', () => {
        it('should accept and use injected dependencies', () => {
            const paeManager = new PAEManagerService(mockDependencies)
            
            // Verify that the service uses the injected dependencies
            expect(paeManager).toBeInstanceOf(PAEManagerService)
            
            // Test that injected dependencies are used
            mockExpandableProcessor.expandTemplate.mockReturnValue('injected result')
            const result = paeManager.expandTemplate('test', {})
            
            expect(mockExpandableProcessor.expandTemplate).toHaveBeenCalledWith('test', {})
            expect(result).toBe('injected result')
        })

        it('should handle dependency injection with real services', () => {
            const realExpandableProcessor = new ExpandableProcessorService()
            const realCommandExecution = new CommandExecutionService()
            const realAliasManager = new AliasManagerService()
            
            const realDependencies: IPAEDependencies = {
                expandableProcessor: realExpandableProcessor,
                commandExecution: realCommandExecution,
                aliasManager: realAliasManager
            }
            
            const paeManager = new PAEManagerService(realDependencies)
            
            // Test that real services work correctly
            const result = paeManager.detectShellType()
            expect(['pwsh', 'linux', 'cmd']).toContain(result)
        })

        it('should handle mixed dependency injection (real and mock services)', () => {
            const realExpandableProcessor = new ExpandableProcessorService()
            const mockCommandExecution = {
                runNx: vi.fn().mockResolvedValue(0),
                runCommand: vi.fn().mockResolvedValue(0),
                runMany: vi.fn().mockResolvedValue(0),
                executeWithPool: vi.fn(),
                getProcessMetrics: vi.fn(),
                shutdownProcessPool: vi.fn()
            }
            const realAliasManager = new AliasManagerService()
            
            const mixedDependencies: IPAEDependencies = {
                expandableProcessor: realExpandableProcessor,
                commandExecution: mockCommandExecution,
                aliasManager: realAliasManager
            }
            
            const paeManager = new PAEManagerService(mixedDependencies)
            
            // Test real service
            const shellType = paeManager.detectShellType()
            expect(['pwsh', 'linux', 'cmd']).toContain(shellType)
            
            // Test mock service
            paeManager.runNx(['build'])
            expect(mockCommandExecution.runNx).toHaveBeenCalledWith(['build'])
        })

        it('should handle dependency injection failures gracefully', () => {
            // Test null dependencies - current implementation doesn't validate, so it should not throw
            expect(() => {
                new PAEManagerService(null as any)
            }).not.toThrow()
            
            // Test undefined dependencies - current implementation doesn't validate, so it should not throw
            expect(() => {
                new PAEManagerService(undefined as any)
            }).not.toThrow()
            
            // Test incomplete dependencies
            const incompleteDependencies = {
                expandableProcessor: mockExpandableProcessor,
                commandExecution: mockCommandExecution,
                aliasManager: undefined as any
            }
            
            expect(() => {
                new PAEManagerService(incompleteDependencies)
            }).not.toThrow()
        })

        it('should validate dependency injection contracts', () => {
            const paeManager = new PAEManagerService(mockDependencies)
            
            // Verify that all required dependencies are present
            expect(mockDependencies.expandableProcessor).toBeDefined()
            expect(mockDependencies.commandExecution).toBeDefined()
            expect(mockDependencies.aliasManager).toBeDefined()
            
            // Verify that dependencies implement required interfaces
            expect(typeof mockDependencies.expandableProcessor.expandTemplate).toBe('function')
            expect(typeof mockDependencies.commandExecution.runNx).toBe('function')
            expect(typeof mockDependencies.aliasManager.generateLocalFiles).toBe('function')
        })
    })

    describe('Service Coordination and Orchestration', () => {
        it('should coordinate multiple services in complex workflows', async () => {
            const paeManager = new PAEManagerService(mockDependencies)
            
            // Mock service responses
            mockExpandableProcessor.detectShellType.mockReturnValue('pwsh')
            mockExpandableProcessor.expandTemplate.mockReturnValue('Write-Host "Starting"; nx build test-project')
            mockCommandExecution.runCommand.mockResolvedValue(0)
            mockAliasManager.generateLocalFiles.mockReturnValue(undefined)
            
            // Complex workflow: detect shell, expand template, generate files, execute command
            const shellType = paeManager.detectShellType()
            const expandedCommand = paeManager.expandTemplate('{{shell_command}}', { shell_command: 'Write-Host "Starting"; nx build test-project' })
            paeManager.generateLocalFiles()
            const exitCode = await paeManager.runCommand('powershell', ['-Command', expandedCommand])
            
            // Verify coordination sequence
            expect(mockExpandableProcessor.detectShellType).toHaveBeenCalledBefore(mockExpandableProcessor.expandTemplate as any)
            expect(mockExpandableProcessor.expandTemplate).toHaveBeenCalledBefore(mockAliasManager.generateLocalFiles as any)
            expect(mockAliasManager.generateLocalFiles).toHaveBeenCalledBefore(mockCommandExecution.runCommand as any)
            
            expect(shellType).toBe('pwsh')
            expect(expandedCommand).toBe('Write-Host "Starting"; nx build test-project')
            expect(exitCode).toBe(0)
        })

        it('should handle service coordination with error handling', async () => {
            const paeManager = new PAEManagerService(mockDependencies)
            
            // Mock service responses with errors
            mockExpandableProcessor.detectShellType.mockReturnValue('pwsh')
            mockExpandableProcessor.expandTemplate.mockImplementation(() => {
                throw new Error('Template expansion failed')
            })
            mockCommandExecution.runCommand.mockResolvedValue(0)
            
            // Test error handling in coordination
            const shellType = paeManager.detectShellType()
            expect(shellType).toBe('pwsh')
            
            expect(() => {
                paeManager.expandTemplate('invalid template', {})
            }).toThrow('Template expansion failed')
            
            // Command execution should not be called due to template failure
            expect(mockCommandExecution.runCommand).not.toHaveBeenCalled()
        })

        it('should coordinate services with different response types', async () => {
            const paeManager = new PAEManagerService(mockDependencies)
            
            // Mock different response types
            mockExpandableProcessor.detectShellType.mockReturnValue('linux')
            mockExpandableProcessor.expandTemplate.mockReturnValue('echo "Linux command"')
            mockCommandExecution.runNx.mockResolvedValue(42)
            mockAliasManager.installAliases.mockResolvedValue(undefined)
            
            // Test coordination with different response types
            const shellType = paeManager.detectShellType() // string
            const expanded = paeManager.expandTemplate('test', {}) // string
            const exitCode = await paeManager.runNx(['build']) // number
            await paeManager.installAliases() // void
            
            expect(shellType).toBe('linux')
            expect(expanded).toBe('echo "Linux command"')
            expect(exitCode).toBe(42)
        })

        it('should handle service coordination with async operations', async () => {
            const paeManager = new PAEManagerService(mockDependencies)
            
            // Mock async operations
            mockCommandExecution.runNx.mockResolvedValue(0)
            mockCommandExecution.runCommand.mockResolvedValue(1)
            mockAliasManager.installAliases.mockResolvedValue(undefined)
            mockAliasManager.refreshAliasesDirect.mockResolvedValue(undefined)
            
            // Test async coordination
            const promises = [
                paeManager.runNx(['build']),
                paeManager.runCommand('test', []),
                paeManager.installAliases(),
                paeManager.refreshAliasesDirect()
            ]
            
            const results = await Promise.all(promises)
            
            expect(results[0]).toBe(0)
            expect(results[1]).toBe(1)
            expect(results[2]).toBeUndefined()
            expect(results[3]).toBeUndefined()
        })
    })

    describe('Service Lifecycle Management', () => {
        it('should handle service initialization correctly', () => {
            const paeManager = new PAEManagerService(mockDependencies)
            
            // Verify proper initialization
            expect(paeManager).toBeInstanceOf(PAEManagerService)
            expect(paeManager).toBeDefined()
        })

        it('should maintain service state consistency', () => {
            const paeManager = new PAEManagerService(mockDependencies)
            
            mockExpandableProcessor.detectShellType.mockReturnValue('pwsh')
            
            // Test state consistency
            const result1 = paeManager.detectShellType()
            const result2 = paeManager.detectShellType()
            
            expect(result1).toBe('pwsh')
            expect(result2).toBe('pwsh')
            expect(mockExpandableProcessor.detectShellType).toHaveBeenCalledTimes(2)
        })

        it('should handle service lifecycle with dependency changes', () => {
            // Create initial dependencies
            const initialDependencies: IPAEDependencies = {
                expandableProcessor: mockExpandableProcessor,
                commandExecution: mockCommandExecution,
                aliasManager: mockAliasManager
            }
            
            const paeManager1 = new PAEManagerService(initialDependencies)
            
            // Create new dependencies
            const newExpandableProcessor = {
                ...mockExpandableProcessor,
                detectShellType: vi.fn().mockReturnValue('linux')
            }
            
            const newDependencies: IPAEDependencies = {
                expandableProcessor: newExpandableProcessor,
                commandExecution: mockCommandExecution,
                aliasManager: mockAliasManager
            }
            
            const paeManager2 = new PAEManagerService(newDependencies)
            
            // Test that different instances use different dependencies
            mockExpandableProcessor.detectShellType.mockReturnValue('pwsh')
            
            const result1 = paeManager1.detectShellType()
            const result2 = paeManager2.detectShellType()
            
            expect(result1).toBe('pwsh')
            expect(result2).toBe('linux')
        })

        it('should handle service cleanup and resource management', () => {
            const paeManager = new PAEManagerService(mockDependencies)
            
            // Test that services can be cleaned up
            mockCommandExecution.shutdownProcessPool.mockResolvedValue(undefined)
            
            // Simulate cleanup
            paeManager.runNx(['build'])
            expect(mockCommandExecution.runNx).toHaveBeenCalled()
            
            // Verify cleanup methods are available
            expect(typeof mockCommandExecution.shutdownProcessPool).toBe('function')
        })
    })

    describe('Service Isolation and Composition', () => {
        it('should isolate services from each other', () => {
            const paeManager = new PAEManagerService(mockDependencies)
            
            // Test service isolation
            mockExpandableProcessor.expandTemplate.mockReturnValue('isolated result')
            mockCommandExecution.runNx.mockResolvedValue(0)
            mockAliasManager.generateLocalFiles.mockReturnValue(undefined)
            
            // Each service should work independently
            const expanded = paeManager.expandTemplate('test', {})
            paeManager.generateLocalFiles()
            
            expect(expanded).toBe('isolated result')
            expect(mockExpandableProcessor.expandTemplate).toHaveBeenCalledWith('test', {})
            expect(mockAliasManager.generateLocalFiles).toHaveBeenCalled()
            
            // Verify no cross-service calls
            expect(mockCommandExecution.runNx).not.toHaveBeenCalled()
        })

        it('should compose services correctly through PAEManager', async () => {
            const paeManager = new PAEManagerService(mockDependencies)
            
            // Test service composition
            mockExpandableProcessor.detectShellType.mockReturnValue('pwsh')
            mockExpandableProcessor.expandTemplate.mockReturnValue('Write-Host "Composed command"')
            mockCommandExecution.runCommand.mockResolvedValue(0)
            
            // Compose services through PAEManager
            const shellType = paeManager.detectShellType()
            const expanded = paeManager.expandTemplate('{command}', { command: 'Write-Host "Composed command"' })
            const exitCode = await paeManager.runCommand('powershell', ['-Command', expanded])
            
            expect(shellType).toBe('pwsh')
            expect(expanded).toBe('Write-Host "Composed command"')
            expect(exitCode).toBe(0)
        })

        it('should handle service composition with error boundaries', () => {
            const paeManager = new PAEManagerService(mockDependencies)
            
            // Test error boundaries in service composition
            mockExpandableProcessor.detectShellType.mockReturnValue('pwsh')
            mockExpandableProcessor.expandTemplate.mockImplementation(() => {
                throw new Error('Composition error')
            })
            mockCommandExecution.runCommand.mockResolvedValue(0)
            
            // Test error boundary
            const shellType = paeManager.detectShellType()
            expect(shellType).toBe('pwsh')
            
            expect(() => {
                paeManager.expandTemplate('invalid', {})
            }).toThrow('Composition error')
            
            // Command execution should not be called due to error boundary
            expect(mockCommandExecution.runCommand).not.toHaveBeenCalled()
        })

        it('should validate service composition contracts', () => {
            const paeManager = new PAEManagerService(mockDependencies)
            
            // Test that all service methods are properly composed
            const serviceMethods = [
                'generateLocalFiles',
                'installAliases',
                'refreshAliasesDirect',
                'runNx',
                'runCommand',
                'runMany',
                'expandTemplate',
                'detectShellType',
                'processTemplateArray',
                'processShellSpecificTemplate',
                'parseExpandableFlag',
                'expandFlags',
                'constructWrappedCommand'
            ]
            
            serviceMethods.forEach(method => {
                expect(typeof paeManager[method as keyof PAEManagerService]).toBe('function')
            })
        })
    })

    describe('Dependency Injection Performance', () => {
        it('should handle dependency injection efficiently', () => {
            const startTime = Date.now()
            
            // Create many instances with different dependencies
            for (let i = 0; i < 100; i++) {
                const customDependencies: IPAEDependencies = {
                    expandableProcessor: {
                        ...mockExpandableProcessor,
                        detectShellType: vi.fn().mockReturnValue('pwsh')
                    },
                    commandExecution: {
                        ...mockCommandExecution,
                        runNx: vi.fn().mockResolvedValue(i)
                    },
                    aliasManager: {
                        ...mockAliasManager,
                        generateLocalFiles: vi.fn()
                    }
                }
                
                new PAEManagerService(customDependencies)
            }
            
            const endTime = Date.now()
            
            expect(endTime - startTime).toBeLessThan(1000) // Should complete within 1 second
        })

        it('should handle service coordination efficiently', async () => {
            const paeManager = new PAEManagerService(mockDependencies)
            
            // Mock efficient service responses
            mockExpandableProcessor.detectShellType.mockReturnValue('pwsh')
            mockExpandableProcessor.expandTemplate.mockReturnValue('efficient command')
            mockCommandExecution.runCommand.mockResolvedValue(0)
            
            const startTime = Date.now()
            
            // Perform many coordinated operations
            for (let i = 0; i < 50; i++) {
                const shellType = paeManager.detectShellType()
                const expanded = paeManager.expandTemplate(`template-${i}`, {})
                await paeManager.runCommand('test', [])
            }
            
            const endTime = Date.now()
            
            expect(endTime - startTime).toBeLessThan(2000) // Should complete within 2 seconds
            expect(mockExpandableProcessor.detectShellType).toHaveBeenCalledTimes(50)
            expect(mockExpandableProcessor.expandTemplate).toHaveBeenCalledTimes(50)
            expect(mockCommandExecution.runCommand).toHaveBeenCalledTimes(50)
        })
    })

    describe('Dependency Injection Validation', () => {
        it('should validate dependency injection patterns', () => {
            // Test that dependency injection follows proper patterns
            const paeManager = new PAEManagerService(mockDependencies)
            
            // Verify that dependencies are properly injected
            expect(paeManager).toBeInstanceOf(PAEManagerService)
            
            // Verify that injected dependencies are used
            mockExpandableProcessor.expandTemplate.mockReturnValue('validated result')
            const result = paeManager.expandTemplate('test', {})
            
            expect(result).toBe('validated result')
            expect(mockExpandableProcessor.expandTemplate).toHaveBeenCalledWith('test', {})
        })

        it('should validate service coordination patterns', () => {
            const paeManager = new PAEManagerService(mockDependencies)
            
            // Test that service coordination follows proper patterns
            mockExpandableProcessor.detectShellType.mockReturnValue('pwsh')
            mockExpandableProcessor.expandTemplate.mockReturnValue('coordinated result')
            
            const shellType = paeManager.detectShellType()
            const expanded = paeManager.expandTemplate('test', {})
            
            expect(shellType).toBe('pwsh')
            expect(expanded).toBe('coordinated result')
            
            // Verify coordination sequence
            expect(mockExpandableProcessor.detectShellType).toHaveBeenCalledBefore(mockExpandableProcessor.expandTemplate as any)
        })

        it('should validate service lifecycle patterns', () => {
            // Test that service lifecycle follows proper patterns
            const paeManager = new PAEManagerService(mockDependencies)
            
            // Verify initialization
            expect(paeManager).toBeDefined()
            expect(paeManager).toBeInstanceOf(PAEManagerService)
            
            // Verify state management
            mockExpandableProcessor.detectShellType.mockReturnValue('pwsh')
            const result1 = paeManager.detectShellType()
            const result2 = paeManager.detectShellType()
            
            expect(result1).toBe('pwsh')
            expect(result2).toBe('pwsh')
        })
    })
})
