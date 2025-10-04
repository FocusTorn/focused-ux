import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'

// Mock all external dependencies
vi.mock('execa', () => ({
    execa: vi.fn()
}))

vi.mock('fs', () => ({
    default: {
        existsSync: vi.fn(),
        readFileSync: vi.fn(),
        writeFileSync: vi.fn(),
        appendFileSync: vi.fn()
    }
}))

vi.mock('ora', () => ({
    default: vi.fn(() => ({
        start: vi.fn(),
        stop: vi.fn(),
        text: ''
    }))
}))

vi.mock('../../../src/config.js', () => ({
    default: {},
    loadAliasConfig: vi.fn(),
    resolveProjectForAlias: vi.fn(),
    clearAllCaches: vi.fn()
}))

vi.mock('../../../src/services/index.js', () => ({
    commandExecution: {
        runNx: vi.fn(),
        runCommand: vi.fn(),
        executeWithPool: vi.fn(),
        shutdownProcessPool: vi.fn(),
        setChildProcessTracker: vi.fn()
    },
    expandableProcessor: {
        expandFlags: vi.fn(),
        constructWrappedCommand: vi.fn()
    },
    aliasManager: {
        generateLocalFiles: vi.fn(),
        generateDirectToNativeModules: vi.fn()
    }
}))

// Mock the specific CommandExecution service file for dynamic imports
vi.mock('../../../src/services/CommandExecution.service.js', () => ({
    commandExecution: {
        runNx: vi.fn(),
        runCommand: vi.fn(),
        executeWithPool: vi.fn(),
        shutdownProcessPool: vi.fn(),
        setChildProcessTracker: vi.fn()
    },
    setChildProcessTracker: vi.fn()
}))

vi.mock('../../../src/shell.js', () => ({
    detectShell: vi.fn(() => 'powershell')
}))

// Mock cli.js to allow importing specific functions
vi.mock('../../../src/cli.js', async (importOriginal) => {
    const actual = await importOriginal()
    return {
        ...actual,
        handleAliasCommand: actual.handleAliasCommand,
        handlePackageAlias: actual.handlePackageAlias,
        handleFeatureAlias: actual.handleFeatureAlias,
        handleNotNxTarget: actual.handleNotNxTarget,
        handleExpandableCommand: actual.handleExpandableCommand,
        resolveProjectForAlias: actual.resolveProjectForAlias,
        showDynamicHelp: actual.showDynamicHelp
    }
})

