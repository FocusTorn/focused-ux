import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { writeFileSync, unlinkSync, existsSync, mkdirSync, rmdirSync } from 'fs'
import { join } from 'path'
import { ConfigLoader,
    loadAliasConfig,
    loadAliasConfigCached,
    clearAllCaches
} from '../../../src/services/ConfigLoader.service.js'

import type { AliasConfig } from '../../../src/_types/index.js'

describe('ConfigLoader Error Handling', () => {
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
        clearAllCaches()
    })

    describe('file system errors', () => {
        it('should handle missing config file', async () => {
            await expect(configLoader.loadConfig()).rejects.toThrow(
                'No configuration file found. Please ensure .pae.json exists in the project root.'
            )
        })

        it('should handle directory instead of file', async () => {
            // Create a directory with the config name
            mkdirSync(tempConfigPath)

            await expect(configLoader.loadConfig()).rejects.toThrow(
                'Failed to parse JSON config from'
            )

            rmdirSync(tempConfigPath)
        })

        it('should handle permission denied errors', async () => {
            // Mock readFileSync to throw permission error
            vi.spyOn(require('fs'), 'readFileSync').mockImplementation(() => {
                throw new Error('EACCES: permission denied')
            })

            await expect(configLoader.loadConfig()).rejects.toThrow(
                'Failed to parse JSON config from'
            )

            vi.restoreAllMocks()
        })

        it('should handle file locked errors', async () => {
            writeFileSync(tempConfigPath, '{}')

            // Mock readFileSync to throw file locked error
            vi.spyOn(require('fs'), 'readFileSync').mockImplementation(() => {
                throw new Error('EBUSY: resource busy or locked')
            })

            await expect(configLoader.loadConfig()).rejects.toThrow(
                'Failed to parse JSON config from'
            )

            vi.restoreAllMocks()
        })
    })

    describe('JSON parsing errors', () => {
        it('should handle malformed JSON', async () => {
            writeFileSync(tempConfigPath, '{ "invalid": json }')

            await expect(configLoader.loadConfig()).rejects.toThrow(
                'Failed to parse JSON config from'
            )
        })

        it('should handle incomplete JSON', async () => {
            writeFileSync(tempConfigPath, '{ "nxPackages": {')

            await expect(configLoader.loadConfig()).rejects.toThrow(
                'Failed to parse JSON config from'
            )
        })

        it('should handle empty file', async () => {
            writeFileSync(tempConfigPath, '')

            await expect(configLoader.loadConfig()).rejects.toThrow(
                'Failed to parse JSON config from'
            )
        })

        it('should handle non-JSON content', async () => {
            writeFileSync(tempConfigPath, 'This is not JSON content')

            await expect(configLoader.loadConfig()).rejects.toThrow(
                'Failed to parse JSON config from'
            )
        })

        it('should handle JSON with comments (invalid)', async () => {
            writeFileSync(tempConfigPath, '{ "nxPackages": {} // comment }')

            await expect(configLoader.loadConfig()).rejects.toThrow(
                'Failed to parse JSON config from'
            )
        })
    })

    describe('configuration validation errors', () => {
        it('should handle missing required fields', async () => {
            const invalidConfig = {
                nxTargets: {
                    'b': 'build'
                }
                // Missing nxPackages
            }

            writeFileSync(tempConfigPath, JSON.stringify(invalidConfig, null, 2))

            await configLoader.loadConfig()
            const errors = configLoader.getValidationErrors()

            expect(errors).toContain('Missing required field: nxPackages')
        })

        it('should handle invalid nxPackages structure', async () => {
            const invalidConfig = {
                nxPackages: {
                    'valid': '@fux/valid-package',
                    'invalid-object': { /* missing name */ },
                    'invalid-type': 123,
                    'null-value': null
                }
            }

            writeFileSync(tempConfigPath, JSON.stringify(invalidConfig, null, 2))

            await configLoader.loadConfig()
            const errors = configLoader.getValidationErrors()

            expect(errors).toContain("Package alias 'invalid-object' missing required 'name' property")
            expect(errors).toContain("Package alias 'invalid-type' has invalid value type")
        })

        it('should handle invalid section types', async () => {
            const invalidConfig = {
                nxPackages: {
                    'test': '@fux/test'
                },
                nxTargets: 'should be object',
                'expandable-flags': 123,
                commands: null
            }

            writeFileSync(tempConfigPath, JSON.stringify(invalidConfig, null, 2))

            await configLoader.loadConfig()
            const errors = configLoader.getValidationErrors()

            expect(errors).toContain("Section 'nxTargets' must be an object")
            expect(errors).toContain("Section 'expandable-flags' must be an object")
            expect(errors).toContain("Section 'commands' must be an object")
        })

        it('should handle circular references in JSON', async () => {
            const circularConfig: any = {
                nxPackages: {
                    'test': '@fux/test'
                }
            }
            circularConfig.self = circularConfig

            writeFileSync(tempConfigPath, JSON.stringify(circularConfig, null, 2))

            await expect(configLoader.loadConfig()).rejects.toThrow(
                'Failed to parse JSON config from'
            )
        })
    })

    describe('legacy function error handling', () => {
        it('should handle missing config in loadAliasConfig', () => {
            expect(() => loadAliasConfig()).toThrow(
                'No configuration file found. Please ensure .pae.json exists in the project root.'
            )
        })

        it('should handle invalid JSON in loadAliasConfig', () => {
            writeFileSync(tempConfigPath, '{ invalid json }')

            expect(() => loadAliasConfig()).toThrow(
                'Failed to load configuration from .pae.json'
            )
        })

        it('should handle file read errors in loadAliasConfig', () => {
            writeFileSync(tempConfigPath, '{}')

            // Mock readFileSync to throw error
            vi.spyOn(require('fs'), 'readFileSync').mockImplementation(() => {
                throw new Error('Read error')
            })

            expect(() => loadAliasConfig()).toThrow(
                'Failed to load configuration from .pae.json'
            )

            vi.restoreAllMocks()
        })

        it('should handle missing config in loadAliasConfigCached', () => {
            expect(() => loadAliasConfigCached()).toThrow(
                'No configuration file found. Please ensure .pae.json exists in the project root.'
            )
        })
    })

    describe('edge cases', () => {
        it('should handle very large config files', async () => {
            const largeConfig: AliasConfig = {
                nxPackages: {},
                nxTargets: {}
            }

            // Create a large config with many entries
            for (let i = 0; i < 1000; i++) {
                largeConfig.nxPackages![`package${i}`] = `@fux/package-${i}`
                largeConfig.nxTargets![`target${i}`] = `target-${i}`
            }

            writeFileSync(tempConfigPath, JSON.stringify(largeConfig, null, 2))

            const config = await configLoader.loadConfig()
            expect(Object.keys(config.nxPackages!)).toHaveLength(1000)
            expect(Object.keys(config.nxTargets!)).toHaveLength(1000)
        })

        it('should handle config with special characters', async () => {
            const specialConfig: AliasConfig = {
                nxPackages: {
                    'test-with-dashes': '@fux/test-package',
                    'test_with_underscores': '@fux/test-package-2',
                    'test.with.dots': '@fux/test-package-3'
                }
            }

            writeFileSync(tempConfigPath, JSON.stringify(specialConfig, null, 2))

            const config = await configLoader.loadConfig()
            expect(config.nxPackages).toHaveProperty('test-with-dashes')
            expect(config.nxPackages).toHaveProperty('test_with_underscores')
            expect(config.nxPackages).toHaveProperty('test.with.dots')
        })

        it('should handle config with unicode characters', async () => {
            const unicodeConfig: AliasConfig = {
                nxPackages: {
                    'test-unicode': '@fux/test-package-🚀',
                    'test-emoji': '@fux/test-package-🎉'
                },
                commands: {
                    'help': 'Show help information 🆘'
                }
            }

            writeFileSync(tempConfigPath, JSON.stringify(unicodeConfig, null, 2))

            const config = await configLoader.loadConfig()
            expect(config.nxPackages).toHaveProperty('test-unicode')
            expect(config.nxPackages).toHaveProperty('test-emoji')
            expect(config.commands?.help).toContain('🆘')
        })

        it('should handle config file being deleted during load', async () => {
            const testConfig: AliasConfig = {
                nxPackages: {
                    'test': '@fux/test-package'
                }
            }

            writeFileSync(tempConfigPath, JSON.stringify(testConfig, null, 2))

            // Start loading
            const loadPromise = configLoader.loadConfig()

            // Delete file while loading
            unlinkSync(tempConfigPath)

            // Should handle gracefully
            await expect(loadPromise).rejects.toThrow()
        })
    })
})
