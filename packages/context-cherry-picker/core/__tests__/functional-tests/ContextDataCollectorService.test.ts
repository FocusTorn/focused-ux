import { describe, it, expect, beforeEach, vi } from 'vitest'
import { ContextDataCollectorService } from '../../src/services/ContextDataCollector.service.js'
import { setupTestEnvironment, setupPathMocks } from '../__mocks__/helpers.js'
import { CCPMockBuilder } from '../__mocks__/mock-scenario-builder.js'

describe('ContextDataCollectorService', () => {
    let service: ContextDataCollectorService
    let mockWorkspace: any
    let mockFileSystem: any
    let mockPath: any

    beforeEach(() => {
        const mocks = setupTestEnvironment()
        setupPathMocks(mocks)
        
        mockWorkspace = {
            workspaceFolders: [
                { uri: { fsPath: '/test/project' } }
            ]
        }
        
        mockFileSystem = mocks.fileSystem
        mockPath = mocks.path
        
        service = new ContextDataCollectorService(
            mockWorkspace,
            mockFileSystem,
            mockPath
        )
    })

    describe('collectContextData', () => {
        it('should collect context data successfully', async () => {
            // Arrange
            const mode = 'all' as const
            const initialCheckedUris = ['/test/file1.ts', '/test/file2.ts']
            const projectRootUri = '/test/project'
            const coreScanIgnoreGlobs = ['*.log', 'node_modules/**']
            const coreScanDirHideAndContentsGlobs = ['temp/**']
            const coreScanDirShowDirHideContentsGlobs = ['src/temp/**']

            const mocks = setupTestEnvironment()
            const builder = new CCPMockBuilder(mocks)
                .contextCollection({
                    operation: 'stat',
                    sourcePath: '/test/file1.ts',
                    fileType: 'file',
                    fileSize: 1024,
                })

            const service = new ContextDataCollectorService(
                mockWorkspace,
                mockFileSystem,
                mockPath
            )

            // Act
            const result = await service.collectContextData(
                mode,
                initialCheckedUris,
                projectRootUri,
                coreScanIgnoreGlobs,
                coreScanDirHideAndContentsGlobs,
                coreScanDirShowDirHideContentsGlobs
            )

            // Assert
            expect(result).toBeDefined()
            expect(result.treeEntries).toBeInstanceOf(Map)
            expect(result.contentFileUris).toBeInstanceOf(Set)
        })

        it('should handle file system errors gracefully', async () => {
            // Arrange
            const mode = 'selected' as const
            const initialCheckedUris = ['/test/file.ts']
            const projectRootUri = '/test/project'
            const coreScanIgnoreGlobs = ['*.log']
            const coreScanDirHideAndContentsGlobs = ['temp/**']
            const coreScanDirShowDirHideContentsGlobs = ['src/temp/**']

            const mocks = setupTestEnvironment()
            const builder = new CCPMockBuilder(mocks)
                .contextCollectionError('stat', 'File not found', {
                    operation: 'stat',
                    sourcePath: '/test/file.ts',
                    fileType: 'file',
                    fileSize: 1024,
                })

            const service = new ContextDataCollectorService(
                mockWorkspace,
                mockFileSystem,
                mockPath
            )

            // Act & Assert
            await expect(service.collectContextData(
                mode,
                initialCheckedUris,
                projectRootUri,
                coreScanIgnoreGlobs,
                coreScanDirHideAndContentsGlobs,
                coreScanDirShowDirHideContentsGlobs
            )).rejects.toThrow('File not found')
        })

        it('should handle empty initial checked URIs', async () => {
            // Arrange
            const mode = 'none' as const
            const initialCheckedUris: string[] = []
            const projectRootUri = '/test/project'
            const coreScanIgnoreGlobs = ['*.log']
            const coreScanDirHideAndContentsGlobs = ['temp/**']
            const coreScanDirShowDirHideContentsGlobs = ['src/temp/**']

            const mocks = setupTestEnvironment()
            const builder = new CCPMockBuilder(mocks)
                .contextCollection({
                    operation: 'stat',
                    sourcePath: '/test/project',
                    fileType: 'directory',
                    fileSize: 0,
                })

            const service = new ContextDataCollectorService(
                mockWorkspace,
                mockFileSystem,
                mockPath
            )

            // Act
            const result = await service.collectContextData(
                mode,
                initialCheckedUris,
                projectRootUri,
                coreScanIgnoreGlobs,
                coreScanDirHideAndContentsGlobs,
                coreScanDirShowDirHideContentsGlobs
            )

            // Assert
            expect(result).toBeDefined()
            expect(result.treeEntries.size).toBe(0)
            expect(result.contentFileUris.size).toBe(0)
        })

        it('should handle different collection modes', async () => {
            // Arrange
            const initialCheckedUris = ['/test/file.ts']
            const projectRootUri = '/test/project'
            const coreScanIgnoreGlobs = ['*.log']
            const coreScanDirHideAndContentsGlobs = ['temp/**']
            const coreScanDirShowDirHideContentsGlobs = ['src/temp/**']

            const mocks = setupTestEnvironment()
            const builder = new CCPMockBuilder(mocks)
                .contextCollection({
                    operation: 'stat',
                    sourcePath: '/test/file.ts',
                    fileType: 'file',
                    fileSize: 1024,
                })

            const service = new ContextDataCollectorService(
                mockWorkspace,
                mockFileSystem,
                mockPath
            )

            // Test 'all' mode
            const allResult = await service.collectContextData(
                'all',
                initialCheckedUris,
                projectRootUri,
                coreScanIgnoreGlobs,
                coreScanDirHideAndContentsGlobs,
                coreScanDirShowDirHideContentsGlobs
            )

            // Test 'selected' mode
            const selectedResult = await service.collectContextData(
                'selected',
                initialCheckedUris,
                projectRootUri,
                coreScanIgnoreGlobs,
                coreScanDirHideAndContentsGlobs,
                coreScanDirShowDirHideContentsGlobs
            )

            // Test 'none' mode
            const noneResult = await service.collectContextData(
                'none',
                initialCheckedUris,
                projectRootUri,
                coreScanIgnoreGlobs,
                coreScanDirHideAndContentsGlobs,
                coreScanDirShowDirHideContentsGlobs
            )

            // Assert
            expect(allResult).toBeDefined()
            expect(selectedResult).toBeDefined()
            expect(noneResult).toBeDefined()
        })

        it('should handle complex directory structures', async () => {
            // Arrange
            const mode = 'all' as const
            const initialCheckedUris = ['/test/project/src/file.ts', '/test/project/docs/readme.md']
            const projectRootUri = '/test/project'
            const coreScanIgnoreGlobs = ['*.log', 'node_modules/**']
            const coreScanDirHideAndContentsGlobs = ['temp/**']
            const coreScanDirShowDirHideContentsGlobs = ['src/temp/**']

            const mocks = setupTestEnvironment()
            const builder = new CCPMockBuilder(mocks)
                .contextCollection({
                    operation: 'stat',
                    sourcePath: '/test/project',
                    fileType: 'directory',
                    fileSize: 0,
                })

            const service = new ContextDataCollectorService(
                mockWorkspace,
                mockFileSystem,
                mockPath
            )

            // Act
            const result = await service.collectContextData(
                mode,
                initialCheckedUris,
                projectRootUri,
                coreScanIgnoreGlobs,
                coreScanDirHideAndContentsGlobs,
                coreScanDirShowDirHideContentsGlobs
            )

            // Assert
            expect(result).toBeDefined()
            expect(result.treeEntries).toBeInstanceOf(Map)
            expect(result.contentFileUris).toBeInstanceOf(Set)
        })
    })
})