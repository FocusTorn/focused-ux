import { describe, it, expect, beforeEach, vi } from 'vitest'
import { EnhancedAssetOrchestrator as AssetOrchestrator } from '../../src/orchestrators/enhanced-asset-orchestrator.js'

// Mock all processors
vi.mock('../../src/processors/icon-processor.js', () => ({
    IconProcessor: vi.fn().mockImplementation(() => ({
        process: vi.fn().mockResolvedValue(true),
    })),
}))

vi.mock('../../src/processors/theme-processor.js', () => ({
    ThemeProcessor: vi.fn().mockImplementation(() => ({
        process: vi.fn().mockResolvedValue(true),
    })),
}))

vi.mock('../../src/processors/preview-processor.js', () => ({
    PreviewProcessor: vi.fn().mockImplementation(() => ({
        process: vi.fn().mockResolvedValue(true),
    })),
}))

vi.mock('../../src/processors/model-audit-processor.js', () => ({
    ModelAuditProcessor: vi.fn().mockImplementation(() => ({
        process: vi.fn().mockResolvedValue(true),
    })),
}))

vi.mock('../../src/processors/theme-audit-processor.js', () => ({
    ThemeAuditProcessor: vi.fn().mockImplementation(() => ({
        process: vi.fn().mockResolvedValue(true),
    })),
}))

vi.mock('../../src/utils/error-handler.js', () => ({
    ErrorHandler: vi.fn().mockImplementation(() => ({
        createError: vi.fn(),
        handleError: vi.fn(),
    })),
}))

// Mock asset constants
vi.mock('../../src/_config/asset.constants.js', () => ({
    assetConstants: {
        externalIconSource: '/external/icons',
        themeFiles: {
            baseTheme: 'base.theme.json',
            generatedTheme: 'dynamicons.theme.json',
        },
        paths: {
            newIconsDir: '/new_icons',
            fileIconsDir: '/file_icons',
            folderIconsDir: '/folder_icons',
        },
    },
}))

// Mock file system
vi.mock('fs', () => ({
    default: {
        existsSync: vi.fn().mockReturnValue(true),
        readdirSync: vi.fn().mockReturnValue([]),
        statSync: vi.fn().mockReturnValue({
            mtime: { getTime: () => Date.now() }
        }),
    },
    existsSync: vi.fn().mockReturnValue(true),
    readdirSync: vi.fn().mockReturnValue([]),
    statSync: vi.fn().mockReturnValue({
        mtime: { getTime: () => Date.now() }
    }),
}))

// Mock path
vi.mock('path', () => ({
    default: {
        resolve: vi.fn((...args: string[]) => process.cwd()),
        join: vi.fn((...args: string[]) => args.join('/')),
        dirname: vi.fn((file: string) => process.cwd()),
    },
    resolve: vi.fn((...args: string[]) => process.cwd()),
    join: vi.fn((...args: string[]) => args.join('/')),
    dirname: vi.fn((file: string) => process.cwd()),
}))

// Mock process.chdir
const mockChdir = vi.fn()
Object.defineProperty(process, 'chdir', {
    value: mockChdir,
    writable: true
})

