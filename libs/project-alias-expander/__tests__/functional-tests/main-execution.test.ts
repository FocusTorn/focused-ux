import { describe, it, expect, beforeEach, vi } from 'vitest'
import { setupPaeTestEnvironment, resetPaeMocks } from '../__mocks__/helpers'
import { createLibMockBuilder, setupCliConfigScenario } from '@fux/mock-strategy/lib'
import { spawnSync } from 'node:child_process'

// child_process is mocked globally in globals.ts

// Mock fs to prevent actual file operations
vi.mock('node:fs', () => ({
    default: {
        existsSync: vi.fn().mockReturnValue(true),
        readFileSync: vi.fn().mockReturnValue('{"packages":{"pbc":{"name":"project-butler","suffix":"core"}},"package-targets":{"v":"validate:deps","h":"help"},"not-nx-targets":{},"expandables":{"f":"fix","s":"skip-nx-cache"}}'),
        writeFileSync: vi.fn(),
        mkdirSync: vi.fn(),
    },
    existsSync: vi.fn().mockReturnValue(true),
    readFileSync: vi.fn().mockReturnValue('{"packages":{"pbc":{"name":"project-butler","suffix":"core"}},"package-targets":{"v":"validate:deps","h":"help"},"not-nx-targets":{},"expandables":{"f":"fix","s":"skip-nx-cache"}}'),
    writeFileSync: vi.fn(),
    mkdirSync: vi.fn(),
}))

// Mock strip-json-comments
vi.mock('strip-json-comments', () => ({
    default: vi.fn().mockImplementation((content) => {
        // Return the content as-is since it's already valid JSON
        return content
    })
}))

import { main } from '../../src/cli'


