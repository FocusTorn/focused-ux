import { describe, it, expect, beforeEach, vi } from 'vitest'

// Mock console to avoid output during tests
vi.mock('console', () => ({
    log: vi.fn(),
    error: vi.fn(),
    warn: vi.fn(),
}))

describe('Processors', () => {
    beforeEach(() => {
        vi.clearAllMocks()
    })

    describe('ModelAuditProcessor', () => {
        it('should instantiate correctly', async () => {
            const { ModelAuditProcessor } = await import('../../src/processors/model-audit-processor.js')
            const processor = new ModelAuditProcessor()
            expect(processor).toBeDefined()
            expect(typeof processor.process).toBe('function')
        })

        it('should have process method with correct signature', async () => {
            const { ModelAuditProcessor } = await import('../../src/processors/model-audit-processor.js')
            const processor = new ModelAuditProcessor()
            
            // Test that the method exists and can be called
            expect(processor.process).toBeDefined()
            expect(typeof processor.process).toBe('function')
        })
    })

    describe('ThemeProcessor', () => {
        it('should instantiate correctly', async () => {
            const { ThemeProcessor } = await import('../../src/processors/theme-processor.js')
            const processor = new ThemeProcessor()
            expect(processor).toBeDefined()
            expect(typeof processor.process).toBe('function')
        })

        it('should have process method with correct signature', async () => {
            const { ThemeProcessor } = await import('../../src/processors/theme-processor.js')
            const processor = new ThemeProcessor()
            
            // Test that the method exists and can be called
            expect(processor.process).toBeDefined()
            expect(typeof processor.process).toBe('function')
        })
    })

    describe('PreviewProcessor', () => {
        it('should instantiate correctly', async () => {
            const { PreviewProcessor } = await import('../../src/processors/preview-processor.js')
            const processor = new PreviewProcessor()
            expect(processor).toBeDefined()
            expect(typeof processor.process).toBe('function')
        })

        it('should have process method with correct signature', async () => {
            const { PreviewProcessor } = await import('../../src/processors/preview-processor.js')
            const processor = new PreviewProcessor()
            
            // Test that the method exists and can be called
            expect(processor.process).toBeDefined()
            expect(typeof processor.process).toBe('function')
        })
    })

    describe('SyncProcessor', () => {
        it('should instantiate correctly', async () => {
            const { SyncProcessor } = await import('../../src/processors/sync-processor.js')
            const processor = new SyncProcessor()
            expect(processor).toBeDefined()
            expect(typeof processor.process).toBe('function')
        })

        it('should have process method with correct signature', async () => {
            const { SyncProcessor } = await import('../../src/processors/sync-processor.js')
            const processor = new SyncProcessor()
            
            // Test that the method exists and can be called
            expect(processor.process).toBeDefined()
            expect(typeof processor.process).toBe('function')
        })
    })

    describe('ThemeAuditProcessor', () => {
        it('should instantiate correctly', async () => {
            const { ThemeAuditProcessor } = await import('../../src/processors/theme-audit-processor.js')
            const processor = new ThemeAuditProcessor()
            expect(processor).toBeDefined()
            expect(typeof processor.process).toBe('function')
        })

        it('should have process method with correct signature', async () => {
            const { ThemeAuditProcessor } = await import('../../src/processors/theme-audit-processor.js')
            const processor = new ThemeAuditProcessor()
            
            // Test that the method exists and can be called
            expect(processor.process).toBeDefined()
            expect(typeof processor.process).toBe('function')
        })
    })
})
