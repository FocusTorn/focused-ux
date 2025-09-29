import { describe, it, expect, beforeEach, vi } from 'vitest'
import { detectShell } from '../../src/shell.js'

describe('Internal Functions', () => {
    beforeEach(() => {
        // Clear all mocks before each test
        vi.clearAllMocks()
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

    // Legacy runCommand tests removed - functionality now handled by paeManager.runCommand
})
