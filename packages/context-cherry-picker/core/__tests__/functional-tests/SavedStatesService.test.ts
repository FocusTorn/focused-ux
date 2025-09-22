import { describe, it, expect, beforeEach, vi } from 'vitest'
import { SavedStatesService } from '../../src/services/SavedStates.service.js'
import { setupTestEnvironment, resetAllMocks } from '../__mocks__/helpers'
import { 
    setupSavedStatesSuccessScenario, 
    setupSavedStatesErrorScenario, 
    createCCPMockBuilder 
} from '../__mocks__/mock-scenario-builder'
import { SavedStateItem } from '../../src/models/SavedStateItem.js'

// Mock service classes
class MockStorageService {
    loadAllSavedStates = vi.fn()
}

describe('SavedStatesService', () => {
    let service: SavedStatesService
    let mockStorageService: MockStorageService
    let mocks: ReturnType<typeof setupTestEnvironment>

    beforeEach(() => {
        mocks = setupTestEnvironment()
        resetAllMocks(mocks)

        // Initialize mock services
        mockStorageService = new MockStorageService()

        // Initialize service with mocked dependencies
        service = new SavedStatesService(mockStorageService as any)
    })

    describe('getTreeItem', () => {
        it('should return the same element', () => {
            // Arrange
            const element = new SavedStateItem('123', 'Test State', 1234567890, [])
            
            setupSavedStatesSuccessScenario(mocks, {
                operation: 'getTreeItem',
                element
            })

            // Act
            const result = service.getTreeItem(element)

            // Assert
            expect(result).toBe(element)
        })

        it('should handle SavedStateItem with string label', () => {
            // Arrange
            const element = new SavedStateItem('123', 'Test State', 1234567890, [
                { uriString: '/test/file1.ts', checkboxState: 1 },
                { uriString: '/test/file2.ts', checkboxState: 0 }
            ])
            
            setupSavedStatesSuccessScenario(mocks, {
                operation: 'getTreeItem',
                element
            })

            // Act
            const result = service.getTreeItem(element)

            // Assert
            expect(result).toBe(element)
            expect(result.label).toBe('Test State')
        })

        it('should handle SavedStateItem with TreeItemLabel', () => {
            // Arrange
            const element = new SavedStateItem('123', { label: 'Test State', highlights: [] }, 1234567890, [])
            
            setupSavedStatesSuccessScenario(mocks, {
                operation: 'getTreeItem',
                element
            })

            // Act
            const result = service.getTreeItem(element)

            // Assert
            expect(result).toBe(element)
        })
    })

    describe('getChildren', () => {
        it('should return empty array when element is provided', async () => {
            // Arrange
            const element = new SavedStateItem('123', 'Test State', 1234567890, [])
            
            setupSavedStatesSuccessScenario(mocks, {
                operation: 'getChildren',
                element,
                expectedChildren: []
            })

            // Act
            const result = await service.getChildren(element)

            // Assert
            expect(result).toEqual([])
            expect(mockStorageService.loadAllSavedStates).not.toHaveBeenCalled()
        })

        it('should return saved states when no element provided', async () => {
            // Arrange
            const savedStatesData = [
                {
                    id: '1234567890',
                    label: 'State 1',
                    timestamp: 1234567890,
                    checkedItems: [
                        { uriString: '/test/file1.ts', checkboxState: 1 },
                        { uriString: '/test/file2.ts', checkboxState: 0 }
                    ]
                },
                {
                    id: '2345678901',
                    label: 'State 2',
                    timestamp: 2345678901,
                    checkedItems: [
                        { uriString: '/test/file3.ts', checkboxState: 1 }
                    ]
                }
            ]

            const expectedChildren = [
                new SavedStateItem('1234567890', 'State 1', 1234567890, savedStatesData[0].checkedItems),
                new SavedStateItem('2345678901', 'State 2', 2345678901, savedStatesData[1].checkedItems)
            ]

            setupSavedStatesSuccessScenario(mocks, {
                operation: 'getChildren',
                savedStatesData,
                expectedChildren
            })

            mockStorageService.loadAllSavedStates.mockResolvedValue(savedStatesData)

            // Act
            const result = await service.getChildren()

            // Assert
            expect(result).toHaveLength(2)
            expect(result[0].id).toBe('1234567890')
            expect(result[0].label).toBe('State 1')
            expect(result[0].timestamp).toBe(1234567890)
            expect(result[0].checkedItems).toEqual(savedStatesData[0].checkedItems)
            
            expect(result[1].id).toBe('2345678901')
            expect(result[1].label).toBe('State 2')
            expect(result[1].timestamp).toBe(2345678901)
            expect(result[1].checkedItems).toEqual(savedStatesData[1].checkedItems)
        })

        it('should return empty array when no saved states exist', async () => {
            // Arrange
            setupSavedStatesSuccessScenario(mocks, {
                operation: 'getChildren',
                savedStatesData: [],
                expectedChildren: []
            })

            mockStorageService.loadAllSavedStates.mockResolvedValue([])

            // Act
            const result = await service.getChildren()

            // Assert
            expect(result).toEqual([])
        })

        it('should handle saved states with string labels', async () => {
            // Arrange
            const savedStatesData = [
                {
                    id: '1234567890',
                    label: 'My Test State',
                    timestamp: 1234567890,
                    checkedItems: []
                }
            ]

            setupSavedStatesSuccessScenario(mocks, {
                operation: 'getChildren',
                savedStatesData,
                expectedChildren: [
                    new SavedStateItem('1234567890', 'My Test State', 1234567890, [])
                ]
            })

            mockStorageService.loadAllSavedStates.mockResolvedValue(savedStatesData)

            // Act
            const result = await service.getChildren()

            // Assert
            expect(result).toHaveLength(1)
            expect(result[0].label).toBe('My Test State')
        })

        it('should handle saved states with TreeItemLabel objects', async () => {
            // Arrange
            const savedStatesData = [
                {
                    id: '1234567890',
                    label: { label: 'My Test State', highlights: [[0, 5]] },
                    timestamp: 1234567890,
                    checkedItems: []
                }
            ]

            setupSavedStatesSuccessScenario(mocks, {
                operation: 'getChildren',
                savedStatesData,
                expectedChildren: [
                    new SavedStateItem('1234567890', 'My Test State', 1234567890, [])
                ]
            })

            mockStorageService.loadAllSavedStates.mockResolvedValue(savedStatesData)

            // Act
            const result = await service.getChildren()

            // Assert
            expect(result).toHaveLength(1)
            expect(result[0].label).toBe('My Test State')
        })

        it('should handle saved states with invalid label types', async () => {
            // Arrange
            const savedStatesData = [
                {
                    id: '1234567890',
                    label: null,
                    timestamp: 1234567890,
                    checkedItems: []
                },
                {
                    id: '2345678901',
                    label: undefined,
                    timestamp: 2345678901,
                    checkedItems: []
                },
                {
                    id: '3456789012',
                    label: 123, // Invalid type
                    timestamp: 3456789012,
                    checkedItems: []
                }
            ]

            setupSavedStatesSuccessScenario(mocks, {
                operation: 'getChildren',
                savedStatesData,
                expectedChildren: [
                    new SavedStateItem('1234567890', 'Unnamed State', 1234567890, []),
                    new SavedStateItem('2345678901', 'Unnamed State', 2345678901, []),
                    new SavedStateItem('3456789012', 'Unnamed State', 3456789012, [])
                ]
            })

            mockStorageService.loadAllSavedStates.mockResolvedValue(savedStatesData)

            // Act
            const result = await service.getChildren()

            // Assert
            expect(result).toHaveLength(3)
            expect(result[0].label).toBe('Unnamed State')
            expect(result[1].label).toBe('Unnamed State')
            expect(result[2].label).toBe('Unnamed State')
        })

        it('should handle storage service errors gracefully', async () => {
            // Arrange
            setupSavedStatesErrorScenario(mocks, 'loadAllSavedStates', 'Storage error', {
                operation: 'getChildren'
            })

            mockStorageService.loadAllSavedStates.mockRejectedValue(new Error('Storage error'))

            // Act & Assert
            await expect(service.getChildren()).rejects.toThrow('Storage error')
        })

        it('should handle large number of saved states', async () => {
            // Arrange
            const savedStatesData = Array.from({ length: 100 }, (_, i) => ({
                id: `${i}`,
                label: `State ${i}`,
                timestamp: 1234567890 + i,
                checkedItems: [
                    { uriString: `/test/file${i}.ts`, checkboxState: 1 }
                ]
            }))

            setupSavedStatesSuccessScenario(mocks, {
                operation: 'getChildren',
                savedStatesData,
                expectedChildren: savedStatesData.map(data => 
                    new SavedStateItem(data.id, data.label, data.timestamp, data.checkedItems)
                )
            })

            mockStorageService.loadAllSavedStates.mockResolvedValue(savedStatesData)

            // Act
            const result = await service.getChildren()

            // Assert
            expect(result).toHaveLength(100)
            expect(result[0].label).toBe('State 0')
            expect(result[99].label).toBe('State 99')
        })

        it('should handle saved states with complex checked items', async () => {
            // Arrange
            const savedStatesData = [
                {
                    id: '1234567890',
                    label: 'Complex State',
                    timestamp: 1234567890,
                    checkedItems: [
                        { uriString: '/test/src/components/Button.tsx', checkboxState: 1 },
                        { uriString: '/test/src/utils/helpers.ts', checkboxState: 1 },
                        { uriString: '/test/tests/Button.test.tsx', checkboxState: 0 },
                        { uriString: '/test/docs/README.md', checkboxState: 1 },
                        { uriString: '/test/package.json', checkboxState: 0 }
                    ]
                }
            ]

            setupSavedStatesSuccessScenario(mocks, {
                operation: 'getChildren',
                savedStatesData,
                expectedChildren: [
                    new SavedStateItem('1234567890', 'Complex State', 1234567890, savedStatesData[0].checkedItems)
                ]
            })

            mockStorageService.loadAllSavedStates.mockResolvedValue(savedStatesData)

            // Act
            const result = await service.getChildren()

            // Assert
            expect(result).toHaveLength(1)
            expect(result[0].checkedItems).toHaveLength(5)
            expect(result[0].checkedItems[0].uriString).toBe('/test/src/components/Button.tsx')
            expect(result[0].checkedItems[0].checkboxState).toBe(1)
        })
    })

    describe('refresh', () => {
        it('should fire tree data change event', () => {
            // Arrange
            let eventFired = false
            let eventData: any = null

            setupSavedStatesSuccessScenario(mocks, {
                operation: 'refresh',
                shouldFireEvent: true
            })

            // Subscribe to events
            service.onDidChangeTreeData((data) => {
                eventFired = true
                eventData = data
            })

            // Act
            service.refresh()

            // Assert
            expect(eventFired).toBe(true)
            expect(eventData).toBeUndefined() // refresh fires with undefined
        })

        it('should allow multiple event listeners', () => {
            // Arrange
            let event1Fired = false
            let event2Fired = false

            setupSavedStatesSuccessScenario(mocks, {
                operation: 'refresh',
                shouldFireEvent: true
            })

            // Subscribe multiple listeners
            service.onDidChangeTreeData(() => { event1Fired = true })
            service.onDidChangeTreeData(() => { event2Fired = true })

            // Act
            service.refresh()

            // Assert
            expect(event1Fired).toBe(true)
            expect(event2Fired).toBe(true)
        })

        it('should handle refresh without event listeners', () => {
            // Arrange
            setupSavedStatesSuccessScenario(mocks, {
                operation: 'refresh',
                shouldFireEvent: false
            })

            // Act & Assert - should not throw
            expect(() => service.refresh()).not.toThrow()
        })
    })

    describe('event handling', () => {
        it('should properly dispose event listeners', () => {
            // Arrange
            let eventFired = false

            setupSavedStatesSuccessScenario(mocks, {
                operation: 'dispose',
                shouldFireEvent: false
            })

            const disposable = service.onDidChangeTreeData(() => {
                eventFired = true
            })

            // Act
            disposable.dispose()
            service.refresh()

            // Assert
            expect(eventFired).toBe(false)
        })

        it('should handle multiple disposals gracefully', () => {
            // Arrange
            setupSavedStatesSuccessScenario(mocks, {
                operation: 'dispose',
                shouldFireEvent: false
            })

            const disposable = service.onDidChangeTreeData(() => {})

            // Act & Assert - should not throw
            expect(() => {
                disposable.dispose()
                disposable.dispose()
            }).not.toThrow()
        })
    })

    describe('edge cases', () => {
        it('should handle null element in getChildren', async () => {
            // Arrange
            setupSavedStatesSuccessScenario(mocks, {
                operation: 'getChildren',
                element: null,
                expectedChildren: []
            })

            // Act
            const result = await service.getChildren(null as any)

            // Assert
            expect(result).toEqual([])
        })

        it('should handle undefined element in getChildren', async () => {
            // Arrange
            setupSavedStatesSuccessScenario(mocks, {
                operation: 'getChildren',
                element: undefined,
                expectedChildren: []
            })

            // Act
            const result = await service.getChildren(undefined)

            // Assert
            expect(result).toEqual([])
        })

        it('should handle concurrent getChildren calls', async () => {
            // Arrange
            const savedStatesData = [
                {
                    id: '1234567890',
                    label: 'State 1',
                    timestamp: 1234567890,
                    checkedItems: []
                }
            ]

            setupSavedStatesSuccessScenario(mocks, {
                operation: 'concurrentGetChildren',
                savedStatesData
            })

            mockStorageService.loadAllSavedStates.mockResolvedValue(savedStatesData)

            // Act
            const [result1, result2] = await Promise.all([
                service.getChildren(),
                service.getChildren()
            ])

            // Assert
            expect(result1).toHaveLength(1)
            expect(result2).toHaveLength(1)
            expect(result1[0].id).toBe('1234567890')
            expect(result2[0].id).toBe('1234567890')
        })

        it('should handle very long state labels', async () => {
            // Arrange
            const longLabel = 'A'.repeat(1000)
            const savedStatesData = [
                {
                    id: '1234567890',
                    label: longLabel,
                    timestamp: 1234567890,
                    checkedItems: []
                }
            ]

            setupSavedStatesSuccessScenario(mocks, {
                operation: 'getChildren',
                savedStatesData,
                expectedChildren: [
                    new SavedStateItem('1234567890', longLabel, 1234567890, [])
                ]
            })

            mockStorageService.loadAllSavedStates.mockResolvedValue(savedStatesData)

            // Act
            const result = await service.getChildren()

            // Assert
            expect(result).toHaveLength(1)
            expect(result[0].label).toBe(longLabel)
            expect(result[0].label.length).toBe(1000)
        })

        it('should handle special characters in state labels', async () => {
            // Arrange
            const specialLabel = 'State with special chars: !@#$%^&*()_+-=[]{}|;:,.<>?'
            const savedStatesData = [
                {
                    id: '1234567890',
                    label: specialLabel,
                    timestamp: 1234567890,
                    checkedItems: []
                }
            ]

            setupSavedStatesSuccessScenario(mocks, {
                operation: 'getChildren',
                savedStatesData,
                expectedChildren: [
                    new SavedStateItem('1234567890', specialLabel, 1234567890, [])
                ]
            })

            mockStorageService.loadAllSavedStates.mockResolvedValue(savedStatesData)

            // Act
            const result = await service.getChildren()

            // Assert
            expect(result).toHaveLength(1)
            expect(result[0].label).toBe(specialLabel)
        })

        it('should handle empty checked items array', async () => {
            // Arrange
            const savedStatesData = [
                {
                    id: '1234567890',
                    label: 'Empty State',
                    timestamp: 1234567890,
                    checkedItems: []
                }
            ]

            setupSavedStatesSuccessScenario(mocks, {
                operation: 'getChildren',
                savedStatesData,
                expectedChildren: [
                    new SavedStateItem('1234567890', 'Empty State', 1234567890, [])
                ]
            })

            mockStorageService.loadAllSavedStates.mockResolvedValue(savedStatesData)

            // Act
            const result = await service.getChildren()

            // Assert
            expect(result).toHaveLength(1)
            expect(result[0].checkedItems).toEqual([])
        })
    })
})
