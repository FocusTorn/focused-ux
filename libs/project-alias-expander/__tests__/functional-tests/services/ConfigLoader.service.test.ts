import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { setupPaeTestEnvironment, resetPaeMocks } from '../../__mocks__/helpers.js'
import { createPaeMockBuilder } from '../../__mocks__/mock-scenario-builder.js'
import { readFileSync, writeFileSync, unlinkSync, existsSync, mkdirSync, rmdirSync, statSync } from 'fs'
import { join } from 'path'
import { ConfigLoader, clearAllCaches } from '../../../src/services/ConfigLoader.service.js'
import type { AliasConfig } from '../../../src/_types/index.js'

vi.mock('../../../src/services/ConfigLoader.service.js', async () => { //>

    const actual = await vi.importActual('../../../src/services/ConfigLoader.service.js')
    return {
        ...actual,
        ConfigLoader: {
            getInstance: vi.fn(() => ({
                loadConfig: vi.fn(),
                reloadConfig: vi.fn(),
                getCachedConfig: vi.fn(),
                clearCache: vi.fn(),
                getValidationErrors: vi.fn(() => [])
            }))
        },
        clearAllCaches: vi.fn()
    }

}) //<

describe('ConfigLoader', () => {

    // SETUP ----------------->>
    let mocks: ReturnType<typeof setupPaeTestEnvironment>
    let configLoader: any
    let tempDir: string
    let tempConfigPath: string
    
    beforeEach(async () => { //>

        // Use Mock-Strategy library functions for Node.js module mocking
        mocks = await setupPaeTestEnvironment()
        await resetPaeMocks(mocks)
        
        configLoader = ConfigLoader.getInstance()
        // Ensure clearCache is available
        if (!configLoader.clearCache) {

            configLoader.clearCache = vi.fn()
        
        }
        configLoader.clearCache()
        
        // Create a temporary directory for test configs
        tempDir = process.cwd()
        tempConfigPath = join(tempDir, '.pae.yaml')
    
    }) //<

    afterEach(() => { //>

        // Clean up test files
        if (existsSync(tempConfigPath)) {

            unlinkSync(tempConfigPath)
        
        }
        if (configLoader && configLoader.clearCache) {

            configLoader.clearCache()
        
        }
        clearAllCaches()
    
    }) //<
    //----------------------------------------------------<<
    
    describe('loadConfig', () => {

        it('should load valid YAML config', async () => { //>

            const validConfig = {
                nxPackages: {
                    'test-package': 'test-package'
                }
            }
            
            // Use scenario builder for consistent mock setup
            const _scenario = createPaeMockBuilder(mocks)
                .configLoaderSuccess({ configContent: validConfig })
                .build()
            
            configLoader.loadConfig.mockResolvedValue(validConfig)
            
            const result = await configLoader.loadConfig()
            
            expect(result).toEqual(validConfig)
            expect(configLoader.loadConfig).toHaveBeenCalled()
        
        }) //<
        it('should return cached config on subsequent calls', async () => { //>

            const validConfig = {
                nxPackages: {
                    'test-package': 'test-package'
                }
            }
            
            // Use scenario builder for caching scenario
            const _scenario = createPaeMockBuilder(mocks)
                .configLoaderCaching({
                    initialConfig: validConfig,
                    useCache: true
                })
                .build()
            
            configLoader.loadConfig.mockResolvedValue(validConfig)
            
            // First call
            const result1 = await configLoader.loadConfig()
            expect(result1).toEqual(validConfig)
            
            // Second call should use cache
            const result2 = await configLoader.loadConfig()
            expect(result2).toEqual(validConfig)
            
            // Should have been called twice
            expect(configLoader.loadConfig).toHaveBeenCalledTimes(2)
        
        }) //<
        it('should reload config when file is modified', async () => { //>

            const initialConfig = {
                nxPackages: {
                    'test-package': 'test-package'
                }
            }
            
            const modifiedConfig = {
                nxPackages: {
                    'test-package': 'test-package',
                    'new-package': 'new-package'
                }
            }
            
            // Use scenario builder for file modification scenario
            const _scenario = createPaeMockBuilder(mocks)
                .configLoaderCaching({
                    initialConfig,
                    modifiedConfig,
                    useCache: false
                })
                .build()
            
            configLoader.loadConfig
                .mockResolvedValueOnce(initialConfig)
                .mockResolvedValueOnce(modifiedConfig)
            
            // First load
            const result1 = await configLoader.loadConfig()
            expect(result1).toEqual(initialConfig)
            
            // Second load should detect file change and reload
            const result2 = await configLoader.loadConfig()
            expect(result2).toEqual(modifiedConfig)
            
            expect(configLoader.loadConfig).toHaveBeenCalledTimes(2)
        
        }) //<
        it('should only load config when needed (lazy loading)', async () => { //>

            const config = {
                nxPackages: {
                    'test-package': 'test-package'
                }
            }
            
            // Use scenario builder for lazy loading scenario
            const _scenario = createPaeMockBuilder(mocks)
                .configLoaderSuccess({ configContent: config })
                .build()
            
            configLoader.loadConfig.mockResolvedValue(config)
            
            // Initially no config should be loaded
            configLoader.getCachedConfig.mockReturnValue(null)
            expect(configLoader.getCachedConfig()).toBeNull()
            
            // Load config
            await configLoader.loadConfig()
            
            // Now config should be cached
            configLoader.getCachedConfig.mockReturnValue(config)
            expect(configLoader.getCachedConfig()).not.toBeNull()
        
        }) //<
   
    })
    
    describe('reloadConfig', () => {

        it('should force reload config and clear cache', async () => { //>

            const initialConfig = {
                nxPackages: {
                    'test-package': 'test-package'
                }
            }
            
            const reloadedConfig = {
                nxPackages: {
                    'test-package': 'test-package',
                    'new-package': 'new-package'
                }
            }
            
            configLoader.loadConfig.mockResolvedValue(initialConfig)
            configLoader.reloadConfig.mockResolvedValue(reloadedConfig)
            
            // First load
            const result1 = await configLoader.loadConfig()
            expect(result1).toEqual(initialConfig)
            
            // Force reload
            const result2 = await configLoader.reloadConfig()
            expect(result2).toEqual(reloadedConfig)
            
            expect(configLoader.loadConfig).toHaveBeenCalled()
            expect(configLoader.reloadConfig).toHaveBeenCalled()
        
        }) //<
        it('should reload config when forced even if file not modified', async () => { //>

            const config = {
                nxPackages: {
                    'test-package': 'test-package'
                }
            }
            
            configLoader.loadConfig.mockResolvedValue(config)
            configLoader.reloadConfig.mockResolvedValue(config)
            
            // First load
            await configLoader.loadConfig()
            
            // Force reload (should ignore cache)
            const result = await configLoader.reloadConfig()
            expect(result).toEqual(config)
            
            expect(configLoader.loadConfig).toHaveBeenCalled()
            expect(configLoader.reloadConfig).toHaveBeenCalled()
        
        }) //<
    
    })

    describe('file system errors', () => {

        it('should throw error when config file does not exist', async () => { //>

            // Use scenario builder for file not found error
            const _scenario = createPaeMockBuilder(mocks)
                .configLoaderError({
                    errorType: 'file-not-found',
                    errorMessage: 'No configuration file found. Please ensure .pae.yaml exists in the project root.'
                })
                .build()
            
            const error = new Error('No configuration file found. Please ensure .pae.yaml exists in the project root.')
            configLoader.loadConfig.mockRejectedValue(error)
            
            await expect(configLoader.loadConfig()).rejects.toThrow(
                'No configuration file found. Please ensure .pae.yaml exists in the project root.'
            )
        
        }) //<
        it('should handle directory instead of file', async () => { //>

            // Use scenario builder for directory error
            const _scenario = createPaeMockBuilder(mocks)
                .configLoaderError({
                    errorType: 'directory-instead-of-file',
                    errorMessage: 'Failed to load config from /path/to/directory: EISDIR: illegal operation on a directory'
                })
                .build()
            
            const error = new Error('Failed to load config from /path/to/directory: EISDIR: illegal operation on a directory')
            configLoader.loadConfig.mockRejectedValue(error)
            
            await expect(configLoader.loadConfig()).rejects.toThrow(
                'Failed to load config from'
            )
        
        }) //<
        it('should handle permission denied errors', async () => { //>

            // Use scenario builder for permission denied error
            const _scenario = createPaeMockBuilder(mocks)
                .configLoaderError({
                    errorType: 'permission-denied',
                    errorMessage: 'Failed to load config from /path/to/file: EACCES: permission denied'
                })
                .build()
            
            const error = new Error('Failed to load config from /path/to/file: EACCES: permission denied')
            configLoader.loadConfig.mockRejectedValue(error)
            
            await expect(configLoader.loadConfig()).rejects.toThrow(
                'Failed to load config from'
            )
        
        }) //<
        it('should handle file locked errors', async () => { //>

            // Use scenario builder for file locked error
            const _scenario = createPaeMockBuilder(mocks)
                .configLoaderError({
                    errorType: 'file-locked',
                    errorMessage: 'Failed to load config from /path/to/file: EBUSY: resource busy or locked'
                })
                .build()
            
            const error = new Error('Failed to load config from /path/to/file: EBUSY: resource busy or locked')
            configLoader.loadConfig.mockRejectedValue(error)
            
            await expect(configLoader.loadConfig()).rejects.toThrow(
                'Failed to load config from'
            )
        
        }) //<
        it('should handle file deletion gracefully', async () => { //>

            const config = {
                nxPackages: {
                    'test-package': 'test-package'
                }
            }
            
            const error = new Error('No configuration file found. Please ensure .pae.yaml exists in the project root.')
            
            configLoader.loadConfig
                .mockResolvedValueOnce(config)
                .mockRejectedValueOnce(error)
            
            // First load succeeds
            await configLoader.loadConfig()
            
            // Second load fails because file was deleted
            await expect(configLoader.loadConfig()).rejects.toThrow(
                'No configuration file found. Please ensure .pae.yaml exists in the project root.'
            )
        
        }) //<
        it('should handle file permission changes', async () => { //>

            const config = {
                nxPackages: {
                    'test-package': 'test-package'
                }
            }
            
            const error = new Error('Failed to load config from /path/to/file: EACCES: permission denied')
            
            configLoader.loadConfig
                .mockResolvedValueOnce(config)
                .mockRejectedValueOnce(error)
            
            // First load succeeds
            await configLoader.loadConfig()
            
            // Second load fails due to permission change
            await expect(configLoader.loadConfig()).rejects.toThrow(
                'Failed to load config from'
            )
        
        }) //<
        it('should handle config file being deleted during load', async () => { //>

            const error = new Error('Failed to load config from /path/to/file: ENOENT: no such file or directory')
            configLoader.loadConfig.mockRejectedValue(error)
            
            await expect(configLoader.loadConfig()).rejects.toThrow(
                'Failed to load config from'
            )
        
        }) //<
    
    })

    describe('YAML parsing errors', () => {

        it('should throw error for invalid YAML', async () => { //>

            // Use scenario builder for YAML parse error
            const _scenario = createPaeMockBuilder(mocks)
                .configLoaderError({
                    errorType: 'yaml-parse-error',
                    errorMessage: 'Failed to parse YAML config from /path/to/file: invalid: yaml: content: ['
                })
                .build()
            
            const error = new Error('Failed to parse YAML config from /path/to/file: invalid: yaml: content: [')
            configLoader.loadConfig.mockRejectedValue(error)
            
            await expect(configLoader.loadConfig()).rejects.toThrow(
                'Failed to parse YAML config from'
            )
        
        }) //<
        it('should handle malformed YAML', async () => { //>

            const error = new Error('Failed to parse YAML config from /path/to/file: nxPackages:\n  test-package: [unclosed array')
            configLoader.loadConfig.mockRejectedValue(error)
            
            await expect(configLoader.loadConfig()).rejects.toThrow(
                'Failed to parse YAML config from'
            )
        
        }) //<
        it('should handle incomplete YAML', async () => { //>

            const error = new Error('Failed to parse YAML config from /path/to/file: nxPackages:\n  test-package:')
            configLoader.loadConfig.mockRejectedValue(error)
            
            await expect(configLoader.loadConfig()).rejects.toThrow(
                'Failed to parse YAML config from'
            )
        
        }) //<
        it('should handle empty file', async () => { //>

            const error = new Error('Failed to parse YAML config from /path/to/file: ')
            configLoader.loadConfig.mockRejectedValue(error)
            
            await expect(configLoader.loadConfig()).rejects.toThrow(
                'Failed to parse YAML config from'
            )
        
        }) //<
        it('should handle non-YAML content', async () => { //>

            const error = new Error('Failed to parse YAML config from /path/to/file: This is not YAML content at all')
            configLoader.loadConfig.mockRejectedValue(error)
            
            await expect(configLoader.loadConfig()).rejects.toThrow(
                'Failed to parse YAML config from'
            )
        
        }) //<
        it('should handle YAML with comments (valid)', async () => { //>

            const validConfig = {
                nxPackages: {
                    'test-package': 'test-package'
                }
            }
            
            configLoader.loadConfig.mockResolvedValue(validConfig)
            
            const result = await configLoader.loadConfig()
            expect(result).toEqual(validConfig)
        
        }) //<
        it('should throw error for unsupported file format', async () => { //>

            const error = new Error('Unsupported config file format: /path/to/.pae.json. Only YAML files are supported.')
            configLoader.loadConfig.mockRejectedValue(error)
            
            await expect(configLoader.loadConfig()).rejects.toThrow(
                'Unsupported config file format'
            )
        
        }) //<
        it('should handle circular references in YAML', async () => { //>

            const error = new Error('Failed to parse YAML config from /path/to/file: nxPackages: &ref\n  test-package: test-package\ncircular: *ref')
            configLoader.loadConfig.mockRejectedValue(error)
            
            await expect(configLoader.loadConfig()).rejects.toThrow(
                'Failed to parse YAML config from'
            )
        
        }) //<
    
    })

    describe('configuration validation', () => {

        it('should validate config structure and report errors', async () => { //>

            // Use scenario builder for validation error
            const _scenario = createPaeMockBuilder(mocks)
                .configLoaderError({
                    errorType: 'validation-error',
                    errorMessage: 'Configuration validation failed: nxPackages must be an object'
                })
                .build()
            
            const error = new Error('Configuration validation failed: nxPackages must be an object')
            configLoader.loadConfig.mockRejectedValue(error)
            configLoader.getValidationErrors.mockReturnValue(['nxPackages must be an object'])
            
            await expect(configLoader.loadConfig()).rejects.toThrow(
                'Configuration validation failed'
            )
            
            const errors = configLoader.getValidationErrors()
            expect(errors.length).toBeGreaterThan(0)
        
        }) //<
        it('should handle missing required fields', async () => { //>

            const configWithoutNxPackages = {
                'expandable-flags': {
                    'test': '--test'
                }
            }
            
            // Use scenario builder for config without nxPackages
            const _scenario = createPaeMockBuilder(mocks)
                .configLoaderSuccess({ configContent: configWithoutNxPackages })
                .build()
            
            configLoader.loadConfig.mockResolvedValue(configWithoutNxPackages)
            
            // Should still load successfully as nxPackages is not strictly required
            const result = await configLoader.loadConfig()
            expect(result).toEqual(configWithoutNxPackages)
        
        }) //<
        it('should validate nxPackages structure', async () => { //>

            const validConfig = {
                nxPackages: {
                    'test-package': 'test-package',
                    'complex-package': {
                        aliases: ['alias1', 'alias2'],
                        variants: { 'core': 'core', 'ext': 'ext' },
                        default: 'core'
                    }
                }
            }
            
            // Use scenario builder for valid nxPackages structure
            const _scenario = createPaeMockBuilder(mocks)
                .configLoaderSuccess({ configContent: validConfig })
                .build()
            
            configLoader.loadConfig.mockResolvedValue(validConfig)
            
            const result = await configLoader.loadConfig()
            expect(result).toEqual(validConfig)
        
        }) //<
        it('should handle invalid nxPackages structure', async () => { //>

            // Use scenario builder for invalid nxPackages structure
            const _scenario = createPaeMockBuilder(mocks)
                .configLoaderError({
                    errorType: 'validation-error',
                    errorMessage: 'Configuration validation failed: nxPackages must be an object'
                })
                .build()
            
            const error = new Error('Configuration validation failed: nxPackages must be an object')
            configLoader.loadConfig.mockRejectedValue(error)
            
            await expect(configLoader.loadConfig()).rejects.toThrow(
                'Configuration validation failed'
            )
        
        }) //<
        it('should validate other sections are objects', async () => { //>

            const validConfig = {
                'expandable-flags': {
                    'test': '--test'
                },
                'context-aware-flags': {
                    'build': {
                        'default': {
                            'f': '--fix'
                        }
                    }
                }
            }
            
            // Use scenario builder for valid other sections
            const _scenario = createPaeMockBuilder(mocks)
                .configLoaderSuccess({ configContent: validConfig })
                .build()
            
            configLoader.loadConfig.mockResolvedValue(validConfig)
            
            const result = await configLoader.loadConfig()
            expect(result).toEqual(validConfig)
        
        }) //<
        it('should handle invalid section types', async () => { //>

            // Use scenario builder for invalid section types
            const _scenario = createPaeMockBuilder(mocks)
                .configLoaderError({
                    errorType: 'validation-error',
                    errorMessage: 'Configuration validation failed: expandable-flags must be an object'
                })
                .build()
            
            const error = new Error('Configuration validation failed: expandable-flags must be an object')
            configLoader.loadConfig.mockRejectedValue(error)
            
            await expect(configLoader.loadConfig()).rejects.toThrow(
                'Configuration validation failed'
            )
        
        }) //<
    
    })

    describe('clearCache', () => {

        it('should clear all cached data', async () => { //>

            const config = {
                nxPackages: {
                    'test-package': 'test-package'
                }
            }
            
            // Use scenario builder for cache clearing scenario
            const _scenario = createPaeMockBuilder(mocks)
                .configLoaderSuccess({ configContent: config })
                .build()
            
            configLoader.loadConfig.mockResolvedValue(config)
            configLoader.getCachedConfig.mockReturnValue(config)
            
            // Load config
            await configLoader.loadConfig()
            expect(configLoader.getCachedConfig()).toEqual(config)
            
            // Clear cache
            configLoader.clearCache()
            configLoader.getCachedConfig.mockReturnValue(null)
            expect(configLoader.getCachedConfig()).toBeNull()
        
        }) //<
        it('should clear cache when clearCache is called', async () => { //>

            const config = {
                nxPackages: {
                    'test-package': 'test-package'
                }
            }
            
            // Use scenario builder for cache clearing scenario
            const _scenario = createPaeMockBuilder(mocks)
                .configLoaderSuccess({ configContent: config })
                .build()
            
            configLoader.loadConfig.mockResolvedValue(config)
            
            // Load config
            await configLoader.loadConfig()
            
            // Clear cache
            configLoader.clearCache()
            
            // Next load should read from file again
            await configLoader.loadConfig()
            expect(configLoader.loadConfig).toHaveBeenCalledTimes(2)
        
        }) //<
    
    })

    describe('concurrent access', () => {

        it('should handle concurrent config loads', async () => { //>

            const config = {
                nxPackages: {
                    'test-package': 'test-package'
                }
            }
            
            // Use scenario builder for concurrent access scenario
            const _scenario = createPaeMockBuilder(mocks)
                .configLoaderSuccess({ configContent: config })
                .build()
            
            configLoader.loadConfig.mockResolvedValue(config)
            
            // Start multiple concurrent loads
            const promises = [
                configLoader.loadConfig(),
                configLoader.loadConfig(),
                configLoader.loadConfig()
            ]
            
            const results = await Promise.all(promises)
            
            // All should return the same config
            results.forEach(result => {

                expect(result).toEqual(config)
            
            })
            
            // Should have been called three times
            expect(configLoader.loadConfig).toHaveBeenCalledTimes(3)
        
        }) //<
        it('should handle concurrent loads with file modification', async () => { //>

            const initialConfig = {
                nxPackages: {
                    'test-package': 'test-package'
                }
            }
            
            const _modifiedConfig = {
                nxPackages: {
                    'test-package': 'test-package',
                    'new-package': 'new-package'
                }
            }
            
            // Use scenario builder for concurrent access with file modification
            const _scenario = createPaeMockBuilder(mocks)
                .configLoaderCaching({
                    initialConfig,
                    useCache: true
                })
                .build()
            
            configLoader.loadConfig
                .mockResolvedValueOnce(initialConfig)
                .mockResolvedValueOnce(initialConfig)
                .mockResolvedValueOnce(initialConfig)
            
            // Start concurrent loads
            const promises = [
                configLoader.loadConfig(),
                configLoader.loadConfig(),
                configLoader.loadConfig()
            ]
            
            const results = await Promise.all(promises)
            
            // All should return the same config (first one loaded)
            results.forEach(result => {

                expect(result).toEqual(initialConfig)
            
            })
            
            // Should have been called three times
            expect(configLoader.loadConfig).toHaveBeenCalledTimes(3)
        
        }) //<
    
    })

    describe('edge cases', () => {

        it('should handle very large config files', async () => { //>

            // Create a large YAML config
            const largeConfig = {
                nxPackages: {} as Record<string, string>
            }
            
            for (let i = 0; i < 1000; i++) {

                largeConfig.nxPackages[`package-${i}`] = `package-${i}`
            
            }
            
            // Use scenario builder for large config scenario
            const _scenario = createPaeMockBuilder(mocks)
                .configLoaderSuccess({ configContent: largeConfig })
                .build()
            
            configLoader.loadConfig.mockResolvedValue(largeConfig)
            
            const result = await configLoader.loadConfig()
            expect(result).toEqual(largeConfig)
            expect(Object.keys(result.nxPackages)).toHaveLength(1000)
        
        }) //<
        it('should handle config with special characters', async () => { //>

            const configWithSpecialChars = {
                nxPackages: {
                    'package-with-dashes': 'package-with-dashes',
                    'package_with_underscores': 'package_with_underscores',
                    'package.with.dots': 'package.with.dots'
                }
            }
            
            // Use scenario builder for special characters scenario
            const _scenario = createPaeMockBuilder(mocks)
                .configLoaderSuccess({ configContent: configWithSpecialChars })
                .build()
            
            configLoader.loadConfig.mockResolvedValue(configWithSpecialChars)
            
            const result = await configLoader.loadConfig()
            expect(result).toEqual(configWithSpecialChars)
        
        }) //<
        it('should handle config with unicode characters', async () => { //>

            const configWithUnicode = {
                nxPackages: {
                    'package-测试': 'package-测试',
                    'package-🚀': 'package-🚀'
                }
            }
            
            // Use scenario builder for unicode characters scenario
            const _scenario = createPaeMockBuilder(mocks)
                .configLoaderSuccess({ configContent: configWithUnicode })
                .build()
            
            configLoader.loadConfig.mockResolvedValue(configWithUnicode)
            
            const result = await configLoader.loadConfig()
            expect(result).toEqual(configWithUnicode)
        
        }) //<
    
    })

})