import { describe, it, expect, beforeEach, vi } from 'vitest'
import { validateModels } from '../../src/utils/model-validator.js'

// Mock file system operations
vi.mock('fs', () => ({
    promises: {
        readFile: vi.fn(),
        readdir: vi.fn(),
        access: vi.fn(),
    }
}))

describe('ModelValidator', () => {
    let mockFs: any

    beforeEach(async () => {
        mockFs = await import('fs')
        vi.clearAllMocks()
    })

    describe('validateModels', () => {
        it('should validate valid model files', async () => {
            const validFileModelData = {
                file: { iconName: 'default-file' },
                icons: [
                    {
                        iconName: 'test-icon',
                        fileExtensions: ['.test']
                    }
                ]
            }

            const validFolderModelData = {
                folder: { iconName: 'default-folder' },
                rootFolder: { iconName: 'default-root' },
                icons: [
                    {
                        iconName: 'folder-icon',
                        folderNames: ['test-folder']
                    }
                ]
            }

            const validLanguageModelData = {
                icons: [
                    {
                        languageID: 'typescript',
                        iconName: 'ts-icon'
                    }
                ]
            }

            vi.spyOn(mockFs.promises, 'access').mockResolvedValue(undefined)
            vi.spyOn(mockFs.promises, 'readFile')
                .mockResolvedValueOnce(JSON.stringify(validFileModelData))
                .mockResolvedValueOnce(JSON.stringify(validFolderModelData))
                .mockResolvedValueOnce(JSON.stringify(validLanguageModelData))

            const result = await validateModels(true) // silent mode

            expect(result).toBe(true)
        })

        it('should detect invalid JSON in model files', async () => {
            vi.spyOn(mockFs.promises, 'access').mockResolvedValue(undefined)
            vi.spyOn(mockFs.promises, 'readFile')
                .mockResolvedValueOnce('invalid json content')
                .mockResolvedValueOnce('{}')
                .mockResolvedValueOnce('{}')

            const result = await validateModels(true) // silent mode

            expect(result).toBe(false)
        })

        it('should detect missing required fields in model data', async () => {
            const invalidModelData = {
                // Missing 'icons' field
                metadata: 'test'
            }

            vi.spyOn(mockFs.promises, 'access').mockResolvedValue(undefined)
            vi.spyOn(mockFs.promises, 'readFile')
                .mockResolvedValueOnce(JSON.stringify(invalidModelData))
                .mockResolvedValueOnce('{}')
                .mockResolvedValueOnce('{}')

            const result = await validateModels(true) // silent mode

            expect(result).toBe(false)
        })

        it('should detect invalid icon structure', async () => {
            const invalidModelData = {
                file: { iconName: 'default-file' },
                icons: [
                    {
                        // Missing required iconName field
                        fileExtensions: ['.test']
                    }
                ]
            }

            vi.spyOn(mockFs.promises, 'access').mockResolvedValue(undefined)
            vi.spyOn(mockFs.promises, 'readFile').mockResolvedValue(JSON.stringify(invalidModelData))

            const result = await validateModels(true) // silent mode

            expect(result).toBe(false)
        })

        it('should handle file system errors', async () => {
            vi.spyOn(mockFs.promises, 'access').mockRejectedValue(new Error('Permission denied'))

            const result = await validateModels(true) // silent mode

            expect(result).toBe(false)
        })

        it('should validate multiple model files', async () => {
            const validFileModelData = {
                file: { iconName: 'default-file' },
                icons: [
                    {
                        iconName: 'file-icon',
                        fileExtensions: ['.test']
                    }
                ]
            }

            const validFolderModelData = {
                folder: { iconName: 'default-folder' },
                rootFolder: { iconName: 'default-root' },
                icons: [
                    {
                        iconName: 'folder-icon',
                        folderNames: ['test-folder']
                    }
                ]
            }

            const validLanguageModelData = {
                icons: [
                    {
                        languageID: 'typescript',
                        iconName: 'ts-icon'
                    }
                ]
            }

            vi.spyOn(mockFs.promises, 'access').mockResolvedValue(undefined)
            vi.spyOn(mockFs.promises, 'readFile')
                .mockResolvedValueOnce(JSON.stringify(validFileModelData))
                .mockResolvedValueOnce(JSON.stringify(validFolderModelData))
                .mockResolvedValueOnce(JSON.stringify(validLanguageModelData))

            const result = await validateModels(true) // silent mode

            expect(result).toBe(true)
        })

        it('should handle file access errors', async () => {
            vi.spyOn(mockFs.promises, 'access').mockRejectedValue(new Error('ENOENT'))

            const result = await validateModels(true) // silent mode

            expect(result).toBe(false)
        })
    })
})
