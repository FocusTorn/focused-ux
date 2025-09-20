import { describe, it, expect, vi, beforeEach } from 'vitest'
import { activate, deactivate } from '../../src/extension.js'
import {
    setupTestEnvironment,
    resetAllMocks,
    setupVSCodeMocks,
    createMockExtensionContext,
    createMockStorageContext
} from '../__mocks__/helpers'

describe('Ghost Writer Extension', () => {
    let mocks: ReturnType<typeof setupTestEnvironment>
    let mockContext: any

    beforeEach(() => {
        mocks = setupTestEnvironment()
        setupVSCodeMocks(mocks)
        resetAllMocks(mocks)
		
        mockContext = createMockExtensionContext()
        // Add storage context properties
        const storageContext = createMockStorageContext()
        mockContext.globalState = storageContext.globalState
        mockContext.workspaceState = storageContext.workspaceState
    })

    describe('activate', () => {
        it('should activate without errors', () => {
            expect(() => {
                activate(mockContext)
            }).not.toThrow()
        })

        it('should register commands', () => {
            activate(mockContext)
      
            // Verify that commands were registered
            expect(mockContext.subscriptions).toHaveLength(3)
        })

        it('should log activation message', () => {
            const consoleSpy = vi.spyOn(console, 'log')
      
            activate(mockContext)
      
            expect(consoleSpy).toHaveBeenCalledWith('[F-UX: Ghost Writer] Activating...')
            expect(consoleSpy).toHaveBeenCalledWith('[F-UX: Ghost Writer] Activated.')
        })
    })

    describe('deactivate', () => {
        it('should deactivate without errors', () => {
            expect(() => {
                deactivate()
            }).not.toThrow()
        })
    })

    describe('integration', () => {
        it('should activate and deactivate successfully', () => {
            expect(() => {
                activate(mockContext)
                deactivate()
            }).not.toThrow()
        })
    })
})
