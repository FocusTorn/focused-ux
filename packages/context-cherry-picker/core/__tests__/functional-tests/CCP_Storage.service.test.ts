import { describe, it, expect, beforeEach, vi } from 'vitest'
import { StorageService } from '../../src/services/CCP_Storage.service.js'
import { setupTestEnvironment, resetAllMocks, setupFileSystemMocks, setupPathMocks } from '../__mocks__/helpers'
import {
    setupStorageSuccessScenario,
    setupStorageErrorScenario,
    createCCPMockBuilder
} from '../__mocks__/mock-scenario-builder'

// Mock service classes
class MockContext {

    globalStorageUri = '/test/storage'

}

class MockFileSystem {

    stat = vi.fn()
    createDirectory = vi.fn()
    writeFile = vi.fn()
    readFile = vi.fn()

}

class MockPath {

    join = vi.fn()

}

describe('StorageService', () => {
    let service: StorageService
    let mockContext: MockContext
    let mockFileSystem: MockFileSystem
    let mockPath: MockPath
    let mocks: ReturnType<typeof setupTestEnvironment>

    beforeEach(() => {
        mocks = setupTestEnvironment()
        setupFileSystemMocks(mocks)
        setupPathMocks(mocks)
        resetAllMocks(mocks)

        // Initialize mock services
        mockContext = new MockContext()
        mockFileSystem = new MockFileSystem()
        mockPath = new MockPath()

        // Setup default mock behaviors
        mockPath.join.mockImplementation((...paths: string[]) => paths.join('/'))
        mockFileSystem.stat.mockResolvedValue({ type: 'file' })
        mockFileSystem.createDirectory.mockResolvedValue(undefined)
        mockFileSystem.writeFile.mockResolvedValue(undefined)
        mockFileSystem.readFile.mockResolvedValue('{}')

        // Initialize service with mocked dependencies
        service = new StorageService(
            mockContext as any,
            mockFileSystem as any,
            mockPath as any
        )
    })

    describe('saveState', () => {
        it('should save state successfully', async () => {
            // Arrange
            const name = 'Test State'
            const checkedItems = [
                { uriString: '/test/file1.ts', checkboxState: 1 },
                { uriString: '/test/file2.ts', checkboxState: 0 }
            ]
            const expectedStorageData = {
                '1234567890': {
                    label: name,
                    timestamp: 1234567890,
                    checkedItems
                }
            }

            setupStorageSuccessScenario(mocks, {
                operation: 'saveState',
                name,
                checkedItems,
                expectedStorageData
            })

            // Mock Date.now to return predictable timestamp
            const mockDateNow = vi.spyOn(Date, 'now').mockReturnValue(1234567890)

            mockFileSystem.readFile.mockResolvedValue('{}')
            mockFileSystem.writeFile.mockResolvedValue(undefined)

            // Act
            await service.saveState(name, checkedItems as any)

            // Assert
            expect(mockFileSystem.readFile).toHaveBeenCalled()
            expect(mockFileSystem.writeFile).toHaveBeenCalledWith(
                '/test/storage/ccp.savedStates.json',
                expect.any(Uint8Array)
            )
            
            // Verify the written data contains our state
            const writeCall = mockFileSystem.writeFile.mock.calls[0]
            const writtenData = JSON.parse(new TextDecoder().decode(writeCall[1]))
            expect(writtenData).toEqual(expectedStorageData)

            // Cleanup
            mockDateNow.mockRestore()
        })

        it('should handle multiple saved states', async () => {
            // Arrange
            const state1 = {
                name: 'State 1',
                checkedItems: [{ uriString: '/test/file1.ts', checkboxState: 1 }]
            }
            const state2 = {
                name: 'State 2',
                checkedItems: [{ uriString: '/test/file2.ts', checkboxState: 1 }]
            }

            setupStorageSuccessScenario(mocks, {
                operation: 'saveState',
                name: state1.name,
                checkedItems: state1.checkedItems
            })

            // Mock Date.now to return different timestamps
            const mockDateNow = vi.spyOn(Date, 'now')
                .mockReturnValueOnce(1000000000)
                .mockReturnValueOnce(2000000000)

            mockFileSystem.readFile
                .mockResolvedValueOnce('{}') // First save - empty storage
                .mockResolvedValueOnce(JSON.stringify({
                    '1000000000': {
                        label: state1.name,
                        timestamp: 1000000000,
                        checkedItems: state1.checkedItems
                    }
                })) // Second save - with first state
            mockFileSystem.writeFile.mockResolvedValue(undefined)

            // Act
            await service.saveState(state1.name, state1.checkedItems as any)
            await service.saveState(state2.name, state2.checkedItems as any)

            // Assert
            expect(mockFileSystem.writeFile).toHaveBeenCalledTimes(2)
            
            // Verify second write contains both states
            const secondWriteCall = mockFileSystem.writeFile.mock.calls[1]
            const writtenData = JSON.parse(new TextDecoder().decode(secondWriteCall[1]))
            expect(Object.keys(writtenData)).toHaveLength(2)
            expect(writtenData['1000000000'].label).toBe(state1.name)
            expect(writtenData['2000000000'].label).toBe(state2.name)

            // Cleanup
            mockDateNow.mockRestore()
        })

        it('should handle storage initialization on first save', async () => {
            // Arrange
            const name = 'First State'
            const checkedItems = [{ uriString: '/test/file.ts', checkboxState: 1 }]

            setupStorageSuccessScenario(mocks, {
                operation: 'saveState',
                name,
                checkedItems,
                needsInitialization: true
            })

            mockFileSystem.stat.mockRejectedValue(new Error('File not found'))
            mockFileSystem.createDirectory.mockResolvedValue(undefined)
            mockFileSystem.writeFile.mockResolvedValue(undefined)
            mockFileSystem.readFile.mockResolvedValue('{}')

            // Act
            await service.saveState(name, checkedItems as any)

            // Assert
            expect(mockFileSystem.createDirectory).toHaveBeenCalledWith('/test/storage')
            expect(mockFileSystem.writeFile).toHaveBeenCalledTimes(2) // Initialization + save
        })
    })

    describe('loadState', () => {
        it('should load existing state', async () => {
            // Arrange
            const stateId = '1234567890'
            const expectedItems = [
                { uriString: '/test/file1.ts', checkboxState: 1 },
                { uriString: '/test/file2.ts', checkboxState: 0 }
            ]
            const storageData = {
                [stateId]: {
                    label: 'Test State',
                    timestamp: 1234567890,
                    checkedItems: expectedItems
                }
            }

            setupStorageSuccessScenario(mocks, {
                operation: 'loadState',
                stateId,
                expectedItems,
                storageData
            })

            mockFileSystem.readFile.mockResolvedValue(JSON.stringify(storageData))

            // Act
            const result = await service.loadState(stateId)

            // Assert
            expect(result).toEqual(expectedItems)
        })

        it('should return undefined for non-existent state', async () => {
            // Arrange
            const stateId = 'nonexistent'
            const storageData = {
                '1234567890': {
                    label: 'Other State',
                    timestamp: 1234567890,
                    checkedItems: []
                }
            }

            setupStorageSuccessScenario(mocks, {
                operation: 'loadState',
                stateId,
                expectedItems: undefined,
                storageData
            })

            mockFileSystem.readFile.mockResolvedValue(JSON.stringify(storageData))

            // Act
            const result = await service.loadState(stateId)

            // Assert
            expect(result).toBeUndefined()
        })

        it('should handle storage file read errors', async () => {
            // Arrange
            const stateId = '1234567890'

            setupStorageErrorScenario(mocks, 'readFile', 'Permission denied', {
                operation: 'loadState',
                stateId
            })

            mockFileSystem.readFile.mockRejectedValue(new Error('Permission denied'))

            // Act
            const result = await service.loadState(stateId)

            // Assert
            expect(result).toBeUndefined()
        })
    })

    describe('loadAllSavedStates', () => {
        it('should load all saved states', async () => {
            // Arrange
            const storageData = {
                '1000000000': {
                    label: 'State 1',
                    timestamp: 1000000000,
                    checkedItems: [{ uriString: '/test/file1.ts', checkboxState: 1 }]
                },
                '2000000000': {
                    label: 'State 2',
                    timestamp: 2000000000,
                    checkedItems: [{ uriString: '/test/file2.ts', checkboxState: 1 }]
                }
            }
            const expectedStates = [
                {
                    id: '1000000000',
                    label: 'State 1',
                    timestamp: 1000000000,
                    checkedItems: [{ uriString: '/test/file1.ts', checkboxState: 1 }]
                },
                {
                    id: '2000000000',
                    label: 'State 2',
                    timestamp: 2000000000,
                    checkedItems: [{ uriString: '/test/file2.ts', checkboxState: 1 }]
                }
            ]

            setupStorageSuccessScenario(mocks, {
                operation: 'loadAllSavedStates',
                storageData,
                expectedStates
            })

            mockFileSystem.readFile.mockResolvedValue(JSON.stringify(storageData))

            // Act
            const result = await service.loadAllSavedStates()

            // Assert
            expect(result).toEqual(expectedStates)
        })

        it('should return empty array for empty storage', async () => {
            // Arrange
            setupStorageSuccessScenario(mocks, {
                operation: 'loadAllSavedStates',
                storageData: {},
                expectedStates: []
            })

            mockFileSystem.readFile.mockResolvedValue('{}')

            // Act
            const result = await service.loadAllSavedStates()

            // Assert
            expect(result).toEqual([])
        })

        it('should handle malformed storage data', async () => {
            // Arrange
            setupStorageErrorScenario(mocks, 'readFile', 'Invalid JSON', {
                operation: 'loadAllSavedStates'
            })

            mockFileSystem.readFile.mockResolvedValue('invalid json')

            // Act
            const result = await service.loadAllSavedStates()

            // Assert
            expect(result).toEqual([])
        })
    })

    describe('deleteState', () => {
        it('should delete existing state', async () => {
            // Arrange
            const stateId = '1234567890'
            const storageData = {
                [stateId]: {
                    label: 'Test State',
                    timestamp: 1234567890,
                    checkedItems: []
                },
                '9999999999': {
                    label: 'Other State',
                    timestamp: 9999999999,
                    checkedItems: []
                }
            }

            setupStorageSuccessScenario(mocks, {
                operation: 'deleteState',
                stateId,
                storageData,
                shouldDelete: true
            })

            mockFileSystem.readFile.mockResolvedValue(JSON.stringify(storageData))
            mockFileSystem.writeFile.mockResolvedValue(undefined)

            // Act
            await service.deleteState(stateId)

            // Assert
            expect(mockFileSystem.writeFile).toHaveBeenCalled()
            
            // Verify the state was removed
            const writeCall = mockFileSystem.writeFile.mock.calls[0]
            const writtenData = JSON.parse(new TextDecoder().decode(writeCall[1]))
            expect(writtenData[stateId]).toBeUndefined()
            expect(writtenData['9999999999']).toBeDefined()
        })

        it('should handle deletion of non-existent state', async () => {
            // Arrange
            const stateId = 'nonexistent'
            const storageData = {
                '1234567890': {
                    label: 'Existing State',
                    timestamp: 1234567890,
                    checkedItems: []
                }
            }

            setupStorageSuccessScenario(mocks, {
                operation: 'deleteState',
                stateId,
                storageData,
                shouldDelete: false
            })

            mockFileSystem.readFile.mockResolvedValue(JSON.stringify(storageData))

            // Act
            await service.deleteState(stateId)

            // Assert
            expect(mockFileSystem.writeFile).not.toHaveBeenCalled()
        })

        it('should handle storage read errors during deletion', async () => {
            // Arrange
            const stateId = '1234567890'

            setupStorageErrorScenario(mocks, 'readFile', 'Permission denied', {
                operation: 'deleteState',
                stateId
            })

            mockFileSystem.readFile.mockRejectedValue(new Error('Permission denied'))

            // Act & Assert
            await expect(service.deleteState(stateId)).rejects.toThrow('Permission denied')
        })
    })

    describe('storage initialization', () => {
        it('should initialize storage directory and file', async () => {
            // Arrange
            setupStorageSuccessScenario(mocks, {
                operation: 'initializeStorage',
                needsInitialization: true
            })

            mockFileSystem.stat.mockRejectedValue(new Error('File not found'))
            mockFileSystem.createDirectory.mockResolvedValue(undefined)
            mockFileSystem.writeFile.mockResolvedValue(undefined)

            // Act - Access private method through any cast
            await (service as any)._initializeStorage()

            // Assert
            expect(mockFileSystem.createDirectory).toHaveBeenCalledWith('/test/storage')
            expect(mockFileSystem.writeFile).toHaveBeenCalledWith(
                '/test/storage/ccp.savedStates.json',
                expect.any(Uint8Array)
            )
        })

        it('should not reinitialize if storage already exists', async () => {
            // Arrange
            setupStorageSuccessScenario(mocks, {
                operation: 'initializeStorage',
                needsInitialization: false
            })

            mockFileSystem.stat.mockResolvedValue({ type: 'file' })

            // Act
            await (service as any)._initializeStorage()

            // Assert
            expect(mockFileSystem.createDirectory).not.toHaveBeenCalled()
            expect(mockFileSystem.writeFile).not.toHaveBeenCalled()
        })

        it('should handle initialization errors gracefully', async () => {
            // Arrange
            setupStorageErrorScenario(mocks, 'initializeStorage', 'Permission denied', {
                operation: 'initializeStorage'
            })

            mockFileSystem.stat.mockRejectedValue(new Error('Permission denied'))
            mockFileSystem.createDirectory.mockRejectedValue(new Error('Permission denied'))

            // Act & Assert
            await expect((service as any)._initializeStorage()).rejects.toThrow('Permission denied')
        })
    })

    describe('concurrent operations', () => {
        it('should handle concurrent save operations', async () => {
            // Arrange
            const state1 = { name: 'State 1', checkedItems: [{ uriString: '/test/file1.ts', checkboxState: 1 }] }
            const state2 = { name: 'State 2', checkedItems: [{ uriString: '/test/file2.ts', checkboxState: 1 }] }

            setupStorageSuccessScenario(mocks, {
                operation: 'concurrentSave',
                states: [state1, state2]
            })

            // Mock Date.now to return different timestamps
            const mockDateNow = vi.spyOn(Date, 'now')
                .mockReturnValueOnce(1000000000)
                .mockReturnValueOnce(2000000000)

            mockFileSystem.readFile.mockResolvedValue('{}')
            mockFileSystem.writeFile.mockResolvedValue(undefined)

            // Act
            await Promise.all([
                service.saveState(state1.name, state1.checkedItems as any),
                service.saveState(state2.name, state2.checkedItems as any)
            ])

            // Assert
            expect(mockFileSystem.writeFile).toHaveBeenCalledTimes(2)

            // Cleanup
            mockDateNow.mockRestore()
        })

        it('should handle concurrent read operations', async () => {
            // Arrange
            const storageData = {
                '1000000000': {
                    label: 'State 1',
                    timestamp: 1000000000,
                    checkedItems: [{ uriString: '/test/file1.ts', checkboxState: 1 }]
                }
            }

            setupStorageSuccessScenario(mocks, {
                operation: 'concurrentRead',
                storageData
            })

            mockFileSystem.readFile.mockResolvedValue(JSON.stringify(storageData))

            // Act
            const [state1, allStates] = await Promise.all([
                service.loadState('1000000000'),
                service.loadAllSavedStates()
            ])

            // Assert
            expect(state1).toEqual(storageData['1000000000'].checkedItems)
            expect(allStates).toHaveLength(1)
            expect(allStates[0].id).toBe('1000000000')
        })
    })

    describe('data integrity', () => {
        it('should preserve data integrity during multiple operations', async () => {
            // Arrange
            const state1 = { name: 'State 1', checkedItems: [{ uriString: '/test/file1.ts', checkboxState: 1 }] }
            const state2 = { name: 'State 2', checkedItems: [{ uriString: '/test/file2.ts', checkboxState: 1 }] }

            setupStorageSuccessScenario(mocks, {
                operation: 'dataIntegrity',
                states: [state1, state2]
            })

            // Mock Date.now to return different timestamps
            const mockDateNow = vi.spyOn(Date, 'now')
                .mockReturnValueOnce(1000000000)
                .mockReturnValueOnce(2000000000)

            mockFileSystem.readFile.mockResolvedValue('{}')
            mockFileSystem.writeFile.mockResolvedValue(undefined)

            // Act
            await service.saveState(state1.name, state1.checkedItems as any)
            await service.saveState(state2.name, state2.checkedItems as any)
            
            const allStates = await service.loadAllSavedStates()
            const loadedState1 = await service.loadState('1000000000')
            const loadedState2 = await service.loadState('2000000000')
            
            await service.deleteState('1000000000')
            const remainingStates = await service.loadAllSavedStates()

            // Assert
            expect(allStates).toHaveLength(2)
            expect(loadedState1).toEqual(state1.checkedItems)
            expect(loadedState2).toEqual(state2.checkedItems)
            expect(remainingStates).toHaveLength(1)
            expect(remainingStates[0].id).toBe('2000000000')

            // Cleanup
            mockDateNow.mockRestore()
        })

        it('should handle corrupted storage file gracefully', async () => {
            // Arrange
            setupStorageErrorScenario(mocks, 'readFile', 'Corrupted data', {
                operation: 'loadAllSavedStates'
            })

            mockFileSystem.readFile.mockResolvedValue('{"corrupted": "data"')

            // Act
            const result = await service.loadAllSavedStates()

            // Assert
            expect(result).toEqual([])
        })
    })
})
