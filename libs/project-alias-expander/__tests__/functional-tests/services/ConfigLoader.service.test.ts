import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { readFileSync, writeFileSync, unlinkSync, existsSync } from 'fs'
import { join } from 'path'
import { ConfigLoader } from '../../../src/services/ConfigLoader.service.js'
import type { AliasConfig } from '../../../src/_types/index.js'

describe('ConfigLoader', () => {
    let configLoader: ConfigLoader
    let tempDir: string
    let tempConfigPath: string

    beforeEach(() => {
        configLoader = ConfigLoader.getInstance()
        configLoader.clearCache()
        
        // Create a temporary directory for test configs
        tempDir = process.cwd()
        tempConfigPath = join(tempDir, '.pae.json')
    })

    afterEach(() => {
        // Clean up test files
        if (existsSync(tempConfigPath)) {
            unlinkSync(tempConfigPath)
        }
        configLoader.clearCache()
    })

    describe('loadConfig', () => {
        it('should load valid JSON config', async () => {
            const testConfig: AliasConfig = {
                nxPackages: {
                    'test': '@fux/test-package',
                    'testc': { name: 'test-package', suffix: 'core' }
                },
                nxTargets: {
                    'b': 'build',
                    't': 'test'
                }
            }

            writeFileSync(tempConfigPath, JSON.stringify(testConfig, null, 2))

            const config = await configLoader.loadConfig()

            expect(config).toEqual(testConfig)
            expect(configLoader.getCachedConfig()).toEqual(testConfig)
        })

        it('should return cached config on subsequent calls', async () => {
            const testConfig: AliasConfig = {
                nxPackages: {
                    'test': '@fux/test-package'
                }
            }

            writeFileSync(tempConfigPath, JSON.stringify(testConfig, null, 2))

            // First call
            const config1 = await configLoader.loadConfig()
            
            // Second call should return cached config
            const config2 = await configLoader.loadConfig()

            expect(config1).toBe(config2) // Same reference due to caching
        })

        it('should reload config when file is modified', async () => {
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
            
            const config1 = await configLoader.loadConfig()
            expect(config1.nxPackages).toHaveProperty('test')
            expect(config1.nxPackages).not.toHaveProperty('test2')

            // Modify the file
            writeFileSync(tempConfigPath, JSON.stringify(updatedConfig, null, 2))
            
            // Wait a bit to ensure file modification time changes
            await new Promise(resolve => setTimeout(resolve, 10))
            
            const config2 = await configLoader.loadConfig()
            expect(config2.nxPackages).toHaveProperty('test')
            expect(config2.nxPackages).toHaveProperty('test2')
        })
    })

    describe('reloadConfig', () => {
        it('should force reload config and clear cache', async () => {
            const testConfig: AliasConfig = {
                nxPackages: {
                    'test': '@fux/test-package'
                }
            }

            writeFileSync(tempConfigPath, JSON.stringify(testConfig, null, 2))

            // Load config
            await configLoader.loadConfig()
            expect(configLoader.getCachedConfig()).toBeTruthy()

            // Force reload
            const reloadedConfig = await configLoader.reloadConfig()
            expect(reloadedConfig).toEqual(testConfig)
        })
    })

    describe('error handling', () => {
        it('should throw error when config file does not exist', async () => {
            await expect(configLoader.loadConfig()).rejects.toThrow(
                'No configuration file found. Please ensure .pae.json exists in the project root.'
            )
        })

        it('should throw error for invalid JSON', async () => {
            writeFileSync(tempConfigPath, '{ invalid json }')

            await expect(configLoader.loadConfig()).rejects.toThrow(
                'Failed to parse JSON config from'
            )
        })

        it('should throw error for unsupported file format', async () => {
            const unsupportedPath = join(tempDir, '.pae.txt')
            writeFileSync(unsupportedPath, 'some content')

            // Mock the getConfigPaths to return unsupported format
            vi.spyOn(configLoader as any, 'getConfigPaths').mockReturnValue([unsupportedPath])

            await expect(configLoader.loadConfig()).rejects.toThrow(
                'Unsupported config file format'
            )

            // Clean up
            unlinkSync(unsupportedPath)
        })
    })

    describe('validation', () => {
        it('should validate config structure and report errors', async () => {
            const invalidConfig = {
                // Missing required nxPackages
                nxTargets: {
                    'b': 'build'
                }
            }

            writeFileSync(tempConfigPath, JSON.stringify(invalidConfig, null, 2))

            await configLoader.loadConfig()
            const errors = configLoader.getValidationErrors()

            expect(errors).toContain('Missing required field: nxPackages')
        })

        it('should validate nxPackages structure', async () => {
            const invalidConfig: AliasConfig = {
                nxPackages: {
                    'valid': '@fux/valid-package',
                    'invalid-object': { /* missing name */ },
                    'invalid-type': 123
                } as any
            }

            writeFileSync(tempConfigPath, JSON.stringify(invalidConfig, null, 2))

            await configLoader.loadConfig()
            const errors = configLoader.getValidationErrors()

            expect(errors).toContain("Package alias 'invalid-object' missing required 'name' property")
            expect(errors).toContain("Package alias 'invalid-type' has invalid value type")
        })

        it('should validate other sections are objects', async () => {
            const invalidConfig = {
                nxPackages: {
                    'test': '@fux/test'
                },
                nxTargets: 'should be object' // Invalid
            }

            writeFileSync(tempConfigPath, JSON.stringify(invalidConfig, null, 2))

            await configLoader.loadConfig()
            const errors = configLoader.getValidationErrors()

            expect(errors).toContain("Section 'nxTargets' must be an object")
        })
    })

    describe('clearCache', () => {
        it('should clear all cached data', async () => {
            const testConfig: AliasConfig = {
                nxPackages: {
                    'test': '@fux/test-package'
                }
            }

            writeFileSync(tempConfigPath, JSON.stringify(testConfig, null, 2))

            await configLoader.loadConfig()
            expect(configLoader.getCachedConfig()).toBeTruthy()

            configLoader.clearCache()
            expect(configLoader.getCachedConfig()).toBeNull()
        })
    })
})
