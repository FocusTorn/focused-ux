import { describe, it, expect, beforeEach, vi } from 'vitest'
import { setupPaeTestEnvironment, resetPaeMocks } from '../__mocks__/helpers'

// Mock the child_process module
vi.mock('node:child_process', () => ({
    spawnSync: vi.fn(),
    execSync: vi.fn(),
}))

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

// Import the internal functions we need to test
import { detectShell, runCommand } from '../../src/cli'

describe('Internal Functions', () => {
    let mocks: Awaited<ReturnType<typeof setupPaeTestEnvironment>>

    beforeEach(async () => {
        mocks = await setupPaeTestEnvironment()
        await resetPaeMocks(mocks)
        
        // Wire up the child_process module mocks
        const childProcess = await import('node:child_process')
        vi.mocked(childProcess.spawnSync).mockImplementation(mocks.childProcess.spawnSync)
        vi.mocked(childProcess.execSync).mockImplementation(mocks.childProcess.execSync)
    })

    describe('detectShell', () => {
        it('should detect PowerShell when PSModulePath is set', () => {
            // Arrange
            const originalPsModulePath = process.env.PSModulePath
            process.env.PSModulePath = 'C:\\Windows\\System32\\WindowsPowerShell\\v1.0\\Modules'

            // Act
            const result = detectShell()

            // Assert
            expect(result).toBe('powershell')

            // Cleanup
            process.env.PSModulePath = originalPsModulePath
        })

        it('should detect Git Bash when MSYS_ROOT is set', () => {
            // Arrange
            const originalPsModulePath = process.env.PSModulePath
            const originalPowerShellChannel = process.env.POWERSHELL_DISTRIBUTION_CHANNEL
            const originalPsExecutionPolicy = process.env.PSExecutionPolicyPreference
            const originalTermProgram = process.env.TERM_PROGRAM
            const originalMsysRoot = process.env.MSYS_ROOT
            
            // Clear all PowerShell indicators
            delete process.env.PSModulePath
            delete process.env.POWERSHELL_DISTRIBUTION_CHANNEL
            delete process.env.PSExecutionPolicyPreference
            delete process.env.TERM_PROGRAM
            
            process.env.MSYS_ROOT = 'C:\\Program Files\\Git'

            // Act
            const result = detectShell()

            // Assert
            expect(result).toBe('gitbash')

            // Cleanup
            process.env.PSModulePath = originalPsModulePath
            process.env.POWERSHELL_DISTRIBUTION_CHANNEL = originalPowerShellChannel
            process.env.PSExecutionPolicyPreference = originalPsExecutionPolicy
            process.env.TERM_PROGRAM = originalTermProgram
            process.env.MSYS_ROOT = originalMsysRoot
        })

        it('should detect Git Bash when SHELL contains bash', () => {
            // Arrange
            const originalPsModulePath = process.env.PSModulePath
            const originalPowerShellChannel = process.env.POWERSHELL_DISTRIBUTION_CHANNEL
            const originalPsExecutionPolicy = process.env.PSExecutionPolicyPreference
            const originalTermProgram = process.env.TERM_PROGRAM
            const originalShell = process.env.SHELL
            
            // Clear all PowerShell indicators
            delete process.env.PSModulePath
            delete process.env.POWERSHELL_DISTRIBUTION_CHANNEL
            delete process.env.PSExecutionPolicyPreference
            delete process.env.TERM_PROGRAM
            
            process.env.SHELL = 'C:\\Program Files\\Git\\bin\\bash.exe'

            // Act
            const result = detectShell()

            // Assert
            expect(result).toBe('gitbash')

            // Cleanup
            process.env.PSModulePath = originalPsModulePath
            process.env.POWERSHELL_DISTRIBUTION_CHANNEL = originalPowerShellChannel
            process.env.PSExecutionPolicyPreference = originalPsExecutionPolicy
            process.env.TERM_PROGRAM = originalTermProgram
            process.env.SHELL = originalShell
        })

        it('should return unknown when no shell indicators are present', () => {
            // Arrange
            const originalPsModulePath = process.env.PSModulePath
            const originalPowerShellChannel = process.env.POWERSHELL_DISTRIBUTION_CHANNEL
            const originalPsExecutionPolicy = process.env.PSExecutionPolicyPreference
            const originalTermProgram = process.env.TERM_PROGRAM
            const originalMsysRoot = process.env.MSYS_ROOT
            const originalShell = process.env.SHELL
            
            // Clear all shell indicators
            delete process.env.PSModulePath
            delete process.env.POWERSHELL_DISTRIBUTION_CHANNEL
            delete process.env.PSExecutionPolicyPreference
            delete process.env.TERM_PROGRAM
            delete process.env.MSYS_ROOT
            delete process.env.SHELL

            // Act
            const result = detectShell()

            // Assert
            expect(result).toBe('unknown')

            // Cleanup
            process.env.PSModulePath = originalPsModulePath
            process.env.POWERSHELL_DISTRIBUTION_CHANNEL = originalPowerShellChannel
            process.env.PSExecutionPolicyPreference = originalPsExecutionPolicy
            process.env.TERM_PROGRAM = originalTermProgram
            process.env.MSYS_ROOT = originalMsysRoot
            process.env.SHELL = originalShell
        })
    })

    describe('runCommand', () => {
        it('should execute command successfully', () => {
            // Arrange
            const command = 'echo'
            const args = ['test']

            // Mock spawnSync to return success
            mocks.childProcess.spawnSync.mockReturnValue({
                status: 0,
                signal: null,
                output: ['test\n'],
                pid: 123,
                stdout: Buffer.from('test\n'),
                stderr: Buffer.from(''),
                error: undefined
            })

            // Act
            const result = runCommand(command, args)

            // Assert
            expect(result).toBe(0)
            expect(mocks.childProcess.spawnSync).toHaveBeenCalledWith(command, args, {
                stdio: 'inherit',
                shell: true,
                timeout: 300000,
                killSignal: 'SIGTERM'
            })
        })

        it('should handle command failure', () => {
            // Arrange
            const command = 'nonexistent-command'
            const args = ['test']

            // Mock spawnSync to return failure
            mocks.childProcess.spawnSync.mockReturnValue({
                status: 1,
                signal: null,
                output: [''],
                pid: 123,
                stdout: Buffer.from(''),
                stderr: Buffer.from('command not found'),
                error: undefined
            })

            // Act
            const result = runCommand(command, args)

            // Assert
            expect(result).toBe(1)
        })

        it('should handle command error', () => {
            // Arrange
            const command = 'echo'
            const args = ['test']

            // Mock spawnSync to return error
            mocks.childProcess.spawnSync.mockReturnValue({
                status: null,
                signal: 'SIGTERM',
                output: [''],
                pid: 123,
                stdout: Buffer.from(''),
                stderr: Buffer.from(''),
                error: new Error('Command failed')
            })

            // Act
            const result = runCommand(command, args)

            // Assert
            expect(result).toBe(1)
        })
    })
})
