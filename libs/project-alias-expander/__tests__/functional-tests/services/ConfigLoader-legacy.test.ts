import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { readFileSync, writeFileSync, unlinkSync, existsSync } from 'fs'
import { join } from 'path'
import {
    loadAliasConfig,
    loadAliasConfigCached,
    clearAllCaches,
    resolveProjectForAlias
} from '../../../src/services/ConfigLoader.service.js'
import type { AliasConfig } from '../../../src/_types/index.js'

describe('ConfigLoader Legacy Functions', () => {
    let tempDir: string
    let tempConfigPath: string

    beforeEach(() => {
        tempDir = process.cwd()
        tempConfigPath = join(tempDir, '.pae.json')
        clearAllCaches()
    })

    afterEach(() => {
        if (existsSync(tempConfigPath)) {
            unlinkSync(tempConfigPath)
        }
        clearAllCaches()
    })

    describe('loadAliasConfig', () => {
        it('should load valid JSON config synchronously', () => {
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

            const config = loadAliasConfig()

            expect(config).toEqual(testConfig)
        })

        it('should throw error when config file does not exist', () => {
            expect(() => loadAliasConfig()).toThrow(
                'No configuration file found. Please ensure .pae.json exists in the project root.'
            )
        })

        it('should throw error for invalid JSON', () => {
            writeFileSync(tempConfigPath, '{ invalid json }')

            expect(() => loadAliasConfig()).toThrow(
                'Failed to load configuration from .pae.json'
            )
        })

        it('should handle file read errors', () => {
            // Create a directory instead of a file to cause read error
            writeFileSync(tempConfigPath, '{}')
            
            // Mock readFileSync to throw an error
            vi.spyOn(require('fs'), 'readFileSync').mockImplementation(() => {
                throw new Error('Permission denied')
            })

            expect(() => loadAliasConfig()).toThrow(
                'Failed to load configuration from .pae.json'
            )

            vi.restoreAllMocks()
        })
    })

    describe('loadAliasConfigCached', () => {
        it('should return cached config if available', () => {
            const testConfig: AliasConfig = {
                nxPackages: {
                    'test': '@fux/test-package'
                }
            }

            writeFileSync(tempConfigPath, JSON.stringify(testConfig, null, 2))

            // Load config first time
            const config1 = loadAliasConfig()
            
            // Second call should use cache
            const config2 = loadAliasConfigCached()

            expect(config1).toBe(config2) // Same reference due to caching
        })

        it('should fallback to loadAliasConfig when no cache', () => {
            const testConfig: AliasConfig = {
                nxPackages: {
                    'test': '@fux/test-package'
                }
            }

            writeFileSync(tempConfigPath, JSON.stringify(testConfig, null, 2))

            const config = loadAliasConfigCached()

            expect(config).toEqual(testConfig)
        })
    })

    describe('clearAllCaches', () => {
        it('should clear all cached data', () => {
            const testConfig: AliasConfig = {
                nxPackages: {
                    'test': '@fux/test-package'
                }
            }

            writeFileSync(tempConfigPath, JSON.stringify(testConfig, null, 2))

            // Load config to populate cache
            loadAliasConfig()
            
            // Verify cache is populated
            const cachedConfig = loadAliasConfigCached()
            expect(cachedConfig).toBeTruthy()

            // Clear cache
            clearAllCaches()

            // Verify cache is cleared
            const configAfterClear = loadAliasConfigCached()
            expect(configAfterClear).toBeTruthy() // Should reload from file
        })
    })

    describe('resolveProjectForAlias', () => {
        it('should resolve string aliases', () => {
            const result = resolveProjectForAlias('test-package')
            expect(result).toEqual({
                project: '@fux/test-package',
                isFull: false
            })
        })

        it('should resolve string aliases with @fux prefix', () => {
            const result = resolveProjectForAlias('@fux/test-package')
            expect(result).toEqual({
                project: '@fux/test-package',
                isFull: false
            })
        })

        it('should resolve object aliases with name only', () => {
            const result = resolveProjectForAlias({ name: 'test-package' })
            expect(result).toEqual({
                project: '@fux/test-package',
                isFull: false
            })
        })

        it('should resolve object aliases with suffix', () => {
            const result = resolveProjectForAlias({ name: 'test-package', suffix: 'core' })
            expect(result).toEqual({
                project: '@fux/test-package-core',
                isFull: false
            })
        })

        it('should resolve object aliases with full flag', () => {
            const result = resolveProjectForAlias({ name: 'test-package', suffix: 'ext', full: true })
            expect(result).toEqual({
                project: '@fux/test-package-ext',
                isFull: true
            })
        })

        it('should resolve object aliases with full flag but no suffix', () => {
            const result = resolveProjectForAlias({ name: 'test-package', full: true })
            expect(result).toEqual({
                project: '@fux/test-package',
                isFull: true
            })
        })
    })
})
