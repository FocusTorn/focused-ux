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
    paeManager,
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
                console.log(`nx run ${args.join(' ')}`)
            }
            return 0
        })
    }) //<

    // Legacy Command Expansion tests removed - functionality now handled by paeManager.expandFlags

    describe('Echo Mode Testing', () => {
        it('should output command in echo mode without executing', async () => { //>
            // Arrange
            const config = {
                'nxPackages': {
                    pbc: { name: 'project-butler', suffix: 'core' as const }
                },
                'nxTargets': {
                    b: 'build'
                },
                'expandable-flags': {}
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
            const flags = ['-echo']

            const aliasVal = config['nxPackages'][alias]
            const flagExpansion = paeManager.expandFlags(flags, config['expandable-flags'] || {})

            const processedArgs = [...flagExpansion.prefix, ...flagExpansion.remainingArgs, ...flagExpansion.preArgs, ...flagExpansion.suffix]

            // Assert - The echo flag should be processed and removed from args, but PAE_ECHO should be set
            expect(processedArgs).toEqual([])
            expect(process.env.PAE_ECHO).toBe('1')
        }) //<

        it('should test pae -echo pbc b command generation', async () => { //>
            // Arrange
            const config = {
                'nxPackages': {
                    pbc: { name: 'project-butler', suffix: 'core' as const }
                },
                'nxTargets': {
                    b: 'build'
                },
                'expandable-flags': {
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

            // Act - Test the expansion logic directly
            const alias = 'pbc'
            const target = 'b'
            const flags = ['-echo']

            const aliasVal = config['nxPackages'][alias]
            const flagExpansion = paeManager.expandFlags(flags, config['expandable-flags'] || {})

            const processedArgs = [...flagExpansion.prefix, ...flagExpansion.remainingArgs, ...flagExpansion.preArgs, ...flagExpansion.suffix]

            // Assert - The echo flag should be processed and set environment variable
            expect(processedArgs).toEqual([])
            expect(process.env.PAE_ECHO).toBe('1')
        }) //<
    })
})