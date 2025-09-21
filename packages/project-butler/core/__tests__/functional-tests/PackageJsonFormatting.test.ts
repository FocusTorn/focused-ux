import { describe, it, expect, beforeEach } from 'vitest'
import { PackageJsonFormattingService } from '../../src/services/PackageJsonFormatting.service'
import {
    setupTestEnvironment,
    resetAllMocks,
    setupFileSystemMocks,
    setupPathMocks,
    setupYamlMocks,
} from '../__mocks__/helpers'
import {
    setupPackageJsonSuccessScenario,
    setupPackageJsonConfigErrorScenario,
    // setupPackageJsonYamlErrorScenario,
    // createProjectButlerMockBuilder
} from '../__mocks__/mock-scenario-builder'

describe('PackageJsonFormatting', () => {
    let service: PackageJsonFormattingService
    let mocks: ReturnType<typeof setupTestEnvironment>

    beforeEach(() => { //>
        mocks = setupTestEnvironment()
        setupFileSystemMocks(mocks)
        setupPathMocks(mocks)
        setupYamlMocks(mocks)
		
        service = new PackageJsonFormattingService(mocks.fileSystem, mocks.yaml)
        resetAllMocks(mocks)
    }) //<

    describe('formatPackageJson', () => {
        it('should format package.json successfully', async () => { //>
            // Arrange
            const packageJsonPath = '/test/package.json'
            const workspaceRoot = '/test'
            const configContent = 'ProjectButler:\n  packageJson-order:\n    - name\n    - version\n    - scripts'
            const packageContent = JSON.stringify({
                scripts: { test: 'jest' },
                name: 'test-package',
                version: '1.0.0',
                dependencies: { lodash: '^4.17.21' },
            }, null, 2)

            setupPackageJsonSuccessScenario(mocks, {
                packageJsonPath,
                workspaceRoot,
                configContent,
                packageContent,
                expectedOrder: ['name', 'version', 'scripts', 'dependencies']
            })

            // Act
            await service.formatPackageJson(packageJsonPath, workspaceRoot)

            // Assert
            expect(mocks.fileSystem.readFile).toHaveBeenCalledWith('/test/.FocusedUX')
            expect(mocks.fileSystem.readFile).toHaveBeenCalledWith(packageJsonPath)
            expect(mocks.yaml.load).toHaveBeenCalledWith(configContent)
            expect(mocks.fileSystem.writeFile).toHaveBeenCalledWith(
                packageJsonPath,
                expect.stringContaining('"name": "test-package"'),
            )
        }) //<

        it('should handle missing .FocusedUX file', async () => { //>
            // Arrange
            const packageJsonPath = '/test/package.json'
            const workspaceRoot = '/test'

            setupPackageJsonConfigErrorScenario(mocks, {
                packageJsonPath,
                workspaceRoot,
                configContent: '',
                packageContent: ''
            })

            // Act & Assert
            await expect(service.formatPackageJson(packageJsonPath, workspaceRoot))
                .rejects
                .toThrow('Could not read \'.FocusedUX\' file: File not found')
        }) //<

        it('should handle invalid YAML in .FocusedUX', async () => { //>
            // Arrange
            const packageJsonPath = '/test/package.json'
            const workspaceRoot = '/test'
            const configContent = 'invalid: yaml: content:'

            mocks.fileSystem.readFile.mockResolvedValueOnce(configContent)
            mocks.yaml.load.mockImplementation(() => {
                throw new Error('Invalid YAML')
            })

            // Act & Assert
            await expect(service.formatPackageJson(packageJsonPath, workspaceRoot))
                .rejects
                .toThrow('Could not parse \'.FocusedUX\' file: Invalid YAML')
        }) //<

        it('should handle missing packageJson-order configuration', async () => { //>
            // Arrange
            const packageJsonPath = '/test/package.json'
            const workspaceRoot = '/test'
            const configContent = 'ProjectButler:\n  other-config: value'

            mocks.fileSystem.readFile.mockResolvedValueOnce(configContent)
            mocks.yaml.load.mockReturnValue({
                ProjectButler: {
                    'other-config': 'value',
                },
            })

            // Act & Assert
            await expect(service.formatPackageJson(packageJsonPath, workspaceRoot))
                .rejects
                .toThrow('Configuration Error: \'ProjectButler.packageJson-order\' not found or invalid in \'.FocusedUX\'.')
        }) //<

        it('should handle missing package.json file', async () => { //>
            // Arrange
            const packageJsonPath = '/test/package.json'
            const workspaceRoot = '/test'
            const configContent = 'ProjectButler:\n  packageJson-order:\n    - name\n    - version'

            mocks.fileSystem.readFile
                .mockResolvedValueOnce(configContent)
                .mockRejectedValueOnce(new Error('Package.json not found'))

            mocks.yaml.load.mockReturnValue({
                ProjectButler: {
                    'packageJson-order': ['name', 'version'],
                },
            })

            // Act & Assert
            await expect(service.formatPackageJson(packageJsonPath, workspaceRoot))
                .rejects
                .toThrow('Could not read \'package.json\' file: Package.json not found')
        }) //<

        it('should ensure name is always first in order', async () => { //>
            // Arrange
            const packageJsonPath = '/test/package.json'
            const workspaceRoot = '/test'
            const configContent = 'ProjectButler:\n  packageJson-order:\n    - version\n    - scripts'
            const packageContent = JSON.stringify({
                name: 'test-package',
                version: '1.0.0',
                scripts: { test: 'jest' },
            }, null, 2)

            mocks.fileSystem.readFile
                .mockResolvedValueOnce(configContent)
                .mockResolvedValueOnce(packageContent)

            mocks.yaml.load.mockReturnValue({
                ProjectButler: {
                    'packageJson-order': ['version', 'scripts'],
                },
            })

            // Act
            await service.formatPackageJson(packageJsonPath, workspaceRoot)

            // Assert
            expect(mocks.fileSystem.writeFile).toHaveBeenCalledWith(
                packageJsonPath,
                expect.stringContaining('"name": "test-package"'),
            )
			
            // Verify the order is correct
            const writtenContent = mocks.fileSystem.writeFile.mock.calls[0][1]
            const parsed = JSON.parse(writtenContent)
            const keys = Object.keys(parsed)

            expect(keys[0]).toBe('name')
            expect(keys[1]).toBe('version')
            expect(keys[2]).toBe('scripts')
        }) //<

        it('should handle unknown keys by placing them at the end', async () => { //>
            // Arrange
            const packageJsonPath = '/test/package.json'
            const workspaceRoot = '/test'
            const configContent = 'ProjectButler:\n  packageJson-order:\n    - name\n    - version'
            const packageContent = JSON.stringify({
                name: 'test-package',
                version: '1.0.0',
                unknownKey: 'value',
                scripts: { test: 'jest' },
            }, null, 2)

            mocks.fileSystem.readFile
                .mockResolvedValueOnce(configContent)
                .mockResolvedValueOnce(packageContent)

            mocks.yaml.load.mockReturnValue({
                ProjectButler: {
                    'packageJson-order': ['name', 'version'],
                },
            })

            // Act
            await service.formatPackageJson(packageJsonPath, workspaceRoot)

            // Assert
            const writtenContent = mocks.fileSystem.writeFile.mock.calls[0][1]
            const parsed = JSON.parse(writtenContent)
            const keys = Object.keys(parsed)
			
            expect(keys[0]).toBe('name')
            expect(keys[1]).toBe('version')
            expect(keys[2]).toBe('unknownKey')
            expect(keys[3]).toBe('scripts')
        }) //<

        it('should preserve comment-like keys', async () => { //>
            // Arrange
            const packageJsonPath = '/test/package.json'
            const workspaceRoot = '/test'
            const configContent = 'ProjectButler:\n  packageJson-order:\n    - name\n    - version'
            const packageContent = JSON.stringify({
                'name': 'test-package',
                'version': '1.0.0',
                '=comment=': 'This is a comment',
                'scripts': { test: 'jest' },
            }, null, 2)

            mocks.fileSystem.readFile
                .mockResolvedValueOnce(configContent)
                .mockResolvedValueOnce(packageContent)

            mocks.yaml.load.mockReturnValue({
                ProjectButler: {
                    'packageJson-order': ['name', 'version'],
                },
            })

            // Act
            await service.formatPackageJson(packageJsonPath, workspaceRoot)

            // Assert
            const writtenContent = mocks.fileSystem.writeFile.mock.calls[0][1]
            const parsed = JSON.parse(writtenContent)
			
            expect(parsed['=comment=']).toBe('This is a comment')
        }) //<
    })
	
    //==================================================================================================================================
	
    describe('getUnknownKeys', () => {
        it('should identify unknown keys correctly', () => { //>
            // Arrange
            const packageData = {
                name: 'test',
                version: '1.0.0',
                unknownKey: 'value',
                scripts: { test: 'jest' },
            }
            const masterOrder = ['name', 'version', 'scripts']

            // Act
            const unknownKeys = service.getUnknownKeys(packageData, masterOrder)

            // Assert
            expect(unknownKeys).toEqual(['unknownKey'])
        }) //<

        it('should ignore comment-like keys', () => { //>
            // Arrange
            const packageData = {
                'name': 'test',
                '=comment=': 'This is a comment',
                'unknownKey': 'value',
            }
            const masterOrder = ['name']

            // Act
            const unknownKeys = service.getUnknownKeys(packageData, masterOrder)

            // Assert
            expect(unknownKeys).toEqual(['unknownKey'])
        }) //<
    })

    describe('getUnknownKeys Edge Cases', () => {
        it('should handle empty package data', () => {
            // Arrange
            const packageData = {}
            const masterOrder = ['name', 'version']

            // Act
            const unknownKeys = service.getUnknownKeys(packageData, masterOrder)

            // Assert
            expect(unknownKeys).toEqual([])
        })

        it('should handle package data with only known keys', () => {
            // Arrange
            const packageData = {
                name: 'test',
                version: '1.0.0',
                scripts: { test: 'jest' },
            }
            const masterOrder = ['name', 'version', 'scripts']

            // Act
            const unknownKeys = service.getUnknownKeys(packageData, masterOrder)

            // Assert
            expect(unknownKeys).toEqual([])
        })

        it('should handle multiple unknown keys', () => {
            // Arrange
            const packageData = {
                name: 'test',
                version: '1.0.0',
                unknownKey1: 'value1',
                unknownKey2: 'value2',
                scripts: { test: 'jest' },
                '=comment=': 'This is a comment',
            }
            const masterOrder = ['name', 'version', 'scripts']

            // Act
            const unknownKeys = service.getUnknownKeys(packageData, masterOrder)

            // Assert
            expect(unknownKeys).toEqual(['unknownKey1', 'unknownKey2'])
        })

        it('should handle various comment-like key patterns', () => {
            // Arrange
            const packageData = {
                name: 'test',
                '=comment=': 'This is a comment',
                '=another-comment=': 'Another comment',
                '=special-chars@#$=': 'Special chars comment',
                unknownKey: 'value',
            }
            const masterOrder = ['name']

            // Act
            const unknownKeys = service.getUnknownKeys(packageData, masterOrder)

            // Assert
            expect(unknownKeys).toEqual(['unknownKey'])
        })

        it('should handle keys that partially match comment pattern', () => {
            // Arrange
            const packageData = {
                name: 'test',
                '=comment=': 'This is a comment',
                'not-a-comment=': 'This is not a comment',
                '=not-a-comment': 'This is not a comment either',
                '=comment': 'This is not a comment',
                'comment=': 'This is not a comment',
            }
            const masterOrder = ['name']

            // Act
            const unknownKeys = service.getUnknownKeys(packageData, masterOrder)

            // Assert
            expect(unknownKeys).toEqual(['not-a-comment=', '=not-a-comment', '=comment', 'comment='])
        })

        it('should handle complex nested objects in unknown keys', () => {
            // Arrange
            const packageData = {
                name: 'test',
                unknownComplexKey: {
                    nested: {
                        deeply: {
                            value: 'complex'
                        }
                    },
                    array: [1, 2, 3],
                    function: () =>
                        'test'
                },
                scripts: { test: 'jest' },
            }
            const masterOrder = ['name', 'scripts']

            // Act
            const unknownKeys = service.getUnknownKeys(packageData, masterOrder)

            // Assert
            expect(unknownKeys).toEqual(['unknownComplexKey'])
        })
    })

    describe('Complex Package.json Scenarios', () => {
        it('should handle deeply nested package.json with complex dependencies', async () => {
            // Arrange
            const packageJsonPath = '/complex-project/package.json'
            const workspaceRoot = '/complex-project'
            const configContent = `ProjectButler:
  packageJson-order:
    - name
    - version
    - description
    - main
    - types
    - scripts
    - dependencies
    - devDependencies
    - peerDependencies
    - optionalDependencies
    - engines
    - repository
    - keywords
    - author
    - license`
			
            const complexPackageContent = JSON.stringify({
                keywords: ['typescript', 'vscode', 'extension'],
                license: 'MIT',
                author: 'John Doe <john@example.com>',
                repository: {
                    type: 'git',
                    url: 'https://github.com/example/complex-project.git'
                },
                engines: {
                    vscode: '^1.99.0'
                },
                optionalDependencies: {
                    'optional-package': '^1.0.0'
                },
                peerDependencies: {
                    'peer-package': '^2.0.0'
                },
                devDependencies: {
                    '@types/node': '^20.0.0',
                    'typescript': '^5.0.0',
                    'vitest': '^1.0.0'
                },
                dependencies: {
                    'lodash': '^4.17.21',
                    'react': '^18.0.0',
                    'axios': '^1.0.0'
                },
                scripts: {
                    'build': 'tsc',
                    'test': 'vitest',
                    'dev': 'vite'
                },
                types: './dist/index.d.ts',
                main: './dist/index.js',
                description: 'A complex project with many dependencies',
                version: '1.0.0',
                name: 'complex-project'
            }, null, 2)

            mocks.fileSystem.readFile
                .mockResolvedValueOnce(configContent)
                .mockResolvedValueOnce(complexPackageContent)

            mocks.yaml.load.mockReturnValue({
                ProjectButler: {
                    'packageJson-order': [
                        'name', 'version', 'description', 'main', 'types', 'scripts',
                        'dependencies', 'devDependencies', 'peerDependencies', 'optionalDependencies',
                        'engines', 'repository', 'keywords', 'author', 'license'
                    ],
                },
            })

            // Act
            await service.formatPackageJson(packageJsonPath, workspaceRoot)

            // Assert
            expect(mocks.fileSystem.writeFile).toHaveBeenCalledWith(
                packageJsonPath,
                expect.stringContaining('"name": "complex-project"'),
            )
			
            // Verify the order is correct
            const writtenContent = mocks.fileSystem.writeFile.mock.calls[0][1]
            const parsed = JSON.parse(writtenContent)
            const keys = Object.keys(parsed)

            expect(keys[0]).toBe('name')
            expect(keys[1]).toBe('version')
            expect(keys[2]).toBe('description')
            expect(keys[3]).toBe('main')
            expect(keys[4]).toBe('types')
            expect(keys[5]).toBe('scripts')
            expect(keys[6]).toBe('dependencies')
            expect(keys[7]).toBe('devDependencies')
            expect(keys[8]).toBe('peerDependencies')
            expect(keys[9]).toBe('optionalDependencies')
            expect(keys[10]).toBe('engines')
            expect(keys[11]).toBe('repository')
            expect(keys[12]).toBe('keywords')
            expect(keys[13]).toBe('author')
            expect(keys[14]).toBe('license')
        })

        it('should handle monorepo package.json with workspace dependencies', async () => {
            // Arrange
            const packageJsonPath = '/monorepo/packages/core/package.json'
            const workspaceRoot = '/monorepo'
            const configContent = `ProjectButler:
  packageJson-order:
    - name
    - version
    - description
    - main
    - types
    - scripts
    - dependencies
    - devDependencies`
			
            const monorepoPackageContent = JSON.stringify({
                devDependencies: {
                    '@types/node': '^20.0.0',
                    'typescript': '^5.0.0'
                },
                dependencies: {
                    '@monorepo/shared': 'workspace:*',
                    '@monorepo/ui': 'workspace:*',
                    'lodash': '^4.17.21'
                },
                scripts: {
                    'build': 'tsc',
                    'test': 'vitest'
                },
                types: './dist/index.d.ts',
                main: './dist/index.js',
                description: 'Core package for monorepo',
                version: '1.0.0',
                name: '@monorepo/core'
            }, null, 2)

            mocks.fileSystem.readFile
                .mockResolvedValueOnce(configContent)
                .mockResolvedValueOnce(monorepoPackageContent)

            mocks.yaml.load.mockReturnValue({
                ProjectButler: {
                    'packageJson-order': ['name', 'version', 'description', 'main', 'types', 'scripts', 'dependencies', 'devDependencies'],
                },
            })

            // Act
            await service.formatPackageJson(packageJsonPath, workspaceRoot)

            // Assert
            expect(mocks.fileSystem.writeFile).toHaveBeenCalledWith(
                packageJsonPath,
                expect.stringContaining('"name": "@monorepo/core"'),
            )
			
            // Verify workspace dependencies are preserved
            const writtenContent = mocks.fileSystem.writeFile.mock.calls[0][1]
            const parsed = JSON.parse(writtenContent)
			
            expect(parsed.dependencies['@monorepo/shared']).toBe('workspace:*')
            expect(parsed.dependencies['@monorepo/ui']).toBe('workspace:*')
        })

        it('should handle package.json with complex nested objects', async () => {
            // Arrange
            const packageJsonPath = '/nested-project/package.json'
            const workspaceRoot = '/nested-project'
            const configContent = `ProjectButler:
  packageJson-order:
    - name
    - version
    - scripts
    - dependencies`
			
            const nestedPackageContent = JSON.stringify({
                dependencies: {
                    'react': '^18.0.0',
                    'react-dom': '^18.0.0'
                },
                scripts: {
                    'build': 'webpack --mode production',
                    'dev': 'webpack serve --mode development',
                    'test': 'jest --coverage',
                    'lint': 'eslint src/ --ext .ts,.tsx',
                    'format': 'prettier --write src/'
                },
                version: '2.1.0',
                name: 'nested-project'
            }, null, 2)

            mocks.fileSystem.readFile
                .mockResolvedValueOnce(configContent)
                .mockResolvedValueOnce(nestedPackageContent)

            mocks.yaml.load.mockReturnValue({
                ProjectButler: {
                    'packageJson-order': ['name', 'version', 'scripts', 'dependencies'],
                },
            })

            // Act
            await service.formatPackageJson(packageJsonPath, workspaceRoot)

            // Assert
            expect(mocks.fileSystem.writeFile).toHaveBeenCalledWith(
                packageJsonPath,
                expect.stringContaining('"name": "nested-project"'),
            )
			
            // Verify nested objects are preserved
            const writtenContent = mocks.fileSystem.writeFile.mock.calls[0][1]
            const parsed = JSON.parse(writtenContent)
			
            expect(parsed.scripts.build).toBe('webpack --mode production')
            expect(parsed.scripts.dev).toBe('webpack serve --mode development')
            expect(parsed.dependencies.react).toBe('^18.0.0')
        })
    })
})
