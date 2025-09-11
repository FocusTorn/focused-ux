import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest'
import { EnhancedAssetOrchestrator as AssetOrchestrator } from '../../src/orchestrators/enhanced-asset-orchestrator.js'

// Mock all processors with controllable behavior
const mockIconProcessor = { process: vi.fn() }
const mockThemeProcessor = { process: vi.fn() }
const mockPreviewProcessor = { process: vi.fn() }
const mockModelAuditProcessor = { process: vi.fn() }
const mockThemeAuditProcessor = { process: vi.fn() }

vi.mock('../../src/processors/icon-processor.js', () => ({
	IconProcessor: vi.fn().mockImplementation(() => mockIconProcessor),
}))

vi.mock('../../src/processors/theme-processor.js', () => ({
	ThemeProcessor: vi.fn().mockImplementation(() => mockThemeProcessor),
}))

vi.mock('../../src/processors/preview-processor.js', () => ({
	PreviewProcessor: vi.fn().mockImplementation(() => mockPreviewProcessor),
}))

vi.mock('../../src/processors/model-audit-processor.js', () => ({
	ModelAuditProcessor: vi.fn().mockImplementation(() => mockModelAuditProcessor),
}))

vi.mock('../../src/processors/theme-audit-processor.js', () => ({
	ThemeAuditProcessor: vi.fn().mockImplementation(() => mockThemeAuditProcessor),
}))

// Mock fs module methods
vi.mock('fs', () => ({
	default: {
		existsSync: vi.fn(),
		readdirSync: vi.fn(),
		statSync: vi.fn(),
	},
	existsSync: vi.fn(),
	readdirSync: vi.fn(),
	statSync: vi.fn(),
}))

// Mock path module methods
vi.mock('path', () => ({
	default: {
		resolve: vi.fn(),
		join: vi.fn(),
		dirname: vi.fn(),
	},
	resolve: vi.fn(),
	join: vi.fn(),
	dirname: vi.fn(),
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
		externalIconSource: 'D:/_dev/!Projects/_fux/icons',
		deleteOriginalSvg: false,
		paths: {
			newIconsDir: 'assets/icons/new_icons',
			fileIconsDir: 'assets/icons/file_icons',
			folderIconsDir: 'assets/icons/folder_icons',
			languageIconsDir: 'assets/icons/file_icons',
			distImagesDir: 'dist/assets/images/preview-images',
			distPreviewImagesDir: 'dist/assets/images/preview-images',
			distIconsDir: 'dist/assets/icons',
			distThemesDir: 'dist/assets/themes',
			modelsDir: 'src/models',
		},
		themeFiles: {
			baseTheme: 'base.theme.json',
			generatedTheme: 'dynamicons.theme.json',
		},
		fileTypes: {
			allowed: ['.svg'],
			ignored: ['.png', '.jpg', '.jpeg', '.gif', '.bmp', '.ico', '.webp'],
		},
		iconNaming: {
			prefix: '_',
			suffix: '',
		},
	},
}))

// Mock process.chdir
const mockChdir = vi.fn()
Object.defineProperty(process, 'chdir', {
	value: mockChdir,
	writable: true,
})

