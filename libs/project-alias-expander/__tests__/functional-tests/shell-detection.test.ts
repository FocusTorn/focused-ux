import { describe, it, expect, beforeEach, afterEach } from 'vitest'
import { detectShell } from '../../src/shell.js'

describe('Shell Detection', () => {
    let originalEnv: NodeJS.ProcessEnv

    beforeEach(() => {
        // Store original environment
        originalEnv = { ...process.env }
        
        // Clear all shell-related environment variables
        delete process.env.PSModulePath
        delete process.env.POWERSHELL_DISTRIBUTION_CHANNEL
        delete process.env.PSExecutionPolicyPreference
        delete process.env.TERM_PROGRAM
        delete process.env.MSYS_ROOT
        delete process.env.MINGW_ROOT
        delete process.env.WSL_DISTRO_NAME
        delete process.env.WSLENV
        delete process.env.SHELL
    })

    afterEach(() => {
        // Restore original environment
        process.env = originalEnv
    })

    describe('PowerShell Detection', () => {
        it('should detect PowerShell when PSModulePath is set', () => {
            // Arrange
            process.env.PSModulePath = 'C:\\Windows\\System32\\WindowsPowerShell\\v1.0\\Modules'

            // Act
            const result = detectShell()

            // Assert
            expect(result).toBe('powershell')
        })

        it('should detect PowerShell when POWERSHELL_DISTRIBUTION_CHANNEL is set', () => {
            // Arrange
            process.env.POWERSHELL_DISTRIBUTION_CHANNEL = 'MSI'

            // Act
            const result = detectShell()

            // Assert
            expect(result).toBe('powershell')
        })

        it('should detect PowerShell when PSExecutionPolicyPreference is set', () => {
            // Arrange
            process.env.PSExecutionPolicyPreference = 'RemoteSigned'

            // Act
            const result = detectShell()

            // Assert
            expect(result).toBe('powershell')
        })

        it('should detect PowerShell when TERM_PROGRAM is vscode and PSModulePath is set', () => {
            // Arrange
            process.env.TERM_PROGRAM = 'vscode'
            process.env.PSModulePath = 'C:\\Windows\\System32\\WindowsPowerShell\\v1.0\\Modules'

            // Act
            const result = detectShell()

            // Assert
            expect(result).toBe('powershell')
        })

        it('should prioritize PowerShell over Git Bash when both indicators are present', () => {
            // Arrange
            process.env.PSModulePath = 'C:\\Windows\\System32\\WindowsPowerShell\\v1.0\\Modules'
            process.env.MSYS_ROOT = 'C:\\Program Files\\Git'

            // Act
            const result = detectShell()

            // Assert
            expect(result).toBe('powershell')
        })
    })

    describe('Git Bash Detection', () => {
        it('should detect Git Bash when MSYS_ROOT is set', () => {
            // Arrange
            process.env.MSYS_ROOT = 'C:\\Program Files\\Git'

            // Act
            const result = detectShell()

            // Assert
            expect(result).toBe('gitbash')
        })

        it('should detect Git Bash when MINGW_ROOT is set', () => {
            // Arrange
            process.env.MINGW_ROOT = 'C:\\Program Files\\Git'

            // Act
            const result = detectShell()

            // Assert
            expect(result).toBe('gitbash')
        })

        it('should detect Git Bash when WSL_DISTRO_NAME is set', () => {
            // Arrange
            process.env.WSL_DISTRO_NAME = 'Ubuntu'

            // Act
            const result = detectShell()

            // Assert
            expect(result).toBe('gitbash')
        })

        it('should detect Git Bash when WSLENV is set', () => {
            // Arrange
            process.env.WSLENV = 'PATH/u'

            // Act
            const result = detectShell()

            // Assert
            expect(result).toBe('gitbash')
        })

        it('should detect Git Bash when SHELL contains bash', () => {
            // Arrange
            process.env.SHELL = 'C:\\Program Files\\Git\\bin\\bash.exe'

            // Act
            const result = detectShell()

            // Assert
            expect(result).toBe('gitbash')
        })

        it('should detect Git Bash when SHELL contains git-bash', () => {
            // Arrange
            process.env.SHELL = '/usr/bin/git-bash'

            // Act
            const result = detectShell()

            // Assert
            expect(result).toBe('gitbash')
        })

        it('should detect Git Bash when SHELL contains bash.exe', () => {
            // Arrange
            process.env.SHELL = 'bash.exe'

            // Act
            const result = detectShell()

            // Assert
            expect(result).toBe('gitbash')
        })
    })

    describe('Unknown Shell Detection', () => {
        it('should return unknown when no shell indicators are present', () => {
            // Arrange
            // Clear all shell indicators
            delete process.env.PSModulePath
            delete process.env.POWERSHELL_DISTRIBUTION_CHANNEL
            delete process.env.PSExecutionPolicyPreference
            delete process.env.TERM_PROGRAM
            delete process.env.MSYS_ROOT
            delete process.env.MINGW_ROOT
            delete process.env.WSL_DISTRO_NAME
            delete process.env.WSLENV
            delete process.env.SHELL

            // Act
            const result = detectShell()

            // Assert
            expect(result).toBe('unknown')
        })

        it('should return unknown when only unrelated environment variables are set', () => {
            // Arrange
            process.env.NODE_ENV = 'test'
            process.env.PATH = '/usr/bin:/bin'
            process.env.HOME = '/home/user'

            // Act
            const result = detectShell()

            // Assert
            expect(result).toBe('unknown')
        })
    })

    describe('Edge Cases', () => {
        it('should handle empty string values', () => {
            // Arrange
            process.env.PSModulePath = ''
            process.env.MSYS_ROOT = ''

            // Act
            const result = detectShell()

            // Assert
            expect(result).toBe('unknown')
        })

        it('should handle undefined values', () => {
            // Arrange
            process.env.PSModulePath = undefined
            process.env.MSYS_ROOT = undefined

            // Act
            const result = detectShell()

            // Assert
            expect(result).toBe('unknown')
        })

        it('should handle case sensitivity in SHELL variable', () => {
            // Arrange
            process.env.SHELL = 'C:\\Program Files\\Git\\bin\\bash.exe'

            // Act
            const result = detectShell()

            // Assert
            expect(result).toBe('gitbash')
        })

        it('should handle partial matches in SHELL variable', () => {
            // Arrange
            process.env.SHELL = '/usr/local/bin/bash'

            // Act
            const result = detectShell()

            // Assert
            expect(result).toBe('gitbash')
        })

        it('should handle multiple Git Bash indicators', () => {
            // Arrange
            process.env.MSYS_ROOT = 'C:\\Program Files\\Git'
            process.env.SHELL = 'bash.exe'
            process.env.WSL_DISTRO_NAME = 'Ubuntu'

            // Act
            const result = detectShell()

            // Assert
            expect(result).toBe('gitbash')
        })

        it('should handle multiple PowerShell indicators', () => {
            // Arrange
            process.env.PSModulePath = 'C:\\Windows\\System32\\WindowsPowerShell\\v1.0\\Modules'
            process.env.POWERSHELL_DISTRIBUTION_CHANNEL = 'MSI'
            process.env.PSExecutionPolicyPreference = 'RemoteSigned'

            // Act
            const result = detectShell()

            // Assert
            expect(result).toBe('powershell')
        })
    })

    describe('Real-world Scenarios', () => {
        it('should detect PowerShell in VS Code terminal', () => {
            // Arrange
            process.env.TERM_PROGRAM = 'vscode'
            process.env.PSModulePath = 'C:\\Windows\\System32\\WindowsPowerShell\\v1.0\\Modules'

            // Act
            const result = detectShell()

            // Assert
            expect(result).toBe('powershell')
        })

        it('should detect Git Bash in VS Code terminal', () => {
            // Arrange
            process.env.TERM_PROGRAM = 'vscode'
            process.env.SHELL = 'C:\\Program Files\\Git\\bin\\bash.exe'

            // Act
            const result = detectShell()

            // Assert
            expect(result).toBe('gitbash')
        })

        it('should detect WSL environment', () => {
            // Arrange
            process.env.WSL_DISTRO_NAME = 'Ubuntu-20.04'
            process.env.WSLENV = 'PATH/u'

            // Act
            const result = detectShell()

            // Assert
            expect(result).toBe('gitbash')
        })

        it('should detect MinGW environment', () => {
            // Arrange
            process.env.MINGW_ROOT = 'C:\\msys64'
            process.env.SHELL = 'bash'

            // Act
            const result = detectShell()

            // Assert
            expect(result).toBe('gitbash')
        })

        it('should detect PowerShell Core', () => {
            // Arrange
            process.env.POWERSHELL_DISTRIBUTION_CHANNEL = 'GitHub'
            process.env.PSExecutionPolicyPreference = 'Bypass'

            // Act
            const result = detectShell()

            // Assert
            expect(result).toBe('powershell')
        })
    })
})
