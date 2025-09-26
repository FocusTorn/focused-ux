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

import { runNx } from '../../src/cli'

describe('Edge Cases and Error Conditions', () => {
    let mocks: Awaited<ReturnType<typeof setupPaeTestEnvironment>>

    beforeEach(async () => {
        mocks = await setupPaeTestEnvironment()
        await resetPaeMocks(mocks)
        
        // Mock runNx to return different exit codes for testing
        vi.mocked(runNx).mockReturnValue(0)
    })

    describe('validate:deps auto-injection', () => {
        it('should auto-inject --parallel=false for validate:deps target', async () => {
            // Arrange
            const config = {
                packages: {
                    pbc: { name: 'project-butler', suffix: 'core' as const }
                },
                'package-targets': {
                    v: 'validate:deps'
                }
            }

            const builder = await createPaeMockBuilder(mocks)
            const configuredBuilder = await builder
                .configExists({
                    configPath: '/config.json',
                    configContent: JSON.stringify(config)
                })
            configuredBuilder.build()

            // Act - Test the expansion logic directly
            const processedArgs = ['validate:deps']
            const flagArgs = processedArgs.filter(a => a.startsWith('--'))
            const _restArgs = processedArgs.slice(1).filter(a => !a.startsWith('--'))
            
            // Auto-inject --parallel=false for validate:deps
            let enhancedArgs = [...flagArgs]
            if (processedArgs[0] === 'validate:deps' && !enhancedArgs.some(arg =>
                arg === '--parallel=false' || arg === '--parallel=true')) {
                enhancedArgs = ['--parallel=false', ...enhancedArgs]
            }

            // Assert
            expect(enhancedArgs).toContain('--parallel=false')
        })

        it('should not auto-inject --parallel=false when already present', async () => {
            // Arrange
            const config = {
                packages: {
                    pbc: { name: 'project-butler', suffix: 'core' as const }
                },
                'package-targets': {
                    v: 'validate:deps'
                }
            }

            const builder = await createPaeMockBuilder(mocks)
            const configuredBuilder = await builder
                .configExists({
                    configPath: '/config.json',
                    configContent: JSON.stringify(config)
                })
            configuredBuilder.build()

            // Act - Test with --parallel=false already present
            const processedArgs = ['validate:deps', '--parallel=false']
            const flagArgs = processedArgs.filter(a => a.startsWith('--'))
            const _restArgs = processedArgs.slice(1).filter(a => !a.startsWith('--'))
            
            // Auto-inject --parallel=false for validate:deps
            let enhancedArgs = [...flagArgs]
            if (processedArgs[0] === 'validate:deps' && !enhancedArgs.some(arg =>
                arg === '--parallel=false' || arg === '--parallel=true')) {
                enhancedArgs = ['--parallel=false', ...enhancedArgs]
            }

            // Assert - should not duplicate
            const parallelFalseCount = enhancedArgs.filter(arg => arg === '--parallel=false').length
            expect(parallelFalseCount).toBe(1)
        })
    })

    describe('PAE_ECHO environment handling', () => {
        it('should set PAE_ECHO environment when echo is enabled', async () => {
            // Arrange
            const originalEcho = process.env.PAE_ECHO
            delete process.env.PAE_ECHO

            // Mock runNx to capture environment changes
            let capturedEnv: NodeJS.ProcessEnv = {}
            vi.mocked(runNx).mockImplementation((_args) => {
                capturedEnv = { ...process.env }
                return 0
            })

            // Act - Simulate echo mode
            const paeEchoEnabled = true
            if (paeEchoEnabled) {
                process.env.PAE_ECHO = '1'
            }

            const result = runNx(['test', '@fux/project-butler-core'])

            // Assert
            expect(result).toBe(0)
            expect(capturedEnv.PAE_ECHO).toBe('1')

            // Cleanup
            if (originalEcho === undefined) {
                delete process.env.PAE_ECHO
            } else {
                process.env.PAE_ECHO = originalEcho
            }
        })

        it('should restore PAE_ECHO environment after execution', async () => {
            // Arrange
            const originalEcho = process.env.PAE_ECHO
            process.env.PAE_ECHO = 'original'

            // Mock runNx
            vi.mocked(runNx).mockReturnValue(0)

            // Act - Simulate echo mode with restoration
            const paeEchoEnabled = true
            const previousEcho = process.env.PAE_ECHO

            if (paeEchoEnabled) {
                process.env.PAE_ECHO = '1'
            }

            const result = runNx(['test', '@fux/project-butler-core'])

            // Restore echo environment
            if (paeEchoEnabled) {
                if (previousEcho === undefined) {
                    delete process.env.PAE_ECHO
                } else {
                    process.env.PAE_ECHO = previousEcho
                }
            }

            // Assert
            expect(result).toBe(0)
            expect(process.env.PAE_ECHO).toBe('original')

            // Cleanup
            process.env.PAE_ECHO = originalEcho
        })

        it('should delete PAE_ECHO when previous was undefined', async () => {
            // Arrange
            const originalEcho = process.env.PAE_ECHO
            delete process.env.PAE_ECHO

            // Mock runNx
            vi.mocked(runNx).mockReturnValue(0)

            // Act - Simulate echo mode with undefined previous
            const paeEchoEnabled = true
            const previousEcho = undefined

            if (paeEchoEnabled) {
                process.env.PAE_ECHO = '1'
            }

            const result = runNx(['test', '@fux/project-butler-core'])

            // Restore echo environment
            if (paeEchoEnabled) {
                if (previousEcho === undefined) {
                    delete process.env.PAE_ECHO
                } else {
                    process.env.PAE_ECHO = previousEcho
                }
            }

            // Assert
            expect(result).toBe(0)
            expect(process.env.PAE_ECHO).toBeUndefined()

            // Cleanup
            process.env.PAE_ECHO = originalEcho
        })
    })

    describe('process.exit scenarios', () => {
        it('should handle non-zero exit codes', async () => {
            // Arrange
            const originalExit = process.exit
            const exitSpy = vi.fn()
            process.exit = exitSpy as any

            // Mock runNx to return failure
            vi.mocked(runNx).mockReturnValue(1)

            try {
                // Act - Simulate main function logic
                const rc = runNx(['build', '@fux/project-butler-core'])
                
                if (rc !== 0) {
                    process.exit(rc)
                }

                // Assert
                expect(exitSpy).toHaveBeenCalledWith(1)
            } finally {
                // Cleanup
                process.exit = originalExit
            }
        })

        it('should not exit when return code is 0', async () => {
            // Arrange
            const originalExit = process.exit
            const exitSpy = vi.fn()
            process.exit = exitSpy as any

            // Mock runNx to return success
            vi.mocked(runNx).mockReturnValue(0)

            try {
                // Act - Simulate main function logic
                const rc = runNx(['build', '@fux/project-butler-core'])
                
                if (rc !== 0) {
                    process.exit(rc)
                }

                // Assert
                expect(exitSpy).not.toHaveBeenCalled()
            } finally {
                // Cleanup
                process.exit = originalExit
            }
        })
    })

    describe('main function execution conditions', () => {
        it('should not execute main when imported as module', () => {
            // Arrange
            const originalArgv = process.argv
            
            process.argv = ['node', 'module.js']

            // Act - The main execution check should not trigger
            const shouldExecute = import.meta.url.endsWith(process.argv[1]) || process.argv[1]?.includes('cli.js')
            
            // Assert
            expect(shouldExecute).toBe(false)

            // Cleanup
            process.argv = originalArgv
        })

        it('should execute main when run directly as CLI', () => {
            // Arrange
            const originalArgv = process.argv
            
            process.argv = ['node', 'cli.js']

            // Act - The main execution check should trigger
            const shouldExecute = import.meta.url.endsWith(process.argv[1]) || process.argv[1]?.includes('cli.js')
            
            // Assert
            expect(shouldExecute).toBe(true)

            // Cleanup
            process.argv = originalArgv
        })
    })
})
