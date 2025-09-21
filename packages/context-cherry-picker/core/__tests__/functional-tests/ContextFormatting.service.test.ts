import { describe, it, expect, beforeEach, vi } from 'vitest'
import { ContextFormattingService } from '../../src/services/ContextFormatting.service.js'
import { setupTestEnvironment, resetAllMocks, setupFileSystemMocks, setupPathMocks, setupMicromatchMocks } from '../__mocks__/helpers'
import { 
    setupContextFormattingSuccessScenario, 
    setupContextFormattingErrorScenario, 
    createCCPMockBuilder 
} from '../__mocks__/mock-scenario-builder'

// Mock service classes
class MockTreeFormatterService {
    formatTree = vi.fn()
}

class MockFileUtilsService {
    formatFileSize = vi.fn()
}

class MockPath {
    join = vi.fn()
}

describe('ContextFormattingService', () => {
    let service: ContextFormattingService
    let mockTreeFormatter: MockTreeFormatterService
    let mockFileUtils: MockFileUtilsService
    let mockPath: MockPath
    let mocks: ReturnType<typeof setupTestEnvironment>

    beforeEach(() => {
        mocks = setupTestEnvironment()
        setupFileSystemMocks(mocks)
        setupPathMocks(mocks)
        setupMicromatchMocks(mocks)
        resetAllMocks(mocks)

        // Initialize mock services
        mockTreeFormatter = new MockTreeFormatterService()
        mockFileUtils = new MockFileUtilsService()
        mockPath = new MockPath()

        // Initialize service with mocked dependencies
        service = new ContextFormattingService(
            mockTreeFormatter as any,
            mockFileUtils as any,
            mockPath as any
        )
    })

    describe('generateProjectTreeString', () => {
        it('should generate project tree string successfully', async () => {
            // Arrange
            const treeEntriesMap = new Map([
                ['/test/project/file1.ts', {
                    uri: '/test/project/file1.ts',
                    isFile: true,
                    name: 'file1.ts',
                    relativePath: 'file1.ts',
                    size: 1024
                }],
                ['/test/project/src/file2.ts', {
                    uri: '/test/project/src/file2.ts',
                    isFile: true,
                    name: 'file2.ts',
                    relativePath: 'src/file2.ts',
                    size: 2048
                }]
            ])
            const projectRootUri = '/test/project'
            const projectRootName = 'project'
            const outputFilterAlwaysShow = ['*.md']
            const outputFilterAlwaysHide = ['*.log']
            const outputFilterShowIfSelected = ['*.test.ts']
            const initialCheckedUris = ['/test/project/file1.ts']
            const expectedTreeString = 'project/\n  file1.ts\n  src/\n    file2.ts'

            setupContextFormattingSuccessScenario(mocks, {
                operation: 'generateTree',
                treeEntriesMap,
                projectRootUri,
                projectRootName,
                outputFilterAlwaysShow,
                outputFilterAlwaysHide,
                outputFilterShowIfSelected,
                initialCheckedUris,
                expectedTreeString
            })

            // Mock micromatch behavior
            mocks.micromatch.isMatch.mockImplementation((path: string, patterns: string[]) => {
                if (patterns.includes('*.md')) return path.includes('.md')
                if (patterns.includes('*.log')) return path.includes('.log')
                if (patterns.includes('*.test.ts')) return path.includes('.test.ts')
                return false
            })

            mockPath.join.mockImplementation((...paths: string[]) => paths.join('/'))
            mockFileUtils.formatFileSize.mockImplementation((size: number) => {
                if (size === 1024) return '1KB'
                if (size === 2048) return '2KB'
                return `${size}B`
            })
            mockTreeFormatter.formatTree.mockReturnValue(expectedTreeString)

            // Act
            const result = await service.generateProjectTreeString(
                treeEntriesMap,
                projectRootUri,
                projectRootName,
                outputFilterAlwaysShow,
                outputFilterAlwaysHide,
                outputFilterShowIfSelected,
                initialCheckedUris
            )

            // Assert
            expect(result).toBe(expectedTreeString)
            expect(mockTreeFormatter.formatTree).toHaveBeenCalledWith(
                expect.objectContaining({
                    label: 'project',
                    isDirectory: true,
                    children: expect.arrayContaining([
                        expect.objectContaining({
                            label: 'file1.ts',
                            isDirectory: false,
                            details: '[1KB]'
                        })
                    ])
                })
            )
        })

        it('should filter entries based on always show patterns', async () => {
            // Arrange
            const treeEntriesMap = new Map([
                ['/test/project/readme.md', {
                    uri: '/test/project/readme.md',
                    isFile: true,
                    name: 'readme.md',
                    relativePath: 'readme.md'
                }],
                ['/test/project/file.ts', {
                    uri: '/test/project/file.ts',
                    isFile: true,
                    name: 'file.ts',
                    relativePath: 'file.ts'
                }]
            ])
            const outputFilterAlwaysShow = ['*.md']
            const outputFilterAlwaysHide = []
            const outputFilterShowIfSelected = []
            const initialCheckedUris = []

            setupContextFormattingSuccessScenario(mocks, {
                operation: 'generateTree',
                treeEntriesMap,
                outputFilterAlwaysShow,
                outputFilterAlwaysHide,
                outputFilterShowIfSelected,
                initialCheckedUris,
                expectedTreeString: 'project/\n  readme.md'
            })

            mocks.micromatch.isMatch.mockImplementation((path: string, patterns: string[]) => {
                if (patterns.includes('*.md')) return path.includes('.md')
                return false
            })

            mockPath.join.mockImplementation((...paths: string[]) => paths.join('/'))
            mockTreeFormatter.formatTree.mockReturnValue('project/\n  readme.md')

            // Act
            const result = await service.generateProjectTreeString(
                treeEntriesMap,
                '/test/project',
                'project',
                outputFilterAlwaysShow,
                outputFilterAlwaysHide,
                outputFilterShowIfSelected,
                initialCheckedUris
            )

            // Assert
            expect(result).toBe('project/\n  readme.md')
            expect(mockTreeFormatter.formatTree).toHaveBeenCalledWith(
                expect.objectContaining({
                    label: 'project',
                    children: expect.arrayContaining([
                        expect.objectContaining({
                            label: 'readme.md',
                            isDirectory: false
                        })
                    ])
                })
            )
        })

        it('should filter entries based on always hide patterns', async () => {
            // Arrange
            const treeEntriesMap = new Map([
                ['/test/project/file.log', {
                    uri: '/test/project/file.log',
                    isFile: true,
                    name: 'file.log',
                    relativePath: 'file.log'
                }],
                ['/test/project/file.ts', {
                    uri: '/test/project/file.ts',
                    isFile: true,
                    name: 'file.ts',
                    relativePath: 'file.ts'
                }]
            ])
            const outputFilterAlwaysShow = []
            const outputFilterAlwaysHide = ['*.log']
            const outputFilterShowIfSelected = []
            const initialCheckedUris = []

            setupContextFormattingSuccessScenario(mocks, {
                operation: 'generateTree',
                treeEntriesMap,
                outputFilterAlwaysShow,
                outputFilterAlwaysHide,
                outputFilterShowIfSelected,
                initialCheckedUris,
                expectedTreeString: 'project/\n  file.ts'
            })

            mocks.micromatch.isMatch.mockImplementation((path: string, patterns: string[]) => {
                if (patterns.includes('*.log')) return path.includes('.log')
                return false
            })

            mockPath.join.mockImplementation((...paths: string[]) => paths.join('/'))
            mockTreeFormatter.formatTree.mockReturnValue('project/\n  file.ts')

            // Act
            const result = await service.generateProjectTreeString(
                treeEntriesMap,
                '/test/project',
                'project',
                outputFilterAlwaysShow,
                outputFilterAlwaysHide,
                outputFilterShowIfSelected,
                initialCheckedUris
            )

            // Assert
            expect(result).toBe('project/\n  file.ts')
            expect(mockTreeFormatter.formatTree).toHaveBeenCalledWith(
                expect.objectContaining({
                    label: 'project',
                    children: expect.arrayContaining([
                        expect.objectContaining({
                            label: 'file.ts',
                            isDirectory: false
                        })
                    ])
                })
            )
        })

        it('should filter entries based on show if selected patterns', async () => {
            // Arrange
            const treeEntriesMap = new Map([
                ['/test/project/file.test.ts', {
                    uri: '/test/project/file.test.ts',
                    isFile: true,
                    name: 'file.test.ts',
                    relativePath: 'file.test.ts'
                }],
                ['/test/project/file.ts', {
                    uri: '/test/project/file.ts',
                    isFile: true,
                    name: 'file.ts',
                    relativePath: 'file.ts'
                }]
            ])
            const outputFilterAlwaysShow = []
            const outputFilterAlwaysHide = []
            const outputFilterShowIfSelected = ['*.test.ts']
            const initialCheckedUris = ['/test/project/file.test.ts']

            setupContextFormattingSuccessScenario(mocks, {
                operation: 'generateTree',
                treeEntriesMap,
                outputFilterAlwaysShow,
                outputFilterAlwaysHide,
                outputFilterShowIfSelected,
                initialCheckedUris,
                expectedTreeString: 'project/\n  file.test.ts\n  file.ts'
            })

            mocks.micromatch.isMatch.mockImplementation((path: string, patterns: string[]) => {
                if (patterns.includes('*.test.ts')) return path.includes('.test.ts')
                return false
            })

            mockPath.join.mockImplementation((...paths: string[]) => paths.join('/'))
            mockTreeFormatter.formatTree.mockReturnValue('project/\n  file.test.ts\n  file.ts')

            // Act
            const result = await service.generateProjectTreeString(
                treeEntriesMap,
                '/test/project',
                'project',
                outputFilterAlwaysShow,
                outputFilterAlwaysHide,
                outputFilterShowIfSelected,
                initialCheckedUris
            )

            // Assert
            expect(result).toBe('project/\n  file.test.ts\n  file.ts')
            expect(mockTreeFormatter.formatTree).toHaveBeenCalledWith(
                expect.objectContaining({
                    label: 'project',
                    children: expect.arrayContaining([
                        expect.objectContaining({
                            label: 'file.test.ts',
                            isDirectory: false
                        }),
                        expect.objectContaining({
                            label: 'file.ts',
                            isDirectory: false
                        })
                    ])
                })
            )
        })

        it('should return empty string when no entries match filters', async () => {
            // Arrange
            const treeEntriesMap = new Map([
                ['/test/project/file.log', {
                    uri: '/test/project/file.log',
                    isFile: true,
                    name: 'file.log',
                    relativePath: 'file.log'
                }]
            ])
            const outputFilterAlwaysShow = []
            const outputFilterAlwaysHide = ['*.log']
            const outputFilterShowIfSelected = []
            const initialCheckedUris = []

            setupContextFormattingSuccessScenario(mocks, {
                operation: 'generateTree',
                treeEntriesMap,
                outputFilterAlwaysShow,
                outputFilterAlwaysHide,
                outputFilterShowIfSelected,
                initialCheckedUris,
                expectedTreeString: ''
            })

            mocks.micromatch.isMatch.mockImplementation((path: string, patterns: string[]) => {
                if (patterns.includes('*.log')) return path.includes('.log')
                return false
            })

            // Act
            const result = await service.generateProjectTreeString(
                treeEntriesMap,
                '/test/project',
                'project',
                outputFilterAlwaysShow,
                outputFilterAlwaysHide,
                outputFilterShowIfSelected,
                initialCheckedUris
            )

            // Assert
            expect(result).toBe('')
            expect(mockTreeFormatter.formatTree).not.toHaveBeenCalled()
        })

        it('should return project root name when no internal tree root but entries exist', async () => {
            // Arrange
            const treeEntriesMap = new Map([
                ['/test/project/file.ts', {
                    uri: '/test/project/file.ts',
                    isFile: true,
                    name: 'file.ts',
                    relativePath: 'file.ts'
                }]
            ])
            const projectRootName = 'project'

            setupContextFormattingSuccessScenario(mocks, {
                operation: 'generateTree',
                treeEntriesMap,
                projectRootName,
                expectedTreeString: 'project/\n'
            })

            mocks.micromatch.isMatch.mockReturnValue(false)
            mockTreeFormatter.formatTree.mockReturnValue(null)

            // Act
            const result = await service.generateProjectTreeString(
                treeEntriesMap,
                '/test/project',
                projectRootName,
                [],
                [],
                [],
                []
            )

            // Assert
            expect(result).toBe('project/\n')
        })

        it('should handle complex nested directory structure', async () => {
            // Arrange
            const treeEntriesMap = new Map([
                ['/test/project/src/components/Button.tsx', {
                    uri: '/test/project/src/components/Button.tsx',
                    isFile: true,
                    name: 'Button.tsx',
                    relativePath: 'src/components/Button.tsx',
                    size: 1536
                }],
                ['/test/project/src/utils/helpers.ts', {
                    uri: '/test/project/src/utils/helpers.ts',
                    isFile: true,
                    name: 'helpers.ts',
                    relativePath: 'src/utils/helpers.ts',
                    size: 512
                }],
                ['/test/project/package.json', {
                    uri: '/test/project/package.json',
                    isFile: true,
                    name: 'package.json',
                    relativePath: 'package.json',
                    size: 256
                }]
            ])
            const expectedTreeString = 'project/\n  package.json\n  src/\n    components/\n      Button.tsx\n    utils/\n      helpers.ts'

            setupContextFormattingSuccessScenario(mocks, {
                operation: 'generateTree',
                treeEntriesMap,
                expectedTreeString
            })

            mocks.micromatch.isMatch.mockReturnValue(true)
            mockPath.join.mockImplementation((...paths: string[]) => paths.join('/'))
            mockFileUtils.formatFileSize.mockImplementation((size: number) => {
                if (size === 1536) return '1.5KB'
                if (size === 512) return '512B'
                if (size === 256) return '256B'
                return `${size}B`
            })
            mockTreeFormatter.formatTree.mockReturnValue(expectedTreeString)

            // Act
            const result = await service.generateProjectTreeString(
                treeEntriesMap,
                '/test/project',
                'project',
                [],
                [],
                [],
                []
            )

            // Assert
            expect(result).toBe(expectedTreeString)
            expect(mockTreeFormatter.formatTree).toHaveBeenCalledWith(
                expect.objectContaining({
                    label: 'project',
                    isDirectory: true,
                    children: expect.arrayContaining([
                        expect.objectContaining({
                            label: 'package.json',
                            isDirectory: false,
                            details: '[256B]'
                        }),
                        expect.objectContaining({
                            label: 'src',
                            isDirectory: true,
                            children: expect.arrayContaining([
                                expect.objectContaining({
                                    label: 'components',
                                    isDirectory: true,
                                    children: expect.arrayContaining([
                                        expect.objectContaining({
                                            label: 'Button.tsx',
                                            isDirectory: false,
                                            details: '[1.5KB]'
                                        })
                                    ])
                                }),
                                expect.objectContaining({
                                    label: 'utils',
                                    isDirectory: true,
                                    children: expect.arrayContaining([
                                        expect.objectContaining({
                                            label: 'helpers.ts',
                                            isDirectory: false,
                                            details: '[512B]'
                                        })
                                    ])
                                })
                            ])
                        })
                    ])
                })
            )
        })

        it('should sort directories before files', async () => {
            // Arrange
            const treeEntriesMap = new Map([
                ['/test/project/file.ts', {
                    uri: '/test/project/file.ts',
                    isFile: true,
                    name: 'file.ts',
                    relativePath: 'file.ts'
                }],
                ['/test/project/src', {
                    uri: '/test/project/src',
                    isFile: false,
                    name: 'src',
                    relativePath: 'src'
                }]
            ])

            setupContextFormattingSuccessScenario(mocks, {
                operation: 'generateTree',
                treeEntriesMap,
                expectedTreeString: 'project/\n  src/\n  file.ts'
            })

            mocks.micromatch.isMatch.mockReturnValue(true)
            mockPath.join.mockImplementation((...paths: string[]) => paths.join('/'))
            mockTreeFormatter.formatTree.mockReturnValue('project/\n  src/\n  file.ts')

            // Act
            const result = await service.generateProjectTreeString(
                treeEntriesMap,
                '/test/project',
                'project',
                [],
                [],
                [],
                []
            )

            // Assert
            expect(result).toBe('project/\n  src/\n  file.ts')
            expect(mockTreeFormatter.formatTree).toHaveBeenCalledWith(
                expect.objectContaining({
                    label: 'project',
                    children: expect.arrayContaining([
                        expect.objectContaining({
                            label: 'src',
                            isDirectory: true
                        }),
                        expect.objectContaining({
                            label: 'file.ts',
                            isDirectory: false
                        })
                    ])
                })
            )
        })

        it('should handle empty tree entries map', async () => {
            // Arrange
            const treeEntriesMap = new Map()

            setupContextFormattingSuccessScenario(mocks, {
                operation: 'generateTree',
                treeEntriesMap,
                expectedTreeString: ''
            })

            mocks.micromatch.isMatch.mockReturnValue(false)

            // Act
            const result = await service.generateProjectTreeString(
                treeEntriesMap,
                '/test/project',
                'project',
                [],
                [],
                [],
                []
            )

            // Assert
            expect(result).toBe('')
            expect(mockTreeFormatter.formatTree).not.toHaveBeenCalled()
        })

        it('should handle tree formatter errors gracefully', async () => {
            // Arrange
            const treeEntriesMap = new Map([
                ['/test/project/file.ts', {
                    uri: '/test/project/file.ts',
                    isFile: true,
                    name: 'file.ts',
                    relativePath: 'file.ts'
                }]
            ])

            setupContextFormattingErrorScenario(mocks, 'formatTree', 'Formatter error', {
                operation: 'generateTree',
                treeEntriesMap
            })

            mocks.micromatch.isMatch.mockReturnValue(true)
            mockPath.join.mockImplementation((...paths: string[]) => paths.join('/'))
            mockTreeFormatter.formatTree.mockImplementation(() => {
                throw new Error('Formatter error')
            })

            // Act & Assert
            await expect(service.generateProjectTreeString(
                treeEntriesMap,
                '/test/project',
                'project',
                [],
                [],
                [],
                []
            )).rejects.toThrow('Formatter error')
        })
    })

    describe('_buildInternalTree', () => {
        it('should build internal tree structure correctly', () => {
            // Arrange
            const entries = [
                {
                    uri: '/test/project/src/file.ts',
                    isFile: true,
                    name: 'file.ts',
                    relativePath: 'src/file.ts'
                },
                {
                    uri: '/test/project/src',
                    isFile: false,
                    name: 'src',
                    relativePath: 'src'
                }
            ]

            setupContextFormattingSuccessScenario(mocks, {
                operation: 'buildInternalTree',
                entries,
                projectRootUri: '/test/project',
                projectRootName: 'project'
            })

            mockPath.join.mockImplementation((...paths: string[]) => paths.join('/'))

            // Act - Access private method through any cast
            const result = (service as any)._buildInternalTree(entries, '/test/project', 'project')

            // Assert
            expect(result).toBeDefined()
            expect(result.entry.name).toBe('project')
            expect(result.entry.isFile).toBe(false)
            expect(result.children).toHaveLength(1)
            expect(result.children[0].entry.name).toBe('src')
            expect(result.children[0].entry.isFile).toBe(false)
            expect(result.children[0].children).toHaveLength(1)
            expect(result.children[0].children[0].entry.name).toBe('file.ts')
            expect(result.children[0].children[0].entry.isFile).toBe(true)
        })

        it('should return null for empty entries', () => {
            // Arrange
            const entries: any[] = []

            setupContextFormattingSuccessScenario(mocks, {
                operation: 'buildInternalTree',
                entries,
                projectRootUri: '/test/project',
                projectRootName: 'project'
            })

            // Act
            const result = (service as any)._buildInternalTree(entries, '/test/project', 'project')

            // Assert
            expect(result).toBeNull()
        })

        it('should handle root entry replacement', () => {
            // Arrange
            const entries = [
                {
                    uri: '/test/project',
                    isFile: false,
                    name: 'project',
                    relativePath: ''
                }
            ]

            setupContextFormattingSuccessScenario(mocks, {
                operation: 'buildInternalTree',
                entries,
                projectRootUri: '/test/project',
                projectRootName: 'project'
            })

            // Act
            const result = (service as any)._buildInternalTree(entries, '/test/project', 'project')

            // Assert
            expect(result).toBeDefined()
            expect(result.entry.uri).toBe('/test/project')
            expect(result.entry.name).toBe('project')
            expect(result.entry.isFile).toBe(false)
        })
    })

    describe('_transformToFormatterTree', () => {
        it('should transform internal tree to formatter tree', () => {
            // Arrange
            const internalNode = {
                entry: {
                    uri: '/test/project/file.ts',
                    isFile: true,
                    name: 'file.ts',
                    relativePath: 'file.ts',
                    size: 1024
                },
                children: []
            }

            setupContextFormattingSuccessScenario(mocks, {
                operation: 'transformToFormatterTree',
                internalNode
            })

            mockFileUtils.formatFileSize.mockReturnValue('1KB')

            // Act
            const result = (service as any)._transformToFormatterTree(internalNode)

            // Assert
            expect(result).toEqual({
                label: 'file.ts',
                isDirectory: false,
                children: [],
                details: '[1KB]'
            })
            expect(mockFileUtils.formatFileSize).toHaveBeenCalledWith(1024)
        })

        it('should transform directory node without size details', () => {
            // Arrange
            const internalNode = {
                entry: {
                    uri: '/test/project/src',
                    isFile: false,
                    name: 'src',
                    relativePath: 'src'
                },
                children: []
            }

            setupContextFormattingSuccessScenario(mocks, {
                operation: 'transformToFormatterTree',
                internalNode
            })

            // Act
            const result = (service as any)._transformToFormatterTree(internalNode)

            // Assert
            expect(result).toEqual({
                label: 'src',
                isDirectory: true,
                children: []
            })
            expect(mockFileUtils.formatFileSize).not.toHaveBeenCalled()
        })

        it('should transform node without size when size is undefined', () => {
            // Arrange
            const internalNode = {
                entry: {
                    uri: '/test/project/file.ts',
                    isFile: true,
                    name: 'file.ts',
                    relativePath: 'file.ts'
                    // size is undefined
                },
                children: []
            }

            setupContextFormattingSuccessScenario(mocks, {
                operation: 'transformToFormatterTree',
                internalNode
            })

            // Act
            const result = (service as any)._transformToFormatterTree(internalNode)

            // Assert
            expect(result).toEqual({
                label: 'file.ts',
                isDirectory: false,
                children: []
            })
            expect(mockFileUtils.formatFileSize).not.toHaveBeenCalled()
        })
    })
})

