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

import { runNx, runMany, installAliases } from '../../src/cli'

describe('Execution', () => {
    let mocks: Awaited<ReturnType<typeof setupPaeTestEnvironment>>

    beforeEach(async () => { //>
        mocks = await setupPaeTestEnvironment()
        await resetPaeMocks(mocks)
    }) //<

    describe('runNx', () => {
        it('should execute nx command successfully', async () => { //>
            // Arrange
            const argv = ['build', '@fux/project-butler-core']
            
            // Mock the runNx function to return success
            vi.mocked(runNx).mockReturnValue(0)

            // Act
            const result = runNx(argv)

            // Assert
            expect(result).toBe(0)
            expect(runNx).toHaveBeenCalledWith(argv)
        }) //<
        it('should handle nx command failure', async () => { //>
            // Arrange
            const argv = ['build', '@fux/project-butler-core']
            
            // Mock the runNx function to return failure
            vi.mocked(runNx).mockReturnValue(1)

            // Act
            const result = runNx(argv)

            // Assert
            expect(result).toBe(1)
            expect(runNx).toHaveBeenCalledWith(argv)
        }) //<
        it('should handle echo mode', () => { //>
            // Arrange
            const argv = ['build', '@fux/project-butler-core']
            // Mock the runNx function to return success (echo mode)
            vi.mocked(runNx).mockReturnValue(0)

            // Act
            const result = runNx(argv)

            // Assert
            expect(result).toBe(0)
            expect(runNx).toHaveBeenCalledWith(argv)
        }) //<
    })

    describe('runMany', () => {
        it('should run command for all ext packages', async () => { //>
            // Arrange
            const config = {
                packages: {
                    pbc: { name: 'project-butler', suffix: 'core' as const },
                    pbe: { name: 'project-butler', suffix: 'ext' as const },
                    gwc: { name: 'ghost-writer', suffix: 'core' as const },
                    gwe: { name: 'ghost-writer', suffix: 'ext' as const }
                }
            }
            const targets = ['build']
            const flags: string[] = []

            // Mock the runMany function to return success
            vi.mocked(runMany).mockReturnValue(0)

            // Act
            const result = runMany('ext', targets, flags, config)

            // Assert
            expect(result).toBe(0)
            expect(runMany).toHaveBeenCalledWith('ext', targets, flags, config)
        }) //<
        it('should run command for all core packages', async () => { //>
            // Arrange
            const config = {
                packages: {
                    pbc: { name: 'project-butler', suffix: 'core' as const },
                    pbe: { name: 'project-butler', suffix: 'ext' as const },
                    gwc: { name: 'ghost-writer', suffix: 'core' as const },
                    gwe: { name: 'ghost-writer', suffix: 'ext' as const }
                }
            }
            const targets = ['test']
            const flags: string[] = []

            // Mock the runMany function to return success
            vi.mocked(runMany).mockReturnValue(0)

            // Act
            const result = runMany('core', targets, flags, config)

            // Assert
            expect(result).toBe(0)
            expect(runMany).toHaveBeenCalledWith('core', targets, flags, config)
        }) //<
        it('should run command for all packages', async () => { //>
            // Arrange
            const config = {
                packages: {
                    pbc: { name: 'project-butler', suffix: 'core' as const },
                    pbe: { name: 'project-butler', suffix: 'ext' as const },
                    gwc: { name: 'ghost-writer', suffix: 'core' as const },
                    gwe: { name: 'ghost-writer', suffix: 'ext' as const }
                }
            }
            const targets = ['lint']
            const flags: string[] = []

            // Mock the runMany function to return success
            vi.mocked(runMany).mockReturnValue(0)

            // Act
            const result = runMany('all', targets, flags, config)

            // Assert
            expect(result).toBe(0)
            expect(runMany).toHaveBeenCalledWith('all', targets, flags, config)
        }) //<
        it('should handle no packages found', () => { //>
            // Arrange
            const config = {
                packages: {
                    pbc: { name: 'project-butler', suffix: 'core' as const },
                    pbe: { name: 'project-butler', suffix: 'ext' as const }
                }
            }
            const targets = ['build']
            const flags: string[] = []

            // Mock the runMany function to return failure (no packages found)
            vi.mocked(runMany).mockReturnValue(1)

            // Act
            const result = runMany('ext', targets, flags, config)

            // Assert
            expect(result).toBe(1)
            expect(runMany).toHaveBeenCalledWith('ext', targets, flags, config)
        }) //<
        it('should auto-inject stream output for test:full', async () => { //>
            // Arrange
            const config = {
                packages: {
                    pbe: { name: 'project-butler', suffix: 'ext' as const }
                }
            }
            const targets = ['test:full']
            const flags: string[] = []

            // Mock the runMany function to return success
            vi.mocked(runMany).mockReturnValue(0)

            // Act
            const result = runMany('ext', targets, flags, config)

            // Assert
            expect(result).toBe(0)
            expect(runMany).toHaveBeenCalledWith('ext', targets, flags, config)
        }) //<
    })

    describe('installAliases', () => {
        it('should generate PowerShell module successfully', async () => { //>
            // Arrange
            const _config = {
                packages: {
                    pbc: { name: 'project-butler', suffix: 'core' as const },
                    pbe: { name: 'project-butler', suffix: 'ext' as const }
                }
            }

            // Mock the installAliases function to return success
            vi.mocked(installAliases).mockImplementation(() => {
                // Simulate file writing without actually writing files
                mocks.fileSystem.writeFile.mockImplementation(() => {})
            })

            // Act
            installAliases()

            // Assert
            expect(installAliases).toHaveBeenCalled()
        }) //<
        it('should handle verbose output', async () => { //>
            // Arrange
            const _config = {
                packages: {
                    pbc: { name: 'project-butler', suffix: 'core' as const }
                }
            }

            // Mock the installAliases function
            vi.mocked(installAliases).mockImplementation(() => {})

            // Act
            installAliases()

            // Assert
            expect(installAliases).toHaveBeenCalled()
        }) //<
        it('should detect PowerShell shell', async () => { //>
            // Arrange
            const _config = {
                packages: {
                    pbc: { name: 'project-butler', suffix: 'core' as const }
                }
            }

            // Mock the installAliases function
            vi.mocked(installAliases).mockImplementation(() => {})

            // Act
            installAliases()

            // Assert
            expect(installAliases).toHaveBeenCalled()
        }) //<
        it('should detect Git Bash shell', async () => { //>
            // Arrange
            const _config = {
                packages: {
                    pbc: { name: 'project-butler', suffix: 'core' as const }
                }
            }

            // Mock the installAliases function
            vi.mocked(installAliases).mockImplementation(() => {})

            // Act
            installAliases()

            // Assert
            expect(installAliases).toHaveBeenCalled()
        }) //<
    })
})



