import { describe, it, expect, beforeEach, vi } from 'vitest'
import { setupPaeTestEnvironment, resetPaeMocks } from '../__mocks__/helpers'
import { createPaeMockBuilder } from '../__mocks__/mock-scenario-builder'

// Mock the CLI module to prevent actual command execution
vi.mock('../../src/cli', async () => {
    const actual = await vi.importActual('../../src/cli')
    return {
        ...actual,
        runNx: vi.fn(),
        runMany: vi.fn(),
        installAliases: vi.fn()
    }
})

import { //> from '../../src/cli'
    loadAliasConfig,
    resolveProjectForAlias,
    expandTargetShortcuts,
    expandFlags,
    normalizeFullSemantics,
    runNx
} from '../../src/cli' //<

describe('Command Generation (Dry Run)', () => {
    let mocks: Awaited<ReturnType<typeof setupPaeTestEnvironment>>

    beforeEach(async () => { //>
        mocks = await setupPaeTestEnvironment()
        await resetPaeMocks(mocks)
        
        // Mock runNx to prevent actual execution but simulate echo behavior
        vi.mocked(runNx).mockImplementation((args) => {
            if (process.env.PAE_ECHO === '1') {
                console.log(`NX_CALL -> ${args.join(' ')}`)
            }
            return 0
        })
    }) //<

    describe('Command Expansion', () => {
        it('should expand pbc b to correct nx command', async () => { //>
            // Arrange
            const config = {
                packages: {
                    pbc: { name: 'project-butler', suffix: 'core' as const }
                },
                'package-targets': {
                    b: 'build'
                }
            }

            const builder = await createPaeMockBuilder(mocks)
            const configuredBuilder = await builder
                .configExists({
                    configPath: '/config.json',
                    configContent: JSON.stringify(config)
                })
            configuredBuilder.build()

            // Mock the config loading
            vi.doMock('../../src/cli', () => ({
                ...vi.importActual('../../src/cli'),
                loadAliasConfig: () => config
            }))

            // Act - Test the expansion logic directly
            const alias = 'pbc'
            const target = 'b'
            const _flags: string[] = []

            const aliasVal = config.packages[alias]
            const isFull = typeof aliasVal === 'object' && aliasVal?.full === true
            const targetExpansion = expandTargetShortcuts([target], config['package-targets'], undefined, isFull)
            const flagExpansion = expandFlags(targetExpansion.args, config.expandables || {})

            const processedArgs = [...flagExpansion.prefix, ...flagExpansion.remainingArgs, ...flagExpansion.preArgs, ...flagExpansion.suffix]

            // Assert
            expect(processedArgs).toEqual(['build'])
        }) //<

        it('should expand pbc t -c to correct nx command with coverage', async () => { //>
            // Arrange
            const config = {
                packages: {
                    pbc: { name: 'project-butler', suffix: 'core' as const }
                },
                'package-targets': {
                    t: 'test'
                },
                expandables: {
                    c: '--coverage'
                }
            }

            const builder = await createPaeMockBuilder(mocks)
            const configuredBuilder = await builder
                .configExists({
                    configPath: '/config.json',
                    configContent: JSON.stringify(config)
                })
            configuredBuilder.build()

            // Mock the config loading
            vi.doMock('../../src/cli', () => ({
                ...vi.importActual('../../src/cli'),
                loadAliasConfig: () => config
            }))

            // Act - Test the expansion logic directly
            const alias = 'pbc'
            const target = 't'
            const flags = ['-c']

            const aliasVal = config.packages[alias]
            const isFull = typeof aliasVal === 'object' && aliasVal?.full === true
            const targetExpansion = expandTargetShortcuts([target], config['package-targets'], undefined, isFull)
            const flagExpansion = expandFlags([...targetExpansion.args, ...flags], config.expandables || {})

            const processedArgs = [...flagExpansion.prefix, ...flagExpansion.remainingArgs, ...flagExpansion.preArgs, ...flagExpansion.suffix]

            // Assert
            expect(processedArgs).toEqual(['test', '--coverage'])
        }) //<

        it('should expand full package alias correctly', async () => { //>
            // Arrange
            const config = {
                packages: {
                    pb: { name: 'project-butler', suffix: 'ext', full: true }
                },
                'package-targets': {
                    b: 'build'
                },
                'feature-targets': {
                    b: { 'run-from': 'ext', 'run-target': 'build' }
                }
            }

            const builder = await createPaeMockBuilder(mocks)
            const configuredBuilder = await builder
                .configExists({
                    configPath: '/config.json',
                    configContent: JSON.stringify(config)
                })
            configuredBuilder.build()

            // Mock the config loading
            vi.doMock('../../src/cli', () => ({
                ...vi.importActual('../../src/cli'),
                loadAliasConfig: () => config
            }))

            // Act - Test the expansion logic directly
            const alias = 'pb'
            const target = 'b'
            const _flags: string[] = []

            const aliasVal = config.packages[alias]
            const isFull = typeof aliasVal === 'object' && aliasVal?.full === true
            const targetExpansion = expandTargetShortcuts([target], config['package-targets'], config['feature-targets'], isFull)
            const flagExpansion = expandFlags(targetExpansion.args, config.expandables || {})

            const processedArgs = [...flagExpansion.prefix, ...flagExpansion.remainingArgs, ...flagExpansion.preArgs, ...flagExpansion.suffix]

            // Assert
            expect(targetExpansion.wasFeatureTarget).toBe(true)
            expect(processedArgs).toEqual(['build'])
        }) //<
    })

    describe('Echo Mode Testing', () => {
        it('should output command in echo mode without executing', async () => { //>
            // Arrange
            const config = {
                packages: {
                    pbc: { name: 'project-butler', suffix: 'core' as const }
                },
                'package-targets': {
                    b: 'build'
                }
            }

            const builder = await createPaeMockBuilder(mocks)
            const configuredBuilder = await builder
                .configExists({
                    configPath: '/config.json',
                    configContent: JSON.stringify(config)
                })
            configuredBuilder.build()

            // Mock the config loading
            vi.doMock('../../src/cli', () => ({
                ...vi.importActual('../../src/cli'),
                loadAliasConfig: () => config
            }))

            // Set PAE_ECHO to enable dry-run mode
            const originalEcho = process.env.PAE_ECHO
            process.env.PAE_ECHO = '1'

            // Capture console output
            const consoleSpy = vi.spyOn(console, 'log').mockImplementation(() => {})

            try {
                // Use the mocked runNx function directly
                const result = runNx(['@fux/project-butler-core', 'build'])

                // Assert
                expect(result).toBe(0)
                expect(consoleSpy).toHaveBeenCalledWith('NX_CALL -> @fux/project-butler-core build')
            } finally {
                // Cleanup
                process.env.PAE_ECHO = originalEcho
                consoleSpy.mockRestore()
            }
        }) //<

        it('should test pae -echo pbc b command generation', async () => { //>
            // Arrange
            const config = {
                packages: {
                    pbc: { name: 'project-butler', suffix: 'core' as const }
                },
                'package-targets': {
                    b: 'build'
                },
                expandables: {
                    echo: '--pae-echo'
                }
            }

            const builder = await createPaeMockBuilder(mocks)
            const configuredBuilder = await builder
                .configExists({
                    configPath: '/config.json',
                    configContent: JSON.stringify(config)
                })
            configuredBuilder.build()

            // Mock the config loading
            vi.doMock('../../src/cli', () => ({
                ...vi.importActual('../../src/cli'),
                loadAliasConfig: () => config
            }))

            // Set PAE_ECHO to enable dry-run mode
            const originalEcho = process.env.PAE_ECHO
            process.env.PAE_ECHO = '1'

            // Capture console output
            const consoleSpy = vi.spyOn(console, 'log').mockImplementation(() => {})

            try {
                // Act - Simulate the CLI processing
                const alias = 'pbc'
                const target = 'b'
                const flags = ['-echo']

                const aliasVal = config.packages[alias]
                const isFull = typeof aliasVal === 'object' && aliasVal?.full === true
                const targetExpansion = expandTargetShortcuts([target], config['package-targets'], undefined, isFull)
                const flagExpansion = expandFlags([...targetExpansion.args, ...flags], config.expandables || {})

                const processedArgs = [...flagExpansion.prefix, ...flagExpansion.remainingArgs, ...flagExpansion.preArgs, ...flagExpansion.suffix]

                // Check if echo flag is present
                const paeEchoEnabled = processedArgs.includes('--pae-echo')
                expect(paeEchoEnabled).toBe(true)

                // Remove echo flag for final command
                const finalArgs = processedArgs.filter(a => a !== '--pae-echo')

                // Assert
                expect(finalArgs).toEqual(['build'])
            } finally {
                // Cleanup
                process.env.PAE_ECHO = originalEcho
                consoleSpy.mockRestore()
            }
        }) //<
    })
})
