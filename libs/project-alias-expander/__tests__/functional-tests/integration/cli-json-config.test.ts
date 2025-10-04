import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { writeFileSync, unlinkSync, existsSync } from 'fs'
import { join } from 'path'
import { execa } from 'execa'
import type { AliasConfig } from '../../../src/_types/index.js'

describe('CLI Integration with JSON Config', () => {
    let tempDir: string
    let tempConfigPath: string
    let originalCwd: string

    beforeEach(() => {
        tempDir = process.cwd()
        tempConfigPath = join(tempDir, '.pae.json')
        originalCwd = process.cwd()
    })

    afterEach(() => {
        if (existsSync(tempConfigPath)) {
            unlinkSync(tempConfigPath)
        }
        process.chdir(originalCwd)
    })

    describe('CLI with valid JSON config', () => {
        beforeEach(() => {
            const testConfig: AliasConfig = {
                nxPackages: {
                    'test': '@fux/test-package',
                    'testc': { name: 'test-package', suffix: 'core' },
                    'teste': { name: 'test-package', suffix: 'ext' }
                },
                nxTargets: {
                    'b': 'build',
                    't': 'test',
                    'l': 'lint'
                },
                'expandable-flags': {
                    'f': '--fix',
                    'v': '--verbose'
                },
                commands: {
                    'help': 'Show help information'
                }
            }

            writeFileSync(tempConfigPath, JSON.stringify(testConfig, null, 2))
        })

        it('should execute help command successfully', async () => {
            const result = await execa('pae', ['help'], {
                cwd: tempDir,
                reject: false
            })

            expect(result.exitCode).toBe(0)
            expect(result.stdout).toContain('PAE - Project Alias Expander')
            expect(result.stdout).toContain('test')
            expect(result.stdout).toContain('testc')
            expect(result.stdout).toContain('teste')
        })

        it('should handle debug flag', async () => {
            const result = await execa('pae', ['help', '-d'], {
                cwd: tempDir,
                reject: false
            })

            expect(result.exitCode).toBe(0)
            expect(result.stderr).toContain('[PAE DEBUG]')
        })

        it('should show validation warnings for invalid config', async () => {
            // Create invalid config
            const invalidConfig = {
                nxPackages: {
                    'valid': '@fux/valid-package',
                    'invalid': { /* missing name */ }
                }
            }

            writeFileSync(tempConfigPath, JSON.stringify(invalidConfig, null, 2))

            const result = await execa('pae', ['help'], {
                cwd: tempDir,
                reject: false
            })

            expect(result.exitCode).toBe(0)
            // Should still work but with warnings
            expect(result.stdout).toContain('PAE - Project Alias Expander')
        })
    })

    describe('CLI error handling', () => {
        it('should show error when config file is missing', async () => {
            const result = await execa('pae', ['help'], {
                cwd: tempDir,
                reject: false
            })

            expect(result.exitCode).toBe(1)
            expect(result.stderr).toContain('Failed to load configuration')
            expect(result.stderr).toContain('Make sure you are running from the project root directory')
            expect(result.stderr).toContain('The .pae.json file should be located at: .pae.json')
        })

        it('should show error for invalid JSON', async () => {
            writeFileSync(tempConfigPath, '{ invalid json }')

            const result = await execa('pae', ['help'], {
                cwd: tempDir,
                reject: false
            })

            expect(result.exitCode).toBe(1)
            expect(result.stderr).toContain('Failed to load configuration')
        })

        it('should show current working directory in error', async () => {
            const result = await execa('pae', ['help'], {
                cwd: tempDir,
                reject: false
            })

            expect(result.exitCode).toBe(1)
            expect(result.stderr).toContain('Current working directory:')
            expect(result.stderr).toContain(tempDir)
        })

        it('should suggest debug flag for troubleshooting', async () => {
            const result = await execa('pae', ['help'], {
                cwd: tempDir,
                reject: false
            })

            expect(result.exitCode).toBe(1)
            expect(result.stderr).toContain('To debug this issue, run: pae <command> -d')
        })
    })

    describe('CLI with different working directories', () => {
        it('should work from project root', async () => {
            const testConfig: AliasConfig = {
                nxPackages: {
                    'test': '@fux/test-package'
                }
            }

            writeFileSync(tempConfigPath, JSON.stringify(testConfig, null, 2))

            const result = await execa('pae', ['help'], {
                cwd: tempDir,
                reject: false
            })

            expect(result.exitCode).toBe(0)
        })

        it('should work from subdirectory', async () => {
            const testConfig: AliasConfig = {
                nxPackages: {
                    'test': '@fux/test-package'
                }
            }

            writeFileSync(tempConfigPath, JSON.stringify(testConfig, null, 2))

            // Create a subdirectory and test from there
            const subDir = join(tempDir, 'subdir')
            require('fs').mkdirSync(subDir, { recursive: true })

            const result = await execa('pae', ['help'], {
                cwd: subDir,
                reject: false
            })

            expect(result.exitCode).toBe(0)

            // Clean up
            require('fs').rmdirSync(subDir)
        })
    })

    describe('CLI performance with caching', () => {
        it('should be fast on subsequent calls due to caching', async () => {
            const testConfig: AliasConfig = {
                nxPackages: {
                    'test': '@fux/test-package'
                }
            }

            writeFileSync(tempConfigPath, JSON.stringify(testConfig, null, 2))

            // First call
            const start1 = Date.now()
            const result1 = await execa('pae', ['help'], {
                cwd: tempDir,
                reject: false
            })
            const time1 = Date.now() - start1

            expect(result1.exitCode).toBe(0)

            // Second call should be faster due to caching
            const start2 = Date.now()
            const result2 = await execa('pae', ['help'], {
                cwd: tempDir,
                reject: false
            })
            const time2 = Date.now() - start2

            expect(result2.exitCode).toBe(0)
            // Note: This is a basic test - actual performance may vary
            expect(time2).toBeLessThanOrEqual(time1)
        })
    })
})
