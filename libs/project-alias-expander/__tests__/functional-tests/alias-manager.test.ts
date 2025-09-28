import { describe, it, expect, beforeEach, vi } from 'vitest'
import { AliasManagerService } from '../../src/services/AliasManager.service.js'
import type { AliasConfig } from '../../src/_types/index.js'

// Mock fs
vi.mock('fs', () => ({
    default: {
        existsSync: vi.fn(),
        readFileSync: vi.fn(),
        writeFileSync: vi.fn(),
        mkdirSync: vi.fn(),
        copyFileSync: vi.fn(),
        rmSync: vi.fn()
    },
    existsSync: vi.fn(),
    readFileSync: vi.fn(),
    writeFileSync: vi.fn(),
    mkdirSync: vi.fn(),
    copyFileSync: vi.fn(),
    rmSync: vi.fn()
}))

// Mock child_process
vi.mock('child_process', () => ({
    execSync: vi.fn()
}))

// Mock config loading
vi.mock('../../src/config.js', () => ({
    loadAliasConfig: vi.fn()
}))

// Mock shell detection
vi.mock('../../src/shell.js', () => ({
    detectShell: vi.fn()
}))

import * as fs from 'fs'
import { execSync } from 'child_process'
import { loadAliasConfig } from '../../src/config.js'
import { detectShell } from '../../src/shell.js'

