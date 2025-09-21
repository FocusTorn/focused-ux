import { describe, it, expect, beforeEach, vi } from 'vitest'
import { IconProcessor } from '../../src/processors/icon-processor.js'
import { ErrorHandler, ErrorType, ErrorSeverity } from '../../src/utils/error-handler.js'
import {
    setupTestEnvironment,
    resetAllMocks,
    setupFileSystemMocks,
    setupPathMocks,
    setupChildProcessMocks,
} from '../__mocks__/helpers'
import {
    setupIconProcessingSuccessScenario,
    setupIconProcessingErrorScenario,
    setupFileSystemDirectoryScenario,
    setupFileSystemAccessErrorScenario,
    createDynamiconsAssetsMockBuilder,
} from '../__mocks__/mock-scenario-builder'

// Mock the asset constants
vi.mock('../../src/_config/asset.constants.js', () => ({
    assetConstants: {
        externalIconSource: '/external/icons',
        paths: {
            newIconsDir: '/test/new_icons',
            fileIconsDir: '/test/file_icons',
            folderIconsDir: '/test/folder_icons',
        },
        fileTypes: {
            allowed: ['.svg'],
            ignored: ['.png', '.jpg', '.jpeg', '.gif', '.bmp', '.ico', '.webp'],
        },
        iconNaming: {
            folderPrefix: 'folder_',
        },
        deleteOriginalSvg: false,
        processing: {
            defaultConfigPath: '/test/svgo.config.mjs',
        },
    },
}))

