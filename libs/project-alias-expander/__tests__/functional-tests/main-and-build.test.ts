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

import { main, installAliases } from '../../src/cli'

describe('Main Function and Build Functions', () => {
    let mocks: Awaited<ReturnType<typeof setupPaeTestEnvironment>>

    beforeEach(async () => { //>
        mocks = await setupPaeTestEnvironment()
        await resetPaeMocks(mocks)
        
        // Wire up the fs module mocks to our test mocks
        const fs = await import('node:fs')
        vi.mocked(fs.default.existsSync).mockImplementation(mocks.fs.existsSync)
        vi.mocked(fs.default.readFileSync).mockImplementation(mocks.fs.readFileSync)
        vi.mocked(fs.default.writeFileSync).mockImplementation(mocks.fs.writeFileSync)
        vi.mocked(fs.default.mkdirSync).mockImplementation(mocks.fs.mkdirSync)
        
        // Also wire up the non-default exports
        vi.mocked(fs.existsSync).mockImplementation(mocks.fs.existsSync)
        vi.mocked(fs.readFileSync).mockImplementation(mocks.fs.readFileSync)
        vi.mocked(fs.writeFileSync).mockImplementation(mocks.fs.writeFileSync)
        vi.mocked(fs.mkdirSync).mockImplementation(mocks.fs.mkdirSync)
    }) //<

    // Legacy generateLocalFiles, refreshAliases, refreshAliasesDirect tests removed - functionality now handled by paeManager

    describe('main function', () => {
        it('should handle install-aliases command', () => { //>
            // Arrange
            const originalArgv = process.argv
            process.argv = ['node', 'cli.js', 'install-aliases']

            // Mock the config loading
            mocks.fs.existsSync.mockReturnValue(true)
            mocks.fs.readFileSync.mockReturnValue(JSON.stringify({
                'nxPackages': {
                    pbc: { name: 'project-butler', suffix: 'core' }
                },
                'nxTargets': {
                    "a": "audit",
                    "b": "build"
                },
                'expandable-flags': {}
            }))

            // Act & Assert - should not throw
            expect(() => main()).not.toThrow()

            // Cleanup
            process.argv = originalArgv
        }) //<

        it('should handle install command', () => { //>
            // Arrange
            const originalArgv = process.argv
            process.argv = ['node', 'cli.js', 'install']

            // Mock the config loading
            mocks.fs.existsSync.mockReturnValue(true)
            mocks.fs.readFileSync.mockReturnValue(JSON.stringify({
                'nxPackages': {
                    pbc: { name: 'project-butler', suffix: 'core' }
                },
                'nxTargets': {
                    "a": "audit",
                    "b": "build"
                },
                'expandable-flags': {}
            }))

            // Act & Assert - should not throw
            expect(() => main()).not.toThrow()

            // Cleanup
            process.argv = originalArgv
        }) //<

        it('should handle refresh command', () => { //>
            // Arrange
            const originalArgv = process.argv
            process.argv = ['node', 'cli.js', 'refresh']

            // Act & Assert - should not throw
            expect(() => main()).not.toThrow()

            // Cleanup
            process.argv = originalArgv
        }) //<

        it('should handle refresh-aliases command', () => { //>
            // Arrange
            const originalArgv = process.argv
            process.argv = ['node', 'cli.js', 'refresh-aliases']

            // Mock the config loading
            mocks.fs.existsSync.mockReturnValue(true)
            mocks.fs.readFileSync.mockReturnValue(JSON.stringify({
                'nxPackages': {
                    pbc: { name: 'project-butler', suffix: 'core' }
                },
                'nxTargets': {
                    "a": "audit",
                    "b": "build"
                },
                'expandable-flags': {}
            }))

            // Act & Assert - should not throw
            expect(() => main()).not.toThrow()

            // Cleanup
            process.argv = originalArgv
        }) //<

        it('should handle debug-workspace command', () => { //>
            // Arrange
            const originalArgv = process.argv
            process.argv = ['node', 'cli.js', 'debug-workspace']

            // Mock the config loading
            mocks.fs.existsSync.mockReturnValue(true)
            mocks.fs.readFileSync.mockReturnValue(JSON.stringify({
                'nxPackages': {
                    pbc: { name: 'project-butler', suffix: 'core' }
                },
                'nxTargets': {
                    "a": "audit",
                    "b": "build"
                },
                'expandable-flags': {}
            }))

            // Act & Assert - should not throw
            expect(() => main()).not.toThrow()

            // Cleanup
            process.argv = originalArgv
        }) //<

        it('should generate local files when no arguments provided', () => { //>
            // Arrange
            const originalArgv = process.argv
            process.argv = ['node', 'cli.js']

            // Act & Assert - should not throw
            expect(() => main()).not.toThrow()

            // Cleanup
            process.argv = originalArgv
        }) //<

        it('should handle help command', () => { //>
            // Arrange
            const originalArgv = process.argv
            process.argv = ['node', 'cli.js', 'help']
            const consoleSpy = vi.spyOn(console, 'log').mockImplementation(() => {})

            // Act
            main()

            // Assert
            expect(consoleSpy).toHaveBeenCalledWith(expect.stringContaining('PAE - Project Alias Expander'))

            // Cleanup
            process.argv = originalArgv
            consoleSpy.mockRestore()
        }) //<
    })
})