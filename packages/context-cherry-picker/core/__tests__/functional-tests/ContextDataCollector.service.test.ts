import { describe, it, expect, beforeEach } from 'vitest'
import { ContextDataCollectorService } from '../../src/services/ContextDataCollector.service.js'
import { setupTestEnvironment, resetAllMocks, setupFileSystemMocks, setupPathMocks } from '../__mocks__/helpers'
import { setupContextCollectionSuccessScenario, setupContextCollectionErrorScenario, createCCPMockBuilder } from '../__mocks__/mock-scenario-builder'

class MockFileSystem {
    readFile = vi.fn()
    stat = vi.fn()
}

class MockPath {
    basename = vi.fn()
    dirname = vi.fn()
    extname = vi.fn()
}

describe('ContextDataCollectorService', () => {
    let service: ContextDataCollectorService
    let mockFileSystem: MockFileSystem
    let mockPath: MockPath
    let mocks: ReturnType<typeof setupTestEnvironment>

    beforeEach(() => {
        mocks = setupTestEnvironment()
        setupFileSystemMocks(mocks)
        setupPathMocks(mocks)
        resetAllMocks(mocks)

        mockFileSystem = new MockFileSystem()
        mockPath = new MockPath()
        service = new ContextDataCollectorService(mockFileSystem as any, mockPath as any)
    })

    describe('collectFileData', () => {
        it('should collect file data successfully', async () => {
            // Arrange
            const sourcePath = '/test/file.ts'
            const content = 'export const test = "hello world"'

            setupContextCollectionSuccessScenario(mocks, {
                sourcePath,
                content,
                fileType: 'file',
            })

            // Act
            const result = await service.collectFileData(sourcePath)

            // Assert
            expect(result).toBeDefined()
            expect(result.content).toBe(content)
            expect(result.path).toBe(sourcePath)
        })

        it('should handle file read errors', async () => {
            // Arrange
            const sourcePath = '/test/file.ts'
            const errorMessage = 'Permission denied'

            setupContextCollectionErrorScenario(mocks, 'read', errorMessage, {
                sourcePath,
                content: '',
            })

            // Act & Assert
            await expect(service.collectFileData(sourcePath)).rejects.toThrow(errorMessage)
        })

        it('should handle file stat errors', async () => {
            // Arrange
            const sourcePath = '/test/nonexistent.ts'
            const errorMessage = 'File not found'

            setupContextCollectionErrorScenario(mocks, 'stat', errorMessage, {
                sourcePath,
                content: '',
            })

            // Act & Assert
            await expect(service.collectFileData(sourcePath)).rejects.toThrow(errorMessage)
        })
    })

    describe('collectDirectoryData', () => {
        it('should collect directory data using fluent builder', async () => {
            // Arrange
            const directoryPath = '/test/project'
            const files = ['file1.ts', 'file2.js', 'file3.md']
            const patterns = ['*.ts', '*.js']
            const expectedMatches = ['file1.ts', 'file2.js']

            createCCPMockBuilder(mocks)
                .fileFiltering({
                    files,
                    patterns,
                    expectedMatches,
                })
                .build()

            // Act
            const result = await service.collectDirectoryData(directoryPath, patterns)

            // Assert
            expect(result).toBeDefined()
            expect(result.files).toEqual(expectedMatches)
        })
    })
})
