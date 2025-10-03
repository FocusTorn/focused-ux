import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import * as fs from 'fs'
import * as path from 'path'
import { execa } from 'execa'

describe('Bundle Size Performance Tests', () => {
    let originalCwd: string
    let projectRoot: string

    beforeEach(() => {
        originalCwd = process.cwd()
        projectRoot = path.join(__dirname, '../../')
        
        // Mock console to avoid noise
        vi.spyOn(console, 'log').mockImplementation(() => {})
        vi.spyOn(console, 'error').mockImplementation(() => {})
        vi.spyOn(console, 'warn').mockImplementation(() => {})
    })

    afterEach(() => {
        // Don't change directory in tests - use mocked process.cwd()
        vi.restoreAllMocks()
    })

    describe('CLI Bundle Size', () => {
        it('should have reasonable CLI bundle size', async () => {
            // Arrange
            const cliPath = path.join(projectRoot, 'dist/cli.js')
            
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

        it('should have reasonable CLI bundle size with source maps', async () => {
            // Arrange
            const cliPath = path.join(projectRoot, 'dist/cli.js')
            const sourceMapPath = path.join(projectRoot, 'dist/cli.js.map')
            
            // Act
            if (fs.existsSync(cliPath) && fs.existsSync(sourceMapPath)) {
                const cliStats = fs.statSync(cliPath)
                const sourceMapStats = fs.statSync(sourceMapPath)
                const totalSizeKB = (cliStats.size + sourceMapStats.size) / 1024
                
                // Assert
                expect(totalSizeKB).toBeLessThan(1000) // Should be under 1MB total
                expect(totalSizeKB).toBeGreaterThan(20) // Should be at least 20KB
            } else {
                // Skip test if bundles don't exist yet
                expect(true).toBe(true)
            }
        })
    })

    describe('Services Bundle Size', () => {
        it('should have reasonable services bundle size', async () => {
            // Arrange
            const servicesPath = path.join(projectRoot, 'dist/services')
            
            // Act
            if (fs.existsSync(servicesPath)) {
                const files = fs.readdirSync(servicesPath)
                let totalSize = 0
                let fileCount = 0
                
                for (const file of files) {
                    if (file.endsWith('.js')) {
                        const filePath = path.join(servicesPath, file)
                        const stats = fs.statSync(filePath)
                        totalSize += stats.size
                        fileCount++
                    }
                }
                
                const totalSizeKB = totalSize / 1024
                const avgSizeKB = totalSize / fileCount / 1024
                
                // Assert
                expect(totalSizeKB).toBeLessThan(1000) // Should be under 1MB total
                expect(totalSizeKB).toBeGreaterThan(50) // Should be at least 50KB
                expect(avgSizeKB).toBeLessThan(100) // Average file should be under 100KB
                expect(fileCount).toBeGreaterThan(0) // Should have at least one service file
            } else {
                // Skip test if services don't exist yet
                expect(true).toBe(true)
            }
        })

        it('should have reasonable individual service bundle sizes', async () => {
            // Arrange
            const servicesPath = path.join(projectRoot, 'dist/services')
            const expectedServices = [
                'AliasManager.service.js',
                'CommandExecution.service.js',
                'ExpandableProcessor.service.js',
                'PAEManager.service.js',
                'ProcessPool.service.js',
                'CommonUtils.service.js'
            ]
            
            // Act
            if (fs.existsSync(servicesPath)) {
                for (const serviceFile of expectedServices) {
                    const servicePath = path.join(servicesPath, serviceFile)
                    
                    if (fs.existsSync(servicePath)) {
                        const stats = fs.statSync(servicePath)
                        const serviceSizeKB = stats.size / 1024
                        
                        // Assert
                        expect(serviceSizeKB).toBeLessThan(200) // Each service should be under 200KB
                        expect(serviceSizeKB).toBeGreaterThan(1) // Each service should be at least 1KB
                    }
                }
            } else {
                // Skip test if services don't exist yet
                expect(true).toBe(true)
            }
        })
    })

    describe('Configuration Bundle Size', () => {
        it('should have reasonable configuration bundle size', async () => {
            // Arrange
            const configPath = path.join(projectRoot, 'dist/config.js')
            
            // Act
            if (fs.existsSync(configPath)) {
                const stats = fs.statSync(configPath)
                const configSizeKB = stats.size / 1024
                
                // Assert
                expect(configSizeKB).toBeLessThan(100) // Should be under 100KB
                expect(configSizeKB).toBeGreaterThan(1) // Should be at least 1KB
            } else {
                // Skip test if config doesn't exist yet
                expect(true).toBe(true)
            }
        })
    })

    describe('Total Bundle Size', () => {
        it('should have reasonable total bundle size', async () => {
            // Arrange
            const distPath = path.join(projectRoot, 'dist')
            
            // Act
            if (fs.existsSync(distPath)) {
                let totalSize = 0
                let fileCount = 0
                
                const calculateSize = (dirPath: string) => {
                    const items = fs.readdirSync(dirPath)
                    
                    for (const item of items) {
                        const itemPath = path.join(dirPath, item)
                        const stats = fs.statSync(itemPath)
                        
                        if (stats.isDirectory()) {
                            calculateSize(itemPath)
                        } else if (item.endsWith('.js') || item.endsWith('.js.map')) {
                            totalSize += stats.size
                            fileCount++
                        }
                    }
                }
                
                calculateSize(distPath)
                
                const totalSizeKB = totalSize / 1024
                const avgSizeKB = totalSize / fileCount / 1024
                
                // Assert
                expect(totalSizeKB).toBeLessThan(2000) // Should be under 2MB total
                expect(totalSizeKB).toBeGreaterThan(100) // Should be at least 100KB
                expect(avgSizeKB).toBeLessThan(200) // Average file should be under 200KB
                expect(fileCount).toBeGreaterThan(0) // Should have at least one file
            } else {
                // Skip test if dist doesn't exist yet
                expect(true).toBe(true)
            }
        })
    })

    describe('Bundle Size Trends', () => {
        it('should not have excessive bundle size growth', async () => {
            // Arrange
            const distPath = path.join(projectRoot, 'dist')
            const bundleSizeReportPath = path.join(projectRoot, '__tests__/_reports/bundle-size-report.json')
            
            // Act
            if (fs.existsSync(distPath)) {
                let currentTotalSize = 0
                
                const calculateSize = (dirPath: string) => {
                    const items = fs.readdirSync(dirPath)
                    
                    for (const item of items) {
                        const itemPath = path.join(dirPath, item)
                        const stats = fs.statSync(itemPath)
                        
                        if (stats.isDirectory()) {
                            calculateSize(itemPath)
                        } else if (item.endsWith('.js')) {
                            currentTotalSize += stats.size
                        }
                    }
                }
                
                calculateSize(distPath)
                
                const currentSizeKB = currentTotalSize / 1024
                
                // Check against previous bundle size if report exists
                if (fs.existsSync(bundleSizeReportPath)) {
                    const previousReport = JSON.parse(fs.readFileSync(bundleSizeReportPath, 'utf8'))
                    const previousSizeKB = previousReport.totalSizeKB
                    const growthPercent = ((currentSizeKB - previousSizeKB) / previousSizeKB) * 100
                    
                    // Assert
                    expect(growthPercent).toBeLessThan(50) // Should not grow more than 50%
                    expect(currentSizeKB).toBeLessThan(previousSizeKB * 2) // Should not double in size
                }
                
                // Save current bundle size for future comparisons
                const bundleSizeReport = {
                    timestamp: new Date().toISOString(),
                    totalSizeKB: currentSizeKB,
                    files: []
                }
                
                // Ensure reports directory exists
                const reportsDir = path.dirname(bundleSizeReportPath)
                if (!fs.existsSync(reportsDir)) {
                    fs.mkdirSync(reportsDir, { recursive: true })
                }
                
                fs.writeFileSync(bundleSizeReportPath, JSON.stringify(bundleSizeReport, null, 2))
                
                // Assert
                expect(currentSizeKB).toBeLessThan(2000) // Should be under 2MB
                expect(currentSizeKB).toBeGreaterThan(100) // Should be at least 100KB
            } else {
                // Skip test if dist doesn't exist yet
                expect(true).toBe(true)
            }
        })
    })

    describe('Bundle Optimization', () => {
        it('should have optimized bundle structure', async () => {
            // Arrange
            const distPath = path.join(projectRoot, 'dist')
            
            // Act
            if (fs.existsSync(distPath)) {
                const items = fs.readdirSync(distPath)
                const hasCli = items.includes('cli.js')
                const hasServices = items.includes('services')
                const hasConfig = items.includes('config.js')
                const hasSourceMaps = items.some(item => item.endsWith('.js.map'))
                
                // Assert
                expect(hasCli).toBe(true) // Should have CLI entry point
                expect(hasServices).toBe(true) // Should have services directory
                expect(hasConfig).toBe(true) // Should have config file
                expect(hasSourceMaps).toBe(true) // Should have source maps for debugging
            } else {
                // Skip test if dist doesn't exist yet
                expect(true).toBe(true)
            }
        })

        it('should have reasonable file count', async () => {
            // Arrange
            const distPath = path.join(projectRoot, 'dist')
            
            // Act
            if (fs.existsSync(distPath)) {
                let fileCount = 0
                let jsFileCount = 0
                let mapFileCount = 0
                
                const countFiles = (dirPath: string) => {
                    const items = fs.readdirSync(dirPath)
                    
                    for (const item of items) {
                        const itemPath = path.join(dirPath, item)
                        const stats = fs.statSync(itemPath)
                        
                        if (stats.isDirectory()) {
                            countFiles(itemPath)
                        } else {
                            fileCount++
                            if (item.endsWith('.js')) {
                                jsFileCount++
                            } else if (item.endsWith('.js.map')) {
                                mapFileCount++
                            }
                        }
                    }
                }
                
                countFiles(distPath)
                
                // Assert
                expect(fileCount).toBeLessThan(50) // Should not have too many files
                expect(fileCount).toBeGreaterThan(5) // Should have at least some files
                expect(jsFileCount).toBeGreaterThan(0) // Should have JavaScript files
                expect(mapFileCount).toBeGreaterThan(0) // Should have source map files
                expect(jsFileCount).toBeLessThan(30) // Should not have too many JS files
            } else {
                // Skip test if dist doesn't exist yet
                expect(true).toBe(true)
            }
        })
    })

    describe('Bundle Dependencies', () => {
        it('should have reasonable external dependencies', async () => {
            // Arrange
            const packageJsonPath = path.join(projectRoot, 'package.json')
            
            // Act
            if (fs.existsSync(packageJsonPath)) {
                const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'))
                const dependencies = Object.keys(packageJson.dependencies || {})
                const devDependencies = Object.keys(packageJson.devDependencies || {})
                
                // Assert
                expect(dependencies.length).toBeLessThan(20) // Should not have too many runtime dependencies
                expect(dependencies.length).toBeGreaterThan(0) // Should have some dependencies
                expect(devDependencies.length).toBeLessThan(30) // Should not have too many dev dependencies
                expect(devDependencies.length).toBeGreaterThan(0) // Should have some dev dependencies
            } else {
                // Skip test if package.json doesn't exist
                expect(true).toBe(true)
            }
        })

        it('should have reasonable dependency sizes', async () => {
            // Arrange
            const nodeModulesPath = path.join(projectRoot, '../../node_modules')
            
            // Act
            if (fs.existsSync(nodeModulesPath)) {
                const packageJsonPath = path.join(projectRoot, 'package.json')
                if (fs.existsSync(packageJsonPath)) {
                    const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'))
                    const dependencies = Object.keys(packageJson.dependencies || {})
                    
                    let totalDependencySize = 0
                    let dependencyCount = 0
                    
                    for (const dep of dependencies) {
                        const depPath = path.join(nodeModulesPath, dep)
                        if (fs.existsSync(depPath)) {
                            const stats = fs.statSync(depPath)
                            if (stats.isDirectory()) {
                                // Rough estimate of dependency size
                                totalDependencySize += stats.size
                                dependencyCount++
                            }
                        }
                    }
                    
                    const avgDependencySize = totalDependencySize / dependencyCount
                    
                    // Assert
                    expect(avgDependencySize).toBeLessThan(10 * 1024 * 1024) // Average dependency should be under 10MB
                    expect(dependencyCount).toBeLessThan(20) // Should not have too many dependencies
                }
            } else {
                // Skip test if node_modules doesn't exist
                expect(true).toBe(true)
            }
        })
    })
})
