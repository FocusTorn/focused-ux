import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { writeFileSync, unlinkSync, existsSync, statSync } from 'fs'
import { join } from 'path'
import { ConfigLoader } from '../../../src/services/ConfigLoader.service.js'
import type { AliasConfig } from '../../../src/_types/index.js'

describe('ConfigLoader File Modification Detection', () => {
    let configLoader: ConfigLoader
    let tempDir: string
    let tempConfigPath: string

    beforeEach(() => {
        configLoader = ConfigLoader.getInstance()
        configLoader.clearCache()
        
        tempDir = process.cwd()
        tempConfigPath = join(tempDir, '.pae.json')
    })

    afterEach(() => {
        if (existsSync(tempConfigPath)) {
            unlinkSync(tempConfigPath)
        }
        configLoader.clearCache()
    })

    describe('file modification detection', () => {
        it('should detect when config file is modified', async () => {
            const initialConfig: AliasConfig = {
                nxPackages: {
                    'test': '@fux/test-package'
                }
            }

            const updatedConfig: AliasConfig = {
                nxPackages: {
                    'test': '@fux/test-package',
                    'test2': '@fux/test-package-2'
                }
            }

            writeFileSync(tempConfigPath, JSON.stringify(initialConfig, null, 2))

            // Load initial config
            const config1 = await configLoader.loadConfig()
            expect(config1.nxPackages).toHaveProperty('test')
            expect(config1.nxPackages).not.toHaveProperty('test2')

            // Wait to ensure file modification time changes
            await new Promise(resolve => setTimeout(resolve, 100))

            // Modify the file
            writeFileSync(tempConfigPath, JSON.stringify(updatedConfig, null, 2))

            // Load config again - should detect modification and reload
            const config2 = await configLoader.loadConfig()
            expect(config2.nxPackages).toHaveProperty('test')
            expect(config2.nxPackages).toHaveProperty('test2')
        })

        it('should use cached config when file is not modified', async () => {
            const testConfig: AliasConfig = {
                nxPackages: {
                    'test': '@fux/test-package'
                }
            }

            writeFileSync(tempConfigPath, JSON.stringify(testConfig, null, 2))

            // Load config first time
            const config1 = await configLoader.loadConfig()
            
            // Load config second time - should use cache
            const config2 = await configLoader.loadConfig()

            expect(config1).toBe(config2) // Same reference due to caching
        })

        it('should handle file deletion gracefully', async () => {
            const testConfig: AliasConfig = {
                nxPackages: {
                    'test': '@fux/test-package'
                }
            }

            writeFileSync(tempConfigPath, JSON.stringify(testConfig, null, 2))

            // Load config
            await configLoader.loadConfig()

            // Delete the file
            unlinkSync(tempConfigPath)

            // Try to load config again - should detect file is gone and throw error
            await expect(configLoader.loadConfig()).rejects.toThrow(
                'No configuration file found'
            )
        })

        it('should handle file permission changes', async () => {
            const testConfig: AliasConfig = {
                nxPackages: {
                    'test': '@fux/test-package'
                }
            }

            writeFileSync(tempConfigPath, JSON.stringify(testConfig, null, 2))

            // Load config
            await configLoader.loadConfig()

            // Mock statSync to throw permission error
            vi.spyOn(require('fs'), 'statSync').mockImplementation(() => {
                throw new Error('Permission denied')
            })

            // Should handle permission error gracefully
            await expect(configLoader.loadConfig()).rejects.toThrow(
                'No configuration file found'
            )

            vi.restoreAllMocks()
        })
    })

    describe('lazy loading behavior', () => {
        it('should only load config when needed', async () => {
            const testConfig: AliasConfig = {
                nxPackages: {
                    'test': '@fux/test-package'
                }
            }

            writeFileSync(tempConfigPath, JSON.stringify(testConfig, null, 2))

            // Config should not be loaded yet
            expect(configLoader.getCachedConfig()).toBeNull()

            // Load config
            const config = await configLoader.loadConfig()
            expect(config).toEqual(testConfig)

            // Config should now be cached
            expect(configLoader.getCachedConfig()).toEqual(testConfig)
        })

        it('should reload config when forced', async () => {
            const initialConfig: AliasConfig = {
                nxPackages: {
                    'test': '@fux/test-package'
                }
            }

            const updatedConfig: AliasConfig = {
                nxPackages: {
                    'test': '@fux/test-package',
                    'test2': '@fux/test-package-2'
                }
            }

            writeFileSync(tempConfigPath, JSON.stringify(initialConfig, null, 2))

            // Load initial config
            await configLoader.loadConfig()
            expect(configLoader.getCachedConfig()?.nxPackages).not.toHaveProperty('test2')

            // Update file
            writeFileSync(tempConfigPath, JSON.stringify(updatedConfig, null, 2))

            // Force reload
            const reloadedConfig = await configLoader.reloadConfig()
            expect(reloadedConfig.nxPackages).toHaveProperty('test2')
            expect(configLoader.getCachedConfig()?.nxPackages).toHaveProperty('test2')
        })

        it('should clear cache when clearCache is called', async () => {
            const testConfig: AliasConfig = {
                nxPackages: {
                    'test': '@fux/test-package'
                }
            }

            writeFileSync(tempConfigPath, JSON.stringify(testConfig, null, 2))

            // Load config
            await configLoader.loadConfig()
            expect(configLoader.getCachedConfig()).toBeTruthy()

            // Clear cache
            configLoader.clearCache()
            expect(configLoader.getCachedConfig()).toBeNull()

            // Load again should work
            const config = await configLoader.loadConfig()
            expect(config).toEqual(testConfig)
        })
    })

    describe('concurrent access', () => {
        it('should handle concurrent config loads', async () => {
            const testConfig: AliasConfig = {
                nxPackages: {
                    'test': '@fux/test-package'
                }
            }

            writeFileSync(tempConfigPath, JSON.stringify(testConfig, null, 2))

            // Start multiple concurrent loads
            const promises = Array.from({ length: 5 }, () => configLoader.loadConfig())

            const results = await Promise.all(promises)

            // All should return the same config
            results.forEach(result => {
                expect(result).toEqual(testConfig)
            })

            // Cache should be populated
            expect(configLoader.getCachedConfig()).toEqual(testConfig)
        })

        it('should handle concurrent loads with file modification', async () => {
            const initialConfig: AliasConfig = {
                nxPackages: {
                    'test': '@fux/test-package'
                }
            }

            const updatedConfig: AliasConfig = {
                nxPackages: {
                    'test': '@fux/test-package',
                    'test2': '@fux/test-package-2'
                }
            }

            writeFileSync(tempConfigPath, JSON.stringify(initialConfig, null, 2))

            // Start loading
            const loadPromise = configLoader.loadConfig()

            // Modify file while loading
            setTimeout(() => {
                writeFileSync(tempConfigPath, JSON.stringify(updatedConfig, null, 2))
            }, 10)

            const config = await loadPromise
            expect(config).toEqual(initialConfig)

            // Next load should get updated config
            const updatedConfigResult = await configLoader.loadConfig()
            expect(updatedConfigResult.nxPackages).toHaveProperty('test2')
        })
    })
})
