import { describe, it, expect, beforeEach, vi } from 'vitest'
import { FileContentProviderService } from '../../src/services/FileContentProvider.service.js'
import { setupTestEnvironment, resetAllMocks, setupFileSystemMocks, setupTokenizerMocks } from '../__mocks__/helpers'
import { 
    setupFileContentProviderSuccessScenario, 
    setupFileContentProviderErrorScenario, 
    createCCPMockBuilder 
} from '../__mocks__/mock-scenario-builder'

// Mock service classes
class MockWindow {
    showWarningMessage = vi.fn()
    showErrorMessage = vi.fn()
}

class MockTokenizerService {
    calculateTokens = vi.fn()
}

describe('FileContentProviderService', () => {
    let service: FileContentProviderService
    let mockWindow: MockWindow
    let mockTokenizer: MockTokenizerService
    let mocks: ReturnType<typeof setupTestEnvironment>

    beforeEach(() => {
        mocks = setupTestEnvironment()
        setupFileSystemMocks(mocks)
        setupTokenizerMocks(mocks)
        resetAllMocks(mocks)

        // Initialize mock services
        mockWindow = new MockWindow()
        mockTokenizer = new MockTokenizerService()

        // Initialize service with mocked dependencies
        service = new FileContentProviderService(
            mocks.fileSystem as any,
            mockWindow as any,
            mockTokenizer as any
        )
    })

    describe('getFileContents', () => {
        it('should process file contents successfully', async () => {
            // Arrange
            const contentFileUrisSet = new Set(['/test/project/file1.ts', '/test/project/file2.js'])
            const collectedFileSystemEntries = new Map([
                ['/test/project/file1.ts', {
                    uri: '/test/project/file1.ts',
                    isFile: true,
                    name: 'file1.ts',
                    relativePath: 'file1.ts'
                }],
                ['/test/project/file2.js', {
                    uri: '/test/project/file2.js',
                    isFile: true,
                    name: 'file2.js',
                    relativePath: 'file2.js'
                }]
            ])
            const maxTokens = 1000
            const currentTotalTokens = 0
            const file1Content = 'export const test1 = "hello"'
            const file2Content = 'export const test2 = "world"'
            const expectedResult = {
                contentString: `<file name="file1.ts" path="/file1.ts">\n${file1Content}\n</file>\n<file name="file2.js" path="/file2.js">\n${file2Content}\n</file>\n`,
                processedTokens: 20,
                limitReached: false
            }

            setupFileContentProviderSuccessScenario(mocks, {
                operation: 'getFileContents',
                contentFileUrisSet,
                collectedFileSystemEntries,
                maxTokens,
                currentTotalTokens,
                fileContents: [file1Content, file2Content],
                tokenCounts: [10, 10],
                expectedResult
            })

            mockFileSystem.readFile
                .mockResolvedValueOnce(file1Content)
                .mockResolvedValueOnce(file2Content)
            mockTokenizer.calculateTokens
                .mockResolvedValueOnce(10)
                .mockResolvedValueOnce(10)

            // Act
            const result = await service.getFileContents(
                contentFileUrisSet,
                collectedFileSystemEntries,
                maxTokens,
                currentTotalTokens
            )

            // Assert
            expect(result).toEqual(expectedResult)
            expect(mockFileSystem.readFile).toHaveBeenCalledTimes(2)
            expect(mockFileSystem.readFile).toHaveBeenCalledWith('/test/project/file1.ts')
            expect(mockFileSystem.readFile).toHaveBeenCalledWith('/test/project/file2.js')
            expect(mockTokenizer.calculateTokens).toHaveBeenCalledTimes(2)
            expect(mockWindow.showWarningMessage).not.toHaveBeenCalled()
            expect(mockWindow.showErrorMessage).not.toHaveBeenCalled()
        })

        it('should handle empty content file URIs set', async () => {
            // Arrange
            const contentFileUrisSet = new Set<string>()
            const collectedFileSystemEntries = new Map()
            const maxTokens = 1000
            const currentTotalTokens = 0
            const expectedResult = {
                contentString: '',
                processedTokens: 0,
                limitReached: false
            }

            setupFileContentProviderSuccessScenario(mocks, {
                operation: 'getFileContents',
                contentFileUrisSet,
                collectedFileSystemEntries,
                maxTokens,
                currentTotalTokens,
                expectedResult
            })

            // Act
            const result = await service.getFileContents(
                contentFileUrisSet,
                collectedFileSystemEntries,
                maxTokens,
                currentTotalTokens
            )

            // Assert
            expect(result).toEqual(expectedResult)
            expect(mockFileSystem.readFile).not.toHaveBeenCalled()
            expect(mockTokenizer.calculateTokens).not.toHaveBeenCalled()
        })

        it('should skip non-file entries', async () => {
            // Arrange
            const contentFileUrisSet = new Set(['/test/project/directory'])
            const collectedFileSystemEntries = new Map([
                ['/test/project/directory', {
                    uri: '/test/project/directory',
                    isFile: false,
                    name: 'directory',
                    relativePath: 'directory'
                }]
            ])
            const maxTokens = 1000
            const currentTotalTokens = 0
            const expectedResult = {
                contentString: '',
                processedTokens: 0,
                limitReached: false
            }

            setupFileContentProviderSuccessScenario(mocks, {
                operation: 'getFileContents',
                contentFileUrisSet,
                collectedFileSystemEntries,
                maxTokens,
                currentTotalTokens,
                expectedResult
            })

            // Act
            const result = await service.getFileContents(
                contentFileUrisSet,
                collectedFileSystemEntries,
                maxTokens,
                currentTotalTokens
            )

            // Assert
            expect(result).toEqual(expectedResult)
            expect(mockFileSystem.readFile).not.toHaveBeenCalled()
            expect(mockTokenizer.calculateTokens).not.toHaveBeenCalled()
        })

        it('should skip entries not found in collected entries', async () => {
            // Arrange
            const contentFileUrisSet = new Set(['/test/project/missing.ts'])
            const collectedFileSystemEntries = new Map()
            const maxTokens = 1000
            const currentTotalTokens = 0
            const expectedResult = {
                contentString: '',
                processedTokens: 0,
                limitReached: false
            }

            setupFileContentProviderSuccessScenario(mocks, {
                operation: 'getFileContents',
                contentFileUrisSet,
                collectedFileSystemEntries,
                maxTokens,
                currentTotalTokens,
                expectedResult
            })

            // Act
            const result = await service.getFileContents(
                contentFileUrisSet,
                collectedFileSystemEntries,
                maxTokens,
                currentTotalTokens
            )

            // Assert
            expect(result).toEqual(expectedResult)
            expect(mockFileSystem.readFile).not.toHaveBeenCalled()
            expect(mockTokenizer.calculateTokens).not.toHaveBeenCalled()
        })

        it('should handle token limit reached', async () => {
            // Arrange
            const contentFileUrisSet = new Set(['/test/project/file1.ts', '/test/project/file2.ts'])
            const collectedFileSystemEntries = new Map([
                ['/test/project/file1.ts', {
                    uri: '/test/project/file1.ts',
                    isFile: true,
                    name: 'file1.ts',
                    relativePath: 'file1.ts'
                }],
                ['/test/project/file2.ts', {
                    uri: '/test/project/file2.ts',
                    isFile: true,
                    name: 'file2.ts',
                    relativePath: 'file2.ts'
                }]
            ])
            const maxTokens = 50
            const currentTotalTokens = 0
            const file1Content = 'export const test1 = "hello"'
            const file2Content = 'export const test2 = "world"'
            const expectedResult = {
                contentString: `<file name="file1.ts" path="/file1.ts">\n${file1Content}\n</file>\n`,
                processedTokens: 30,
                limitReached: true
            }

            setupFileContentProviderSuccessScenario(mocks, {
                operation: 'getFileContents',
                contentFileUrisSet,
                collectedFileSystemEntries,
                maxTokens,
                currentTotalTokens,
                fileContents: [file1Content, file2Content],
                tokenCounts: [30, 25],
                expectedResult,
                limitReached: true
            })

            mockFileSystem.readFile
                .mockResolvedValueOnce(file1Content)
                .mockResolvedValueOnce(file2Content)
            mockTokenizer.calculateTokens
                .mockResolvedValueOnce(30)
                .mockResolvedValueOnce(25)
            mockWindow.showWarningMessage.mockResolvedValue(undefined)

            // Act
            const result = await service.getFileContents(
                contentFileUrisSet,
                collectedFileSystemEntries,
                maxTokens,
                currentTotalTokens
            )

            // Assert
            expect(result).toEqual(expectedResult)
            expect(mockFileSystem.readFile).toHaveBeenCalledTimes(2)
            expect(mockTokenizer.calculateTokens).toHaveBeenCalledTimes(2)
            expect(mockWindow.showWarningMessage).toHaveBeenCalledWith(
                'Context limit reached. File \'file2.ts\' and subsequent files were not added.',
                false
            )
        })

        it('should handle file read errors gracefully', async () => {
            // Arrange
            const contentFileUrisSet = new Set(['/test/project/file1.ts', '/test/project/file2.ts'])
            const collectedFileSystemEntries = new Map([
                ['/test/project/file1.ts', {
                    uri: '/test/project/file1.ts',
                    isFile: true,
                    name: 'file1.ts',
                    relativePath: 'file1.ts'
                }],
                ['/test/project/file2.ts', {
                    uri: '/test/project/file2.ts',
                    isFile: true,
                    name: 'file2.ts',
                    relativePath: 'file2.ts'
                }]
            ])
            const maxTokens = 1000
            const currentTotalTokens = 0
            const file1Content = 'export const test1 = "hello"'
            const file2Content = 'export const test2 = "world"'
            const expectedResult = {
                contentString: `<file name="file1.ts" path="/file1.ts">\n${file1Content}\n</file>\n<file name="file2.ts" path="/file2.ts">\n${file2Content}\n</file>\n`,
                processedTokens: 20,
                limitReached: false
            }

            setupFileContentProviderErrorScenario(mocks, 'readFile', 'Permission denied', {
                operation: 'getFileContents',
                contentFileUrisSet,
                collectedFileSystemEntries,
                maxTokens,
                currentTotalTokens,
                fileContents: [file1Content, file2Content],
                tokenCounts: [10, 10],
                expectedResult
            })

            mockFileSystem.readFile
                .mockResolvedValueOnce(file1Content)
                .mockRejectedValueOnce(new Error('Permission denied'))
                .mockResolvedValueOnce(file2Content)
            mockTokenizer.calculateTokens
                .mockResolvedValueOnce(10)
                .mockResolvedValueOnce(10)
            mockWindow.showErrorMessage.mockResolvedValue(undefined)

            // Act
            const result = await service.getFileContents(
                contentFileUrisSet,
                collectedFileSystemEntries,
                maxTokens,
                currentTotalTokens
            )

            // Assert
            expect(result).toEqual(expectedResult)
            expect(mockFileSystem.readFile).toHaveBeenCalledTimes(3)
            expect(mockTokenizer.calculateTokens).toHaveBeenCalledTimes(2)
            expect(mockWindow.showErrorMessage).toHaveBeenCalledWith(
                'Error reading file /test/project/file2.ts for content: Permission denied'
            )
        })

        it('should sort files by relative path', async () => {
            // Arrange
            const contentFileUrisSet = new Set(['/test/project/z.ts', '/test/project/a.ts'])
            const collectedFileSystemEntries = new Map([
                ['/test/project/z.ts', {
                    uri: '/test/project/z.ts',
                    isFile: true,
                    name: 'z.ts',
                    relativePath: 'z.ts'
                }],
                ['/test/project/a.ts', {
                    uri: '/test/project/a.ts',
                    isFile: true,
                    name: 'a.ts',
                    relativePath: 'a.ts'
                }]
            ])
            const maxTokens = 1000
            const currentTotalTokens = 0
            const fileAContent = 'export const a = "first"'
            const fileZContent = 'export const z = "last"'
            const expectedResult = {
                contentString: `<file name="a.ts" path="/a.ts">\n${fileAContent}\n</file>\n<file name="z.ts" path="/z.ts">\n${fileZContent}\n</file>\n`,
                processedTokens: 20,
                limitReached: false
            }

            setupFileContentProviderSuccessScenario(mocks, {
                operation: 'getFileContents',
                contentFileUrisSet,
                collectedFileSystemEntries,
                maxTokens,
                currentTotalTokens,
                fileContents: [fileAContent, fileZContent],
                tokenCounts: [10, 10],
                expectedResult
            })

            mockFileSystem.readFile
                .mockResolvedValueOnce(fileAContent)
                .mockResolvedValueOnce(fileZContent)
            mockTokenizer.calculateTokens
                .mockResolvedValueOnce(10)
                .mockResolvedValueOnce(10)

            // Act
            const result = await service.getFileContents(
                contentFileUrisSet,
                collectedFileSystemEntries,
                maxTokens,
                currentTotalTokens
            )

            // Assert
            expect(result).toEqual(expectedResult)
            expect(mockFileSystem.readFile).toHaveBeenNthCalledWith(1, '/test/project/a.ts')
            expect(mockFileSystem.readFile).toHaveBeenNthCalledWith(2, '/test/project/z.ts')
        })

        it('should handle files without entries gracefully', async () => {
            // Arrange
            const contentFileUrisSet = new Set(['/test/project/file1.ts', '/test/project/file2.ts'])
            const collectedFileSystemEntries = new Map([
                ['/test/project/file1.ts', {
                    uri: '/test/project/file1.ts',
                    isFile: true,
                    name: 'file1.ts',
                    relativePath: 'file1.ts'
                }]
                // file2.ts is missing from entries
            ])
            const maxTokens = 1000
            const currentTotalTokens = 0
            const file1Content = 'export const test1 = "hello"'
            const expectedResult = {
                contentString: `<file name="file1.ts" path="/file1.ts">\n${file1Content}\n</file>\n`,
                processedTokens: 10,
                limitReached: false
            }

            setupFileContentProviderSuccessScenario(mocks, {
                operation: 'getFileContents',
                contentFileUrisSet,
                collectedFileSystemEntries,
                maxTokens,
                currentTotalTokens,
                fileContents: [file1Content],
                tokenCounts: [10],
                expectedResult
            })

            mockFileSystem.readFile.mockResolvedValueOnce(file1Content)
            mockTokenizer.calculateTokens.mockResolvedValueOnce(10)

            // Act
            const result = await service.getFileContents(
                contentFileUrisSet,
                collectedFileSystemEntries,
                maxTokens,
                currentTotalTokens
            )

            // Assert
            expect(result).toEqual(expectedResult)
            expect(mockFileSystem.readFile).toHaveBeenCalledTimes(1)
            expect(mockTokenizer.calculateTokens).toHaveBeenCalledTimes(1)
        })

        it('should handle tokenizer service errors', async () => {
            // Arrange
            const contentFileUrisSet = new Set(['/test/project/file1.ts'])
            const collectedFileSystemEntries = new Map([
                ['/test/project/file1.ts', {
                    uri: '/test/project/file1.ts',
                    isFile: true,
                    name: 'file1.ts',
                    relativePath: 'file1.ts'
                }]
            ])
            const maxTokens = 1000
            const currentTotalTokens = 0

            setupFileContentProviderErrorScenario(mocks, 'calculateTokens', 'Tokenizer error', {
                operation: 'getFileContents',
                contentFileUrisSet,
                collectedFileSystemEntries,
                maxTokens,
                currentTotalTokens
            })

            mockFileSystem.readFile.mockResolvedValue('export const test = "hello"')
            mockTokenizer.calculateTokens.mockRejectedValue(new Error('Tokenizer error'))

            // Act & Assert
            await expect(service.getFileContents(
                contentFileUrisSet,
                collectedFileSystemEntries,
                maxTokens,
                currentTotalTokens
            )).rejects.toThrow('Tokenizer error')
        })

        it('should handle complex file structure with nested paths', async () => {
            // Arrange
            const contentFileUrisSet = new Set([
                '/test/project/src/components/Button.tsx',
                '/test/project/src/utils/helpers.ts',
                '/test/project/package.json'
            ])
            const collectedFileSystemEntries = new Map([
                ['/test/project/src/components/Button.tsx', {
                    uri: '/test/project/src/components/Button.tsx',
                    isFile: true,
                    name: 'Button.tsx',
                    relativePath: 'src/components/Button.tsx'
                }],
                ['/test/project/src/utils/helpers.ts', {
                    uri: '/test/project/src/utils/helpers.ts',
                    isFile: true,
                    name: 'helpers.ts',
                    relativePath: 'src/utils/helpers.ts'
                }],
                ['/test/project/package.json', {
                    uri: '/test/project/package.json',
                    isFile: true,
                    name: 'package.json',
                    relativePath: 'package.json'
                }]
            ])
            const maxTokens = 1000
            const currentTotalTokens = 0
            const buttonContent = 'export const Button = () => <button>Click me</button>'
            const helpersContent = 'export const formatDate = (date: Date) => date.toISOString()'
            const packageContent = '{"name": "test-project", "version": "1.0.0"}'
            const expectedResult = {
                contentString: `<file name="package.json" path="/package.json">\n${packageContent}\n</file>\n<file name="Button.tsx" path="/src/components/Button.tsx">\n${buttonContent}\n</file>\n<file name="helpers.ts" path="/src/utils/helpers.ts">\n${helpersContent}\n</file>\n`,
                processedTokens: 30,
                limitReached: false
            }

            setupFileContentProviderSuccessScenario(mocks, {
                operation: 'getFileContents',
                contentFileUrisSet,
                collectedFileSystemEntries,
                maxTokens,
                currentTotalTokens,
                fileContents: [packageContent, buttonContent, helpersContent],
                tokenCounts: [10, 10, 10],
                expectedResult
            })

            mockFileSystem.readFile
                .mockResolvedValueOnce(packageContent)
                .mockResolvedValueOnce(buttonContent)
                .mockResolvedValueOnce(helpersContent)
            mockTokenizer.calculateTokens
                .mockResolvedValueOnce(10)
                .mockResolvedValueOnce(10)
                .mockResolvedValueOnce(10)

            // Act
            const result = await service.getFileContents(
                contentFileUrisSet,
                collectedFileSystemEntries,
                maxTokens,
                currentTotalTokens
            )

            // Assert
            expect(result).toEqual(expectedResult)
            expect(mockFileSystem.readFile).toHaveBeenCalledTimes(3)
            expect(mockTokenizer.calculateTokens).toHaveBeenCalledTimes(3)
            // Verify files are processed in sorted order by relative path
            expect(mockFileSystem.readFile).toHaveBeenNthCalledWith(1, '/test/project/package.json')
            expect(mockFileSystem.readFile).toHaveBeenNthCalledWith(2, '/test/project/src/components/Button.tsx')
            expect(mockFileSystem.readFile).toHaveBeenNthCalledWith(3, '/test/project/src/utils/helpers.ts')
        })
    })

    describe('_localEstimateTokens', () => {
        it('should estimate tokens using tokenizer service', async () => {
            // Arrange
            const text = 'export const test = "hello world"'
            const expectedTokens = 8

            setupFileContentProviderSuccessScenario(mocks, {
                operation: 'estimateTokens',
                text,
                expectedTokens
            })

            mockTokenizer.calculateTokens.mockResolvedValue(expectedTokens)

            // Act - Access private method through any cast
            const result = await (service as any)._localEstimateTokens(text)

            // Assert
            expect(result).toBe(expectedTokens)
            expect(mockTokenizer.calculateTokens).toHaveBeenCalledWith(text)
        })

        it('should handle tokenizer service errors', async () => {
            // Arrange
            const text = 'export const test = "hello world"'
            const errorMessage = 'Tokenizer service unavailable'

            setupFileContentProviderErrorScenario(mocks, 'estimateTokens', errorMessage, {
                operation: 'estimateTokens',
                text
            })

            mockTokenizer.calculateTokens.mockRejectedValue(new Error(errorMessage))

            // Act & Assert
            await expect((service as any)._localEstimateTokens(text)).rejects.toThrow(errorMessage)
        })
    })
})

