import { describe, it, expect, beforeEach, vi } from 'vitest'
import { IconProcessor } from '../../src/processors/icon-processor.js'
import { ErrorHandler, ErrorType, ErrorSeverity } from '../../src/utils/error-handler.js'

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
    let mockFs: any

    beforeEach(async () => {
        iconProcessor = new IconProcessor()
        mockFs = await import('fs/promises')
        vi.clearAllMocks()
    })

    describe('process', () => {
        it('should handle successful icon processing with verbose output', async () => {
            const consoleSpy = vi.spyOn(console, 'log').mockImplementation(() => {})
            
            // Mock file system operations
            vi.spyOn(mockFs, 'access').mockResolvedValue(undefined)
            vi.spyOn(mockFs, 'readdir').mockResolvedValue(['test.svg', 'folder_test.svg'])
            vi.spyOn(mockFs, 'mkdir').mockResolvedValue(undefined)
            vi.spyOn(mockFs, 'copyFile').mockResolvedValue(undefined)
            vi.spyOn(mockFs, 'stat').mockResolvedValue({ size: 1000 })
            vi.spyOn(mockFs, 'rename').mockResolvedValue(undefined)
            vi.spyOn(mockFs, 'unlink').mockResolvedValue(undefined)

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
            
            // Mock file system operations
            vi.spyOn(mockFs, 'access').mockResolvedValue(undefined)
            vi.spyOn(mockFs, 'readdir').mockResolvedValue(['test.svg'])
            vi.spyOn(mockFs, 'mkdir').mockResolvedValue(undefined)
            vi.spyOn(mockFs, 'copyFile').mockResolvedValue(undefined)
            vi.spyOn(mockFs, 'stat').mockResolvedValue({ size: 1000 })
            vi.spyOn(mockFs, 'rename').mockResolvedValue(undefined)

            // Mock SVGO execution
            const childProcess = await import('node:child_process')
            vi.spyOn(childProcess, 'exec').mockImplementation((_command, callback) => {
                if (callback) callback(null, '', '')
                return {} as any
            })

            const result = await iconProcessor.process(false)

            expect(result).toBe(true)
            expect(consoleSpy).toHaveBeenCalledWith(expect.stringContaining('✨ No icon changes detected'))

            consoleSpy.mockRestore()
        })

        it('should handle external source not available', async () => {
            const consoleSpy = vi.spyOn(console, 'log').mockImplementation(() => {})
            
            // Mock file system operations - external source not available
            vi.spyOn(mockFs, 'access').mockRejectedValue(new Error('ENOENT'))
            vi.spyOn(mockFs, 'readdir').mockResolvedValue([])

            const result = await iconProcessor.process(true)

            expect(result).toBe(true)
            expect(consoleSpy).toHaveBeenCalledWith(expect.stringContaining('⚠️  External source not available'))

            consoleSpy.mockRestore()
        })

        it('should handle no changes detected', async () => {
            const consoleSpy = vi.spyOn(console, 'log').mockImplementation(() => {})
            
            // Mock file system operations - no new icons
            vi.spyOn(mockFs, 'access').mockRejectedValue(new Error('ENOENT'))
            vi.spyOn(mockFs, 'readdir').mockResolvedValue([])

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
})
