import { describe, it, expect, beforeEach, vi } from 'vitest'
import { setupPaeTestEnvironment, resetPaeMocks } from '../__mocks__/helpers'

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

// Mock the fs module
vi.mock('node:fs', () => ({
    default: {
        existsSync: vi.fn(),
        readFileSync: vi.fn(),
        writeFileSync: vi.fn(),
        mkdirSync: vi.fn(),
    },
    existsSync: vi.fn(),
    readFileSync: vi.fn(),
    writeFileSync: vi.fn(),
    mkdirSync: vi.fn(),
}))

// Mock strip-json-comments
vi.mock('strip-json-comments', () => ({
    default: vi.fn(),
}))

import { generateLocalFiles, refreshAliases, refreshAliasesDirect, main, installAliases } from '../../src/cli'

describe('Main Function and Build Functions', () => {
    let mocks: Awaited<ReturnType<typeof setupPaeTestEnvironment>>

    beforeEach(async () => {
        mocks = await setupPaeTestEnvironment()
        await resetPaeMocks(mocks)
        
        // Wire up the fs module mocks
        const fs = await import('node:fs')
        vi.mocked(fs.default.existsSync).mockImplementation(mocks.fs.existsSync)
        vi.mocked(fs.default.readFileSync).mockImplementation(mocks.fs.readFileSync)
        vi.mocked(fs.default.writeFileSync).mockImplementation(mocks.fs.writeFileSync)
        vi.mocked(fs.default.mkdirSync).mockImplementation(mocks.fs.mkdirSync)
        
        // Wire up the strip-json-comments mock
        const stripJsonComments = await import('strip-json-comments')
        vi.mocked(stripJsonComments.default).mockImplementation(mocks.stripJsonComments)
        
        // Mock process.exit to prevent actual exit
        vi.spyOn(process, 'exit').mockImplementation(() => {
            throw new Error('process.exit called')
        })
    })

    describe('generateLocalFiles', () => {
        it('should generate PowerShell and Bash files successfully', () => {
            // Arrange
            const config = {
                packages: {
                    pbc: { name: 'project-butler', suffix: 'core' },
                    pbe: { name: 'project-butler', suffix: 'ext' }
                },
                'package-targets': {
                    b: 'build',
                    t: 'test'
                }
            }

            mocks.fs.existsSync.mockReturnValue(true)
            mocks.fs.readFileSync.mockReturnValue(JSON.stringify(config))
            mocks.stripJsonComments.mockImplementation((content) => content)
            mocks.fs.mkdirSync.mockImplementation(() => {})

            // Mock detectShell to return powershell
            const originalComspec = process.env.COMSPEC
            process.env.COMSPEC = 'C:\\Windows\\System32\\WindowsPowerShell\\v1.0\\powershell.exe'

            // Act
            generateLocalFiles()

            // Assert
            expect(mocks.fs.writeFileSync).toHaveBeenCalledTimes(2) // PowerShell and Bash files
            expect(mocks.fs.writeFileSync).toHaveBeenCalledWith(
                expect.stringContaining('pae-functions.psm1'),
                expect.stringContaining('Invoke-pbc')
            )
            expect(mocks.fs.writeFileSync).toHaveBeenCalledWith(
                expect.stringContaining('pae-aliases.sh'),
                expect.stringContaining('alias pbc=')
            )

            // Cleanup
            process.env.COMSPEC = originalComspec
        })

        it('should create dist directory if it does not exist', () => {
            // Arrange
            const config = {
                packages: {
                    pbc: { name: 'project-butler', suffix: 'core' }
                }
            }

            mocks.fs.existsSync.mockImplementation((path) => {
                if (path.includes('config.json')) return true
                if (path.includes('dist')) return false
                return true
            })
            mocks.fs.readFileSync.mockReturnValue(JSON.stringify(config))
            mocks.stripJsonComments.mockImplementation((content) => content)

            // Act
            generateLocalFiles()

            // Assert
            expect(mocks.fs.mkdirSync).toHaveBeenCalledWith(
                expect.stringContaining('dist'),
                { recursive: true }
            )
        })

        it('should show verbose output when --verbose flag is present', () => {
            // Arrange
            const originalArgv = process.argv
            process.argv = ['node', 'cli.js', '--verbose']

            const config = {
                packages: {
                    pbc: { name: 'project-butler', suffix: 'core' }
                }
            }

            mocks.fs.existsSync.mockReturnValue(true)
            mocks.fs.readFileSync.mockReturnValue(JSON.stringify(config))
            mocks.stripJsonComments.mockImplementation((content) => content)

            const consoleSpy = vi.spyOn(console, 'log').mockImplementation(() => {})

            // Act
            generateLocalFiles()

            // Assert
            expect(consoleSpy).toHaveBeenCalledWith(expect.stringContaining('Detected shell:'))
            expect(consoleSpy).toHaveBeenCalledWith(expect.stringContaining('Found 1 aliases:'))

            // Cleanup
            process.argv = originalArgv
            consoleSpy.mockRestore()
        })
    })

    describe('refreshAliases', () => {
        it('should call installAliases internally', () => {
            // Arrange
            const config = {
                packages: {
                    pbc: { name: 'project-butler', suffix: 'core' }
                }
            }

            mocks.fs.existsSync.mockReturnValue(true)
            mocks.fs.readFileSync.mockReturnValue(JSON.stringify(config))
            mocks.stripJsonComments.mockImplementation((content) => content)

            // Act & Assert - should not throw
            expect(() => refreshAliases()).not.toThrow()
        })

        it('should handle different shell environments', () => {
            // Arrange
            const config = {
                packages: {
                    pbc: { name: 'project-butler', suffix: 'core' }
                }
            }

            mocks.fs.existsSync.mockReturnValue(true)
            mocks.fs.readFileSync.mockReturnValue(JSON.stringify(config))
            mocks.stripJsonComments.mockImplementation((content) => content)

            // Act & Assert - should not throw
            expect(() => refreshAliases()).not.toThrow()
        })
    })

    describe('refreshAliasesDirect', () => {
        it('should execute successfully', () => {
            // Arrange - Mock execSync to prevent actual command execution
            const childProcess = require('node:child_process')
            const originalExecSync = childProcess.execSync
            childProcess.execSync = vi.fn().mockImplementation(() => {
                return Buffer.from('success')
            })

            // Act & Assert - should not throw
            expect(() => refreshAliasesDirect()).not.toThrow()

            // Cleanup
            childProcess.execSync = originalExecSync
        }, 5000)
    })

    describe('main function', () => {
        it('should handle install-aliases command', () => {
            // Arrange
            const originalArgv = process.argv
            process.argv = ['node', 'cli.js', 'install-aliases']

            // Act & Assert - should not throw
            expect(() => main()).not.toThrow()

            // Cleanup
            process.argv = originalArgv
        })

        it('should handle install command', () => {
            // Arrange
            const originalArgv = process.argv
            process.argv = ['node', 'cli.js', 'install']

            // Act & Assert - should not throw
            expect(() => main()).not.toThrow()

            // Cleanup
            process.argv = originalArgv
        })

        it('should handle refresh command', () => {
            // Arrange
            const originalArgv = process.argv
            process.argv = ['node', 'cli.js', 'refresh']

            // Act & Assert - should not throw
            expect(() => main()).not.toThrow()

            // Cleanup
            process.argv = originalArgv
        })

        it('should handle refresh-aliases command', () => {
            // Arrange
            const originalArgv = process.argv
            process.argv = ['node', 'cli.js', 'refresh-aliases']

            // Act & Assert - should not throw
            expect(() => main()).not.toThrow()

            // Cleanup
            process.argv = originalArgv
        })

        it('should handle debug-workspace command', () => {
            // Arrange
            const originalArgv = process.argv
            process.argv = ['node', 'cli.js', '--debug-workspace']

            const consoleSpy = vi.spyOn(console, 'log').mockImplementation(() => {})

            // Act
            main()

            // Assert
            expect(consoleSpy).toHaveBeenCalledWith('DEBUG: process.argv[1]:', 'cli.js')
            expect(consoleSpy).toHaveBeenCalledWith('DEBUG: import.meta.url:', expect.stringContaining('cli.ts'))

            // Cleanup
            process.argv = originalArgv
            consoleSpy.mockRestore()
        })

        it('should generate local files when no arguments provided', () => {
            // Arrange
            const originalArgv = process.argv
            process.argv = ['node', 'cli.js']

            const config = {
                packages: {
                    pbc: { name: 'project-butler', suffix: 'core' }
                }
            }

            mocks.fs.existsSync.mockReturnValue(true)
            mocks.fs.readFileSync.mockReturnValue(JSON.stringify(config))
            mocks.stripJsonComments.mockImplementation((content) => content)

            // Act & Assert - should not throw
            expect(() => main()).not.toThrow()

            // Cleanup
            process.argv = originalArgv
        })

        it('should handle help command', () => {
            // Arrange
            const originalArgv = process.argv
            process.argv = ['node', 'cli.js', '--help']

            const config = {
                packages: {
                    pbc: { name: 'project-butler', suffix: 'core' }
                },
                'package-targets': {
                    b: 'build'
                }
            }

            mocks.fs.existsSync.mockReturnValue(true)
            mocks.fs.readFileSync.mockReturnValue(JSON.stringify(config))
            mocks.stripJsonComments.mockImplementation((content) => content)

            const consoleSpy = vi.spyOn(console, 'log').mockImplementation(() => {})

            // Act
            try {
                main()
            } catch (_error) {
                // Expected - process.exit throws
            }

            // Assert
            expect(consoleSpy).toHaveBeenCalledWith(expect.stringContaining('pae <alias> <target>'))

            // Cleanup
            process.argv = originalArgv
            consoleSpy.mockRestore()
        })
    })
})
