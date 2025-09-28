import { describe, it, expect, beforeEach, vi } from 'vitest'
import { loadAliasConfig, resolveProjectForAlias } from '../../src/config.js'

// Mock fs
vi.mock('fs', () => ({
    default: {
        existsSync: vi.fn(),
        readFileSync: vi.fn()
    },
    existsSync: vi.fn(),
    readFileSync: vi.fn()
}))

// Mock strip-json-comments
vi.mock('strip-json-comments', () => ({
    default: vi.fn()
}))

import * as fs from 'fs'
import stripJsonComments from 'strip-json-comments'

describe('Config Loading and Resolution', () => {
    let mockFs: typeof fs
    let mockStripJsonComments: ReturnType<typeof vi.mocked>

    beforeEach(() => {
        mockFs = vi.mocked(fs)
        mockStripJsonComments = vi.mocked(stripJsonComments)
        
        // Reset all mocks
        vi.clearAllMocks()
        
        // Reset environment
        delete process.env.PAE_DEBUG
    })

    describe('loadAliasConfig', () => {
        it('should load config from project root location', () => {
            // Arrange
            const configContent = JSON.stringify({
                'nxPackages': {
                    'pbc': { name: 'project-butler', suffix: 'core' }
                },
                'nxTargets': {
                    'b': 'build'
                }
            })
            
            mockFs.existsSync.mockImplementation((path) => {
                return path.toString().includes('libs/project-alias-expander/config.json')
            })
            mockFs.readFileSync.mockReturnValue(configContent)
            mockStripJsonComments.mockReturnValue(configContent)

            // Act
            const result = loadAliasConfig()

            // Assert
            expect(result).toEqual({
                'nxPackages': {
                    'pbc': { name: 'project-butler', suffix: 'core' }
                },
                'nxTargets': {
                    'b': 'build'
                }
            })
        })

        it('should try multiple config locations', () => {
            // Arrange
            const configContent = JSON.stringify({
                'nxPackages': {
                    'pbc': { name: 'project-butler', suffix: 'core' }
                }
            })
            
            mockFs.existsSync.mockImplementation((path) => {
                return path.toString().includes('config.json')
            })
            mockFs.readFileSync.mockReturnValue(configContent)
            mockStripJsonComments.mockReturnValue(configContent)

            // Act
            const result = loadAliasConfig()

            // Assert
            expect(result).toBeDefined()
            expect(mockFs.existsSync).toHaveBeenCalledTimes(4) // Should try all 4 locations
        })

        it('should handle config with comments', () => {
            // Arrange
            const configWithComments = `{
                // This is a comment
                "nxPackages": {
                    "pbc": { "name": "project-butler", "suffix": "core" }
                }
            }`
            const strippedContent = JSON.stringify({
                'nxPackages': {
                    'pbc': { name: 'project-butler', suffix: 'core' }
                }
            })
            
            mockFs.existsSync.mockReturnValue(true)
            mockFs.readFileSync.mockReturnValue(configWithComments)
            mockStripJsonComments.mockReturnValue(strippedContent)

            // Act
            const result = loadAliasConfig()

            // Assert
            expect(result).toEqual({
                'nxPackages': {
                    'pbc': { name: 'project-butler', suffix: 'core' }
                }
            })
            expect(mockStripJsonComments).toHaveBeenCalledWith(configWithComments)
        })

        it('should throw error when config file not found', () => {
            // Arrange
            mockFs.existsSync.mockReturnValue(false)

            // Act & Assert
            expect(() => loadAliasConfig()).toThrow('Config file not found')
        })

        it('should throw error when JSON parsing fails', () => {
            // Arrange
            mockFs.existsSync.mockReturnValue(true)
            mockFs.readFileSync.mockReturnValue('{ invalid json }')
            mockStripJsonComments.mockReturnValue('{ invalid json }')

            // Act & Assert
            expect(() => loadAliasConfig()).toThrow()
        })

        it('should throw error when strip-json-comments fails', () => {
            // Arrange
            mockFs.existsSync.mockReturnValue(true)
            mockFs.readFileSync.mockReturnValue('{ invalid json }')
            mockStripJsonComments.mockImplementation(() => {
                throw new Error('Invalid JSON')
            })

            // Act & Assert
            expect(() => loadAliasConfig()).toThrow('Invalid JSON')
        })

        it('should handle file system errors gracefully', () => {
            // Arrange
            mockFs.existsSync.mockImplementation(() => {
                throw new Error('Permission denied')
            })

            // Act & Assert
            expect(() => loadAliasConfig()).toThrow('Permission denied')
        })

        it('should load complex config with all sections', () => {
            // Arrange
            const configContent = JSON.stringify({
                'nxPackages': {
                    'pbc': { name: 'project-butler', suffix: 'core' },
                    'pbe': { name: 'project-butler', suffix: 'ext' },
                    'pb': '@fux/project-butler'
                },
                'nxTargets': {
                    'b': 'build',
                    't': 'test',
                    'l': 'lint'
                },
                'feature-nxTargets': {
                    'aka': {
                        'run-from': 'core',
                        'run-target': 'build'
                    }
                },
                'not-nxTargets': {
                    'help': 'help',
                    'version': 'version'
                },
                'expandable-flags': {
                    'f': '--fix',
                    's': '--skip-nx-cache'
                },
                'expandable-templates': {
                    'sto': {
                        'position': 'prefix',
                        'template': 'timeout {duration}s',
                        'defaults': { duration: '10' }
                    }
                }
            })
            
            mockFs.existsSync.mockReturnValue(true)
            mockFs.readFileSync.mockReturnValue(configContent)
            mockStripJsonComments.mockReturnValue(configContent)

            // Act
            const result = loadAliasConfig()

            // Assert
            expect(result).toEqual({
                'nxPackages': {
                    'pbc': { name: 'project-butler', suffix: 'core' },
                    'pbe': { name: 'project-butler', suffix: 'ext' },
                    'pb': '@fux/project-butler'
                },
                'nxTargets': {
                    'b': 'build',
                    't': 'test',
                    'l': 'lint'
                },
                'feature-nxTargets': {
                    'aka': {
                        'run-from': 'core',
                        'run-target': 'build'
                    }
                },
                'not-nxTargets': {
                    'help': 'help',
                    'version': 'version'
                },
                'expandable-flags': {
                    'f': '--fix',
                    's': '--skip-nx-cache'
                },
                'expandable-templates': {
                    'sto': {
                        'position': 'prefix',
                        'template': 'timeout {duration}s',
                        'defaults': { duration: '10' }
                    }
                }
            })
        })
    })

    describe('resolveProjectForAlias', () => {
        it('should resolve string alias with @fux/ prefix', () => {
            // Arrange
            const aliasValue = '@fux/project-butler'

            // Act
            const result = resolveProjectForAlias(aliasValue)

            // Assert
            expect(result).toEqual({
                project: '@fux/project-butler',
                isFull: false
            })
        })

        it('should add @fux/ prefix to string alias without it', () => {
            // Arrange
            const aliasValue = 'project-butler'

            // Act
            const result = resolveProjectForAlias(aliasValue)

            // Assert
            expect(result).toEqual({
                project: '@fux/project-butler',
                isFull: false
            })
        })

        it('should resolve object alias with suffix', () => {
            // Arrange
            const aliasValue = { name: 'project-butler', suffix: 'core' as const }

            // Act
            const result = resolveProjectForAlias(aliasValue)

            // Assert
            expect(result).toEqual({
                project: '@fux/project-butler-core',
                isFull: false
            })
        })

        it('should resolve object alias with ext suffix', () => {
            // Arrange
            const aliasValue = { name: 'project-butler', suffix: 'ext' as const }

            // Act
            const result = resolveProjectForAlias(aliasValue)

            // Assert
            expect(result).toEqual({
                project: '@fux/project-butler-ext',
                isFull: false
            })
        })

        it('should resolve object alias with full flag set to true', () => {
            // Arrange
            const aliasValue = { name: 'project-butler', suffix: 'ext' as const, full: true }

            // Act
            const result = resolveProjectForAlias(aliasValue)

            // Assert
            expect(result).toEqual({
                project: '@fux/project-butler-ext',
                isFull: true
            })
        })

        it('should resolve object alias with full flag set to false', () => {
            // Arrange
            const aliasValue = { name: 'project-butler', suffix: 'core' as const, full: false }

            // Act
            const result = resolveProjectForAlias(aliasValue)

            // Assert
            expect(result).toEqual({
                project: '@fux/project-butler-core',
                isFull: false
            })
        })

        it('should resolve object alias without suffix', () => {
            // Arrange
            const aliasValue = { name: 'project-butler' }

            // Act
            const result = resolveProjectForAlias(aliasValue)

            // Assert
            expect(result).toEqual({
                project: '@fux/project-butler',
                isFull: false
            })
        })

        it('should handle object alias with @fux/ prefix in name', () => {
            // Arrange
            const aliasValue = { name: '@fux/project-butler', suffix: 'core' as const }

            // Act
            const result = resolveProjectForAlias(aliasValue)

            // Assert
            expect(result).toEqual({
                project: '@fux/project-butler-core',
                isFull: false
            })
        })

        it('should handle edge cases with empty strings', () => {
            // Arrange
            const aliasValue = { name: '', suffix: 'core' as const }

            // Act
            const result = resolveProjectForAlias(aliasValue)

            // Assert
            expect(result).toEqual({
                project: '@fux/-core',
                isFull: false
            })
        })

        it('should handle special characters in project names', () => {
            // Arrange
            const aliasValue = { name: 'project-with-dashes', suffix: 'core' as const }

            // Act
            const result = resolveProjectForAlias(aliasValue)

            // Assert
            expect(result).toEqual({
                project: '@fux/project-with-dashes-core',
                isFull: false
            })
        })

        it('should handle numeric project names', () => {
            // Arrange
            const aliasValue = { name: '123', suffix: 'core' as const }

            // Act
            const result = resolveProjectForAlias(aliasValue)

            // Assert
            expect(result).toEqual({
                project: '@fux/123-core',
                isFull: false
            })
        })
    })
})