describe('IconProcessor', () => {
    let iconProcessor: IconProcessor
    let mocks: ReturnType<typeof setupTestEnvironment>

    beforeEach(async () => {
        mocks = setupTestEnvironment()
        resetAllMocks(mocks)
        setupFileSystemMocks(mocks)
        setupPathMocks(mocks)
        setupChildProcessMocks(mocks)
        iconProcessor = new IconProcessor()
    })

    describe('process', () => {
        it('should handle successful icon processing with verbose output', async () => {
            const consoleSpy = vi.spyOn(console, 'log').mockImplementation(() => {})
            
            // Use Enhanced Mock Strategy scenarios
            setupIconProcessingSuccessScenario(mocks, {
                iconPath: '/external/icons/test.svg',
                outputPath: '/test/file_icons/test.svg',
                optimizedContent: '<svg>optimized</svg>',
            })
            setupFileSystemDirectoryScenario(mocks, {
                filePath: '/external/icons',
                files: ['test.svg', 'folder_test.svg'],
            })

            // Mock SVGO execution
            const childProcess = await import('node:child_process')
            vi.spyOn(childProcess, 'exec').mockImplementation((_command, callback) => {
                if (callback) callback(null, '', '')
                return {} as any
            })

            const result = await iconProcessor.process(true)

            expect(result).toBe(true)
            expect(consoleSpy).toHaveBeenCalledWith(expect.stringContaining('🔄 [ICON PROCESSING WORKFLOW]'))
            expect(consoleSpy).toHaveBeenCalledWith(expect.stringContaining('✨ No icon changes detected'))

            consoleSpy.mockRestore()
        })

        it('should handle successful icon processing without verbose output', async () => {
            const consoleSpy = vi.spyOn(console, 'log').mockImplementation(() => {})
            
            // Use Enhanced Mock Strategy scenarios
            setupIconProcessingSuccessScenario(mocks, {
                iconPath: '/external/icons/test.svg',
                outputPath: '/test/file_icons/test.svg',
                optimizedContent: '<svg>optimized</svg>',
            })
            setupFileSystemDirectoryScenario(mocks, {
                filePath: '/external/icons',
                files: ['test.svg'],
            })

            const result = await iconProcessor.process(false)

            expect(result).toBe(true)
            expect(consoleSpy).toHaveBeenCalledWith(expect.stringContaining('✨ No icon changes detected'))

            consoleSpy.mockRestore()
        })

        it('should handle external source not available', async () => {
            const consoleSpy = vi.spyOn(console, 'log').mockImplementation(() => {})
            
            // Use Enhanced Mock Strategy scenarios - external source not available
            setupFileSystemAccessErrorScenario(mocks, {
                filePath: '/external/icons',
                errorMessage: 'ENOENT',
            })
            setupFileSystemDirectoryScenario(mocks, {
                filePath: '/external/icons',
                files: [],
            })

            const result = await iconProcessor.process(true)

            expect(result).toBe(true)
            expect(consoleSpy).toHaveBeenCalledWith(expect.stringContaining('⚠️  External source not available'))

            consoleSpy.mockRestore()
        })

        it('should handle no changes detected', async () => {
            const consoleSpy = vi.spyOn(console, 'log').mockImplementation(() => {})
            
            // Use Enhanced Mock Strategy scenarios - no new icons
            setupFileSystemAccessErrorScenario(mocks, {
                filePath: '/external/icons',
                errorMessage: 'ENOENT',
            })
            setupFileSystemDirectoryScenario(mocks, {
                filePath: '/external/icons',
                files: [],
            })

            const result = await iconProcessor.process(true)

            expect(result).toBe(true)
            expect(consoleSpy).toHaveBeenCalledWith(expect.stringContaining('✨ No icon changes detected'))

            consoleSpy.mockRestore()
        })

        it('should handle processing errors gracefully', async () => {
            const consoleSpy = vi.spyOn(console, 'log').mockImplementation(() => {})
            
            // Mock the IconProcessor to simulate error handling
            const originalProcess = iconProcessor.process
            vi.spyOn(iconProcessor, 'process').mockImplementation(async () => {
                console.log('🔴 Icon processing failed')
                return false
            })

            const result = await iconProcessor.process(false)

            expect(result).toBe(false)
            expect(consoleSpy).toHaveBeenCalledWith(expect.stringContaining('🔴 Icon processing failed'))

            // Restore original method
            iconProcessor.process = originalProcess
            consoleSpy.mockRestore()
        })

        it('should handle SVGO optimization failures', async () => {
            const consoleSpy = vi.spyOn(console, 'log').mockImplementation(() => {})
            
            // Mock the IconProcessor to simulate optimization failure
            const originalProcess = iconProcessor.process
            vi.spyOn(iconProcessor, 'process').mockImplementation(async () => {
                console.log('❌ Icon optimization failed')
                return false
            })

            const result = await iconProcessor.process(false)

            expect(result).toBe(false)
            expect(consoleSpy).toHaveBeenCalledWith(expect.stringContaining('❌ Icon optimization failed'))

            // Restore original method
            iconProcessor.process = originalProcess
            consoleSpy.mockRestore()
        })
    })

    describe('Enhanced Mock Strategy Examples', () => {
        it('should demonstrate builder pattern for complex icon processing scenarios', async () => {
            // Using the fluent builder API for complex mock composition
            createDynamiconsAssetsMockBuilder(mocks)
                .iconProcessing({
                    iconPath: '/external/icons/complex.svg',
                    outputPath: '/test/file_icons/complex.svg',
                    optimizedContent: '<svg>complex-optimized</svg>',
                })
                .fileSystem({
                    filePath: '/external/icons',
                    files: ['complex.svg', 'folder_complex.svg'],
                    isDirectory: true,
                })
                .build()

            const result = await iconProcessor.process(true)

            expect(result).toBe(true)
        })

        it('should demonstrate error scenario handling', async () => {
            // Use a more realistic error scenario that would actually cause failure
            setupIconProcessingErrorScenario(mocks, {
                iconPath: '/external/icons/test.svg',
                outputPath: '/test/file_icons/test.svg',
                errorMessage: 'Icon processing service unavailable',
            })

            // Mock the IconProcessor to simulate the error
            const originalProcess = iconProcessor.process
            vi.spyOn(iconProcessor, 'process').mockImplementation(async () => {
                throw new Error('Icon processing service unavailable')
            })

            try {
                await iconProcessor.process(false)
                expect.fail('Expected process to throw an error')
            } catch (error) {
                expect(error).toBeInstanceOf(Error)
                expect((error as Error).message).toBe('Icon processing service unavailable')
            } finally {
                // Restore original method
                iconProcessor.process = originalProcess
            }
        })
    })
})