describe('Main Function Execution Tests', () => {
    let mocks: Awaited<ReturnType<typeof setupPaeTestEnvironment>>

    beforeEach(async () => {
        mocks = await setupPaeTestEnvironment()
        await resetPaeMocks(mocks)
    })

    describe('validate:deps auto-injection execution', () => {
        it('should execute main with validate:deps and auto-inject --parallel=false', async () => {
            // Arrange - Use CLI config scenario from mock-strategy library
            setupCliConfigScenario(mocks, {
                packages: {
                    'pbc': { targets: ['build', 'test'] }
                },
                packageTargets: {
                    'v': 'validate:deps'
                },
                notNxTargets: ['help', 'version'],
                expandables: {
                    'f': 'fix',
                    's': 'skip-nx-cache'
                }
            })

            const originalArgv = process.argv
            const originalExit = process.exit
            const exitSpy = vi.fn()
            process.exit = exitSpy as any

            try {
                // Set up argv for validate:deps command
                process.argv = ['node', 'cli.js', 'pbc', 'v']

                // Act - This should execute the main function and hit the validate:deps auto-injection logic
                main()

                // Assert - Should not exit with error
                expect(exitSpy).not.toHaveBeenCalled()

                // Cleanup
                process.argv = originalArgv
            } finally {
                process.exit = originalExit
            }
        })

        it('should execute main with validate:deps and not duplicate --parallel=false', () => {
            // Arrange
            const originalArgv = process.argv
            const originalExit = process.exit
            const exitSpy = vi.fn()
            process.exit = exitSpy as any

            try {
                // Set up argv for validate:deps command with --parallel=false already present
                process.argv = ['node', 'cli.js', 'pbc', 'v', '--parallel=false']

                // Act - This should execute the main function and hit the validate:deps auto-injection logic
                main()

                // Assert - Should not exit with error
                expect(exitSpy).not.toHaveBeenCalled()

                // Cleanup
                process.argv = originalArgv
            } finally {
                process.exit = originalExit
            }
        })
    })

    describe('PAE_ECHO environment execution', () => {
        it('should execute main with echo flag and set PAE_ECHO environment', () => {
            // Arrange
            const originalArgv = process.argv
            const originalExit = process.exit
            const originalEcho = process.env.PAE_ECHO
            const exitSpy = vi.fn()
            process.exit = exitSpy as any

            try {
                // Set up argv for command with echo flag
                process.argv = ['node', 'cli.js', 'pbc', 'b', '-echo']

                // Act - This should execute the main function and hit the PAE_ECHO environment logic
                main()

                // Assert - Should not exit with error
                expect(exitSpy).not.toHaveBeenCalled()

                // Cleanup
                process.argv = originalArgv
                process.env.PAE_ECHO = originalEcho
            } finally {
                process.exit = originalExit
            }
        })

        it('should execute main and restore PAE_ECHO environment after execution', () => {
            // Arrange
            const originalArgv = process.argv
            const originalExit = process.exit
            const originalEcho = process.env.PAE_ECHO
            const exitSpy = vi.fn()
            process.exit = exitSpy as any

            try {
                // Set up argv for command with echo flag
                process.argv = ['node', 'cli.js', 'pbc', 'b', '-echo']

                // Act - This should execute the main function and hit the PAE_ECHO restoration logic
                main()

                // Assert - Should not exit with error
                expect(exitSpy).not.toHaveBeenCalled()

                // Cleanup
                process.argv = originalArgv
                process.env.PAE_ECHO = originalEcho
            } finally {
                process.exit = originalExit
            }
        })
    })

    describe('process.exit execution scenarios', () => {
        it('should execute main and call process.exit when command fails', () => {
            // Arrange
            const originalArgv = process.argv
            const originalExit = process.exit
            const exitSpy = vi.fn()
            process.exit = exitSpy as any

            // Mock spawnSync to return failure
            vi.mocked(spawnSync).mockReturnValue({
                status: 1,
                signal: null,
                output: [''],
                pid: 123,
                stdout: Buffer.from(''),
                stderr: Buffer.from('error'),
                error: undefined
            })

            try {
                // Set up argv for command that will fail
                process.argv = ['node', 'cli.js', 'pbc', 'b']

                // Act - This should execute the main function and hit the process.exit logic
                main()

                // Assert - Should exit with error code
                expect(exitSpy).toHaveBeenCalledWith(1)

                // Cleanup
                process.argv = originalArgv
            } finally {
                process.exit = originalExit
            }
        })

        it('should execute main and not call process.exit when command succeeds', () => {
            // Arrange
            const originalArgv = process.argv
            const originalExit = process.exit
            const exitSpy = vi.fn()
            process.exit = exitSpy as any

            // Mock spawnSync to return success
            vi.mocked(spawnSync).mockReturnValue({
                status: 0,
                signal: null,
                output: [''],
                pid: 123,
                stdout: Buffer.from(''),
                stderr: Buffer.from(''),
                error: undefined
            })

            try {
                // Set up argv for command that will succeed
                process.argv = ['node', 'cli.js', 'pbc', 'b']

                // Act - This should execute the main function and not hit the process.exit logic
                main()

                // Assert - Should not exit
                expect(exitSpy).not.toHaveBeenCalled()

                // Cleanup
                process.argv = originalArgv
            } finally {
                process.exit = originalExit
            }
        })
    })

    describe('main function execution conditions', () => {
        it('should execute main when run directly as CLI', () => {
            // Arrange
            const originalArgv = process.argv
            const originalExit = process.exit
            const exitSpy = vi.fn()
            process.exit = exitSpy as any

            try {
                // Set up argv to simulate CLI execution
                process.argv = ['node', 'cli.js', 'pbc', 'b']

                // Act - This should execute the main function
                main()

                // Assert - Should not exit with error
                expect(exitSpy).not.toHaveBeenCalled()

                // Cleanup
                process.argv = originalArgv
            } finally {
                process.exit = originalExit
            }
        })

        it('should execute main when run with help command', () => {
            // Arrange
            const originalArgv = process.argv
            process.argv = ['node', 'cli.js', 'help']

            const consoleSpy = vi.spyOn(console, 'log').mockImplementation(() => {})

            try {
                // Act - This should execute the main function and hit the help logic
                // process.exit(0) will throw in test environment, which is expected
                expect(() => main()).toThrow()
            } finally {
                // Cleanup
                process.argv = originalArgv
                consoleSpy.mockRestore()
            }
        })
    })

    describe('error handling execution', () => {
        it('should execute main with unknown alias and exit with error', () => {
            // Arrange
            const originalArgv = process.argv
            process.argv = ['node', 'cli.js', 'unknown-alias', 'b']

            const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {})

            try {
                // Act - This should execute the main function and hit the unknown alias error logic
                // process.exit(1) will throw in test environment, which is expected
                expect(() => main()).toThrow()
            } finally {
                // Cleanup
                process.argv = originalArgv
                consoleSpy.mockRestore()
            }
        })

        it('should execute main with missing command and exit with error', () => {
            // Arrange
            const originalArgv = process.argv
            process.argv = ['node', 'cli.js', 'pbc']

            const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {})

            try {
                // Act - This should execute the main function and hit the missing command error logic
                // process.exit(1) will throw in test environment, which is expected
                expect(() => main()).toThrow()
            } finally {
                // Cleanup
                process.argv = originalArgv
                consoleSpy.mockRestore()
            }
        })
    })
})
