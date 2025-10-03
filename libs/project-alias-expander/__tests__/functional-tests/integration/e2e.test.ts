import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
// Mock execa before importing
vi.mock('execa', () => ({
    execa: vi.fn()
}))
import { execa } from 'execa'
import * as fs from 'fs'
import * as path from 'path'
import { main } from '../../../src/cli.js'
import { loadAliasConfig } from '../../../src/config.js'
import { commandExecution, expandableProcessor, aliasManager } from '../../../src/services/index.js'

describe('E2E Integration Tests', () => {
    let originalArgv: string[]
    let originalCwd: string
    let tempDir: string
    let testWorkspaceDir: string

    beforeEach(() => {
        originalArgv = process.argv
        originalCwd = process.cwd()
        
        tempDir = path.join(__dirname, 'temp-e2e-test')
        testWorkspaceDir = path.join(tempDir, 'test-workspace')
        
        if (!fs.existsSync(tempDir)) {
            fs.mkdirSync(tempDir, { recursive: true })
        }
        if (!fs.existsSync(testWorkspaceDir)) {
            fs.mkdirSync(testWorkspaceDir, { recursive: true })
        }
        
        // Mock console to avoid noise
        vi.spyOn(console, 'log').mockImplementation(() => {})
        vi.spyOn(console, 'error').mockImplementation(() => {})
        vi.spyOn(console, 'warn').mockImplementation(() => {})
    })

    afterEach(() => {
        process.argv = originalArgv
        process.chdir(originalCwd)
        
        if (fs.existsSync(tempDir)) {
            fs.rmSync(tempDir, { recursive: true, force: true })
        }
        
        vi.restoreAllMocks()
    })

    describe('Install Flow E2E', () => {
        it('should complete full install flow successfully', async () => {
            // Arrange
            process.argv = ['node', 'cli.js', 'install', '--local']
            
            // Mock file system operations
            vi.spyOn(aliasManager, 'generateLocalFiles').mockImplementation(() => {})
            vi.spyOn(aliasManager, 'generateDirectToNativeModules').mockImplementation(() => {})
            vi.spyOn(fs, 'existsSync').mockReturnValue(true)
            vi.spyOn(fs, 'readFileSync').mockReturnValue('# PowerShell Profile\n')
            vi.spyOn(fs, 'writeFileSync').mockImplementation(() => {})
            vi.spyOn(fs, 'appendFileSync').mockImplementation(() => {})
            vi.mocked(execa).mockResolvedValue({ 
                stdout: 'C:\\Users\\Test\\Documents\\PowerShell\\profile.ps1', 
                stderr: '', 
                exitCode: 0 
            } as any)
            
            // Act
            const result = await main()
            
            // Assert
            expect(result).toBe(0)
            expect(aliasManager.generateLocalFiles).toHaveBeenCalled()
            expect(aliasManager.generateDirectToNativeModules).toHaveBeenCalled()
        })

        it('should handle install flow errors gracefully', async () => {
            // Arrange
            process.argv = ['node', 'cli.js', 'install', '--local']
            
            // Mock file system errors
            vi.spyOn(aliasManager, 'generateLocalFiles').mockImplementation(() => {
                throw new Error('File generation failed')
            })
            
            // Act
            const result = await main()
            
            // Assert
            expect(result).toBe(1)
        })

        it('should handle PowerShell profile operations correctly', async () => {
            // Arrange
            const profilePath = path.join(testWorkspaceDir, 'profile.ps1')
            const profileContent = '# PowerShell Profile\n'
            
            vi.spyOn(fs, 'existsSync').mockImplementation((filePath) => {
                return filePath === profilePath
            })
            vi.spyOn(fs, 'readFileSync').mockImplementation((filePath) => {
                if (filePath === profilePath) {
                    return profileContent
                }
                return ''
            })
            vi.spyOn(fs, 'writeFileSync').mockImplementation(() => {})
            vi.spyOn(fs, 'appendFileSync').mockImplementation(() => {})
            vi.mocked(execa).mockResolvedValue({ 
                stdout: profilePath, 
                stderr: '', 
                exitCode: 0 
            } as any)
            
            // Act
            process.argv = ['node', 'cli.js', 'install', '--local']
            const result = await main()
            
            // Assert
            expect(result).toBe(0)
            expect(fs.existsSync).toHaveBeenCalledWith(profilePath)
            expect(fs.readFileSync).toHaveBeenCalledWith(profilePath, 'utf8')
        })
    })

    describe('Alias Execution E2E', () => {
        it('should execute package alias with target expansion', async () => {
            // Arrange
            process.argv = ['node', 'cli.js', 'dc', 'b']
            
            // Mock command execution
            vi.spyOn(commandExecution, 'runNx').mockResolvedValue(0)
            
            // Act
            const result = await main()
            
            // Assert
            expect(result).toBe(0)
            expect(commandExecution.runNx).toHaveBeenCalledWith(
                expect.arrayContaining(['nx', 'run', 'dynamicons:build']),
                undefined
            )
        })

        it('should execute feature alias with proper target resolution', async () => {
            // Arrange
            process.argv = ['node', 'cli.js', 'pbc', 'b']
            
            // Mock command execution
            vi.spyOn(commandExecution, 'runNx').mockResolvedValue(0)
            
            // Act
            const result = await main()
            
            // Assert
            expect(result).toBe(0)
            expect(commandExecution.runNx).toHaveBeenCalledWith(
                expect.arrayContaining(['nx', 'run', 'project-butler-core:build']),
                undefined
            )
        })

        it('should handle expandable flags in alias execution', async () => {
            // Arrange
            process.argv = ['node', 'cli.js', 'dc', 'b', '-f', '-s']
            
            // Mock command execution
            vi.spyOn(commandExecution, 'runNx').mockResolvedValue(0)
            
            // Act
            const result = await main()
            
            // Assert
            expect(result).toBe(0)
            expect(commandExecution.runNx).toHaveBeenCalledWith(
                expect.arrayContaining(['--fix', '--skip-nx-cache']),
                undefined
            )
        })

        it('should handle unknown aliases gracefully', async () => {
            // Arrange
            process.argv = ['node', 'cli.js', 'unknown-alias', 'b']
            
            // Act
            const result = await main()
            
            // Assert
            expect(result).toBe(1)
        })

        it('should handle command execution failures gracefully', async () => {
            // Arrange
            process.argv = ['node', 'cli.js', 'dc', 'b']
            vi.spyOn(commandExecution, 'runNx').mockRejectedValue(new Error('Command failed'))
            
            // Act
            const result = await main()
            
            // Assert
            expect(result).toBe(1)
        })
    })

    describe('Error Handling E2E', () => {
        it('should handle configuration loading errors', async () => {
            // Arrange
            process.chdir(testWorkspaceDir) // Change to directory without config
            process.argv = ['node', 'cli.js', 'dc', 'b']
            
            // Act
            const result = await main()
            
            // Assert
            expect(result).toBe(1)
        })

        it('should handle invalid command arguments', async () => {
            // Arrange
            process.argv = ['node', 'cli.js', 'dc', 'b', '--invalid-flag']
            
            // Mock command execution
            vi.spyOn(commandExecution, 'runNx').mockResolvedValue(0)
            
            // Act
            const result = await main()
            
            // Assert
            expect(result).toBe(0) // Should still execute, just pass through invalid flag
        })

        it('should handle process cleanup on exit', async () => {
            // Arrange
            process.argv = ['node', 'cli.js', 'dc', 'b']
            vi.spyOn(commandExecution, 'runNx').mockResolvedValue(0)
            
            // Mock process events
            const exitSpy = vi.spyOn(process, 'exit').mockImplementation(() => {
                throw new Error('Process exit called')
            })
            
            // Act
            const result = await main()
            
            // Assert
            expect(result).toBe(0)
            expect(exitSpy).not.toHaveBeenCalled()
        })

        it('should handle uncaught exceptions gracefully', async () => {
            // Arrange
            process.argv = ['node', 'cli.js', 'dc', 'b']
            
            // Mock uncaught exception
            vi.spyOn(commandExecution, 'runNx').mockImplementation(() => {
                throw new Error('Uncaught exception')
            })
            
            // Act
            const result = await main()
            
            // Assert
            expect(result).toBe(1)
        })
    })

    describe('Help System E2E', () => {
        it('should display help information correctly', async () => {
            // Arrange
            process.argv = ['node', 'cli.js', '--help']
            
            // Act
            const result = await main()
            
            // Assert
            expect(result).toBe(0)
        })

        it('should display help for deprecated help command', async () => {
            // Arrange
            process.argv = ['node', 'cli.js', 'help']
            
            // Act
            const result = await main()
            
            // Assert
            expect(result).toBe(0)
        })

        it('should display help when no arguments provided', async () => {
            // Arrange
            process.argv = ['node', 'cli.js']
            
            // Act
            const result = await main()
            
            // Assert
            expect(result).toBe(0)
        })
    })

    describe('Load Command E2E', () => {
        it('should execute load command successfully', async () => {
            // Arrange
            process.argv = ['node', 'cli.js', 'load']
            
            // Mock PowerShell operations
            vi.mocked(execa).mockResolvedValue({ 
                stdout: 'C:\\Users\\Test\\Documents\\PowerShell\\profile.ps1', 
                stderr: '', 
                exitCode: 0 
            } as any)
            
            // Act
            const result = await main()
            
            // Assert
            expect(result).toBe(0)
        })

        it('should handle load command errors gracefully', async () => {
            // Arrange
            process.argv = ['node', 'cli.js', 'load']
            
            // Mock PowerShell errors
            vi.mocked(execa).mockRejectedValue(new Error('PowerShell not found'))
            
            // Act
            const result = await main()
            
            // Assert
            expect(result).toBe(0) // Load command should not fail the process
        })
    })

    describe('Expandable Commands E2E', () => {
        it('should execute expandable commands correctly', async () => {
            // Arrange
            process.argv = ['node', 'cli.js', 'test-all']
            
            // Mock command execution
            vi.spyOn(commandExecution, 'runNx').mockResolvedValue(0)
            
            // Act
            const result = await main()
            
            // Assert
            expect(result).toBe(0)
        })

        it('should handle expandable command recursion', async () => {
            // Arrange
            process.argv = ['node', 'cli.js', 'recursive-command']
            
            // Mock command execution
            vi.spyOn(commandExecution, 'runNx').mockResolvedValue(0)
            
            // Act
            const result = await main()
            
            // Assert
            expect(result).toBe(0)
        })
    })

    describe('Environment Variables E2E', () => {
        it('should handle PAE_DEBUG environment variable', async () => {
            // Arrange
            process.env.PAE_DEBUG = '1'
            process.argv = ['node', 'cli.js', 'dc', 'b']
            
            // Mock command execution
            vi.spyOn(commandExecution, 'runNx').mockResolvedValue(0)
            
            // Act
            const result = await main()
            
            // Assert
            expect(result).toBe(0)
            
            // Cleanup
            delete process.env.PAE_DEBUG
        })

        it('should handle PAE_ECHO environment variable', async () => {
            // Arrange
            process.env.PAE_ECHO = '1'
            process.argv = ['node', 'cli.js', 'dc', 'b']
            
            // Mock command execution
            vi.spyOn(commandExecution, 'runNx').mockResolvedValue(0)
            
            // Act
            const result = await main()
            
            // Assert
            expect(result).toBe(0)
            
            // Cleanup
            delete process.env.PAE_ECHO
        })
    })

    describe('Cache Management E2E', () => {
        it('should handle cache clearing flags', async () => {
            // Arrange
            process.argv = ['node', 'cli.js', '--clear-cache', 'dc', 'b']
            
            // Mock command execution
            vi.spyOn(commandExecution, 'runNx').mockResolvedValue(0)
            
            // Act
            const result = await main()
            
            // Assert
            expect(result).toBe(0)
        })

        it('should handle cache clearing with multiple flags', async () => {
            // Arrange
            process.argv = ['node', 'cli.js', '--clear-caches', 'dc', 'b']
            
            // Mock command execution
            vi.spyOn(commandExecution, 'runNx').mockResolvedValue(0)
            
            // Act
            const result = await main()
            
            // Assert
            expect(result).toBe(0)
        })
    })
})

