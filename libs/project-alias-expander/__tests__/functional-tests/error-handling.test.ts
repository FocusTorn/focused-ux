import { describe, it, expect, beforeEach, vi } from 'vitest'
import { main, handleAliasCommand, handlePackageAlias, handleFeatureAlias, handleNotNxTarget } from '../../src/cli.js'

// Mock all dependencies
vi.mock('../../src/services/index.js', () => ({
    paeManager: {
        expandFlags: vi.fn(),
        constructWrappedCommand: vi.fn(),
        runNx: vi.fn(),
        runCommand: vi.fn()
    }
}))

vi.mock('../../src/config.js', () => ({
    loadAliasConfig: vi.fn(),
    resolveProjectForAlias: vi.fn()
}))

vi.mock('../../src/shell.js', () => ({
    detectShell: vi.fn()
}))

import { paeManager } from '../../src/services/index.js'
import { loadAliasConfig, resolveProjectForAlias } from '../../src/config.js'
import { detectShell } from '../../src/shell.js'

describe('Error Handling Scenarios', () => {
    let mockPaeManager: ReturnType<typeof vi.mocked>
    let mockLoadAliasConfig: ReturnType<typeof vi.mocked>
    let mockResolveProjectForAlias: ReturnType<typeof vi.mocked>
    let mockDetectShell: ReturnType<typeof vi.mocked>
    let originalArgv: string[]
    let originalExit: typeof process.exit
    let consoleSpy: {
        log: ReturnType<typeof vi.spyOn>
        error: ReturnType<typeof vi.spyOn>
    }

    beforeEach(() => {
        mockPaeManager = vi.mocked(paeManager)
        mockLoadAliasConfig = vi.mocked(loadAliasConfig)
        mockResolveProjectForAlias = vi.mocked(resolveProjectForAlias)
        mockDetectShell = vi.mocked(detectShell)
        
        originalArgv = process.argv
        originalExit = process.exit
        
        consoleSpy = {
            log: vi.spyOn(console, 'log').mockImplementation(() => {}),
            error: vi.spyOn(console, 'error').mockImplementation(() => {})
        }
        
        // Reset environment
        delete process.env.PAE_DEBUG
        delete process.env.PAE_ECHO
    })

    afterEach(() => {
        process.argv = originalArgv
        process.exit = originalExit
        consoleSpy.log.mockRestore()
        consoleSpy.error.mockRestore()
    })

    describe('Main Function Error Handling', () => {
        it('should handle config loading failure', () => {
            // Arrange
            process.argv = ['node', 'cli.js', 'pbc', 'b']
            mockLoadAliasConfig.mockImplementation(() => {
                throw new Error('Config file not found')
            })

            // Act
            const result = main()

            // Assert
            expect(result).toBe(1)
            expect(consoleSpy.error).toHaveBeenCalledWith(
                '[PAE ERROR] Failed to load configuration:',
                expect.any(Error)
            )
            expect(consoleSpy.error).toHaveBeenCalledWith('')
            expect(consoleSpy.error).toHaveBeenCalledWith('Make sure you are running from the project root directory.')
        })

        it('should handle unexpected errors', () => {
            // Arrange
            process.argv = ['node', 'cli.js', 'pbc', 'b']
            mockLoadAliasConfig.mockImplementation(() => {
                throw new Error('Unexpected error')
            })

            // Act
            const result = main()

            // Assert
            expect(result).toBe(1)
            expect(consoleSpy.error).toHaveBeenCalledWith(
                '[PAE ERROR] Unexpected CLI error:',
                expect.any(Error)
            )
            expect(consoleSpy.error).toHaveBeenCalledWith('')
            expect(consoleSpy.error).toHaveBeenCalledWith('This is an unexpected error. Please report this issue.')
        })

        it('should handle invalid arguments gracefully', () => {
            // Arrange
            process.argv = ['node', 'cli.js', '--invalid-flag']

            // Act
            const result = main()

            // Assert
            expect(result).toBe(0) // Should show help
            expect(consoleSpy.log).toHaveBeenCalledWith('PAE - Project Alias Expander')
        })
    })

    describe('handleAliasCommand Error Handling', () => {
        it('should handle unknown alias', () => {
            // Arrange
            const config = {
                'nxPackages': {
                    'pbc': { name: 'project-butler', suffix: 'core' }
                },
                'feature-nxTargets': {
                    'aka': { 'run-from': 'core', 'run-target': 'build' }
                },
                'not-nxTargets': {
                    'help': 'help'
                }
            }
            const args = ['unknown-alias']

            // Act
            const result = handleAliasCommand(args, config)

            // Assert
            expect(result).toBe(1)
            expect(consoleSpy.error).toHaveBeenCalledWith('[PAE ERROR] Unknown alias: unknown-alias')
            expect(consoleSpy.error).toHaveBeenCalledWith('')
            expect(consoleSpy.error).toHaveBeenCalledWith('Available aliases:')
            expect(consoleSpy.error).toHaveBeenCalledWith('  Packages: pbc')
            expect(consoleSpy.error).toHaveBeenCalledWith('  Features: aka')
            expect(consoleSpy.error).toHaveBeenCalledWith('  Not-NX: help')
        })

        it('should handle empty config gracefully', () => {
            // Arrange
            const config = {
                'nxPackages': {},
                'feature-nxTargets': {},
                'not-nxTargets': {}
            }
            const args = ['unknown-alias']

            // Act
            const result = handleAliasCommand(args, config)

            // Assert
            expect(result).toBe(1)
            expect(consoleSpy.error).toHaveBeenCalledWith('[PAE ERROR] Unknown alias: unknown-alias')
            expect(consoleSpy.error).toHaveBeenCalledWith('Available aliases:')
            expect(consoleSpy.error).toHaveBeenCalledWith('  Packages:')
            expect(consoleSpy.error).toHaveBeenCalledWith('  Features:')
            expect(consoleSpy.error).toHaveBeenCalledWith('  Not-NX:')
        })

        it('should handle missing config sections', () => {
            // Arrange
            const config = {
                'nxPackages': {
                    'pbc': { name: 'project-butler', suffix: 'core' }
                }
            }
            const args = ['unknown-alias']

            // Act
            const result = handleAliasCommand(args, config)

            // Assert
            expect(result).toBe(1)
            expect(consoleSpy.error).toHaveBeenCalledWith('[PAE ERROR] Unknown alias: unknown-alias')
            expect(consoleSpy.error).toHaveBeenCalledWith('Available aliases:')
            expect(consoleSpy.error).toHaveBeenCalledWith('  Packages: pbc')
        })

        it('should handle errors in alias command processing', () => {
            // Arrange
            const config = {
                'nxPackages': {
                    'pbc': { name: 'project-butler', suffix: 'core' }
                }
            }
            const args = ['pbc', 'b']
            mockResolveProjectForAlias.mockImplementation(() => {
                throw new Error('Resolution error')
            })

            // Act
            const result = handleAliasCommand(args, config)

            // Assert
            expect(result).toBe(1)
            expect(consoleSpy.error).toHaveBeenCalledWith(
                '[PAE ERROR] Error handling alias command:',
                expect.any(Error)
            )
        })
    })

    describe('handlePackageAlias Error Handling', () => {
        it('should handle project resolution errors', () => {
            // Arrange
            const alias = 'pbc'
            const args = ['b']
            const config = {
                'nxPackages': {
                    'pbc': { name: 'project-butler', suffix: 'core' }
                },
                'expandable-flags': {}
            }
            mockResolveProjectForAlias.mockImplementation(() => {
                throw new Error('Resolution error')
            })

            // Act
            const result = handlePackageAlias(alias, args, config)

            // Assert
            expect(result).toBe(1)
            expect(consoleSpy.error).toHaveBeenCalledWith(
                '[PAE ERROR] Error handling package alias pbc:',
                expect.any(Error)
            )
        })

        it('should handle flag expansion errors', () => {
            // Arrange
            const alias = 'pbc'
            const args = ['b', '-invalid']
            const config = {
                'nxPackages': {
                    'pbc': { name: 'project-butler', suffix: 'core' }
                },
                'expandable-flags': {}
            }
            mockResolveProjectForAlias.mockReturnValue({ project: '@fux/project-butler-core', isFull: false })
            mockPaeManager.expandFlags.mockImplementation(() => {
                throw new Error('Flag expansion error')
            })

            // Act
            const result = handlePackageAlias(alias, args, config)

            // Assert
            expect(result).toBe(1)
            expect(consoleSpy.error).toHaveBeenCalledWith(
                '[PAE ERROR] Error handling package alias pbc:',
                expect.any(Error)
            )
        })

        it('should handle command construction errors', () => {
            // Arrange
            const alias = 'pbc'
            const args = ['b']
            const config = {
                'nxPackages': {
                    'pbc': { name: 'project-butler', suffix: 'core' }
                },
                'expandable-flags': {}
            }
            mockResolveProjectForAlias.mockReturnValue({ project: '@fux/project-butler-core', isFull: false })
            mockPaeManager.expandFlags.mockReturnValue({
                start: [],
                prefix: [],
                preArgs: [],
                suffix: [],
                end: [],
                remainingArgs: []
            })
            mockPaeManager.constructWrappedCommand.mockImplementation(() => {
                throw new Error('Command construction error')
            })

            // Act
            const result = handlePackageAlias(alias, args, config)

            // Assert
            expect(result).toBe(1)
            expect(consoleSpy.error).toHaveBeenCalledWith(
                '[PAE ERROR] Error handling package alias pbc:',
                expect.any(Error)
            )
        })

        it('should handle command execution errors', () => {
            // Arrange
            const alias = 'pbc'
            const args = ['b']
            const config = {
                'nxPackages': {
                    'pbc': { name: 'project-butler', suffix: 'core' }
                },
                'expandable-flags': {}
            }
            mockResolveProjectForAlias.mockReturnValue({ project: '@fux/project-butler-core', isFull: false })
            mockPaeManager.expandFlags.mockReturnValue({
                start: [],
                prefix: [],
                preArgs: [],
                suffix: [],
                end: [],
                remainingArgs: []
            })
            mockPaeManager.constructWrappedCommand.mockReturnValue(['nx', 'run', 'test'])
            mockPaeManager.runNx.mockImplementation(() => {
                throw new Error('Command execution error')
            })

            // Act
            const result = handlePackageAlias(alias, args, config)

            // Assert
            expect(result).toBe(1)
            expect(consoleSpy.error).toHaveBeenCalledWith(
                '[PAE ERROR] Error handling package alias pbc:',
                expect.any(Error)
            )
        })
    })

    describe('handleFeatureAlias Error Handling', () => {
        it('should handle feature alias resolution errors', () => {
            // Arrange
            const alias = 'aka'
            const args = ['b']
            const config = {
                'feature-nxTargets': {
                    'aka': { 'run-from': 'core', 'run-target': 'build' }
                },
                'expandable-flags': {}
            }
            mockResolveProjectForAlias.mockImplementation(() => {
                throw new Error('Feature resolution error')
            })

            // Act
            const result = handleFeatureAlias(alias, args, config)

            // Assert
            expect(result).toBe(1)
        })

        it('should handle missing feature config', () => {
            // Arrange
            const alias = 'aka'
            const args = ['b']
            const config = {
                'feature-nxTargets': {},
                'expandable-flags': {}
            }

            // Act
            const result = handleFeatureAlias(alias, args, config)

            // Assert
            expect(result).toBe(1)
        })
    })

    describe('handleNotNxTarget Error Handling', () => {
        it('should handle command execution errors', () => {
            // Arrange
            const alias = 'help'
            const args = ['--verbose']
            const config = {
                'not-nxTargets': {
                    'help': 'help'
                }
            }
            mockPaeManager.runCommand.mockImplementation(() => {
                throw new Error('Command execution error')
            })

            // Act
            const result = handleNotNxTarget(alias, args, config)

            // Assert
            expect(result).toBe(1)
        })

        it('should handle missing not-nx target config', () => {
            // Arrange
            const alias = 'help'
            const args = ['--verbose']
            const config = {
                'not-nxTargets': {}
            }

            // Act
            const result = handleNotNxTarget(alias, args, config)

            // Assert
            expect(result).toBe(1)
        })
    })

    describe('Edge Cases and Boundary Conditions', () => {
        it('should handle empty arguments array', () => {
            // Arrange
            const config = {
                'nxPackages': {
                    'pbc': { name: 'project-butler', suffix: 'core' }
                }
            }
            const args: string[] = []

            // Act
            const result = handleAliasCommand(args, config)

            // Assert
            expect(result).toBe(1)
            expect(consoleSpy.error).toHaveBeenCalledWith('[PAE ERROR] Unknown alias: undefined')
        })

        it('should handle null/undefined config values', () => {
            // Arrange
            const config = {
                'nxPackages': {
                    'pbc': null
                }
            }
            const args = ['pbc', 'b']

            // Act
            const result = handleAliasCommand(args, config)

            // Assert
            expect(result).toBe(1)
        })

        it('should handle malformed config objects', () => {
            // Arrange
            const config = {
                'nxPackages': {
                    'pbc': 'invalid-config'
                }
            }
            const args = ['pbc', 'b']

            // Act
            const result = handleAliasCommand(args, config)

            // Assert
            expect(result).toBe(1)
        })

        it('should handle very long argument lists', () => {
            // Arrange
            const config = {
                'nxPackages': {
                    'pbc': { name: 'project-butler', suffix: 'core' }
                },
                'expandable-flags': {}
            }
            const args = ['pbc', 'b', ...Array(1000).fill('--verbose')]

            mockResolveProjectForAlias.mockReturnValue({ project: '@fux/project-butler-core', isFull: false })
            mockPaeManager.expandFlags.mockReturnValue({
                start: [],
                prefix: [],
                preArgs: [],
                suffix: [],
                end: [],
                remainingArgs: args.slice(2)
            })
            mockPaeManager.constructWrappedCommand.mockReturnValue(['nx', 'run', 'test'])
            mockPaeManager.runNx.mockReturnValue(0)

            // Act
            const result = handlePackageAlias('pbc', args, config)

            // Assert
            expect(result).toBe(0)
        })

        it('should handle special characters in aliases', () => {
            // Arrange
            const config = {
                'nxPackages': {
                    'pbc': { name: 'project-butler', suffix: 'core' }
                }
            }
            const args = ['pbc@#$%', 'b']

            // Act
            const result = handleAliasCommand(args, config)

            // Assert
            expect(result).toBe(1)
            expect(consoleSpy.error).toHaveBeenCalledWith('[PAE ERROR] Unknown alias: pbc@#$%')
        })
    })
})
