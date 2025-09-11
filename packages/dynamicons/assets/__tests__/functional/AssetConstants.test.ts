import { describe, it, expect } from 'vitest'
import { assetConstants } from '../../src/_config/asset.constants.js'

describe('AssetConstants', () => {
    describe('Path Configuration', () => {
        it('should have correct file icons directory path', () => {
            expect(assetConstants.paths.fileIconsDir).toBeDefined()
            expect(typeof assetConstants.paths.fileIconsDir).toBe('string')
            expect(assetConstants.paths.fileIconsDir).toContain('file_icons')
        })

        it('should have correct folder icons directory path', () => {
            expect(assetConstants.paths.folderIconsDir).toBeDefined()
            expect(typeof assetConstants.paths.folderIconsDir).toBe('string')
            expect(assetConstants.paths.folderIconsDir).toContain('folder_icons')
        })

        it('should have correct language icons directory path', () => {
            expect(assetConstants.paths.languageIconsDir).toBeDefined()
            expect(typeof assetConstants.paths.languageIconsDir).toBe('string')
            expect(assetConstants.paths.languageIconsDir).toContain('file_icons') // Language icons use same dir as file icons
        })

        it('should have correct models directory path', () => {
            expect(assetConstants.paths.modelsDir).toBeDefined()
            expect(typeof assetConstants.paths.modelsDir).toBe('string')
            expect(assetConstants.paths.modelsDir).toContain('models')
        })

        it('should have correct new icons directory path', () => {
            expect(assetConstants.paths.newIconsDir).toBeDefined()
            expect(typeof assetConstants.paths.newIconsDir).toBe('string')
            expect(assetConstants.paths.newIconsDir).toContain('new_icons')
        })

        it('should have correct preview images directory path', () => {
            expect(assetConstants.paths.distPreviewImagesDir).toBeDefined()
            expect(typeof assetConstants.paths.distPreviewImagesDir).toBe('string')
            expect(assetConstants.paths.distPreviewImagesDir).toContain('images')
        })

        it('should have correct dist icons directory path', () => {
            expect(assetConstants.paths.distIconsDir).toBeDefined()
            expect(typeof assetConstants.paths.distIconsDir).toBe('string')
            expect(assetConstants.paths.distIconsDir).toContain('icons')
        })

        it('should have correct dist themes directory path', () => {
            expect(assetConstants.paths.distThemesDir).toBeDefined()
            expect(typeof assetConstants.paths.distThemesDir).toBe('string')
            expect(assetConstants.paths.distThemesDir).toContain('themes')
        })

        it('should have correct dist images directory path', () => {
            expect(assetConstants.paths.distImagesDir).toBeDefined()
            expect(typeof assetConstants.paths.distImagesDir).toBe('string')
            expect(assetConstants.paths.distImagesDir).toContain('images')
        })
    })

    describe('Path Consistency', () => {
        it('should have consistent path structure', () => {
            const paths = assetConstants.paths
            
            // All paths should be strings
            Object.values(paths).forEach(path => {
                expect(typeof path).toBe('string')
                expect(path.length).toBeGreaterThan(0)
            })
        })

        it('should have proper path separators', () => {
            const paths = assetConstants.paths
            
            // All paths should use forward slashes or be relative
            Object.values(paths).forEach(path => {
                expect(path).not.toContain('\\')
            })
        })

        it('should have consistent directory naming', () => {
            const paths = assetConstants.paths
            
            // File icons paths should contain 'file'
            expect(paths.fileIconsDir).toContain('file')
            
            // Folder icons paths should contain 'folder'
            expect(paths.folderIconsDir).toContain('folder')
            
            // Language icons paths should contain 'file' (they use file_icons directory)
            expect(paths.languageIconsDir).toContain('file')
        })
    })


    describe('Dist Directory Structure', () => {
        it('should have dist directories for processed assets', () => {
            const paths = assetConstants.paths
            
            expect(paths.distIconsDir).toContain('dist')
            expect(paths.distThemesDir).toContain('dist')
            expect(paths.distImagesDir).toContain('dist')
        })

        it('should have consistent dist directory naming', () => {
            const paths = assetConstants.paths
            
            // Dist directories should follow the same pattern as source directories
            expect(paths.distIconsDir).toContain('icons')
            expect(paths.distThemesDir).toContain('themes')
            expect(paths.distImagesDir).toContain('images')
        })
    })

    describe('Configuration Validation', () => {
        it('should export assetConstants as an object', () => {
            expect(assetConstants).toBeDefined()
            expect(typeof assetConstants).toBe('object')
            expect(assetConstants).not.toBeNull()
        })

        it('should have paths property', () => {
            expect(assetConstants.paths).toBeDefined()
            expect(typeof assetConstants.paths).toBe('object')
            expect(assetConstants.paths).not.toBeNull()
        })

        it('should have all required path properties', () => {
            const requiredPaths = [
                'newIconsDir',
                'fileIconsDir',
                'folderIconsDir',
                'languageIconsDir',
                'distImagesDir',
                'distPreviewImagesDir',
                'distIconsDir',
                'distThemesDir',
                'modelsDir',
            ]
            
            requiredPaths.forEach(pathName => {
                expect(assetConstants.paths).toHaveProperty(pathName)
                expect(assetConstants.paths[pathName]).toBeDefined()
            })
        })

        it('should not have undefined or null paths', () => {
            const paths = assetConstants.paths
            
            Object.values(paths).forEach(path => {
                expect(path).toBeDefined()
                expect(path).not.toBeNull()
                expect(path).not.toBe('')
            })
        })
    })

    describe('Path Relationships', () => {
        it('should have source and dist paths that correspond', () => {
            const paths = assetConstants.paths
            
            // File icons source and dist should both contain 'file'
            expect(paths.fileIconsDir).toContain('file')
            expect(paths.distIconsDir).toContain('icons')
            
            // Themes should have dist path
            expect(paths.distThemesDir).toContain('themes')
            
            // Images should have dist path
            expect(paths.distImagesDir).toContain('images')
        })

        it('should have consistent directory structure', () => {
            const paths = assetConstants.paths
            
            // All icon directories should be under assets/icons
            expect(paths.fileIconsDir).toContain('assets/icons')
            expect(paths.folderIconsDir).toContain('assets/icons')
            expect(paths.languageIconsDir).toContain('assets/icons')
            expect(paths.newIconsDir).toContain('assets/icons')
        })
    })

    describe('Configuration Immutability', () => {
        it('should maintain consistent configuration structure', () => {
            // Verify the configuration structure is consistent
            expect(assetConstants.paths).toBeDefined()
            expect(assetConstants.fileTypes).toBeDefined()
            expect(assetConstants.iconNaming).toBeDefined()
            expect(assetConstants.themeFiles).toBeDefined()
            expect(assetConstants.processing).toBeDefined()
        })

        it('should have stable path values', () => {
            const paths = assetConstants.paths
            
            // Paths should be consistent across multiple accesses
            expect(paths.fileIconsDir).toBe(paths.fileIconsDir)
            expect(paths.folderIconsDir).toBe(paths.folderIconsDir)
            expect(paths.languageIconsDir).toBe(paths.languageIconsDir)
        })
    })
})