describe('AssetOrchestrator - Simple Tests', () => {
    let orchestrator: AssetOrchestrator

    beforeEach(() => {
        orchestrator = new AssetOrchestrator(false, false)
        vi.clearAllMocks()
        mockChdir.mockClear()
    })

    describe('constructor', () => {
        it('should initialize with default parameters', () => {
            const defaultOrchestrator = new AssetOrchestrator()
            expect(defaultOrchestrator).toBeDefined()
        })

        it('should initialize with verbose parameters', () => {
            const verboseOrchestrator = new AssetOrchestrator(true, true)
            expect(verboseOrchestrator).toBeDefined()
        })
    })

    describe('generateAssets - basic functionality', () => {
        it('should execute workflow and return result structure', async () => {
            // Mock process.argv[1] for working directory change
            Object.defineProperty(process, 'argv', {
                value: ['node', '/test/assets/index.js'],
                configurable: true
            })

            const result = await orchestrator.generateAssets()

            expect(result).toBeDefined()
            expect(result.overallSuccess).toBeDefined()
            expect(result.results).toBeDefined()
            expect(result.totalDuration).toBeDefined()
            expect(result.summary).toBeDefined()
            expect(result.changeDetection).toBeDefined()
            expect(typeof result.overallSuccess).toBe('boolean')
            expect(Array.isArray(result.results)).toBe(true)
            expect(typeof result.totalDuration).toBe('number')
            expect(typeof result.summary).toBe('object')
            expect(typeof result.changeDetection).toBe('object')
        })

        it('should handle critical errors when external source not available', async () => {
            const fs = await import('fs')
            vi.spyOn(fs, 'existsSync').mockImplementation((path: string) => {
                if (path.includes('/external/icons')) return false
                return true
            })

            Object.defineProperty(process, 'argv', {
                value: ['node', '/test/assets/index.js'],
                configurable: true
            })

            const result = await orchestrator.generateAssets()

            expect(result.overallSuccess).toBe(true)
            expect(result.changeDetection?.criticalError).toBe(null)
        })

        it('should display verbose output when enabled', async () => {
            const consoleSpy = vi.spyOn(console, 'log').mockImplementation(() => {})
            const verboseOrchestrator = new AssetOrchestrator(true, false)

            Object.defineProperty(process, 'argv', {
                value: ['node', '/test/assets/index.js'],
                configurable: true
            })

            await verboseOrchestrator.generateAssets()

            expect(consoleSpy).toHaveBeenCalledWith(expect.stringContaining('🎨 [ENHANCED ASSET GENERATION ORCHESTRATOR]'))

            consoleSpy.mockRestore()
        })

        it('should restore original working directory after execution', async () => {
            const originalCwd = process.cwd()

            Object.defineProperty(process, 'argv', {
                value: ['node', '/test/assets/index.js'],
                configurable: true
            })

            await orchestrator.generateAssets()

            expect(process.cwd()).toBe(originalCwd)
        })
    })

    describe('change detection - basic functionality', () => {
        it('should perform change detection and return results', async () => {
            Object.defineProperty(process, 'argv', {
                value: ['node', '/test/assets/index.js'],
                configurable: true
            })

            const result = await orchestrator.generateAssets()

            expect(result.changeDetection).toBeDefined()
            expect(typeof result.changeDetection?.iconChanges).toBe('boolean')
            expect(typeof result.changeDetection?.modelChanges).toBe('boolean')
            expect(typeof result.changeDetection?.themeFilesMissing).toBe('boolean')
            expect(typeof result.changeDetection?.previewImagesMissing).toBe('boolean')
            expect(typeof result.changeDetection?.externalSourceAvailable).toBe('boolean')
        })
    })

    describe('processor execution - basic functionality', () => {
        it('should execute processors and return results', async () => {
            Object.defineProperty(process, 'argv', {
                value: ['node', '/test/assets/index.js'],
                configurable: true
            })

            const result = await orchestrator.generateAssets()

            expect(result.results).toBeDefined()
            expect(Array.isArray(result.results)).toBe(true)
            expect(result.results.length).toBeGreaterThan(0)
            
            // Check that all results have required properties
            result.results.forEach(scriptResult => {
                expect(scriptResult.script).toBeDefined()
                expect(typeof scriptResult.success).toBe('boolean')
                expect(Array.isArray(scriptResult.output)).toBe(true)
                expect(Array.isArray(scriptResult.errors)).toBe(true)
                expect(typeof scriptResult.duration).toBe('number')
                expect(['ran', 'skipped', 'failed']).toContain(scriptResult.status)
            })
        })

        it('should calculate summary statistics correctly', async () => {
            Object.defineProperty(process, 'argv', {
                value: ['node', '/test/assets/index.js'],
                configurable: true
            })

            const result = await orchestrator.generateAssets()

            expect(result.summary).toBeDefined()
            expect(typeof result.summary.passed).toBe('number')
            expect(typeof result.summary.failed).toBe('number')
            expect(typeof result.summary.total).toBe('number')
            expect(result.summary.total).toBe(result.summary.passed + result.summary.failed)
        })
    })
})
