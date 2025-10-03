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

vi.mock('../../../src/services/CommandExecution.service.js', () => ({
    commandExecution: {
        executeWithPool: vi.fn()
    }
}))

vi.mock('../../../src/shell.js', () => ({
    detectShell: vi.fn(() => 'powershell')
}))

// Mock cli.js to allow importing specific functions
vi.mock('../../../src/cli.js', async (importOriginal) => {
    const actual = await importOriginal()
    return {
        ...actual,
        handleExpandableCommand: actual.handleExpandableCommand
    }
})

describe('ExpandableCommand Tests', () => {
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

    describe('handleExpandableCommand() function', () => {
        it('should handle expandable command processing', async () => {
            // Mock config with expandable command
            const mockConfig = {
                'expandable-commands': {
                    clean: 'npm run clean'
                },
                'expandable-flags': {}
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

            // Mock commandExecution.executeWithPool
            const { commandExecution } = await import('../../../src/services/CommandExecution.service.js')
            vi.mocked(commandExecution.executeWithPool).mockResolvedValue({ exitCode: 0 })

            // Import and call handleExpandableCommand
            const { handleExpandableCommand } = await import('../../../src/cli.js')
            const result = await handleExpandableCommand('clean', [], mockConfig)
            
            expect(result).toBe(0)
            expect(commandExecution.executeWithPool).toHaveBeenCalledWith(
                'cmd',
                ['/c', 'npm run clean'],
                expect.objectContaining({
                    timeout: 300000,
                    stdio: 'inherit'
                })
            )
        })

        it('should handle expandable command flag expansion', async () => {
            // Mock config with expandable command and flags
            const mockConfig = {
                'expandable-commands': {
                    build: 'npm run build'
                },
                'expandable-flags': {
                    verbose: '--verbose',
                    watch: '--watch'
                }
            }

            const { loadAliasConfig } = await import('../../../src/config.js')
            vi.mocked(loadAliasConfig).mockReturnValue(mockConfig)

            // Mock expandableProcessor to return expanded flags
            const { expandableProcessor } = await import('../../../src/services/index.js')
            vi.mocked(expandableProcessor.expandFlags).mockReturnValue({
                start: [],
                prefix: ['--verbose'],
                preArgs: [],
                suffix: ['--watch'],
                end: [],
                remainingArgs: []
            })

            // Mock commandExecution.executeWithPool
            const { commandExecution } = await import('../../../src/services/CommandExecution.service.js')
            vi.mocked(commandExecution.executeWithPool).mockResolvedValue({ exitCode: 0 })

            // Import and call handleExpandableCommand
            const { handleExpandableCommand } = await import('../../../src/cli.js')
            const result = await handleExpandableCommand('build', ['-verbose', '-watch'], mockConfig)
            
            expect(result).toBe(0)
        })

        it('should handle expandable command template processing', async () => {
            // Mock config with expandable command and templates
            const mockConfig = {
                'expandable-commands': {
                    test: 'npm test'
                },
                'expandable-templates': {
                    coverage: '--coverage'
                }
            }

            const { loadAliasConfig } = await import('../../../src/config.js')
            vi.mocked(loadAliasConfig).mockReturnValue(mockConfig)

            // Mock expandableProcessor
            const { expandableProcessor } = await import('../../../src/services/index.js')
            vi.mocked(expandableProcessor.expandFlags).mockReturnValue({
                start: [],
                prefix: ['--coverage'],
                preArgs: [],
                suffix: [],
                end: [],
                remainingArgs: []
            })

            // Mock commandExecution.executeWithPool
            const { commandExecution } = await import('../../../src/services/CommandExecution.service.js')
            vi.mocked(commandExecution.executeWithPool).mockResolvedValue({ exitCode: 0 })

            // Import and call handleExpandableCommand
            const { handleExpandableCommand } = await import('../../../src/cli.js')
            const result = await handleExpandableCommand('test', ['-coverage'], mockConfig)
            
            expect(result).toBe(0)
        })

        it('should handle expandable command argument handling', async () => {
            // Mock config with expandable command
            const mockConfig = {
                'expandable-commands': {
                    lint: 'npm run lint'
                },
                'expandable-flags': {}
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
                remainingArgs: ['--fix', 'src/']
            })

            // Mock commandExecution.executeWithPool
            const { commandExecution } = await import('../../../src/services/CommandExecution.service.js')
            vi.mocked(commandExecution.executeWithPool).mockResolvedValue({ exitCode: 0 })

            // Import and call handleExpandableCommand
            const { handleExpandableCommand } = await import('../../../src/cli.js')
            const result = await handleExpandableCommand('lint', ['--fix', 'src/'], mockConfig)
            
            expect(result).toBe(0)
        })

        it('should handle expandable command error scenarios', async () => {
            // Mock config with expandable command
            const mockConfig = {
                'expandable-commands': {
                    fail: 'nonexistent-command'
                },
                'expandable-flags': {}
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

            // Mock commandExecution.executeWithPool to throw error
            const { commandExecution } = await import('../../../src/services/CommandExecution.service.js')
            vi.mocked(commandExecution.executeWithPool).mockRejectedValue(new Error('Command failed'))

            // Import and call handleExpandableCommand
            const { handleExpandableCommand } = await import('../../../src/cli.js')
            const result = await handleExpandableCommand('fail', [], mockConfig)
            
            expect(result).toBe(1)
        })

        it('should handle expandable command service integration', async () => {
            // Mock config with expandable command
            const mockConfig = {
                'expandable-commands': {
                    serve: 'npm run serve'
                },
                'expandable-flags': {}
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

            // Mock commandExecution.executeWithPool
            const { commandExecution } = await import('../../../src/services/CommandExecution.service.js')
            vi.mocked(commandExecution.executeWithPool).mockResolvedValue({ exitCode: 0 })

            // Import and call handleExpandableCommand
            const { handleExpandableCommand } = await import('../../../src/cli.js')
            const result = await handleExpandableCommand('serve', [], mockConfig)
            
            expect(result).toBe(0)
        })

        it('should handle expandable command configuration access', async () => {
            // Mock config with expandable command
            const mockConfig = {
                'expandable-commands': {
                    deploy: 'npm run deploy'
                },
                'expandable-flags': {
                    prod: '--production'
                },
                'env-setting-flags': {},
                'internal-flags': {}
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

            // Mock commandExecution.executeWithPool
            const { commandExecution } = await import('../../../src/services/CommandExecution.service.js')
            vi.mocked(commandExecution.executeWithPool).mockResolvedValue({ exitCode: 0 })

            // Import and call handleExpandableCommand
            const { handleExpandableCommand } = await import('../../../src/cli.js')
            const result = await handleExpandableCommand('deploy', [], mockConfig)
            
            expect(result).toBe(0)
        })

        it('should handle expandable command validation', async () => {
            // Mock config with expandable command
            const mockConfig = {
                'expandable-commands': {
                    valid: 'echo "valid command"'
                },
                'expandable-flags': {}
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

            // Mock commandExecution.executeWithPool
            const { commandExecution } = await import('../../../src/services/CommandExecution.service.js')
            vi.mocked(commandExecution.executeWithPool).mockResolvedValue({ exitCode: 0 })

            // Import and call handleExpandableCommand
            const { handleExpandableCommand } = await import('../../../src/cli.js')
            const result = await handleExpandableCommand('valid', [], mockConfig)
            
            expect(result).toBe(0)
        })

        it('should handle expandable command execution', async () => {
            // Mock config with expandable command
            const mockConfig = {
                'expandable-commands': {
                    exec: 'node script.js'
                },
                'expandable-flags': {}
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

            // Mock commandExecution.executeWithPool
            const { commandExecution } = await import('../../../src/services/CommandExecution.service.js')
            vi.mocked(commandExecution.executeWithPool).mockResolvedValue({ exitCode: 0 })

            // Import and call handleExpandableCommand
            const { handleExpandableCommand } = await import('../../../src/cli.js')
            const result = await handleExpandableCommand('exec', [], mockConfig)
            
            expect(result).toBe(0)
        })

        it('should handle env-setting flags processing', async () => {
            // Mock config with expandable command and env-setting flags
            const mockConfig = {
                'expandable-commands': {
                    debug: 'echo "debug mode"'
                },
                'env-setting-flags': {
                    'pae-debug': '--pae-debug'
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

            // Mock commandExecution.executeWithPool
            const { commandExecution } = await import('../../../src/services/CommandExecution.service.js')
            vi.mocked(commandExecution.executeWithPool).mockResolvedValue({ exitCode: 0 })

            // Import and call handleExpandableCommand
            const { handleExpandableCommand } = await import('../../../src/cli.js')
            const result = await handleExpandableCommand('debug', ['--pae-debug'], mockConfig)
            
            expect(result).toBe(0)
        })

        it('should handle internal flags processing', async () => {
            // Mock config with expandable command and internal flags
            const mockConfig = {
                'expandable-commands': {
                    timeout: 'echo "timeout test"'
                },
                'internal-flags': {
                    'pae-execa-timeout': '--pae-execa-timeout=5000'
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
                remainingArgs: ['--pae-execa-timeout=5000']
            })

            // Mock commandExecution.executeWithPool
            const { commandExecution } = await import('../../../src/services/CommandExecution.service.js')
            vi.mocked(commandExecution.executeWithPool).mockResolvedValue({ exitCode: 0 })

            // Import and call handleExpandableCommand
            const { handleExpandableCommand } = await import('../../../src/cli.js')
            const result = await handleExpandableCommand('timeout', ['--pae-execa-timeout=5000'], mockConfig)
            
            expect(result).toBe(0)
        })
    })
})
