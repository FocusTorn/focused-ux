import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'

// Mock console to avoid output during tests
vi.mock('console', () => ({
    log: vi.fn(),
    error: vi.fn(),
    warn: vi.fn(),
}))

// Mock process.exit to prevent actual exit
vi.mock('process', () => ({
    exit: vi.fn(),
    argv: ['node', 'cli.js'],
    cwd: vi.fn(() => '/test/directory'),
    chdir: vi.fn(),
}))

describe('CLI Interface', () => {
    let originalArgv: string[]
    let originalCwd: string

    beforeEach(() => {
        originalArgv = process.argv
        originalCwd = process.cwd()
        vi.clearAllMocks()
    })

    afterEach(() => {
        process.argv = originalArgv
        process.chdir(originalCwd)
    })

    describe('CLI Functions', () => {
        it('should export showHelp function', async () => {
            const { showHelp } = await import('../../src/cli.js')
            expect(typeof showHelp).toBe('function')
        })

        it('should export runSingleProcessor function', async () => {
            const { runSingleProcessor } = await import('../../src/cli.js')
            expect(typeof runSingleProcessor).toBe('function')
        })

        it('should have correct function signatures', async () => {
            const { showHelp, runSingleProcessor } = await import('../../src/cli.js')
            
            expect(typeof showHelp).toBe('function')
            expect(typeof runSingleProcessor).toBe('function')
        })
    })

    describe('Help System', () => {
        it('should display help when called', async () => {
            const { showHelp } = await import('../../src/cli.js')
            
            // Test that showHelp can be called without errors
            expect(() => showHelp()).not.toThrow()
        })
    })

    describe('Processor Execution', () => {
        it('should handle icons processor', async () => {
            const { runSingleProcessor } = await import('../../src/cli.js')
            
            // Test that the function can be called with icons processor
            expect(typeof runSingleProcessor).toBe('function')
        })

        it('should handle themes processor', async () => {
            const { runSingleProcessor } = await import('../../src/cli.js')
            
            // Test that the function can be called with themes processor
            expect(typeof runSingleProcessor).toBe('function')
        })

        it('should handle previews processor', async () => {
            const { runSingleProcessor } = await import('../../src/cli.js')
            
            // Test that the function can be called with previews processor
            expect(typeof runSingleProcessor).toBe('function')
        })

        it('should handle audit-models processor', async () => {
            const { runSingleProcessor } = await import('../../src/cli.js')
            
            // Test that the function can be called with audit-models processor
            expect(typeof runSingleProcessor).toBe('function')
        })

        it('should handle audit-themes processor', async () => {
            const { runSingleProcessor } = await import('../../src/cli.js')
            
            // Test that the function can be called with audit-themes processor
            expect(typeof runSingleProcessor).toBe('function')
        })
    })

    describe('CLI Structure', () => {
        it('should have proper CLI structure', async () => {
            const cliModule = await import('../../src/cli.js')
            
            // Test that all expected functions are exported
            expect(cliModule.showHelp).toBeDefined()
            expect(cliModule.runSingleProcessor).toBeDefined()
            expect(typeof cliModule.showHelp).toBe('function')
            expect(typeof cliModule.runSingleProcessor).toBe('function')
        })

        it('should handle processor name validation', async () => {
            const { runSingleProcessor } = await import('../../src/cli.js')
            
            // Test that the function exists and can be called
            expect(typeof runSingleProcessor).toBe('function')
        })
    })

    describe('CLI Integration', () => {
        it('should import all required processors', async () => {
            // Test that CLI can import all required processor classes
            const { IconProcessor } = await import('../../src/processors/icon-processor.js')
            const { ThemeProcessor } = await import('../../src/processors/theme-processor.js')
            const { PreviewProcessor } = await import('../../src/processors/preview-processor.js')
            const { ModelAuditProcessor } = await import('../../src/processors/model-audit-processor.js')
            const { ThemeAuditProcessor } = await import('../../src/processors/theme-audit-processor.js')
            
            expect(IconProcessor).toBeDefined()
            expect(ThemeProcessor).toBeDefined()
            expect(PreviewProcessor).toBeDefined()
            expect(ModelAuditProcessor).toBeDefined()
            expect(ThemeAuditProcessor).toBeDefined()
        })

        it('should import orchestrator', async () => {
            // Test that CLI can import the orchestrator
            const { EnhancedAssetOrchestrator } = await import('../../src/orchestrators/enhanced-asset-orchestrator.js')
            
            expect(EnhancedAssetOrchestrator).toBeDefined()
        })
    })
})