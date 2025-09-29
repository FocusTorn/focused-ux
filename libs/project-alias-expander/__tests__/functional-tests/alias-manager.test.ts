import { describe, it, expect, beforeEach, vi } from 'vitest'
import { AliasManagerService } from '../../src/services/AliasManager.service.js'
import type { AliasConfig } from '../../src/_types/index.js'

// Import the actual modules - they will be mocked by the global mocks
import * as fs from 'fs'
import * as path from 'path'
import { execSync } from 'child_process'
import { loadAliasConfig } from '../../src/config.js'
import { detectShell } from '../../src/shell.js'

describe('AliasManagerService', () => {
    let service: AliasManagerService

    beforeEach(() => {
        // Create service instance
        service = new AliasManagerService()
        
        // Setup default mock behaviors
        vi.mocked(fs.existsSync).mockReturnValue(true)
        vi.mocked(fs.readFileSync).mockReturnValue('{"aliases": {}}')
        vi.mocked(fs.writeFileSync).mockImplementation(() => {})
        vi.mocked(fs.mkdirSync).mockImplementation(() => {})
        vi.mocked(fs.copyFileSync).mockImplementation(() => {})
        vi.mocked(fs.rmSync).mockImplementation(() => {})
        
        vi.mocked(execSync).mockReturnValue(Buffer.from('success'))
        
        vi.mocked(loadAliasConfig).mockReturnValue({
            aliases: {},
            nxPackages: {},
            nxTargets: {},
            notNxTargets: [],
            expandableFlags: {}
        })
        
        vi.mocked(detectShell).mockReturnValue('powershell')
        
        // Setup path mocks
        vi.mocked(path.join).mockImplementation((...args) => args.join('/'))
        
        // Mock process.cwd by overriding it
        Object.defineProperty(process, 'cwd', {
            value: vi.fn().mockReturnValue('/test/workspace'),
            writable: true
        })
        
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
            
            vi.mocked(loadAliasConfig).mockReturnValue(config)
            vi.mocked(detectShell).mockReturnValue('powershell')
            vi.mocked(fs).existsSync.mockReturnValue(false)
            vi.mocked(fs).mkdirSync.mockImplementation(() => {})
            vi.mocked(fs).writeFileSync.mockImplementation(() => {})

            // Act
            service.generateLocalFiles()

            // Assert
            expect(vi.mocked(fs).mkdirSync).toHaveBeenCalledWith(
                expect.stringContaining('libs/project-alias-expander/dist'),
                { recursive: true }
            )
            expect(vi.mocked(fs).writeFileSync).toHaveBeenCalledTimes(2)
            
            // Check PowerShell module content
            const psCall = vi.mocked(fs).writeFileSync.mock.calls.find(call =>
                call[0].toString().includes('pae-functions.psm1')
            )
            expect(psCall).toBeDefined()
            const psContent = psCall![1] as string
            expect(psContent).toContain('function Invoke-pbc')
            expect(psContent).toContain('function Invoke-pbe')
            expect(psContent).toContain('Set-Alias -Name pbc -Value Invoke-pbc')
            expect(psContent).toContain('Set-Alias -Name pbe -Value Invoke-pbe')
            
            // Check Bash script content
            const bashCall = vi.mocked(fs).writeFileSync.mock.calls.find(call =>
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
            
            vi.mocked(loadAliasConfig).mockReturnValue(config)
            vi.mocked(detectShell).mockReturnValue('powershell')
            vi.mocked(fs).existsSync.mockReturnValue(false)
            vi.mocked(fs).mkdirSync.mockImplementation(() => {})
            vi.mocked(fs).writeFileSync.mockImplementation(() => {})

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
            vi.mocked(loadAliasConfig).mockImplementation(() => {
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
            
            vi.mocked(loadAliasConfig).mockReturnValue(config)
            vi.mocked(detectShell).mockReturnValue('powershell')
            vi.mocked(fs).existsSync.mockReturnValue(false)
            vi.mocked(fs).mkdirSync.mockImplementation(() => {})
            vi.mocked(fs).writeFileSync.mockImplementation(() => {})
            vi.mocked(fs).copyFileSync.mockImplementation(() => {})

            const originalArgv = process.argv
            process.argv = ['node', 'cli.js', '--verbose']
            const consoleSpy = vi.spyOn(console, 'log').mockImplementation(() => {})

            // Act
            service.installAliases()

            // Assert
            expect(vi.mocked(fs).writeFileSync).toHaveBeenCalledTimes(2)
            expect(vi.mocked(fs).copyFileSync).toHaveBeenCalledWith(
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
            
            vi.mocked(loadAliasConfig).mockReturnValue(config)
            vi.mocked(detectShell).mockReturnValue('powershell')
            vi.mocked(fs).existsSync.mockReturnValue(false)
            vi.mocked(fs).mkdirSync.mockImplementation(() => {})
            vi.mocked(fs).writeFileSync.mockImplementation(() => {})
            vi.mocked(fs).copyFileSync.mockImplementation(() => {
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
            
            vi.mocked(loadAliasConfig).mockReturnValue(config)
            vi.mocked(detectShell).mockReturnValue('powershell')
            vi.mocked(fs).existsSync.mockReturnValue(false)
            vi.mocked(fs).mkdirSync.mockImplementation(() => {})
            vi.mocked(fs).writeFileSync.mockImplementation(() => {})
            vi.mocked(fs).copyFileSync.mockImplementation(() => {})
            vi.mocked(execSync).mockImplementation(() => Buffer.from(''))

            const originalArgv = process.argv
            process.argv = ['node', 'cli.js', '--auto-refresh', '--verbose']
            const consoleSpy = vi.spyOn(console, 'log').mockImplementation(() => {})

            // Act
            service.installAliases()

            // Assert
            expect(vi.mocked(execSync)).toHaveBeenCalledWith(
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
            
            vi.mocked(loadAliasConfig).mockReturnValue(config)
            vi.mocked(detectShell).mockReturnValue('gitbash')
            vi.mocked(fs).existsSync.mockReturnValue(false)
            vi.mocked(fs).mkdirSync.mockImplementation(() => {})
            vi.mocked(fs).writeFileSync.mockImplementation(() => {})
            vi.mocked(execSync).mockImplementation(() => Buffer.from(''))

            const originalArgv = process.argv
            process.argv = ['node', 'cli.js', '--auto-refresh', '--verbose']
            const consoleSpy = vi.spyOn(console, 'log').mockImplementation(() => {})

            // Act
            service.installAliases()

            // Assert
            expect(vi.mocked(execSync)).toHaveBeenCalledWith(
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
            
            vi.mocked(loadAliasConfig).mockReturnValue(config)
            vi.mocked(detectShell).mockReturnValue('powershell')
            vi.mocked(fs).existsSync.mockReturnValue(false)
            vi.mocked(fs).mkdirSync.mockImplementation(() => {})
            vi.mocked(fs).writeFileSync.mockImplementation(() => {})
            vi.mocked(fs).copyFileSync.mockImplementation(() => {})
            vi.mocked(execSync).mockImplementation(() => {
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
            vi.mocked(loadAliasConfig).mockImplementation(() => {
                throw new Error('Config not found')
            })
            vi.mocked(detectShell).mockReturnValue('powershell')
            vi.mocked(fs).existsSync.mockReturnValue(false)
            vi.mocked(fs).mkdirSync.mockImplementation(() => {})
            vi.mocked(fs).writeFileSync.mockImplementation(() => {})

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
            
            vi.mocked(loadAliasConfig).mockReturnValue(config)
            vi.mocked(detectShell).mockReturnValue('powershell')
            vi.mocked(fs).existsSync.mockReturnValue(false)
            vi.mocked(fs).mkdirSync.mockImplementation(() => {})
            vi.mocked(fs).writeFileSync.mockImplementation(() => {})
            vi.mocked(fs).copyFileSync.mockImplementation(() => {})

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
            
            vi.mocked(loadAliasConfig).mockReturnValue(config)
            vi.mocked(detectShell).mockReturnValue('gitbash')
            vi.mocked(fs).existsSync.mockReturnValue(false)
            vi.mocked(fs).mkdirSync.mockImplementation(() => {})
            vi.mocked(fs).writeFileSync.mockImplementation(() => {})

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
            
            vi.mocked(loadAliasConfig).mockReturnValue(config)
            vi.mocked(detectShell).mockReturnValue('unknown')
            vi.mocked(fs).existsSync.mockReturnValue(false)
            vi.mocked(fs).mkdirSync.mockImplementation(() => {})
            vi.mocked(fs).writeFileSync.mockImplementation(() => {})

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
            vi.mocked(detectShell).mockReturnValue('powershell')
            vi.mocked(execSync).mockImplementation(() => Buffer.from(''))

            const consoleSpy = vi.spyOn(console, 'log').mockImplementation(() => {})

            // Act
            service.refreshAliasesDirect()

            // Assert
            expect(vi.mocked(execSync)).toHaveBeenCalledWith(
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
            vi.mocked(detectShell).mockReturnValue('gitbash')
            vi.mocked(execSync).mockImplementation(() => Buffer.from(''))

            const consoleSpy = vi.spyOn(console, 'log').mockImplementation(() => {})

            // Act
            service.refreshAliasesDirect()

            // Assert
            expect(vi.mocked(execSync)).toHaveBeenCalledWith(
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
            vi.mocked(detectShell).mockReturnValue('unknown')
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
            vi.mocked(detectShell).mockReturnValue('powershell')
            vi.mocked(execSync).mockImplementation(() => {
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
