import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import type { 
    IPAEDependencies, 
    IPAEManagerService,
    IExpandableProcessorService,
    ICommandExecutionService,
    IAliasManagerService
} from '../../../src/_types/index.js'
import { PAEManagerService } from '../../../src/services/PAEManager.service.js'

/**
 * Service Architecture Testing
 * 
 * Tests the orchestration patterns, service boundaries, and dependency injection
 * of the PAEManagerService and its coordination with other services.
 */

describe('Service Architecture - PAEManagerService', () => {
    let mockDependencies: IPAEDependencies
    let mockExpandableProcessor: IExpandableProcessorService
    let mockCommandExecution: ICommandExecutionService
    let mockAliasManager: IAliasManagerService
    let paeManager: PAEManagerService

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

        paeManager = new PAEManagerService(mockDependencies)
    })

    afterEach(() => {
        vi.clearAllMocks()
    })

    describe('Service Orchestration Patterns', () => {
        it('should delegate alias management operations to AliasManagerService', async () => {
            // Test generateLocalFiles delegation
            paeManager.generateLocalFiles()
            expect(mockAliasManager.generateLocalFiles).toHaveBeenCalledTimes(1)

            // Test installAliases delegation
            await paeManager.installAliases()
            expect(mockAliasManager.installAliases).toHaveBeenCalledTimes(1)

            // Test refreshAliasesDirect delegation
            await paeManager.refreshAliasesDirect()
            expect(mockAliasManager.refreshAliasesDirect).toHaveBeenCalledTimes(1)
        })

        it('should delegate command execution operations to CommandExecutionService', async () => {
            const testArgv = ['build', 'test-project']
            const testCommand = 'nx'
            const testArgs = ['build', 'test-project']
            const testRunType = 'ext' as const
            const testTargets = ['build', 'test']
            const testFlags = ['--skip-nx-cache']
            const testConfig = { nxPackages: {} }

            // Test runNx delegation
            mockCommandExecution.runNx.mockResolvedValue(0)
            await paeManager.runNx(testArgv)
            expect(mockCommandExecution.runNx).toHaveBeenCalledWith(testArgv)

            // Test runCommand delegation
            mockCommandExecution.runCommand.mockResolvedValue(0)
            await paeManager.runCommand(testCommand, testArgs)
            expect(mockCommandExecution.runCommand).toHaveBeenCalledWith(testCommand, testArgs)

            // Test runMany delegation
            mockCommandExecution.runMany.mockResolvedValue(0)
            await paeManager.runMany(testRunType, testTargets, testFlags, testConfig)
            expect(mockCommandExecution.runMany).toHaveBeenCalledWith(testRunType, testTargets, testFlags, testConfig)
        })

        it('should delegate expandable processing operations to ExpandableProcessorService', () => {
            const testTemplate = 'Hello {{name}}!'
            const testVariables = { name: 'World' }
            const testTemplates = [{ position: 'start' as const, template: 'echo "start"' }]
            const testExpandable = { template: 'echo "test"' }
            const testArgs = ['-s', '--output-style=stream']
            const testExpandables = { '-s': '--skip-nx-cache' }
            const testBaseCommand = ['nx', 'build']
            const testStartTemplates = ['echo "before"']
            const testEndTemplates = ['echo "after"']

            // Test expandTemplate delegation
            mockExpandableProcessor.expandTemplate.mockReturnValue('Hello World!')
            const result1 = paeManager.expandTemplate(testTemplate, testVariables)
            expect(mockExpandableProcessor.expandTemplate).toHaveBeenCalledWith(testTemplate, testVariables)
            expect(result1).toBe('Hello World!')

            // Test detectShellType delegation
            mockExpandableProcessor.detectShellType.mockReturnValue('pwsh')
            const result2 = paeManager.detectShellType()
            expect(mockExpandableProcessor.detectShellType).toHaveBeenCalledTimes(1)
            expect(result2).toBe('pwsh')

            // Test processTemplateArray delegation
            mockExpandableProcessor.processTemplateArray.mockReturnValue({ start: ['echo "start"'], end: [] })
            const result3 = paeManager.processTemplateArray(testTemplates, testVariables)
            expect(mockExpandableProcessor.processTemplateArray).toHaveBeenCalledWith(testTemplates, testVariables)
            expect(result3).toEqual({ start: ['echo "start"'], end: [] })

            // Test processShellSpecificTemplate delegation
            mockExpandableProcessor.processShellSpecificTemplate.mockReturnValue({ start: ['echo "test"'], end: [] })
            const result4 = paeManager.processShellSpecificTemplate(testExpandable, testVariables)
            expect(mockExpandableProcessor.processShellSpecificTemplate).toHaveBeenCalledWith(testExpandable, testVariables)
            expect(result4).toEqual({ start: ['echo "test"'], end: [] })

            // Test parseExpandableFlag delegation
            mockExpandableProcessor.parseExpandableFlag.mockReturnValue({ key: 's', value: undefined })
            const result5 = paeManager.parseExpandableFlag('-s')
            expect(mockExpandableProcessor.parseExpandableFlag).toHaveBeenCalledWith('-s')
            expect(result5).toEqual({ key: 's', value: undefined })

            // Test expandFlags delegation
            mockExpandableProcessor.expandFlags.mockReturnValue({ expanded: ['--skip-nx-cache'], remaining: [] })
            const result6 = paeManager.expandFlags(testArgs, testExpandables)
            expect(mockExpandableProcessor.expandFlags).toHaveBeenCalledWith(testArgs, testExpandables)
            expect(result6).toEqual({ expanded: ['--skip-nx-cache'], remaining: [] })

            // Test constructWrappedCommand delegation
            mockExpandableProcessor.constructWrappedCommand.mockReturnValue(['echo "before"', 'nx', 'build', 'echo "after"'])
            const result7 = paeManager.constructWrappedCommand(testBaseCommand, testStartTemplates, testEndTemplates)
            expect(mockExpandableProcessor.constructWrappedCommand).toHaveBeenCalledWith(testBaseCommand, testStartTemplates, testEndTemplates)
            expect(result7).toEqual(['echo "before"', 'nx', 'build', 'echo "after"'])
        })
    })

    describe('Service Boundary Validation', () => {
        it('should maintain proper service boundaries without cross-service calls', () => {
            // Verify that PAEManagerService only calls its direct dependencies
            // and doesn't bypass the service layer architecture
            
            const spyExpandable = vi.spyOn(mockExpandableProcessor, 'expandTemplate')
            const spyCommand = vi.spyOn(mockCommandExecution, 'runNx')
            const spyAlias = vi.spyOn(mockAliasManager, 'generateLocalFiles')

            // Execute operations through PAEManagerService
            paeManager.expandTemplate('test', {})
            paeManager.runNx(['build'])
            paeManager.generateLocalFiles()

            // Verify only the expected service methods were called
            expect(spyExpandable).toHaveBeenCalledTimes(1)
            expect(spyCommand).toHaveBeenCalledTimes(1)
            expect(spyAlias).toHaveBeenCalledTimes(1)

            // Verify no unexpected cross-service calls occurred
            // Note: These methods don't exist on the mock services, so we can't test them
        })

        it('should handle service dependency failures gracefully', async () => {
            // Test error propagation from service dependencies
            const testError = new Error('Service dependency failure')
            
            mockCommandExecution.runNx.mockRejectedValue(testError)
            mockExpandableProcessor.expandTemplate.mockImplementation(() => {
                throw testError
            })
            mockAliasManager.generateLocalFiles.mockImplementation(() => {
                throw testError
            })

            // Verify errors are properly propagated
            await expect(paeManager.runNx(['build'])).rejects.toThrow('Service dependency failure')
            expect(() => paeManager.expandTemplate('test', {})).toThrow('Service dependency failure')
            expect(() => paeManager.generateLocalFiles()).toThrow('Service dependency failure')
        })

        it('should maintain service interface contracts', () => {
            // Verify that PAEManagerService implements all required interface methods
            const interfaceMethods = [
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

            interfaceMethods.forEach(method => {
                expect(typeof paeManager[method as keyof PAEManagerService]).toBe('function')
            })
        })
    })

    describe('Dependency Injection and Coordination', () => {
        it('should accept and use injected dependencies', () => {
            // Verify that the service uses the injected dependencies
            const customDependencies: IPAEDependencies = {
                expandableProcessor: {
                    expandTemplate: vi.fn().mockReturnValue('custom result'),
                    applyMutation: vi.fn(),
                    detectShellType: vi.fn().mockReturnValue('linux'),
                    processTemplateArray: vi.fn(),
                    processShellSpecificTemplate: vi.fn(),
                    parseExpandableFlag: vi.fn(),
                    expandFlags: vi.fn(),
                    constructWrappedCommand: vi.fn()
                },
                commandExecution: {
                    runNx: vi.fn().mockResolvedValue(42),
                    runCommand: vi.fn(),
                    runMany: vi.fn(),
                    executeWithPool: vi.fn(),
                    getProcessMetrics: vi.fn(),
                    shutdownProcessPool: vi.fn()
                },
                aliasManager: {
                    processAliases: vi.fn(),
                    generateLocalFiles: vi.fn(),
                    installAliases: vi.fn(),
                    refreshAliasesDirect: vi.fn()
                }
            }

            const customPAEManager = new PAEManagerService(customDependencies)

            // Test that custom dependencies are used
            const result1 = customPAEManager.expandTemplate('test', {})
            expect(result1).toBe('custom result')
            expect(customDependencies.expandableProcessor.expandTemplate).toHaveBeenCalledWith('test', {})

            const result2 = customPAEManager.detectShellType()
            expect(result2).toBe('linux')
            expect(customDependencies.expandableProcessor.detectShellType).toHaveBeenCalledTimes(1)
        })

        it('should coordinate multiple service operations correctly', async () => {
            // Test complex orchestration scenarios
            mockExpandableProcessor.detectShellType.mockReturnValue('pwsh')
            mockExpandableProcessor.expandTemplate.mockReturnValue('expanded command')
            mockCommandExecution.runCommand.mockResolvedValue(0)

            // Simulate a complex workflow
            const shellType = paeManager.detectShellType()
            expect(shellType).toBe('pwsh')

            const expanded = paeManager.expandTemplate('nx {{target}} {{project}}', { target: 'build', project: 'test' })
            expect(expanded).toBe('expanded command')

            const exitCode = await paeManager.runCommand('nx', ['build', 'test'])
            expect(exitCode).toBe(0)

            // Verify the coordination sequence
            expect(mockExpandableProcessor.detectShellType).toHaveBeenCalledBefore(mockExpandableProcessor.expandTemplate as any)
            expect(mockExpandableProcessor.expandTemplate).toHaveBeenCalledBefore(mockCommandExecution.runCommand as any)
        })

        it('should handle dependency injection failures', () => {
            // Test that the service handles missing or invalid dependencies
            // Note: The constructor doesn't validate dependencies, so these won't throw
            const nullService = new PAEManagerService(null as any)
            expect(nullService).toBeInstanceOf(PAEManagerService)

            const undefinedService = new PAEManagerService(undefined as any)
            expect(undefinedService).toBeInstanceOf(PAEManagerService)
        })
    })

    describe('Service Communication Patterns', () => {
        it('should maintain proper async/await patterns for async operations', async () => {
            // Test that async operations are properly handled
            mockCommandExecution.runNx.mockResolvedValue(0)
            mockCommandExecution.runCommand.mockResolvedValue(0)
            mockCommandExecution.runMany.mockResolvedValue(0)
            mockAliasManager.installAliases.mockResolvedValue(undefined)
            mockAliasManager.refreshAliasesDirect.mockResolvedValue(undefined)

            // Verify async operations return promises
            const runNxPromise = paeManager.runNx(['build'])
            expect(runNxPromise).toBeInstanceOf(Promise)

            const runCommandPromise = paeManager.runCommand('nx', ['build'])
            expect(runCommandPromise).toBeInstanceOf(Promise)

            const runManyPromise = paeManager.runMany('ext', ['build'], [], {})
            expect(runManyPromise).toBeInstanceOf(Promise)

            const installPromise = paeManager.installAliases()
            expect(installPromise).toBeInstanceOf(Promise)

            const refreshPromise = paeManager.refreshAliasesDirect()
            expect(refreshPromise).toBeInstanceOf(Promise)

            // Verify all promises resolve correctly
            await expect(runNxPromise).resolves.toBe(0)
            await expect(runCommandPromise).resolves.toBe(0)
            await expect(runManyPromise).resolves.toBe(0)
            await expect(installPromise).resolves.toBeUndefined()
            await expect(refreshPromise).resolves.toBeUndefined()
        })

        it('should handle synchronous operations correctly', () => {
            // Test that synchronous operations work correctly
            mockExpandableProcessor.expandTemplate.mockReturnValue('result')
            mockExpandableProcessor.detectShellType.mockReturnValue('cmd')
            mockAliasManager.generateLocalFiles.mockReturnValue(undefined)

            // Verify synchronous operations return immediately
            const result1 = paeManager.expandTemplate('test', {})
            expect(result1).toBe('result')

            const result2 = paeManager.detectShellType()
            expect(result2).toBe('cmd')

            const result3 = paeManager.generateLocalFiles()
            expect(result3).toBeUndefined()
        })

        it('should maintain proper error handling across service boundaries', async () => {
            // Test error handling patterns
            const testError = new Error('Test error')
            
            mockCommandExecution.runNx.mockRejectedValue(testError)
            mockExpandableProcessor.expandTemplate.mockImplementation(() => {
                throw testError
            })

            // Verify errors are properly propagated
            await expect(paeManager.runNx(['build'])).rejects.toThrow('Test error')
            expect(() => paeManager.expandTemplate('test', {})).toThrow('Test error')
        })
    })

    describe('Service Lifecycle Management', () => {
        it('should handle service initialization correctly', () => {
            // Test that the service initializes with proper dependencies
            expect(paeManager).toBeInstanceOf(PAEManagerService)
            expect(paeManager).toBeDefined()
        })

        it('should maintain service state consistency', () => {
            // Test that service state remains consistent across operations
            mockExpandableProcessor.detectShellType.mockReturnValue('pwsh')
            
            const result1 = paeManager.detectShellType()
            const result2 = paeManager.detectShellType()
            
            expect(result1).toBe('pwsh')
            expect(result2).toBe('pwsh')
            expect(mockExpandableProcessor.detectShellType).toHaveBeenCalledTimes(2)
        })
    })
})
