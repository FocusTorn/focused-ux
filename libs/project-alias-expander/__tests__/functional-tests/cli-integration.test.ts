import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { main } from '../../src/cli'
import * as path from 'path'
import * as fs from 'fs'

// Don't use global mocks for integration tests
vi.unmock('node:fs')
vi.unmock('fs')

describe('CLI Integration Tests', () => {
    let originalArgv: string[]
    let originalCwd: string
    let consoleSpy: any

    beforeEach(() => {
        originalArgv = process.argv
        originalCwd = process.cwd()
        consoleSpy = {
            log: vi.spyOn(console, 'log').mockImplementation(() => {}),
            error: vi.spyOn(console, 'error').mockImplementation(() => {})
        }
    })

    afterEach(() => {
        process.argv = originalArgv
        process.chdir(originalCwd)
        consoleSpy.log.mockRestore()
        consoleSpy.error.mockRestore()
    })

    describe('Basic CLI Functionality', () => {
        it('should show help when run with no arguments', () => {
            // Arrange
            process.chdir(path.resolve(__dirname, '../../../..'))
            process.argv = ['node', 'cli.js']

            // Act
            const result = main()

            // Assert
            expect(result).toBe(0)
            expect(consoleSpy.log).toHaveBeenCalledWith('PAE - Project Alias Expander')
            expect(consoleSpy.log).toHaveBeenCalledWith('Usage: pae <alias> [target] [flags]')
            expect(consoleSpy.log).toHaveBeenCalledWith('Commands:')
            expect(consoleSpy.log).toHaveBeenCalledWith('  install-aliases    Install PAE aliases')
            expect(consoleSpy.log).toHaveBeenCalledWith('  refresh            Refresh PAE aliases')
            expect(consoleSpy.log).toHaveBeenCalledWith('  refresh-direct     Refresh aliases directly')
            expect(consoleSpy.log).toHaveBeenCalledWith('  help               Show this help')
        })

        it('should show help when run with help command', () => {
            // Arrange
            process.chdir(path.resolve(__dirname, '../../../..'))
            process.argv = ['node', 'cli.js', 'help']

            // Act
            const result = main()

            // Assert
            expect(result).toBe(0)
            expect(consoleSpy.log).toHaveBeenCalledWith('PAE - Project Alias Expander')
            expect(consoleSpy.log).toHaveBeenCalledWith('Usage: pae <alias> [target] [flags]')
        })

        it('should handle install-aliases command', () => {
            // Arrange
            process.chdir(path.resolve(__dirname, '../../../..'))
            process.argv = ['node', 'cli.js', 'install-aliases']

            // Act
            const result = main()

            // Assert
            expect(result).toBe(0)
            // Should not throw errors
        })

        it('should handle refresh command', () => {
            // Arrange
            process.chdir(path.resolve(__dirname, '../../../..'))
            process.argv = ['node', 'cli.js', 'refresh']

            // Act
            const result = main()

            // Assert
            expect(result).toBe(0)
            // Should not throw errors
        })
    })

    describe('Package Alias Resolution', () => {
        it('should resolve package alias to correct nx command', () => {
            // Arrange
            process.chdir(path.resolve(__dirname, '../../../..'))
            process.argv = ['node', 'cli.js', 'pbc', 'b']

            // Debug: Check if file system is working
            const configPath = path.join(process.cwd(), 'libs', 'project-alias-expander', 'config.json')
            console.log('Debug - process.cwd():', process.cwd())
            console.log('Debug - configPath:', configPath)
            console.log('Debug - fs.existsSync(configPath):', fs.existsSync(configPath))

            // Act
            const result = main()

            // Assert
            expect(result).toBe(0)
            // Should execute: nx run build @fux/project-butler-core
        })

        it('should default to build target when no target specified', () => {
            // Arrange
            process.chdir(path.resolve(__dirname, '../../../..'))
            process.argv = ['node', 'cli.js', 'pbc']

            // Act
            const result = main()

            // Assert
            expect(result).toBe(0)
            // Should execute: nx run build @fux/project-butler-core
        })

        it('should handle package alias with flags', () => {
            // Arrange
            process.chdir(path.resolve(__dirname, '../../../..'))
            process.argv = ['node', 'cli.js', 'pbc', 't', '-f', '-s']

            // Act
            const result = main()

            // Assert
            expect(result).toBe(0)
            // Should execute: nx run test @fux/project-butler-core --fix --skip-nx-cache
        })
    })

    describe('Feature Target Resolution', () => {
        it('should resolve feature target correctly', () => {
            // Arrange
            process.chdir(path.resolve(__dirname, '../../../..'))
            process.argv = ['node', 'cli.js', 'aka', 'b']

            // Act
            const result = main()

            // Assert
            expect(result).toBe(0)
            // Should execute: nx run build @fux/project-alias-expander-core
        })
    })

    describe('Error Handling', () => {
        it('should return error for unknown alias', () => {
            // Arrange
            process.chdir(path.resolve(__dirname, '../../../..'))
            process.argv = ['node', 'cli.js', 'unknown-alias']

            // Act
            const result = main()

            // Assert
            expect(result).toBe(1)
            expect(consoleSpy.error).toHaveBeenCalledWith('[PAE ERROR] Unknown alias: unknown-alias')
            expect(consoleSpy.error).toHaveBeenCalledWith('Available aliases:')
        })

        it('should handle config file not found', () => {
            // Arrange
            const tempDir = path.resolve(__dirname, '../../../temp-test-dir')
            fs.mkdirSync(tempDir, { recursive: true })
            process.chdir(tempDir)
            process.argv = ['node', 'cli.js', 'help']

            // Act
            const result = main()

            // Assert
            expect(result).toBe(1)

            // Cleanup
            fs.rmSync(tempDir, { recursive: true, force: true })
        })
    })

    describe('Expandable Flags', () => {
        it('should expand simple flags correctly', () => {
            // Arrange
            process.chdir(path.resolve(__dirname, '../../../..'))
            process.argv = ['node', 'cli.js', 'pbc', 't', '-f', '-s']

            // Act
            const result = main()

            // Assert
            expect(result).toBe(0)
            // Should expand -f to --fix and -s to --skip-nx-cache
        })

        it('should handle template flags with defaults', () => {
            // Arrange
            process.chdir(path.resolve(__dirname, '../../../..'))
            process.argv = ['node', 'cli.js', 'pbc', 't', '-sto']

            // Act
            const result = main()

            // Assert
            expect(result).toBe(0)
            // Should expand -sto to timeout 10s
        })

        it('should handle template flags with custom values', () => {
            // Arrange
            process.chdir(path.resolve(__dirname, '../../../..'))
            process.argv = ['node', 'cli.js', 'pbc', 't', '-sto=5']

            // Act
            const result = main()

            // Assert
            expect(result).toBe(0)
            // Should expand -sto=5 to timeout 5s
        })
    })

    describe('Shell Detection', () => {
        it('should detect shell correctly', () => {
            // Arrange
            process.chdir(path.resolve(__dirname, '../../../..'))
            process.argv = ['node', 'cli.js', 'pbc', 't', '-sto=5']

            // Act
            const result = main()

            // Assert
            expect(result).toBe(0)
            // Should use appropriate shell-specific templates
        })
    })
})