describe('AliasManagerService', () => {
    let service: AliasManagerService
    let mockFs: typeof fs
    let mockExecSync: ReturnType<typeof vi.mocked>
    let mockLoadAliasConfig: ReturnType<typeof vi.mocked>
    let mockDetectShell: ReturnType<typeof vi.mocked>

    beforeEach(() => {
        service = new AliasManagerService()
        mockFs = vi.mocked(fs)
        mockExecSync = vi.mocked(execSync)
        mockLoadAliasConfig = vi.mocked(loadAliasConfig)
        mockDetectShell = vi.mocked(detectShell)
        
        // Reset environment
        delete process.env.PAE_INSTALLING
        delete process.env.ENABLE_TEST_CONSOLE
    })

    describe('generateLocalFiles', () => {
        it('should generate PowerShell and Bash files', () => {
            // Arrange
            const config: AliasConfig = {
                'nxPackages': {
                    'pbc': { name: 'project-butler', suffix: 'core' },
                    'pbe': { name: 'project-butler', suffix: 'ext' }
                }
            }
            
            mockLoadAliasConfig.mockReturnValue(config)
            mockDetectShell.mockReturnValue('powershell')
            mockFs.existsSync.mockReturnValue(false)
            mockFs.mkdirSync.mockImplementation(() => {})
            mockFs.writeFileSync.mockImplementation(() => {})

            // Act
            service.generateLocalFiles()

            // Assert
            expect(mockFs.mkdirSync).toHaveBeenCalledWith(
                expect.stringContaining('libs/project-alias-expander/dist'),
                { recursive: true }
            )
            expect(mockFs.writeFileSync).toHaveBeenCalledTimes(2)
            
            // Check PowerShell module content
            const psCall = mockFs.writeFileSync.mock.calls.find(call => 
                call[0].toString().includes('pae-functions.psm1')
            )
            expect(psCall).toBeDefined()
            const psContent = psCall![1] as string
            expect(psContent).toContain('function Invoke-pbc')
            expect(psContent).toContain('function Invoke-pbe')
            expect(psContent).toContain('Set-Alias -Name pbc -Value Invoke-pbc')
            expect(psContent).toContain('Set-Alias -Name pbe -Value Invoke-pbe')
            
            // Check Bash script content
            const bashCall = mockFs.writeFileSync.mock.calls.find(call => 
                call[0].toString().includes('pae-aliases.sh')
            )
            expect(bashCall).toBeDefined()
            const bashContent = bashCall![1] as string
            expect(bashContent).toContain("alias pbc='pae pbc'")
            expect(bashContent).toContain("alias pbe='pae pbe'")
        })

        it('should handle verbose mode', () => {
            // Arrange
            const originalArgv = process.argv
            process.argv = ['node', 'cli.js', '--verbose']
            
            const config: AliasConfig = {
                'nxPackages': {
                    'pbc': { name: 'project-butler', suffix: 'core' }
                }
            }
            
            mockLoadAliasConfig.mockReturnValue(config)
            mockDetectShell.mockReturnValue('powershell')
            mockFs.existsSync.mockReturnValue(false)
            mockFs.mkdirSync.mockImplementation(() => {})
            mockFs.writeFileSync.mockImplementation(() => {})

            const consoleSpy = vi.spyOn(console, 'log').mockImplementation(() => {})

            // Act
            service.generateLocalFiles()

            // Assert
            expect(consoleSpy).toHaveBeenCalledWith('Detected shell: powershell')
            expect(consoleSpy).toHaveBeenCalledWith('Found 1 aliases: pbc')
            expect(consoleSpy).toHaveBeenCalledWith('Generating local files only (build process)')

            // Cleanup
            process.argv = originalArgv
            consoleSpy.mockRestore()
        })

        it('should handle config loading error gracefully', () => {
            // Arrange
            mockLoadAliasConfig.mockImplementation(() => {
                throw new Error('Config not found')
            })

            // Act & Assert - should not throw
            expect(() => service.generateLocalFiles()).not.toThrow()
        })
    })

    describe('installAliases', () => {
        it('should prevent multiple installations', () => {
            // Arrange
            process.env.PAE_INSTALLING = '1'
            const consoleSpy = vi.spyOn(console, 'log').mockImplementation(() => {})

            // Act
            service.installAliases()

            // Assert
            expect(consoleSpy).not.toHaveBeenCalled()

            // Cleanup
            consoleSpy.mockRestore()
        })

        it('should install aliases successfully', () => {
            // Arrange
            const config: AliasConfig = {
                'nxPackages': {
                    'pbc': { name: 'project-butler', suffix: 'core' }
                }
            }
            
            mockLoadAliasConfig.mockReturnValue(config)
            mockDetectShell.mockReturnValue('powershell')
            mockFs.existsSync.mockReturnValue(false)
            mockFs.mkdirSync.mockImplementation(() => {})
            mockFs.writeFileSync.mockImplementation(() => {})
            mockFs.copyFileSync.mockImplementation(() => {})

            const originalArgv = process.argv
            process.argv = ['node', 'cli.js', '--verbose']
            const consoleSpy = vi.spyOn(console, 'log').mockImplementation(() => {})

            // Act
            service.installAliases()

            // Assert
            expect(mockFs.writeFileSync).toHaveBeenCalledTimes(2)
            expect(mockFs.copyFileSync).toHaveBeenCalledWith(
                expect.stringContaining('pae-functions.psm1'),
                expect.stringContaining('PAE.psm1')
            )

            // Cleanup
            process.argv = originalArgv
            consoleSpy.mockRestore()
        })

        it('should handle PowerShell module installation failure', () => {
            // Arrange
            const config: AliasConfig = {
                'nxPackages': {
                    'pbc': { name: 'project-butler', suffix: 'core' }
                }
            }
            
            mockLoadAliasConfig.mockReturnValue(config)
            mockDetectShell.mockReturnValue('powershell')
            mockFs.existsSync.mockReturnValue(false)
            mockFs.mkdirSync.mockImplementation(() => {})
            mockFs.writeFileSync.mockImplementation(() => {})
            mockFs.copyFileSync.mockImplementation(() => {
                throw new Error('Permission denied')
            })

            const originalArgv = process.argv
            process.argv = ['node', 'cli.js', '--verbose']
            const consoleSpy = vi.spyOn(console, 'log').mockImplementation(() => {})

            // Act
            service.installAliases()

            // Assert
            expect(consoleSpy).toHaveBeenCalledWith(
                expect.stringContaining('⚠️  Failed to install PowerShell module')
            )

            // Cleanup
            process.argv = originalArgv
            consoleSpy.mockRestore()
        })

        it('should handle auto-refresh for PowerShell', () => {
            // Arrange
            const config: AliasConfig = {
                'nxPackages': {
                    'pbc': { name: 'project-butler', suffix: 'core' }
                }
            }
            
            mockLoadAliasConfig.mockReturnValue(config)
            mockDetectShell.mockReturnValue('powershell')
            mockFs.existsSync.mockReturnValue(false)
            mockFs.mkdirSync.mockImplementation(() => {})
            mockFs.writeFileSync.mockImplementation(() => {})
            mockFs.copyFileSync.mockImplementation(() => {})
            mockExecSync.mockImplementation(() => Buffer.from(''))

            const originalArgv = process.argv
            process.argv = ['node', 'cli.js', '--auto-refresh', '--verbose']
            const consoleSpy = vi.spyOn(console, 'log').mockImplementation(() => {})

            // Act
            service.installAliases()

            // Assert
            expect(mockExecSync).toHaveBeenCalledWith(
                expect.stringContaining('powershell -Command'),
                expect.objectContaining({
                    stdio: 'inherit',
                    cwd: process.cwd(),
                    timeout: 5000
                })
            )

            // Cleanup
            process.argv = originalArgv
            consoleSpy.mockRestore()
        })

        it('should handle auto-refresh for Git Bash', () => {
            // Arrange
            const config: AliasConfig = {
                'nxPackages': {
                    'pbc': { name: 'project-butler', suffix: 'core' }
                }
            }
            
            mockLoadAliasConfig.mockReturnValue(config)
            mockDetectShell.mockReturnValue('gitbash')
            mockFs.existsSync.mockReturnValue(false)
            mockFs.mkdirSync.mockImplementation(() => {})
            mockFs.writeFileSync.mockImplementation(() => {})
            mockExecSync.mockImplementation(() => Buffer.from(''))

            const originalArgv = process.argv
            process.argv = ['node', 'cli.js', '--auto-refresh', '--verbose']
            const consoleSpy = vi.spyOn(console, 'log').mockImplementation(() => {})

            // Act
            service.installAliases()

            // Assert
            expect(mockExecSync).toHaveBeenCalledWith(
                expect.stringContaining('bash -c'),
                expect.objectContaining({
                    stdio: 'inherit',
                    cwd: process.cwd(),
                    timeout: 5000
                })
            )

            // Cleanup
            process.argv = originalArgv
            consoleSpy.mockRestore()
        })

        it('should handle auto-refresh failure', () => {
            // Arrange
            const config: AliasConfig = {
                'nxPackages': {
                    'pbc': { name: 'project-butler', suffix: 'core' }
                }
            }
            
            mockLoadAliasConfig.mockReturnValue(config)
            mockDetectShell.mockReturnValue('powershell')
            mockFs.existsSync.mockReturnValue(false)
            mockFs.mkdirSync.mockImplementation(() => {})
            mockFs.writeFileSync.mockImplementation(() => {})
            mockFs.copyFileSync.mockImplementation(() => {})
            mockExecSync.mockImplementation(() => {
                throw new Error('Command failed')
            })

            const originalArgv = process.argv
            process.argv = ['node', 'cli.js', '--auto-refresh', '--verbose']
            const consoleSpy = vi.spyOn(console, 'log').mockImplementation(() => {})

            // Act
            service.installAliases()

            // Assert
            expect(consoleSpy).toHaveBeenCalledWith(
                expect.stringContaining('⚠️  Auto-refresh failed. Manual refresh required.')
            )

            // Cleanup
            process.argv = originalArgv
            consoleSpy.mockRestore()
        })

        it('should handle config loading error', () => {
            // Arrange
            mockLoadAliasConfig.mockImplementation(() => {
                throw new Error('Config not found')
            })
            mockDetectShell.mockReturnValue('powershell')
            mockFs.existsSync.mockReturnValue(false)
            mockFs.mkdirSync.mockImplementation(() => {})
            mockFs.writeFileSync.mockImplementation(() => {})

            const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {})

            // Act
            service.installAliases()

            // Assert
            expect(consoleSpy).toHaveBeenCalledWith(
                'Warning: Could not load config file. Install-aliases will create empty aliases.'
            )

            // Cleanup
            consoleSpy.mockRestore()
        })
    })

    describe('refreshAliases', () => {
        it('should regenerate aliases and show manual reload instructions', () => {
            // Arrange
            const config: AliasConfig = {
                'nxPackages': {
                    'pbc': { name: 'project-butler', suffix: 'core' }
                }
            }
            
            mockLoadAliasConfig.mockReturnValue(config)
            mockDetectShell.mockReturnValue('powershell')
            mockFs.existsSync.mockReturnValue(false)
            mockFs.mkdirSync.mockImplementation(() => {})
            mockFs.writeFileSync.mockImplementation(() => {})
            mockFs.copyFileSync.mockImplementation(() => {})

            const originalArgv = process.argv
            process.argv = ['node', 'cli.js', '--verbose']
            const consoleSpy = vi.spyOn(console, 'log').mockImplementation(() => {})

            // Act
            service.refreshAliases()

            // Assert
            expect(consoleSpy).toHaveBeenCalledWith(
                expect.stringContaining('⚠️  PowerShell refresh requires manual reload:')
            )
            expect(consoleSpy).toHaveBeenCalledWith(
                expect.stringContaining('Import-Module libs/project-alias-expander/dist/pae-functions.psm1 -Force')
            )

            // Cleanup
            process.argv = originalArgv
            consoleSpy.mockRestore()
        })

        it('should show Git Bash instructions', () => {
            // Arrange
            const config: AliasConfig = {
                'nxPackages': {
                    'pbc': { name: 'project-butler', suffix: 'core' }
                }
            }
            
            mockLoadAliasConfig.mockReturnValue(config)
            mockDetectShell.mockReturnValue('gitbash')
            mockFs.existsSync.mockReturnValue(false)
            mockFs.mkdirSync.mockImplementation(() => {})
            mockFs.writeFileSync.mockImplementation(() => {})

            const originalArgv = process.argv
            process.argv = ['node', 'cli.js', '--verbose']
            const consoleSpy = vi.spyOn(console, 'log').mockImplementation(() => {})

            // Act
            service.refreshAliases()

            // Assert
            expect(consoleSpy).toHaveBeenCalledWith(
                expect.stringContaining('⚠️  Git Bash refresh requires manual reload:')
            )
            expect(consoleSpy).toHaveBeenCalledWith(
                expect.stringContaining('source libs/project-alias-expander/dist/pae-aliases.sh')
            )

            // Cleanup
            process.argv = originalArgv
            consoleSpy.mockRestore()
        })

        it('should show instructions for unknown shell', () => {
            // Arrange
            const config: AliasConfig = {
                'nxPackages': {
                    'pbc': { name: 'project-butler', suffix: 'core' }
                }
            }
            
            mockLoadAliasConfig.mockReturnValue(config)
            mockDetectShell.mockReturnValue('unknown')
            mockFs.existsSync.mockReturnValue(false)
            mockFs.mkdirSync.mockImplementation(() => {})
            mockFs.writeFileSync.mockImplementation(() => {})

            const originalArgv = process.argv
            process.argv = ['node', 'cli.js', '--verbose']
            const consoleSpy = vi.spyOn(console, 'log').mockImplementation(() => {})

            // Act
            service.refreshAliases()

            // Assert
            expect(consoleSpy).toHaveBeenCalledWith(
                expect.stringContaining('⚠️  Unknown shell. Manual reload required:')
            )

            // Cleanup
            process.argv = originalArgv
            consoleSpy.mockRestore()
        })
    })

    describe('refreshAliasesDirect', () => {
        it('should execute PowerShell refresh directly', () => {
            // Arrange
            mockDetectShell.mockReturnValue('powershell')
            mockExecSync.mockImplementation(() => Buffer.from(''))

            const consoleSpy = vi.spyOn(console, 'log').mockImplementation(() => {})

            // Act
            service.refreshAliasesDirect()

            // Assert
            expect(mockExecSync).toHaveBeenCalledWith(
                expect.stringContaining('powershell -Command'),
                expect.objectContaining({
                    stdio: 'inherit',
                    cwd: process.cwd(),
                    timeout: 5000
                })
            )

            // Cleanup
            consoleSpy.mockRestore()
        })

        it('should execute Git Bash refresh directly', () => {
            // Arrange
            mockDetectShell.mockReturnValue('gitbash')
            mockExecSync.mockImplementation(() => Buffer.from(''))

            const consoleSpy = vi.spyOn(console, 'log').mockImplementation(() => {})

            // Act
            service.refreshAliasesDirect()

            // Assert
            expect(mockExecSync).toHaveBeenCalledWith(
                'pae-refresh',
                expect.objectContaining({
                    stdio: 'inherit',
                    cwd: process.cwd(),
                    timeout: 5000
                })
            )

            // Cleanup
            consoleSpy.mockRestore()
        })

        it('should handle unknown shell', () => {
            // Arrange
            mockDetectShell.mockReturnValue('unknown')
            const consoleSpy = vi.spyOn(console, 'log').mockImplementation(() => {})

            // Act
            service.refreshAliasesDirect()

            // Assert
            expect(consoleSpy).toHaveBeenCalledWith(
                expect.stringContaining('⚠️  Unknown shell. Manual refresh required.')
            )

            // Cleanup
            consoleSpy.mockRestore()
        })

        it('should handle refresh failure', () => {
            // Arrange
            mockDetectShell.mockReturnValue('powershell')
            mockExecSync.mockImplementation(() => {
                throw new Error('Command failed')
            })

            const consoleSpy = vi.spyOn(console, 'log').mockImplementation(() => {})

            // Act
            service.refreshAliasesDirect()

            // Assert
            expect(consoleSpy).toHaveBeenCalledWith(
                expect.stringContaining('❌ Refresh failed. Manual refresh required.')
            )

            // Cleanup
            consoleSpy.mockRestore()
        })
    })
})
