import { describe, it, expect, beforeEach } from 'vitest'
import { ClipboardService } from '../../src/services/Clipboard.service.js'
import type { StoredFragment } from '../../src/_interfaces/IClipboardService.js'
import {
    createMockTestEnvironment,
    resetAllMocks
} from '../__mocks__/helpers'
import {
    setupClipboardStoreScenario,
    setupClipboardRetrieveScenario,
    setupClipboardClearScenario,
    createGhostWriterMockBuilder
} from '../__mocks__/mock-scenario-builder'

describe('ClipboardService', () => {
    let clipboardService: ClipboardService
    let mocks: ReturnType<typeof createMockTestEnvironment>

    beforeEach(() => {
        mocks = createMockTestEnvironment()
        clipboardService = new ClipboardService(mocks.storage)
        resetAllMocks(mocks)
    })

    describe('store', () => {
        it('should store a code fragment', async () => {
            // Arrange
            const fragment: StoredFragment = {
                text: 'MyComponent',
                sourceFilePath: '/path/to/component.ts',
            }

            setupClipboardStoreScenario(mocks, { fragment })

            // Act
            await clipboardService.store(fragment)

            // Assert
            expect(mocks.storage.update).toHaveBeenCalledWith('fux-ghost-writer.clipboard', fragment)
        })

        it('should overwrite existing fragment', async () => {
            // Arrange
            const fragment1: StoredFragment = {
                text: 'OldComponent',
                sourceFilePath: '/path/to/old.ts',
            }
            const fragment2: StoredFragment = {
                text: 'NewComponent',
                sourceFilePath: '/path/to/new.ts',
            }

            setupClipboardStoreScenario(mocks, { fragment: fragment2 })

            // Act
            await clipboardService.store(fragment1)
            await clipboardService.store(fragment2)

            // Assert
            expect(mocks.storage.update).toHaveBeenCalledWith('fux-ghost-writer.clipboard', fragment2)
        })
    })

    describe('retrieve', () => {
        it('should retrieve stored fragment', async () => {
            // Arrange
            const fragment: StoredFragment = {
                text: 'MyComponent',
                sourceFilePath: '/path/to/component.ts',
            }

            setupClipboardRetrieveScenario(mocks, { fragment })

            // Act
            const retrieved = await clipboardService.retrieve()

            // Assert
            expect(retrieved).toEqual(fragment)
            expect(mocks.storage.get).toHaveBeenCalledWith('fux-ghost-writer.clipboard')
        })

        it('should return undefined when no fragment stored', async () => {
            // Arrange
            setupClipboardRetrieveScenario(mocks, {
                fragment: { text: '', sourceFilePath: '' },
                shouldExist: false
            })

            // Act
            const retrieved = await clipboardService.retrieve()

            // Assert
            expect(retrieved).toBeUndefined()
        })
    })

    describe('clear', () => {
        it('should clear stored fragment', async () => {
            // Arrange
            setupClipboardClearScenario(mocks)

            // Act
            await clipboardService.clear()

            // Assert
            expect(mocks.storage.update).toHaveBeenCalledWith('fux-ghost-writer.clipboard', undefined)
        })

        it('should handle clearing when no fragment exists', async () => {
            // Arrange
            setupClipboardClearScenario(mocks)

            // Act & Assert
            await expect(clipboardService.clear()).resolves.not.toThrow()
        })
    })

    describe('integration', () => {
        it('should handle complete store-retrieve-clear cycle', async () => {
            // Arrange
            const fragment: StoredFragment = {
                text: 'TestComponent',
                sourceFilePath: '/test/path.ts',
            }

            // Setup mock to handle the sequence of calls
            mocks.storage.update = vi.fn().mockResolvedValue(undefined)
            mocks.storage.get = vi.fn()
                .mockResolvedValueOnce(fragment)  // First retrieve
                .mockResolvedValueOnce(undefined) // After clear
                .mockResolvedValueOnce(fragment)   // Final retrieve

            // Act & Assert - Store
            await clipboardService.store(fragment)
            expect(mocks.storage.update).toHaveBeenCalledWith('fux-ghost-writer.clipboard', fragment)

            // Act & Assert - Retrieve
            let retrieved = await clipboardService.retrieve()
            expect(retrieved).toEqual(fragment)

            // Act & Assert - Clear
            await clipboardService.clear()
            expect(mocks.storage.update).toHaveBeenCalledWith('fux-ghost-writer.clipboard', undefined)

            // Act & Assert - Retrieve after clear
            retrieved = await clipboardService.retrieve()
            expect(retrieved).toBeUndefined()

            // Act & Assert - Store again
            await clipboardService.store(fragment)
            expect(mocks.storage.update).toHaveBeenCalledWith('fux-ghost-writer.clipboard', fragment)

            // Act & Assert - Final retrieve
            retrieved = await clipboardService.retrieve()
            expect(retrieved).toEqual(fragment)
        })
    })
})