describe('AliasCommand Tests', () => {
    let mockConsoleLog: ReturnType<typeof vi.spyOn>
    let mockConsoleError: ReturnType<typeof vi.spyOn>

    beforeEach(() => {
        // Mock console methods
        mockConsoleLog = vi.spyOn(console, 'log').mockImplementation(() => {})
        mockConsoleError = vi.spyOn(console, 'error').mockImplementation(() => {})
        
        // Reset all mocks
        vi.clearAllMocks()
        
        // Set test environment
        process.env.NODE_ENV = 'test'
        process.env.VITEST = 'true'
    })

    afterEach(() => {
        // Restore console methods
        vi.restoreAllMocks()
    })

    describe('handleAliasCommand() function', () => {
        it('should handle package alias resolution', async () => {
            // Mock successful config loading
            const mockConfig = {
                nxPackages: {
                    dc: 'dynamicons',
                    pbc: 'project-butler-core'
                },
                nxTargets: {
                    b: 'build',
                    t: 'test'
                }
            }

            const { loadAliasConfig } = await import('../../../src/config.js')
            vi.mocked(loadAliasConfig).mockReturnValue(mockConfig)

            // Mock resolveProjectForAlias
            const { resolveProjectForAlias } = await import('../../../src/config.js')
            vi.mocked(resolveProjectForAlias).mockReturnValue({ project: 'dynamicons', isFull: false })

            // Mock expandableProcessor
            const { expandableProcessor } = await import('../../../src/services/index.js')
            vi.mocked(expandableProcessor.expandFlags).mockReturnValue({
                start: [],
                prefix: [],
                preArgs: [],
                suffix: [],
                end: [],
                remainingArgs: []
            })
            vi.mocked(expandableProcessor.constructWrappedCommand).mockReturnValue(['nx', 'run', 'dynamicons:build'])

            // Mock commandExecution.runNx
            const { commandExecution } = await import('../../../src/services/index.js')
            vi.mocked(commandExecution.runNx).mockResolvedValue(0)

            // Import and call handleAliasCommand
            const { handleAliasCommand } = await import('../../../src/cli.js')
            const result = await handleAliasCommand(['dc', 'b'], mockConfig)
            
            expect(result).toBe(0)
            expect(commandExecution.runNx).toHaveBeenCalledWith(
                ['nx', 'run', 'dynamicons:build'],
                undefined
            )
        })

        it('should handle feature alias resolution', async () => {
            // Mock config with feature alias
            const mockConfig = {
                nxPackages: {},
                'feature-nxTargets': {
                    test: {
                        'run-target': 'test',
                        'run-from': 'core'
                    }
                },
                nxTargets: {
                    b: 'build'
                },
                'expandable-flags': {}
            }

            const { loadAliasConfig } = await import('../../../src/config.js')
            vi.mocked(loadAliasConfig).mockReturnValue(mockConfig)

            // Mock resolveProjectForAlias for feature - it gets called with { name: 'test', suffix: 'core' }
            const { resolveProjectForAlias } = await import('../../../src/config.js')
            vi.mocked(resolveProjectForAlias).mockReturnValue({ project: 'test-core', isFull: false })

            // Mock expandableProcessor
            const { expandableProcessor } = await import('../../../src/services/index.js')
            vi.mocked(expandableProcessor.expandFlags).mockReturnValue({
                start: [],
                prefix: [],
                preArgs: [],
                suffix: [],
                end: [],
                remainingArgs: []
            })
            vi.mocked(expandableProcessor.constructWrappedCommand).mockReturnValue(['nx', 'run', 'test-core:test'])

            // Mock commandExecution.runNx
            const { commandExecution } = await import('../../../src/services/index.js')
            vi.mocked(commandExecution.runNx).mockResolvedValue(0)

            // Import and call handleAliasCommand
            const { handleAliasCommand } = await import('../../../src/cli.js')
            const result = await handleAliasCommand(['test'], mockConfig)
            
            expect(result).toBe(0)
            expect(commandExecution.runNx).toHaveBeenCalledWith(
                ['nx', 'run', 'test-core:test']
            )
        })

        it('should handle nx target resolution', async () => {
            // Mock config with package alias and target shortcuts
            const mockConfig = {
                nxPackages: {
                    dc: 'dynamicons'
                },
                nxTargets: {
                    b: 'build',
                    t: 'test'
                }
            }

            const { loadAliasConfig } = await import('../../../src/config.js')
            vi.mocked(loadAliasConfig).mockReturnValue(mockConfig)

            // Mock resolveProjectForAlias
            const { resolveProjectForAlias } = await import('../../../src/config.js')
            vi.mocked(resolveProjectForAlias).mockReturnValue({ project: 'dynamicons', isFull: false })

            // Mock expandableProcessor
            const { expandableProcessor } = await import('../../../src/services/index.js')
            vi.mocked(expandableProcessor.expandFlags).mockReturnValue({
                start: [],
                prefix: [],
                preArgs: [],
                suffix: [],
                end: [],
                remainingArgs: []
            })
            vi.mocked(expandableProcessor.constructWrappedCommand).mockReturnValue(['nx', 'run', 'dynamicons:test'])

            // Mock commandExecution.runNx
            const { commandExecution } = await import('../../../src/services/index.js')
            vi.mocked(commandExecution.runNx).mockResolvedValue(0)

            // Import and call handleAliasCommand
            const { handleAliasCommand } = await import('../../../src/cli.js')
            const result = await handleAliasCommand(['dc', 't'], mockConfig)
            
            expect(result).toBe(0)
            expect(commandExecution.runNx).toHaveBeenCalledWith(
                ['nx', 'run', 'dynamicons:test'],
                undefined
            )
        })

        it('should handle alias resolution error handling', async () => {
            // Mock config with no matching alias
            const mockConfig = {
                nxPackages: {},
                nxTargets: {}
            }

            const { loadAliasConfig } = await import('../../../src/config.js')
            vi.mocked(loadAliasConfig).mockReturnValue(mockConfig)

            // Import and call handleAliasCommand with unknown alias
            const { handleAliasCommand } = await import('../../../src/cli.js')
            const result = await handleAliasCommand(['unknown'], mockConfig)
            
            expect(result).toBe(1)
            expect(mockConsoleError).toHaveBeenCalledWith(
                expect.stringContaining('Unknown alias: unknown')
            )
        })

        it('should handle alias command with help flags', async () => {
            // Mock config with internal flags
            const mockConfig = {
                nxPackages: {
                    dc: 'dynamicons'
                },
                nxTargets: {
                    b: 'build'
                },
                'internal-flags': {}
            }

            const { loadAliasConfig } = await import('../../../src/config.js')
            vi.mocked(loadAliasConfig).mockReturnValue(mockConfig)

            // Mock resolveProjectForAlias
            const { resolveProjectForAlias } = await import('../../../src/config.js')
            vi.mocked(resolveProjectForAlias).mockReturnValue({ project: 'dynamicons', isFull: false })

            // Mock expandableProcessor
            const { expandableProcessor } = await import('../../../src/services/index.js')
            vi.mocked(expandableProcessor.expandFlags).mockReturnValue({
                start: [],
                prefix: [],
                preArgs: [],
                suffix: [],
                end: [],
                remainingArgs: []
            })

            // Import and call handleAliasCommand with help flag
            const { handleAliasCommand } = await import('../../../src/cli.js')
            const result = await handleAliasCommand(['dc', '--help'], mockConfig)
            
            expect(result).toBe(0)
            expect(mockConsoleLog).toHaveBeenCalledWith('')
            expect(mockConsoleLog).toHaveBeenCalledWith('PAE - Project Alias Expander')
        })

        it('should handle alias command with invalid aliases', async () => {
            // Mock config with no matching alias
            const mockConfig = {
                nxPackages: {},
                nxTargets: {}
            }

            const { loadAliasConfig } = await import('../../../src/config.js')
            vi.mocked(loadAliasConfig).mockReturnValue(mockConfig)

            // Import and call handleAliasCommand with invalid alias
            const { handleAliasCommand } = await import('../../../src/cli.js')
            const result = await handleAliasCommand(['invalid'], mockConfig)
            
            expect(result).toBe(1)
            expect(mockConsoleError).toHaveBeenCalledWith(
                expect.stringContaining('Unknown alias: invalid')
            )
        })

        it('should handle alias command configuration loading', async () => {
            // Mock successful config loading
            const mockConfig = {
                nxPackages: {
                    dc: 'dynamicons'
                },
                nxTargets: {
                    b: 'build'
                }
            }

            const { loadAliasConfig } = await import('../../../src/config.js')
            vi.mocked(loadAliasConfig).mockReturnValue(mockConfig)

            // Mock resolveProjectForAlias
            const { resolveProjectForAlias } = await import('../../../src/config.js')
            vi.mocked(resolveProjectForAlias).mockReturnValue({ project: 'dynamicons', isFull: false })

            // Mock expandableProcessor
            const { expandableProcessor } = await import('../../../src/services/index.js')
            vi.mocked(expandableProcessor.expandFlags).mockReturnValue({
                start: [],
                prefix: [],
                preArgs: [],
                suffix: [],
                end: [],
                remainingArgs: []
            })
            vi.mocked(expandableProcessor.constructWrappedCommand).mockReturnValue(['nx', 'run', 'dynamicons:build'])

            // Mock commandExecution.runNx
            const { commandExecution } = await import('../../../src/services/index.js')
            vi.mocked(commandExecution.runNx).mockResolvedValue(0)

            // Import and call handleAliasCommand
            const { handleAliasCommand } = await import('../../../src/cli.js')
            const result = await handleAliasCommand(['dc', 'b'], mockConfig)
            
            expect(result).toBe(0)
            // Note: loadAliasConfig is not called in handleAliasCommand - it's called in main()
        })

        it('should handle alias command service integration', async () => {
            // Mock config
            const mockConfig = {
                nxPackages: {
                    dc: 'dynamicons'
                },
                nxTargets: {
                    b: 'build'
                }
            }

            const { loadAliasConfig } = await import('../../../src/config.js')
            vi.mocked(loadAliasConfig).mockReturnValue(mockConfig)

            // Mock resolveProjectForAlias
            const { resolveProjectForAlias } = await import('../../../src/config.js')
            vi.mocked(resolveProjectForAlias).mockReturnValue({ project: 'dynamicons', isFull: false })

            // Mock expandableProcessor
            const { expandableProcessor } = await import('../../../src/services/index.js')
            vi.mocked(expandableProcessor.expandFlags).mockReturnValue({
                start: [],
                prefix: [],
                preArgs: [],
                suffix: [],
                end: [],
                remainingArgs: []
            })
            vi.mocked(expandableProcessor.constructWrappedCommand).mockReturnValue(['nx', 'run', 'dynamicons:build'])

            // Mock commandExecution.runNx
            const { commandExecution } = await import('../../../src/services/index.js')
            vi.mocked(commandExecution.runNx).mockResolvedValue(0)

            // Import and call handleAliasCommand
            const { handleAliasCommand } = await import('../../../src/cli.js')
            const result = await handleAliasCommand(['dc', 'b'], mockConfig)
            
            expect(result).toBe(0)
            expect(expandableProcessor.expandFlags).toHaveBeenCalled()
            expect(expandableProcessor.constructWrappedCommand).toHaveBeenCalled()
            expect(commandExecution.runNx).toHaveBeenCalled()
        })

        it('should handle alias command argument passing', async () => {
            // Mock config
            const mockConfig = {
                nxPackages: {
                    dc: 'dynamicons'
                },
                nxTargets: {
                    b: 'build'
                }
            }

            const { loadAliasConfig } = await import('../../../src/config.js')
            vi.mocked(loadAliasConfig).mockReturnValue(mockConfig)

            // Mock resolveProjectForAlias
            const { resolveProjectForAlias } = await import('../../../src/config.js')
            vi.mocked(resolveProjectForAlias).mockReturnValue({ project: 'dynamicons', isFull: false })

            // Mock expandableProcessor to return specific args
            const { expandableProcessor } = await import('../../../src/services/index.js')
            vi.mocked(expandableProcessor.expandFlags).mockReturnValue({
                start: [],
                prefix: ['--verbose'],
                preArgs: [],
                suffix: [],
                end: [],
                remainingArgs: ['--watch']
            })
            vi.mocked(expandableProcessor.constructWrappedCommand).mockReturnValue(['nx', 'run', 'dynamicons:build', '--verbose', '--watch'])

            // Mock commandExecution.runNx
            const { commandExecution } = await import('../../../src/services/index.js')
            vi.mocked(commandExecution.runNx).mockResolvedValue(0)

            // Import and call handleAliasCommand with additional args
            const { handleAliasCommand } = await import('../../../src/cli.js')
            const result = await handleAliasCommand(['dc', 'b', '--verbose', '--watch'], mockConfig)
            
            expect(result).toBe(0)
            expect(commandExecution.runNx).toHaveBeenCalledWith(
                ['nx', 'run', 'dynamicons:build', '--verbose', '--watch'],
                undefined
            )
        })

        it('should handle not-nx target resolution', async () => {
            // Mock config with not-nx target
            const mockConfig = {
                nxPackages: {},
                'not-nxTargets': {
                    ls: 'dir'
                }
            }

            const { loadAliasConfig } = await import('../../../src/config.js')
            vi.mocked(loadAliasConfig).mockReturnValue(mockConfig)

            // Mock commandExecution.runCommand
            const { commandExecution } = await import('../../../src/services/index.js')
            vi.mocked(commandExecution.runCommand).mockResolvedValue(0)

            // Import and call handleAliasCommand
            const { handleAliasCommand } = await import('../../../src/cli.js')
            const result = await handleAliasCommand(['ls', '/tmp'], mockConfig)
            
            expect(result).toBe(0)
            expect(commandExecution.runCommand).toHaveBeenCalledWith('dir', ['/tmp'])
        })

        it('should handle expandable command resolution', async () => {
            // Mock config with expandable command
            const mockConfig = {
                nxPackages: {},
                'expandable-commands': {
                    clean: 'npm run clean'
                }
            }

            const { loadAliasConfig } = await import('../../../src/config.js')
            vi.mocked(loadAliasConfig).mockReturnValue(mockConfig)

            // Mock expandableProcessor
            const { expandableProcessor } = await import('../../../src/services/index.js')
            vi.mocked(expandableProcessor.expandFlags).mockReturnValue({
                start: [],
                prefix: [],
                preArgs: [],
                suffix: [],
                end: [],
                remainingArgs: []
            })

            // Mock commandExecution.executeWithPool (both from index.js and CommandExecution.service.js)
            const { commandExecution } = await import('../../../src/services/index.js')
            vi.mocked(commandExecution.executeWithPool).mockResolvedValue({ exitCode: 0 })
            
            const { commandExecution: commandExecutionService } = await import('../../../src/services/CommandExecution.service.js')
            vi.mocked(commandExecutionService.executeWithPool).mockResolvedValue({ exitCode: 0 })

            // Import and call handleAliasCommand
            const { handleAliasCommand } = await import('../../../src/cli.js')
            const result = await handleAliasCommand(['clean'], mockConfig)
            
            expect(result).toBe(0)
            expect(commandExecutionService.executeWithPool).toHaveBeenCalledWith(
                'cmd',
                ['/c', 'npm run clean'],
                expect.any(Object)
            )
        })
    })
})
