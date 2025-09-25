import { describe, it, expect, beforeEach, vi } from 'vitest'
import { setupPaeTestEnvironment, resetPaeMocks } from '../__mocks__/helpers'
import { createPaeMockBuilder } from '../__mocks__/mock-scenario-builder'
import { detectShell } from '../../src/cli'

describe('PAE CLI Coverage Tests', () => {
    let mocks: ReturnType<typeof setupPaeTestEnvironment>

    beforeEach(() => {
        mocks = setupPaeTestEnvironment()
        resetPaeMocks(mocks)
    })

    describe('detectShell - Edge Cases', () => {
        it('should detect PowerShell with PSModulePath', () => {
            // Arrange
            mocks.process.env = {
                PSModulePath: '/powershell/modules'
            }

            // Act
            const result = detectShell()

            // Assert
            expect(result).toBe('powershell')
        })

        it('should detect PowerShell with POWERSHELL_DISTRIBUTION_CHANNEL', () => {
            // Arrange
            mocks.process.env = {
                POWERSHELL_DISTRIBUTION_CHANNEL: 'PSGallery'
            }

            // Act
            const result = detectShell()

            // Assert
            expect(result).toBe('powershell')
        })

        it('should detect PowerShell with PSExecutionPolicyPreference', () => {
            // Arrange
            mocks.process.env = {
                PSExecutionPolicyPreference: 'RemoteSigned'
            }

            // Act
            const result = detectShell()

            // Assert
            expect(result).toBe('powershell')
        })

        it('should detect PowerShell with VSCode + PSModulePath', () => {
            // Arrange
            mocks.process.env = {
                TERM_PROGRAM: 'vscode',
                PSModulePath: '/powershell/modules'
            }

            // Act
            const result = detectShell()

            // Assert
            expect(result).toBe('powershell')
        })

        it('should detect Git Bash with MSYS_ROOT', () => {
            // Arrange
            mocks.process.env = {
                MSYS_ROOT: '/msys64'
            }

            // Act
            const result = detectShell()

            // Assert
            expect(result).toBe('gitbash')
        })

        it('should detect Git Bash with MINGW_ROOT', () => {
            // Arrange
            mocks.process.env = {
                MINGW_ROOT: '/mingw64'
            }

            // Act
            const result = detectShell()

            // Assert
            expect(result).toBe('gitbash')
        })

        it('should detect Git Bash with WSL_DISTRO_NAME', () => {
            // Arrange
            mocks.process.env = {
                WSL_DISTRO_NAME: 'Ubuntu'
            }

            // Act
            const result = detectShell()

            // Assert
            expect(result).toBe('gitbash')
        })

        it('should detect Git Bash with WSLENV', () => {
            // Arrange
            mocks.process.env = {
                WSLENV: 'PATH/u'
            }

            // Act
            const result = detectShell()

            // Assert
            expect(result).toBe('gitbash')
        })

        it('should detect Git Bash with bash in SHELL', () => {
            // Arrange
            mocks.process.env = {
                SHELL: '/usr/bin/bash'
            }

            // Act
            const result = detectShell()

            // Assert
            expect(result).toBe('gitbash')
        })

        it('should detect Git Bash with git-bash in SHELL', () => {
            // Arrange
            mocks.process.env = {
                SHELL: '/usr/bin/git-bash'
            }

            // Act
            const result = detectShell()

            // Assert
            expect(result).toBe('gitbash')
        })

        it('should detect Git Bash with bash.exe in SHELL', () => {
            // Arrange
            mocks.process.env = {
                SHELL: '/usr/bin/bash.exe'
            }

            // Act
            const result = detectShell()

            // Assert
            expect(result).toBe('gitbash')
        })

        it('should return unknown for unrecognized environment', () => {
            // Arrange
            mocks.process.env = {
                SHELL: '/bin/zsh'
            }

            // Act
            const result = detectShell()

            // Assert
            expect(result).toBe('unknown')
        })

        it('should return unknown for empty environment', () => {
            // Arrange
            mocks.process.env = {}

            // Act
            const result = detectShell()

            // Assert
            expect(result).toBe('unknown')
        })
    })
})



