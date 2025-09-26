import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { setupPaeTestEnvironment, resetPaeMocks } from '../__mocks__/helpers'
import { createPaeMockBuilder } from '../__mocks__/mock-scenario-builder'

import { detectShell } from '../../src/cli'

describe('PAE CLI Coverage Tests', () => {
    let mocks: ReturnType<typeof setupPaeTestEnvironment>
    let originalEnv: NodeJS.ProcessEnv

    beforeEach(() => {
        mocks = setupPaeTestEnvironment()
        resetPaeMocks(mocks)
        
        // Store original environment
        originalEnv = { ...process.env }
        
        // Clear all environment variables
        Object.keys(process.env).forEach(key => {
            delete process.env[key]
        })
    })

    afterEach(() => {
        // Restore original environment
        Object.keys(originalEnv).forEach(key => {
            process.env[key] = originalEnv[key]
        })
    })

    describe('detectShell - Edge Cases', () => {
        it('should detect PowerShell with PSModulePath', () => {
            // Arrange
            process.env.PSModulePath = '/powershell/modules'

            // Act
            const result = detectShell()

            // Assert
            expect(result).toBe('powershell')
        })

        it('should detect PowerShell with POWERSHELL_DISTRIBUTION_CHANNEL', () => {
            // Arrange
            process.env.POWERSHELL_DISTRIBUTION_CHANNEL = 'PSGallery'

            // Act
            const result = detectShell()

            // Assert
            expect(result).toBe('powershell')
        })

        it('should detect PowerShell with PSExecutionPolicyPreference', () => {
            // Arrange
            process.env.PSExecutionPolicyPreference = 'RemoteSigned'

            // Act
            const result = detectShell()

            // Assert
            expect(result).toBe('powershell')
        })

        it('should detect PowerShell with VSCode + PSModulePath', () => {
            // Arrange
            process.env.TERM_PROGRAM = 'vscode'
            process.env.PSModulePath = '/powershell/modules'

            // Act
            const result = detectShell()

            // Assert
            expect(result).toBe('powershell')
        })

        it('should detect Git Bash with MSYS_ROOT', () => {
            // Arrange
            process.env.MSYS_ROOT = '/msys64'

            // Act
            const result = detectShell()

            // Assert
            expect(result).toBe('gitbash')
        })

        it('should detect Git Bash with MINGW_ROOT', () => {
            // Arrange
            process.env.MINGW_ROOT = '/mingw64'

            // Act
            const result = detectShell()

            // Assert
            expect(result).toBe('gitbash')
        })

        it('should detect Git Bash with WSL_DISTRO_NAME', () => {
            // Arrange
            process.env.WSL_DISTRO_NAME = 'Ubuntu'

            // Act
            const result = detectShell()

            // Assert
            expect(result).toBe('gitbash')
        })

        it('should detect Git Bash with WSLENV', () => {
            // Arrange
            process.env.WSLENV = 'PATH/u'

            // Act
            const result = detectShell()

            // Assert
            expect(result).toBe('gitbash')
        })

        it('should detect Git Bash with bash in SHELL', () => {
            // Arrange
            process.env.SHELL = '/usr/bin/bash'

            // Act
            const result = detectShell()

            // Assert
            expect(result).toBe('gitbash')
        })

        it('should detect Git Bash with git-bash in SHELL', () => {
            // Arrange
            process.env.SHELL = '/usr/bin/git-bash'

            // Act
            const result = detectShell()

            // Assert
            expect(result).toBe('gitbash')
        })

        it('should detect Git Bash with bash.exe in SHELL', () => {
            // Arrange
            process.env.SHELL = '/usr/bin/bash.exe'

            // Act
            const result = detectShell()

            // Assert
            expect(result).toBe('gitbash')
        })

        it('should return unknown for unrecognized environment', () => {
            // Arrange
            process.env.SHELL = '/bin/zsh'

            // Act
            const result = detectShell()

            // Assert
            expect(result).toBe('unknown')
        })

        it('should return unknown for empty environment', () => {
            // Arrange - no environment variables set

            // Act
            const result = detectShell()

            // Assert
            expect(result).toBe('unknown')
        })
    })
})