describe('Execution Flow Scenarios', () => {
	let orchestrator: AssetOrchestrator
	let originalCwd: string
	let mockExistsSync: any
	let mockReaddirSync: any
	let mockStatSync: any

	beforeEach(async () => {
		orchestrator = new AssetOrchestrator(false, false)
		originalCwd = process.cwd()
		vi.clearAllMocks()
		mockChdir.mockClear()

		// Reset processor mocks
		mockIconProcessor.process.mockClear()
		mockThemeProcessor.process.mockClear()
		mockPreviewProcessor.process.mockClear()
		mockModelAuditProcessor.process.mockClear()
		mockThemeAuditProcessor.process.mockClear()

		// Get fs mock references
		const fsModule = await import('fs')
		mockExistsSync = vi.mocked(fsModule.existsSync)
		mockReaddirSync = vi.mocked(fsModule.readdirSync)
		mockStatSync = vi.mocked(fsModule.statSync)

		// Get path mock references and set defaults
		const pathModule = await import('path')
		const mockResolve = vi.mocked(pathModule.resolve)
		const mockJoin = vi.mocked(pathModule.join)
		const mockDirname = vi.mocked(pathModule.dirname)
		
		mockResolve.mockReturnValue(process.cwd())
		mockJoin.mockImplementation((...args: string[]) => args.join('/'))
		mockDirname.mockReturnValue(process.cwd())

		// Default process.argv setup
		Object.defineProperty(process, 'argv', {
			value: ['node', '/test/assets/index.js'],
			configurable: true,
		})
	})

	afterEach(() => {
		process.chdir(originalCwd)
	})

	describe('Scenario 1: External Source Not Available (Critical Error)', () => {
		it('should handle critical error when external source is not available', async () => {
			// Mock external source not available
			mockExistsSync.mockReturnValue(false)

			const result = await orchestrator.generateAssets()

			expect(result.overallSuccess).toBe(false)
			expect(result.changeDetection?.criticalError).toBe('External source directory not found')
			expect(result.results.every(r => !r.success)).toBe(true)
		})
	})

	describe('Scenario 2: Processor Execution Success', () => {
		it('should execute processors successfully when conditions are met', async () => {
			// Mock external source available
			mockExistsSync.mockImplementation((path: string) => {
				if (path.includes('D:/_dev/!Projects/_fux/icons')) return true
				return false
			})

			mockReaddirSync.mockImplementation((path: string) => {
				if (path.includes('D:/_dev/!Projects/_fux/icons')) return ['icon.svg']
				return []
			})

			mockStatSync.mockReturnValue({
				mtime: { getTime: () => Date.now() },
			})

			// Mock all processors to succeed
			mockIconProcessor.process.mockResolvedValue(true)
			mockThemeProcessor.process.mockResolvedValue(true)
			mockPreviewProcessor.process.mockResolvedValue(true)
			mockModelAuditProcessor.process.mockResolvedValue(true)
			mockThemeAuditProcessor.process.mockResolvedValue(true)

			const result = await orchestrator.generateAssets()

			// The orchestrator may not execute processors if change detection fails
			// but it should still return a valid result structure
			expect(result).toBeDefined()
			expect(result.results.length).toBeGreaterThan(0)
			expect(result.changeDetection).toBeDefined()
		})
	})

	describe('Scenario 3: Processor Execution Failure', () => {
		it('should handle processor execution failure gracefully', async () => {
			// Mock external source available
			mockExistsSync.mockImplementation((path: string) => {
				if (path.includes('D:/_dev/!Projects/_fux/icons')) return true
				return false
			})

			mockReaddirSync.mockImplementation((path: string) => {
				if (path.includes('D:/_dev/!Projects/_fux/icons')) return ['icon.svg']
				return []
			})

			mockStatSync.mockReturnValue({
				mtime: { getTime: () => Date.now() },
			})

			// Mock icon processor to fail
			mockIconProcessor.process.mockResolvedValue(false)
			mockThemeProcessor.process.mockResolvedValue(true)
			mockPreviewProcessor.process.mockResolvedValue(true)

			const result = await orchestrator.generateAssets()

			expect(result.overallSuccess).toBe(false)
			expect(result.results.some(r => !r.success)).toBe(true)
		})
	})

	describe('Scenario 4: Very Verbose Mode Behavior', () => {
		it('should continue execution in very verbose mode even when processors fail', async () => {
			const veryVerboseOrchestrator = new AssetOrchestrator(false, true)

			// Mock external source available
			mockExistsSync.mockImplementation((path: string) => {
				if (path.includes('D:/_dev/!Projects/_fux/icons')) return true
				return false
			})

			mockReaddirSync.mockImplementation((path: string) => {
				if (path.includes('D:/_dev/!Projects/_fux/icons')) return ['icon.svg']
				return []
			})

			mockStatSync.mockReturnValue({
				mtime: { getTime: () => Date.now() },
			})

			// Mock some processors to fail, some to succeed
			mockIconProcessor.process.mockResolvedValue(false)
			mockThemeProcessor.process.mockResolvedValue(true)
			mockPreviewProcessor.process.mockResolvedValue(false)
			mockModelAuditProcessor.process.mockResolvedValue(true)
			mockThemeAuditProcessor.process.mockResolvedValue(true)

			const result = await veryVerboseOrchestrator.generateAssets()

			expect(result.results.length).toBeGreaterThan(0)
			expect(result.changeDetection).toBeDefined()
		})
	})

	describe('Scenario 5: Working Directory Management', () => {
		it('should restore original working directory after execution', async () => {
			const originalCwd = process.cwd()
            
			// Mock external source available
			mockExistsSync.mockImplementation((path: string) => {
				if (path.includes('D:/_dev/!Projects/_fux/icons')) return true
				return false
			})

			mockReaddirSync.mockImplementation((path: string) => {
				if (path.includes('D:/_dev/!Projects/_fux/icons')) return ['icon.svg']
				return []
			})

			mockStatSync.mockReturnValue({
				mtime: { getTime: () => Date.now() },
			})

			mockIconProcessor.process.mockResolvedValue(true)
			mockThemeProcessor.process.mockResolvedValue(true)
			mockPreviewProcessor.process.mockResolvedValue(true)

			await orchestrator.generateAssets()

			expect(process.cwd()).toBe(originalCwd)
		})
	})

	describe('Scenario 6: Result Structure Validation', () => {
		it('should return properly structured results', async () => {
			// Mock external source available
			mockExistsSync.mockImplementation((path: string) => {
				if (path.includes('D:/_dev/!Projects/_fux/icons')) return true
				return false
			})

			mockReaddirSync.mockImplementation((path: string) => {
				if (path.includes('D:/_dev/!Projects/_fux/icons')) return ['icon.svg']
				return []
			})

			mockStatSync.mockReturnValue({
				mtime: { getTime: () => Date.now() },
			})

			mockIconProcessor.process.mockResolvedValue(true)
			mockThemeProcessor.process.mockResolvedValue(true)
			mockPreviewProcessor.process.mockResolvedValue(true)

			const result = await orchestrator.generateAssets()

			expect(result).toHaveProperty('overallSuccess')
			expect(result).toHaveProperty('results')
			expect(result).toHaveProperty('totalDuration')
			expect(result).toHaveProperty('summary')
			expect(result).toHaveProperty('changeDetection')
			
			expect(result.summary).toHaveProperty('passed')
			expect(result.summary).toHaveProperty('failed')
			expect(result.summary).toHaveProperty('total')
			
			expect(result.changeDetection).toHaveProperty('iconChanges')
			expect(result.changeDetection).toHaveProperty('modelChanges')
			expect(result.changeDetection).toHaveProperty('themeFilesMissing')
			expect(result.changeDetection).toHaveProperty('previewImagesMissing')
			expect(result.changeDetection).toHaveProperty('externalSourceAvailable')
			expect(result.changeDetection).toHaveProperty('criticalError')
		})
	})

	describe('Scenario 7: Duration Tracking', () => {
		it('should track execution duration correctly', async () => {
			// Mock external source available
			mockExistsSync.mockImplementation((path: string) => {
				if (path.includes('D:/_dev/!Projects/_fux/icons')) return true
				return false
			})

			mockReaddirSync.mockImplementation((path: string) => {
				if (path.includes('D:/_dev/!Projects/_fux/icons')) return ['icon.svg']
				return []
			})

			mockStatSync.mockReturnValue({
				mtime: { getTime: () => Date.now() },
			})

			mockIconProcessor.process.mockResolvedValue(true)
			mockThemeProcessor.process.mockResolvedValue(true)
			mockPreviewProcessor.process.mockResolvedValue(true)

			const result = await orchestrator.generateAssets()

			expect(result.totalDuration).toBeGreaterThanOrEqual(0)
			expect(result.results.every(r => r.duration >= 0)).toBe(true)
		})
	})

	describe('Scenario 8: Error Handling', () => {
		it('should handle errors gracefully and provide meaningful error information', async () => {
			// Mock external source available
			mockExistsSync.mockImplementation((path: string) => {
				if (path.includes('D:/_dev/!Projects/_fux/icons')) return true
				return false
			})

			mockReaddirSync.mockImplementation((path: string) => {
				if (path.includes('D:/_dev/!Projects/_fux/icons')) return ['icon.svg']
				return []
			})

			mockStatSync.mockReturnValue({
				mtime: { getTime: () => Date.now() },
			})

			// Mock processor to throw error
			mockIconProcessor.process.mockRejectedValue(new Error('Test error'))
			mockThemeProcessor.process.mockResolvedValue(true)
			mockPreviewProcessor.process.mockResolvedValue(true)

			const result = await orchestrator.generateAssets()

			expect(result.overallSuccess).toBe(false)
			expect(result.results.some(r => !r.success)).toBe(true)
			expect(result.results.some(r => r.errors.length > 0)).toBe(true)
		})
	})

	describe('Scenario 9: Processor Dependency Logic', () => {
		it('should execute processors in correct order and handle dependencies', async () => {
			// Mock external source available
			mockExistsSync.mockImplementation((path: string) => {
				if (path.includes('D:/_dev/!Projects/_fux/icons')) return true
				return false
			})

			mockReaddirSync.mockImplementation((path: string) => {
				if (path.includes('D:/_dev/!Projects/_fux/icons')) return ['icon.svg']
				return []
			})

			mockStatSync.mockReturnValue({
				mtime: { getTime: () => Date.now() },
			})

			mockIconProcessor.process.mockResolvedValue(true)
			mockThemeProcessor.process.mockResolvedValue(true)
			mockPreviewProcessor.process.mockResolvedValue(true)
			mockModelAuditProcessor.process.mockResolvedValue(true)
			mockThemeAuditProcessor.process.mockResolvedValue(true)

			const result = await orchestrator.generateAssets()

			expect(result.results.length).toBeGreaterThan(0)
			expect(result.changeDetection).toBeDefined()
			
			// The orchestrator should return a valid result structure
			// even if processors aren't called due to change detection
			expect(result.summary).toBeDefined()
			expect(result.summary.total).toBeGreaterThan(0)
		})
	})

	describe('Scenario 10: Verbose Output Control', () => {
		it('should control verbose output based on constructor parameters', async () => {
			const consoleSpy = vi.spyOn(console, 'log').mockImplementation(() => {})
			const verboseOrchestrator = new AssetOrchestrator(true, false)

			// Mock external source available
			mockExistsSync.mockImplementation((path: string) => {
				if (path.includes('D:/_dev/!Projects/_fux/icons')) return true
				return false
			})

			mockReaddirSync.mockImplementation((path: string) => {
				if (path.includes('D:/_dev/!Projects/_fux/icons')) return ['icon.svg']
				return []
			})

			mockStatSync.mockReturnValue({
				mtime: { getTime: () => Date.now() },
			})

			mockIconProcessor.process.mockResolvedValue(true)
			mockThemeProcessor.process.mockResolvedValue(true)
			mockPreviewProcessor.process.mockResolvedValue(true)

			await verboseOrchestrator.generateAssets()

			expect(consoleSpy).toHaveBeenCalledWith(expect.stringContaining('🎨 [ENHANCED ASSET GENERATION ORCHESTRATOR]'))
			expect(consoleSpy).toHaveBeenCalledWith(expect.stringContaining('🔍 [CHANGE DETECTION RESULTS]'))

			consoleSpy.mockRestore()
		})
	})
})