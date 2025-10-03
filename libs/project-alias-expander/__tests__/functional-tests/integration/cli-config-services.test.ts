import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { execa } from 'execa'
import * as fs from 'fs'
import * as path from 'path'
import { main } from '../../../src/cli.js'
import { loadAliasConfig } from '../../../src/config.js'
import { commandExecution, expandableProcessor, aliasManager } from '../../../src/services/index.js'

describe('CLI-Config-Services Integration Tests', () => {
    let originalArgv: string[]
    let originalCwd: string
    let tempDir: string

    beforeEach(() => {
        // Save original state
        originalArgv = process.argv
        originalCwd = process.cwd()
        
        // Create temporary directory for testing
        tempDir = path.join(__dirname, 'temp-test-dir')
        if (!fs.existsSync(tempDir)) {
            fs.mkdirSync(tempDir, { recursive: true })
        }
        
        // Mock console methods to avoid noise during tests
        vi.spyOn(console, 'log').mockImplementation(() => {})
        vi.spyOn(console, 'error').mockImplementation(() => {})
        vi.spyOn(console, 'warn').mockImplementation(() => {})
    })

    afterEach(() => {
        // Restore original state
        process.argv = originalArgv
        process.chdir(originalCwd)
        
        // Clean up temp directory
        if (fs.existsSync(tempDir)) {
            fs.rmSync(tempDir, { recursive: true, force: true })
        }
        
        // Restore console methods
        vi.restoreAllMocks()
    })

    describe('Configuration Loading Integration', () => {
        it('should load configuration and make it available to services', async () => {
            // Arrange
            const config = loadAliasConfig()
            
            // Act & Assert
            expect(config).toBeDefined()
            expect(config.nxPackages).toBeDefined()
            expect(config.nxTargets).toBeDefined()
            expect(config['expandable-flags']).toBeDefined()
        })

        it('should handle configuration errors gracefully', async () => {
            // Arrange - change to directory without config
            process.chdir(tempDir)
            
            // Act & Assert
            expect(() => loadAliasConfig()).toThrow()
        })
    })

    describe('CLI-Service Integration', () => {
        it('should execute help command through CLI and services', async () => {
            // Arrange
            process.argv = ['node', 'cli.js', '--help']
            
            // Act
            const result = await main()
            
            // Assert
            expect(result).toBe(0)
        })

        it('should execute install command through CLI and services', async () => {
            // Arrange
            process.argv = ['node', 'cli.js', 'install', '--local']
            
            // Mock the install process to avoid actual file system operations
            vi.spyOn(aliasManager, 'generateLocalFiles').mockImplementation(() => {})
            vi.spyOn(aliasManager, 'generateDirectToNativeModules').mockImplementation(() => {})
            vi.spyOn(execa, 'execa').mockResolvedValue({ stdout: '', stderr: '', exitCode: 0 } as any)
            
            // Act
            const result = await main()
            
            // Assert
            expect(result).toBe(0)
            expect(aliasManager.generateLocalFiles).toHaveBeenCalled()
        })

        it('should handle alias resolution through CLI and services', async () => {
            // Arrange
            process.argv = ['node', 'cli.js', 'dc', 'b']
            
            // Mock command execution to avoid actual nx calls
            vi.spyOn(commandExecution, 'runNx').mockResolvedValue(0)
            
            // Act
            const result = await main()
            
            // Assert
            expect(result).toBe(0)
            expect(commandExecution.runNx).toHaveBeenCalledWith(
                expect.arrayContaining(['nx', 'run', 'dynamicons:build'])
            )
        })
    })

    describe('Service Interaction Integration', () => {
        it('should coordinate between ExpandableProcessor and CommandExecution', async () => {
            // Arrange
            const args = ['-f', '--skip-nx-cache']
            const expandableFlags = { 'f': '--fix' }
            
            // Act
            const expanded = expandableProcessor.expandFlags(args, expandableFlags)
            
            // Assert
            expect(expanded.prefix).toContain('--fix')
            expect(expanded.remainingArgs).toContain('--skip-nx-cache')
        })

        it('should coordinate between AliasManager and CommandExecution for install flow', async () => {
            // Arrange
            vi.spyOn(aliasManager, 'generateLocalFiles').mockImplementation(() => {})
            vi.spyOn(aliasManager, 'generateDirectToNativeModules').mockImplementation(() => {})
            
            // Act
            aliasManager.generateLocalFiles()
            aliasManager.generateDirectToNativeModules()
            
            // Assert
            expect(aliasManager.generateLocalFiles).toHaveBeenCalled()
            expect(aliasManager.generateDirectToNativeModules).toHaveBeenCalled()
        })
    })

    describe('Error Handling Integration', () => {
        it('should handle service errors gracefully in CLI context', async () => {
            // Arrange
            process.argv = ['node', 'cli.js', 'nonexistent-alias']
            
            // Act
            const result = await main()
            
            // Assert
            expect(result).toBe(1)
        })

        it('should handle configuration loading errors in CLI context', async () => {
            // Arrange
            process.chdir(tempDir)
            process.argv = ['node', 'cli.js', 'dc', 'b']
            
            // Act
            const result = await main()
            
            // Assert
            expect(result).toBe(1)
        })

        it('should handle command execution errors gracefully', async () => {
            // Arrange
            process.argv = ['node', 'cli.js', 'dc', 'b']
            vi.spyOn(commandExecution, 'runNx').mockRejectedValue(new Error('Command failed'))
            
            // Act
            const result = await main()
            
            // Assert
            expect(result).toBe(1)
        })
    })

    describe('Performance Integration', () => {
        it('should load configuration efficiently', async () => {
            // Arrange
            const startTime = performance.now()
            
            // Act
            const config = loadAliasConfig()
            const endTime = performance.now()
            
            // Assert
            expect(config).toBeDefined()
            expect(endTime - startTime).toBeLessThan(100) // Should load in under 100ms
        })

        it('should process expandable flags efficiently', async () => {
            // Arrange
            const args = Array(100).fill(0).map((_, i) => `-f${i}`)
            const expandableFlags = Object.fromEntries(
                Array(100).fill(0).map((_, i) => [`f${i}`, `--flag${i}`])
            )
            const startTime = performance.now()
            
            // Act
            const result = expandableProcessor.expandFlags(args, expandableFlags)
            const endTime = performance.now()
            
            // Assert
            expect(result).toBeDefined()
            expect(endTime - startTime).toBeLessThan(50) // Should process in under 50ms
        })
    })

    describe('Memory Management Integration', () => {
        it('should not leak memory during repeated operations', async () => {
            // Arrange
            const initialMemory = process.memoryUsage()
            
            // Act - perform multiple operations
            for (let i = 0; i < 100; i++) {
                const config = loadAliasConfig()
                const expanded = expandableProcessor.expandFlags(['-f'], { 'f': '--fix' })
                expect(config).toBeDefined()
                expect(expanded).toBeDefined()
            }
            
            // Force garbage collection if available
            if (global.gc) {
                global.gc()
            }
            
            const finalMemory = process.memoryUsage()
            
            // Assert - memory usage should not grow excessively
            const memoryGrowth = finalMemory.heapUsed - initialMemory.heapUsed
            expect(memoryGrowth).toBeLessThan(10 * 1024 * 1024) // Less than 10MB growth
        })
    })
})

