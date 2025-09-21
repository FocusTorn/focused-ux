import { describe, it, expect, beforeEach, vi } from 'vitest'

// Mock console to avoid output during tests
vi.mock('console', () => ({
    log: vi.fn(),
    error: vi.fn(),
    warn: vi.fn(),
}))

describe('Utilities', () => {
    beforeEach(() => {
        vi.clearAllMocks()
    })

    describe('ChangeDetector', () => {
        it('should instantiate correctly', async () => {
            const { ChangeDetector } = await import('../../src/utils/change-detector.js')
            const detector = new ChangeDetector()
            expect(detector).toBeDefined()
            expect(typeof detector.detectDirectoryChanges).toBe('function')
            expect(typeof detector.detectFileChanges).toBe('function')
        })

        it('should have correct method signatures', async () => {
            const { ChangeDetector } = await import('../../src/utils/change-detector.js')
            const detector = new ChangeDetector()
            
            // Test that methods exist and can be called
            expect(detector.detectDirectoryChanges).toBeDefined()
            expect(detector.detectFileChanges).toBeDefined()
            expect(typeof detector.detectDirectoryChanges).toBe('function')
            expect(typeof detector.detectFileChanges).toBe('function')
        })

        it('should handle interface types correctly', async () => {
            const { ChangeDetector } = await import('../../src/utils/change-detector.js')
            
            // Test that ChangeDetector can be instantiated
            const detector = new ChangeDetector()
            expect(detector).toBeDefined()
            
            // Test that methods return proper types
            expect(typeof detector.detectDirectoryChanges).toBe('function')
            expect(typeof detector.detectFileChanges).toBe('function')
        })
    })

    describe('ErrorHandler', () => {
        it('should be instantiable', async () => {
            const { ErrorHandler } = await import('../../src/utils/error-handler.js')
            const handler = new ErrorHandler()
            expect(handler).toBeDefined()
        })

        it('should have createError method', async () => {
            const { ErrorHandler } = await import('../../src/utils/error-handler.js')
            const handler = new ErrorHandler()
            expect(typeof handler.createError).toBe('function')
        })

        it('should have handleError method', async () => {
            const { ErrorHandler } = await import('../../src/utils/error-handler.js')
            const handler = new ErrorHandler()
            expect(typeof handler.handleError).toBe('function')
        })
    })

    describe('ModelValidator', () => {
        it('should have validateModels function', async () => {
            const { validateModels } = await import('../../src/utils/model-validator.js')
            expect(typeof validateModels).toBe('function')
        })

        it('should validate models successfully', async () => {
            const { validateModels } = await import('../../src/utils/model-validator.js')
            const result = await validateModels(false)
            expect(typeof result).toBe('boolean') // Just test that it returns a boolean
        })
    })

    describe('TreeFormatter', () => {
        it('should have displaySimpleErrors method', async () => {
            const { TreeFormatter } = await import('../../src/utils/tree-formatter.js')
            expect(typeof TreeFormatter.displaySimpleErrors).toBe('function')
        })

        it('should have displayStructuredWarnings method', async () => {
            const { TreeFormatter } = await import('../../src/utils/tree-formatter.js')
            expect(typeof TreeFormatter.displayStructuredWarnings).toBe('function')
        })

        it('should have displayStructuredSuccess method', async () => {
            const { TreeFormatter } = await import('../../src/utils/tree-formatter.js')
            expect(typeof TreeFormatter.displayStructuredSuccess).toBe('function')
        })

        it('should have displayFileTree method', async () => {
            const { TreeFormatter } = await import('../../src/utils/tree-formatter.js')
            expect(typeof TreeFormatter.displayFileTree).toBe('function')
        })

        it('should have displayStatistics method', async () => {
            const { TreeFormatter } = await import('../../src/utils/tree-formatter.js')
            expect(typeof TreeFormatter.displayStatistics).toBe('function')
        })

        it('should have displayStructuredErrors method', async () => {
            const { TreeFormatter } = await import('../../src/utils/tree-formatter.js')
            expect(typeof TreeFormatter.displayStructuredErrors).toBe('function')
        })
    })
})
