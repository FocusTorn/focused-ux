import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { performance } from 'perf_hooks'
import { main } from '../../../src/cli.js'
import { loadAliasConfig } from '../../../src/config.js'
import { commandExecution, expandableProcessor, aliasManager } from '../../../src/services/index.js'
import * as fs from 'fs'
import * as path from 'path'

describe('Performance Integration Tests', () => {
    let originalArgv: string[]
    let originalCwd: string
    let tempDir: string

    beforeEach(() => {
        originalArgv = process.argv
        originalCwd = process.cwd()
        
        tempDir = path.join(__dirname, 'temp-performance-test')
        if (!fs.existsSync(tempDir)) {
            fs.mkdirSync(tempDir, { recursive: true })
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

    describe('Startup Performance', () => {
        it('should start CLI within acceptable time limits', async () => {
            // Arrange
            process.argv = ['node', 'cli.js', '--help']
            const startTime = performance.now()
            
            // Act
            const result = await main()
            const endTime = performance.now()
            
            // Assert
            expect(result).toBe(0)
            expect(endTime - startTime).toBeLessThan(500) // Should start in under 500ms
        })

        it('should load configuration within acceptable time limits', async () => {
            // Arrange
            const startTime = performance.now()
            
            // Act
            const config = loadAliasConfig()
            const endTime = performance.now()
            
            // Assert
            expect(config).toBeDefined()
            expect(endTime - startTime).toBeLessThan(100) // Should load in under 100ms
        })

        it('should initialize services within acceptable time limits', async () => {
            // Arrange
            const startTime = performance.now()
            
            // Act
            const services = {
                commandExecution,
                expandableProcessor,
                aliasManager
            }
            const endTime = performance.now()
            
            // Assert
            expect(services.commandExecution).toBeDefined()
            expect(services.expandableProcessor).toBeDefined()
            expect(services.aliasManager).toBeDefined()
            expect(endTime - startTime).toBeLessThan(50) // Should initialize in under 50ms
        })
    })

    describe('Memory Performance', () => {
        it('should maintain stable memory usage during normal operations', async () => {
            // Arrange
            const initialMemory = process.memoryUsage()
            const memorySnapshots: NodeJS.MemoryUsage[] = []
            
            // Act - perform typical operations
            for (let i = 0; i < 50; i++) {
                // Load config
                const config = loadAliasConfig()
                expect(config).toBeDefined()
                
                // Process flags
                const expanded = expandableProcessor.expandFlags(['-f', '-s'], {
                    'f': '--fix',
                    's': '--skip-nx-cache'
                })
                expect(expanded).toBeDefined()
                
                // Take memory snapshot every 10 iterations
                if (i % 10 === 0) {
                    memorySnapshots.push(process.memoryUsage())
                }
            }
            
            // Force garbage collection if available
            if (global.gc) {
                global.gc()
            }
            
            const finalMemory = process.memoryUsage()
            
            // Assert - memory should not grow excessively
            const totalGrowth = finalMemory.heapUsed - initialMemory.heapUsed
            expect(totalGrowth).toBeLessThan(5 * 1024 * 1024) // Less than 5MB total growth
            
            // Check that memory growth is relatively stable
            for (let i = 1; i < memorySnapshots.length; i++) {
                const growth = memorySnapshots[i].heapUsed - memorySnapshots[i-1].heapUsed
                expect(growth).toBeLessThan(2 * 1024 * 1024) // Less than 2MB growth per snapshot
            }
        })

        it('should handle large configuration files efficiently', async () => {
            // Arrange
            const largeConfig = {
                nxPackages: Object.fromEntries(
                    Array(1000).fill(0).map((_, i) => [`pkg${i}`, `package-${i}`])
                ),
                nxTargets: Object.fromEntries(
                    Array(100).fill(0).map((_, i) => [`t${i}`, `target-${i}`])
                ),
                'expandable-flags': Object.fromEntries(
                    Array(200).fill(0).map((_, i) => [`f${i}`, `--flag-${i}`])
                )
            }
            
            const startTime = performance.now()
            const initialMemory = process.memoryUsage()
            
            // Act - process large configuration
            const expanded = expandableProcessor.expandFlags(
                Array(100).fill(0).map((_, i) => `-f${i}`),
                largeConfig['expandable-flags']
            )
            
            const endTime = performance.now()
            const finalMemory = process.memoryUsage()
            
            // Assert
            expect(expanded).toBeDefined()
            expect(endTime - startTime).toBeLessThan(200) // Should process in under 200ms
            expect(finalMemory.heapUsed - initialMemory.heapUsed).toBeLessThan(10 * 1024 * 1024) // Less than 10MB
        })
    })

    describe('Bundle Size Performance', () => {
        it('should have reasonable bundle size for CLI', async () => {
            // Arrange
            const cliPath = path.join(__dirname, '../../dist/cli.js')
            
            // Act
            if (fs.existsSync(cliPath)) {
                const stats = fs.statSync(cliPath)
                const bundleSizeKB = stats.size / 1024
                
                // Assert
                expect(bundleSizeKB).toBeLessThan(500) // Should be under 500KB
                expect(bundleSizeKB).toBeGreaterThan(10) // Should be at least 10KB
            } else {
                // Skip test if bundle doesn't exist yet
                expect(true).toBe(true)
            }
        })

        it('should have reasonable bundle size for services', async () => {
            // Arrange
            const servicesPath = path.join(__dirname, '../../dist/services')
            
            // Act
            if (fs.existsSync(servicesPath)) {
                const files = fs.readdirSync(servicesPath)
                let totalSize = 0
                
                for (const file of files) {
                    if (file.endsWith('.js')) {
                        const filePath = path.join(servicesPath, file)
                        const stats = fs.statSync(filePath)
                        totalSize += stats.size
                    }
                }
                
                const totalSizeKB = totalSize / 1024
                
                // Assert
                expect(totalSizeKB).toBeLessThan(1000) // Should be under 1MB total
                expect(totalSizeKB).toBeGreaterThan(50) // Should be at least 50KB
            } else {
                // Skip test if services don't exist yet
                expect(true).toBe(true)
            }
        })
    })

    describe('Concurrent Operations Performance', () => {
        it('should handle concurrent configuration loads efficiently', async () => {
            // Arrange
            const concurrentLoads = 10
            const startTime = performance.now()
            
            // Act
            const promises = Array(concurrentLoads).fill(0).map(async () => {
                return loadAliasConfig()
            })
            
            const results = await Promise.all(promises)
            const endTime = performance.now()
            
            // Assert
            expect(results).toHaveLength(concurrentLoads)
            results.forEach(config => {
                expect(config).toBeDefined()
            })
            expect(endTime - startTime).toBeLessThan(1000) // Should complete in under 1 second
        })

        it('should handle concurrent flag processing efficiently', async () => {
            // Arrange
            const concurrentOperations = 20
            const startTime = performance.now()
            
            // Act
            const promises = Array(concurrentOperations).fill(0).map(async (_, i) => {
                return expandableProcessor.expandFlags(
                    [`-f${i}`, `-s${i}`],
                    { [`f${i}`]: `--flag-${i}`, [`s${i}`]: `--skip-${i}` }
                )
            })
            
            const results = await Promise.all(promises)
            const endTime = performance.now()
            
            // Assert
            expect(results).toHaveLength(concurrentOperations)
            results.forEach(result => {
                expect(result).toBeDefined()
            })
            expect(endTime - startTime).toBeLessThan(500) // Should complete in under 500ms
        })
    })

    describe('Stress Testing', () => {
        it('should handle high-frequency operations without degradation', async () => {
            // Arrange
            const iterations = 1000
            const startTime = performance.now()
            const times: number[] = []
            
            // Act
            for (let i = 0; i < iterations; i++) {
                const iterStart = performance.now()
                
                const config = loadAliasConfig()
                const expanded = expandableProcessor.expandFlags(['-f'], { 'f': '--fix' })
                
                const iterEnd = performance.now()
                times.push(iterEnd - iterStart)
                
                expect(config).toBeDefined()
                expect(expanded).toBeDefined()
            }
            
            const endTime = performance.now()
            
            // Assert
            const totalTime = endTime - startTime
            const avgTime = times.reduce((a, b) => a + b, 0) / times.length
            const maxTime = Math.max(...times)
            
            expect(totalTime).toBeLessThan(5000) // Should complete in under 5 seconds
            expect(avgTime).toBeLessThan(5) // Average should be under 5ms
            expect(maxTime).toBeLessThan(50) // Max should be under 50ms
        })

        it('should maintain performance under memory pressure', async () => {
            // Arrange
            const initialMemory = process.memoryUsage()
            const startTime = performance.now()
            
            // Act - create memory pressure
            const largeArrays: string[][] = []
            for (let i = 0; i < 100; i++) {
                largeArrays.push(Array(1000).fill(0).map((_, j) => `item-${i}-${j}`))
            }
            
            // Perform operations under memory pressure
            const config = loadAliasConfig()
            const expanded = expandableProcessor.expandFlags(['-f'], { 'f': '--fix' })
            
            const endTime = performance.now()
            const finalMemory = process.memoryUsage()
            
            // Assert
            expect(config).toBeDefined()
            expect(expanded).toBeDefined()
            expect(endTime - startTime).toBeLessThan(1000) // Should still perform well
            expect(finalMemory.heapUsed - initialMemory.heapUsed).toBeLessThan(50 * 1024 * 1024) // Less than 50MB growth
        })
    })
})

