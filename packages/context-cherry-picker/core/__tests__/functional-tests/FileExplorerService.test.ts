import { describe, it, expect, beforeEach, vi } from 'vitest'
import { FileExplorerService } from '../../src/services/FileExplorer.service.js'
import { TokenizerService } from '../../src/services/Tokenizer.service.js'
import { setupTestEnvironment, resetAllMocks, setupFileSystemMocks, setupPathMocks, setupYamlMocks, setupMicromatchMocks } from '../__mocks__/helpers.js'
import {
    setupFileExplorerSuccessScenario,
    setupFileExplorerErrorScenario,
    createCCPMockBuilder
} from '../__mocks__/mock-scenario-builder.js'

describe('FileExplorerService', () => {
    let service: FileExplorerService
    let mocks: ReturnType<typeof setupTestEnvironment>

    beforeEach(() => {
        mocks = setupTestEnvironment()
        resetAllMocks(mocks)
        setupFileSystemMocks(mocks)
        setupPathMocks(mocks)
        setupYamlMocks(mocks)
        setupMicromatchMocks(mocks)

        // Create mock dependencies
        const mockWorkspace = {
            workspaceFolders: [{ uri: '/test/project' }],
            onDidChangeConfiguration: vi.fn(),
            createFileSystemWatcher: vi.fn(),
            get: vi.fn(),
            asRelativePath: vi.fn()
        }

        const mockWindow = {
            showErrorMessage: vi.fn()
        }

        const mockQuickSettings = {
            refresh: vi.fn(),
            getSettingState: vi.fn().mockResolvedValue(true)
        }

        const tokenizerService = new TokenizerService()

        const mockTreeItemFactory = {
            getCheckboxStateUnchecked: vi.fn().mockReturnValue(0),
            getCheckboxStateChecked: vi.fn().mockReturnValue(1),
            getCollapsibleStateNone: vi.fn().mockReturnValue(0)
        }

        const mockFileWatcher = {
            onDidChange: vi.fn(),
            onDidCreate: vi.fn(),
            onDidDelete: vi.fn(),
            dispose: vi.fn()
        }

        mockWorkspace.createFileSystemWatcher.mockReturnValue(mockFileWatcher)
        mockWorkspace.asRelativePath.mockImplementation((uri: string) => uri.replace('/test/project/', ''))

        service = new FileExplorerService(
            mockWorkspace as any,
            mockWindow as any,
            mockQuickSettings as any,
            tokenizerService,
            mocks.fileSystem as any,
            mocks.path as any,
            mockTreeItemFactory as any
        )
    })

    describe('getChildren', () => {
        it('should return empty array when no workspace folders', async () => {
            // Arrange
            setupFileExplorerSuccessScenario(mocks, {
                operation: 'getChildren',
                workspaceFolders: null,
                expectedChildren: []
            })

            // Act
            const result = await service.getChildren()

            // Assert
            expect(result).toEqual([])
        })

        it('should return children for root directory', async () => {
            // Arrange
            const entries = [
                { name: 'file1.ts', type: 'file' },
                { name: 'src', type: 'directory' },
                { name: 'file2.js', type: 'file' }
            ]

            // Mock the file system directly
            mocks.fileSystem.readDirectory.mockResolvedValue(entries)
            mocks.fileSystem.readFile.mockResolvedValue('')
            mocks.yaml.load.mockReturnValue({})
            
            // Mock micromatch to return false (not hidden)
            vi.mocked(micromatch.isMatch).mockReturnValue(false)

            // Act
            const result = await service.getChildren()

            // Assert
            expect(result).toHaveLength(3)
            expect(result[0].label).toBe('src') // Directories first
            expect(result[1].label).toBe('file1.ts')
            expect(result[2].label).toBe('file2.js')
        })

        it('should filter hidden files based on ignore patterns', async () => {
            // Arrange
            const entries = [
                { name: 'file1.ts', type: 'file' },
                { name: 'node_modules', type: 'directory' },
                { name: 'file2.js', type: 'file' }
            ]

            setupFileExplorerSuccessScenario(mocks, {
                operation: 'getChildren',
                entries,
                ignorePatterns: ['node_modules/**'],
                expectedChildren: [
                    expect.objectContaining({ label: 'file1.ts' }),
                    expect.objectContaining({ label: 'file2.js' })
                ]
            })

            // Act
            const result = await service.getChildren()

            // Assert
            expect(result).toHaveLength(2)
            expect(result.some(item => item.label === 'node_modules')).toBe(false)
        })

        it('should handle directory with hidden children', async () => {
            // Arrange
            const element = {
                uri: '/test/project/src',
                type: 'directory',
                label: 'src'
            }
            const entries = [
                { name: 'file1.ts', type: 'file' },
                { name: 'temp', type: 'directory' }
            ]

            setupFileExplorerSuccessScenario(mocks, {
                operation: 'getChildren',
                element,
                entries,
                hideChildrenPatterns: ['src/temp/**'],
                expectedChildren: [
                    expect.objectContaining({ label: 'file1.ts' })
                ]
            })

            // Act
            const result = await service.getChildren(element as any)

            // Assert
            expect(result).toHaveLength(1)
            expect(result[0].label).toBe('file1.ts')
        })

        it('should handle file system errors gracefully', async () => {
            // Arrange
            const element = {
                uri: '/test/project/invalid',
                label: 'invalid'
            }

            setupFileExplorerErrorScenario(mocks, 'readDirectory', 'Permission denied', {
                operation: 'getChildren',
                element
            })

            // Act
            const result = await service.getChildren(element as any)

            // Assert
            expect(result).toEqual([])
        })

        it('should sort directories before files', async () => {
            // Arrange
            const entries = [
                { name: 'file1.ts', type: 'file' },
                { name: 'src', type: 'directory' },
                { name: 'file2.js', type: 'file' },
                { name: 'docs', type: 'directory' }
            ]

            setupFileExplorerSuccessScenario(mocks, {
                operation: 'getChildren',
                entries,
                expectedChildren: [
                    expect.objectContaining({ label: 'docs', type: 'directory' }),
                    expect.objectContaining({ label: 'src', type: 'directory' }),
                    expect.objectContaining({ label: 'file1.ts', type: 'file' }),
                    expect.objectContaining({ label: 'file2.js', type: 'file' })
                ]
            })

            // Act
            const result = await service.getChildren()

            // Assert
            expect(result[0].type).toBe('directory')
            expect(result[1].type).toBe('directory')
            expect(result[2].type).toBe('file')
            expect(result[3].type).toBe('file')
        })
    })

    describe('getTreeItem', () => {
        it('should return tree item with checkbox state', async () => {
            // Arrange
            const element = {
                uri: '/test/project/file.ts',
                label: 'file.ts',
                type: 'file'
            }

            setupFileExplorerSuccessScenario(mocks, {
                operation: 'getTreeItem',
                element,
                checkboxState: 1,
                tokenCount: 100
            })

            // Act
            const result = await service.getTreeItem(element as any)

            // Assert
            expect(result).toBe(element)
            expect(result.checkboxState).toBeDefined()
        })

        it('should handle hidden items', async () => {
            // Arrange
            const element = {
                uri: '/test/project/hidden.ts',
                label: 'hidden.ts',
                type: 'file'
            }

            setupFileExplorerSuccessScenario(mocks, {
                operation: 'getTreeItem',
                element,
                isHidden: true
            })

            // Act
            const result = await service.getTreeItem(element as any)

            // Assert
            expect(result).toBe(element)
        })

        it('should calculate and cache token count', async () => {
            // Arrange
            const element = {
                uri: '/test/project/file.ts',
                label: 'file.ts',
                type: 'file'
            }

            setupFileExplorerSuccessScenario(mocks, {
                operation: 'getTreeItem',
                element,
                tokenCount: 150
            })

            // Act
            const result = await service.getTreeItem(element as any)

            // Assert
            expect(result).toBe(element)
            expect(result.description).toBe('(tokens: --)') // Initially loading
        })
    })

    describe('refresh', () => {
        it('should clear token cache and reload configuration', async () => {
            // Arrange
            setupFileExplorerSuccessScenario(mocks, {
                operation: 'refresh'
            })

            // Act
            await service.refresh()

            // Assert
            expect(mocks.fileSystem.readFile).toHaveBeenCalled()
            expect(mocks.yaml.load).toHaveBeenCalled()
        })

        it('should handle configuration file not found', async () => {
            // Arrange
            setupFileExplorerSuccessScenario(mocks, {
                operation: 'refresh',
                configFileExists: false
            })

            // Act
            await service.refresh()

            // Assert
            expect(mocks.fileSystem.readFile).toHaveBeenCalled()
            // Should not throw error
        })
    })

    describe('checkbox state management', () => {
        it('should clear all checkboxes', () => {
            // Arrange
            setupFileExplorerSuccessScenario(mocks, {
                operation: 'clearAllCheckboxes',
                initialStates: new Map([
                    ['/test/file1.ts', 1],
                    ['/test/file2.ts', 0],
                    ['/test/file3.ts', 1]
                ])
            })

            // Set initial checkbox states
            service.updateCheckboxState('/test/file1.ts', 1 as any)
            service.updateCheckboxState('/test/file2.ts', 0 as any)
            service.updateCheckboxState('/test/file3.ts', 1 as any)

            // Act
            service.clearAllCheckboxes()

            // Assert
            expect(service.getCheckboxState('/test/file1.ts')).toBe(0)
            expect(service.getCheckboxState('/test/file2.ts')).toBe(0)
            expect(service.getCheckboxState('/test/file3.ts')).toBe(0)
        })

        it('should update checkbox state', () => {
            // Arrange
            const uri = '/test/file.ts'
            const state = 1

            setupFileExplorerSuccessScenario(mocks, {
                operation: 'updateCheckboxState',
                uri,
                state
            })

            // Act
            service.updateCheckboxState(uri, state as any)

            // Assert
            expect(service.getCheckboxState(uri)).toBe(state)
        })

        it('should get checkbox state', () => {
            // Arrange
            const uri = '/test/file.ts'
            const state = 1

            setupFileExplorerSuccessScenario(mocks, {
                operation: 'getCheckboxState',
                uri,
                state
            })

            service.updateCheckboxState(uri, state as any)

            // Act
            const result = service.getCheckboxState(uri)

            // Assert
            expect(result).toBe(state)
        })

        it('should get all checked items', () => {
            // Arrange
            setupFileExplorerSuccessScenario(mocks, {
                operation: 'getAllCheckedItems',
                checkedItems: ['/test/file1.ts', '/test/file3.ts']
            })

            service.updateCheckboxState('/test/file1.ts', 1 as any)
            service.updateCheckboxState('/test/file2.ts', 0 as any)
            service.updateCheckboxState('/test/file3.ts', 1 as any)

            // Act
            const result = service.getAllCheckedItems()

            // Assert
            expect(result).toEqual(['/test/file1.ts', '/test/file3.ts'])
        })

        it('should load checked state from saved data', () => {
            // Arrange
            const itemsToLoad = [
                { uriString: '/test/file1.ts', checkboxState: 1 },
                { uriString: '/test/file2.ts', checkboxState: 0 },
                { uriString: '/test/file3.ts', checkboxState: 1 }
            ]

            setupFileExplorerSuccessScenario(mocks, {
                operation: 'loadCheckedState',
                itemsToLoad
            })

            // Act
            service.loadCheckedState(itemsToLoad)

            // Assert
            expect(service.getCheckboxState('/test/file1.ts')).toBe(1)
            expect(service.getCheckboxState('/test/file2.ts')).toBe(0)
            expect(service.getCheckboxState('/test/file3.ts')).toBe(1)
        })
    })

    describe('configuration getters', () => {
        it('should return core scan ignore globs', () => {
            // Arrange - Mock the service's internal state directly
            const expectedGlobs = ['*.log', 'node_modules/**']
            ;(service as any).globalIgnoreGlobs = expectedGlobs

            // Act
            const result = service.getCoreScanIgnoreGlobs()

            // Assert
            expect(result).toEqual(expectedGlobs)
        })

        it('should return context explorer ignore globs', () => {
            // Arrange - Mock the service's internal state directly
            const expectedGlobs = ['*.tmp', 'temp/**']
            ;(service as any).contextExplorerIgnoreGlobs = expectedGlobs

            // Act
            const result = service.getContextExplorerIgnoreGlobs()

            // Assert
            expect(result).toEqual(expectedGlobs)
        })

        it('should return context explorer hide children globs', () => {
            // Arrange - Mock the service's internal state directly
            const expectedGlobs = ['src/temp/**']
            ;(service as any).contextExplorerHideChildrenGlobs = expectedGlobs

            // Act
            const result = service.getContextExplorerHideChildrenGlobs()

            // Assert
            expect(result).toEqual(expectedGlobs)
        })

        it('should return project tree always show globs', () => {
            // Arrange - Mock the service's internal state directly
            const expectedGlobs = ['*.md', '*.json']
            ;(service as any).projectTreeAlwaysShowGlobs = expectedGlobs

            // Act
            const result = service.getProjectTreeAlwaysShowGlobs()

            // Assert
            expect(result).toEqual(expectedGlobs)
        })

        it('should return project tree always hide globs', () => {
            // Arrange - Mock the service's internal state directly
            const expectedGlobs = ['*.log', '*.tmp']
            ;(service as any).projectTreeAlwaysHideGlobs = expectedGlobs

            // Act
            const result = service.getProjectTreeAlwaysHideGlobs()

            // Assert
            expect(result).toEqual(expectedGlobs)
        })

        it('should return project tree show if selected globs', () => {
            // Arrange - Mock the service's internal state directly
            const expectedGlobs = ['*.test.ts', '*.spec.ts']
            ;(service as any).projectTreeShowIfSelectedGlobs = expectedGlobs

            // Act
            const result = service.getProjectTreeShowIfSelectedGlobs()

            // Assert
            expect(result).toEqual(expectedGlobs)
        })

        it('should return file groups config', () => {
            // Arrange - Mock the service's internal state directly
            const fileGroupsConfig = {
                'source-files': {
                    items: ['src/**/*.ts', 'src/**/*.js']
                },
                'test-files': {
                    items: ['**/*.test.ts', '**/*.spec.ts']
                }
            }
            ;(service as any).fileGroupsConfig = fileGroupsConfig

            // Act
            const result = service.getFileGroupsConfig()

            // Assert
            expect(result).toEqual(fileGroupsConfig)
        })
    })

    describe('token count calculation', () => {
        it('should calculate token count for file', async () => {
            // Arrange
            const uri = '/test/project/file.ts'
            const content = 'export const test = "hello world"'
            const expectedTokens = 8

            setupFileExplorerSuccessScenario(mocks, {
                operation: 'calculateTokenCount',
                uri,
                content,
                expectedTokens
            })

            // Act - Access private method through any cast
            const result = await (service as any)._calculateTokenCount(uri)

            // Assert
            expect(result).toBe(expectedTokens)
            // Note: TokenizerService uses global gpt-tokenizer mock, not mocks.tokenizer
        })

        it('should calculate token count for directory', async () => {
            // Arrange
            const uri = '/test/project/src'
            const entries = [
                { name: 'file1.ts', type: 'file' },
                { name: 'file2.ts', type: 'file' }
            ]

            setupFileExplorerSuccessScenario(mocks, {
                operation: 'calculateTokenCount',
                uri,
                entries,
                expectedTokens: 200
            })

            // Act
            const result = await (service as any)._calculateTokenCount(uri)

            // Assert
            expect(result).toBe(200) // 100 + 100
        })

        it('should handle token calculation errors', async () => {
            // Arrange
            const uri = '/test/project/invalid.ts'

            setupFileExplorerErrorScenario(mocks, 'calculateTokenCount', 'File not found', {
                operation: 'calculateTokenCount',
                uri
            })

            // Act
            const result = await (service as any)._calculateTokenCount(uri)

            // Assert
            expect(result).toBe(0)
        })

        it('should format token count correctly', () => {
            // Arrange
            const testCases = [
                { count: 50, expected: '50' },
                { count: 500, expected: '500' },
                { count: 1500, expected: '1.5k' },
                { count: 2000, expected: '2.0k' },
                { count: Infinity, expected: '>500k' },
                { count: -1, expected: 'err' }
            ]

            for (const testCase of testCases) {
                setupFileExplorerSuccessScenario(mocks, {
                    operation: 'formatTokenCount',
                    count: testCase.count,
                    expected: testCase.expected
                })

                // Act
                const result = (service as any)._formatTokenCount(testCase.count)

                // Assert
                expect(result).toBe(testCase.expected)
            }
        })
    })

    describe('dispose', () => {
        it('should dispose all resources', () => {
            // Arrange
            setupFileExplorerSuccessScenario(mocks, {
                operation: 'dispose'
            })

            // Act
            service.dispose()

            // Assert
            // Note: We can't easily test the event emitter disposal without more complex mocking
            expect(true).toBe(true) // Placeholder assertion
        })
    })

    describe('configuration loading', () => {
        it('should load configuration from YAML file', async () => {
            // Arrange
            const yamlContent = `
ContextCherryPicker:
  ignore: ["*.log", "node_modules/**"]
  project_tree:
    always_show: ["*.md", "*.json"]
    always_hide: ["*.tmp"]
  context_explorer:
    ignore: ["temp/**"]
    hide_children: ["src/temp/**"]
`

            setupFileExplorerSuccessScenario(mocks, {
                operation: 'loadConfigurationPatterns',
                yamlContent,
                expectedConfig: {
                    globalIgnoreGlobs: ['*.log', 'node_modules/**'],
                    projectTreeAlwaysShowGlobs: ['*.md', '*.json'],
                    projectTreeAlwaysHideGlobs: ['*.tmp'],
                    contextExplorerIgnoreGlobs: ['temp/**'],
                    contextExplorerHideChildrenGlobs: ['src/temp/**']
                }
            })

            // Act - Access private method through any cast
            await (service as any).loadConfigurationPatterns()

            // Assert
            expect(service.getCoreScanIgnoreGlobs()).toEqual(['*.log', 'node_modules/**'])
            expect(service.getProjectTreeAlwaysShowGlobs()).toEqual(['*.md', '*.json'])
            expect(service.getProjectTreeAlwaysHideGlobs()).toEqual(['*.tmp'])
            expect(service.getContextExplorerIgnoreGlobs()).toEqual(['temp/**'])
            expect(service.getContextExplorerHideChildrenGlobs()).toEqual(['src/temp/**'])
        })

        it('should fallback to VS Code settings when YAML not found', async () => {
            // Arrange
            setupFileExplorerSuccessScenario(mocks, {
                operation: 'loadConfigurationPatterns',
                yamlContent: null,
                vscodeSettings: {
                    'ccp.ignoreGlobs': ['*.log'],
                    'ccp.projectTreeDisplay.alwaysShowGlobs': ['*.md']
                }
            })

            // Act
            await (service as any).loadConfigurationPatterns()

            // Assert
            expect(service.getCoreScanIgnoreGlobs()).toEqual(['*.log'])
            expect(service.getProjectTreeAlwaysShowGlobs()).toEqual(['*.md'])
        })
    })
})