import { describe, it, expect, beforeEach, vi } from 'vitest'
import { TreeFormatter } from '../../src/utils/tree-formatter.js'

describe('TreeFormatter', () => {
    let consoleSpy: any

    beforeEach(() => {
        vi.clearAllMocks()
        consoleSpy = vi.spyOn(console, 'log').mockImplementation(() => {})
    })

    afterEach(() => {
        consoleSpy.mockRestore()
    })

    describe('displaySimpleErrors', () => {
        it('should display errors correctly', () => {
            const errors = ['error1', 'error2']
            
            TreeFormatter.displaySimpleErrors(errors, 'Test Errors')
            
            expect(consoleSpy).toHaveBeenCalledWith('\n❌ Test Errors:')
            expect(consoleSpy).toHaveBeenCalledWith('─'.repeat(50))
            expect(consoleSpy).toHaveBeenCalledWith('├── error1')
            expect(consoleSpy).toHaveBeenCalledWith('└── error2')
            expect(consoleSpy).toHaveBeenCalledWith('─'.repeat(50))
        })

        it('should display no errors message when array is empty', () => {
            TreeFormatter.displaySimpleErrors([], 'Test Errors')
            
            expect(consoleSpy).toHaveBeenCalledWith('✅ Test Errors: No errors found')
        })
    })

    describe('displayStructuredWarnings', () => {
        it('should display warnings correctly', () => {
            const warnings = ['warning1', 'warning2']
            
            TreeFormatter.displayStructuredWarnings(warnings, 'Test Warnings')
            
            expect(consoleSpy).toHaveBeenCalledWith('\n⚠️  Test Warnings:')
            expect(consoleSpy).toHaveBeenCalledWith('─'.repeat(50))
            expect(consoleSpy).toHaveBeenCalledWith('├── warning1')
            expect(consoleSpy).toHaveBeenCalledWith('└── warning2')
            expect(consoleSpy).toHaveBeenCalledWith('─'.repeat(50))
        })

        it('should not display anything when warnings array is empty', () => {
            TreeFormatter.displayStructuredWarnings([], 'Test Warnings')
            
            expect(consoleSpy).not.toHaveBeenCalled()
        })
    })

    describe('displayStructuredSuccess', () => {
        it('should display success messages correctly', () => {
            const messages = ['success1', 'success2']
            
            TreeFormatter.displayStructuredSuccess(messages, 'Test Success')
            
            expect(consoleSpy).toHaveBeenCalledWith('\n✅ Test Success:')
            expect(consoleSpy).toHaveBeenCalledWith('─'.repeat(50))
            expect(consoleSpy).toHaveBeenCalledWith('├── success1')
            expect(consoleSpy).toHaveBeenCalledWith('└── success2')
            expect(consoleSpy).toHaveBeenCalledWith('─'.repeat(50))
        })

        it('should not display anything when messages array is empty', () => {
            TreeFormatter.displayStructuredSuccess([], 'Test Success')
            
            expect(consoleSpy).not.toHaveBeenCalled()
        })
    })

    describe('displayFileTree', () => {
        it('should display file tree correctly', () => {
            const files = ['file1.txt', 'file2.txt']
            
            TreeFormatter.displayFileTree(files, 'Test Files')
            
            expect(consoleSpy).toHaveBeenCalledWith('\n📁 Test Files:')
            expect(consoleSpy).toHaveBeenCalledWith('─'.repeat(50))
            expect(consoleSpy).toHaveBeenCalledWith('├── file1.txt')
            expect(consoleSpy).toHaveBeenCalledWith('└── file2.txt')
            expect(consoleSpy).toHaveBeenCalledWith('─'.repeat(50))
        })

        it('should display no files message when array is empty', () => {
            TreeFormatter.displayFileTree([], 'Test Files')
            
            expect(consoleSpy).toHaveBeenCalledWith('📁 Test Files: No files found')
        })
    })

    describe('displayStatistics', () => {
        it('should display statistics correctly', () => {
            const stats = { 'Total': 10, 'Passed': 8, 'Failed': 2 }
            
            TreeFormatter.displayStatistics(stats, 'Test Statistics')
            
            expect(consoleSpy).toHaveBeenCalledWith('\n📊 Test Statistics:')
            expect(consoleSpy).toHaveBeenCalledWith('─'.repeat(50))
            expect(consoleSpy).toHaveBeenCalledWith('├── Total: 10')
            expect(consoleSpy).toHaveBeenCalledWith('├── Passed: 8')
            expect(consoleSpy).toHaveBeenCalledWith('└── Failed: 2')
            expect(consoleSpy).toHaveBeenCalledWith('─'.repeat(50))
        })
    })

    describe('displayStructuredErrors', () => {
        it('should display theme errors correctly', () => {
            const themeErrors = ['theme-error1', 'theme-error2']
            
            TreeFormatter.displayStructuredErrors(
                themeErrors,
                [], // orphanedFileIcons
                [], // orphanedFolderIcons
                [], // orphanedLanguageIcons
                [], // duplicateFileIcons
                [], // duplicateFolderIcons
                [], // duplicateLanguageIcons
                [], // duplicateFileAssignments
                [], // duplicateFolderAssignments
                [], // orphanedFileAssignments
                [], // orphanedFolderAssignments
                [], // orphanedLanguageAssignments
                [], // invalidLanguageIds
                'THEME ERRORS'
            )
            
            expect(consoleSpy).toHaveBeenCalledWith('\n❌ THEME ERRORS (2):')
            expect(consoleSpy).toHaveBeenCalledWith('   ├─ theme-error1')
            expect(consoleSpy).toHaveBeenCalledWith('   └─ theme-error2')
        })

        it('should display orphaned file icons correctly', () => {
            const orphanedFileIcons = ['orphaned-file1', 'orphaned-file2']
            
            TreeFormatter.displayStructuredErrors(
                [], // themeErrors
                orphanedFileIcons,
                [], // orphanedFolderIcons
                [], // orphanedLanguageIcons
                [], // duplicateFileIcons
                [], // duplicateFolderIcons
                [], // duplicateLanguageIcons
                [], // duplicateFileAssignments
                [], // duplicateFolderAssignments
                [], // orphanedFileAssignments
                [], // orphanedFolderAssignments
                [], // orphanedLanguageAssignments
                [], // invalidLanguageIds
                'MODEL ERRORS'
            )
            
            expect(consoleSpy).toHaveBeenCalledWith('\n❌ MODEL ERRORS (2)')
            expect(consoleSpy).toHaveBeenCalledWith('└── FILE ICONS: UNUSED ICON (2) - File icon file with no assignment')
            expect(consoleSpy).toHaveBeenCalledWith('    ├── orphaned-file1')
            expect(consoleSpy).toHaveBeenCalledWith('    └── orphaned-file2')
        })

        it('should display orphaned folder icons correctly', () => {
            const orphanedFolderIcons = ['orphaned-folder1', 'orphaned-folder2']
            
            TreeFormatter.displayStructuredErrors(
                [], // themeErrors
                [], // orphanedFileIcons
                orphanedFolderIcons,
                [], // orphanedLanguageIcons
                [], // duplicateFileIcons
                [], // duplicateFolderIcons
                [], // duplicateLanguageIcons
                [], // duplicateFileAssignments
                [], // duplicateFolderAssignments
                [], // orphanedFileAssignments
                [], // orphanedFolderAssignments
                [], // orphanedLanguageAssignments
                [], // invalidLanguageIds
                'MODEL ERRORS'
            )
            
            expect(consoleSpy).toHaveBeenCalledWith('\n❌ MODEL ERRORS (2)')
            expect(consoleSpy).toHaveBeenCalledWith('└── FOLDER ICONS: UNUSED ICON (2) - Folder icon file with no assignment')
            expect(consoleSpy).toHaveBeenCalledWith('    ├── orphaned-folder1')
            expect(consoleSpy).toHaveBeenCalledWith('    └── orphaned-folder2')
        })

        it('should display duplicate file icons correctly', () => {
            const duplicateFileIcons = ['duplicate-file1', 'duplicate-file2']
            
            TreeFormatter.displayStructuredErrors(
                [], // themeErrors
                [], // orphanedFileIcons
                [], // orphanedFolderIcons
                [], // orphanedLanguageIcons
                duplicateFileIcons,
                [], // duplicateFolderIcons
                [], // duplicateLanguageIcons
                [], // duplicateFileAssignments
                [], // duplicateFolderAssignments
                [], // orphanedFileAssignments
                [], // orphanedFolderAssignments
                [], // orphanedLanguageAssignments
                [], // invalidLanguageIds
                'MODEL ERRORS'
            )
            
            expect(consoleSpy).toHaveBeenCalledWith('\n❌ MODEL ERRORS (2)')
            expect(consoleSpy).toHaveBeenCalledWith('└── FILE ICONS: DUPLICATE ASSIGNMENT (2) - File icon is used multiple times in model')
            expect(consoleSpy).toHaveBeenCalledWith('    ├── duplicate-file1')
            expect(consoleSpy).toHaveBeenCalledWith('    └── duplicate-file2')
        })

        it('should display duplicate folder icons correctly', () => {
            const duplicateFolderIcons = ['duplicate-folder1', 'duplicate-folder2']
            
            TreeFormatter.displayStructuredErrors(
                [], // themeErrors
                [], // orphanedFileIcons
                [], // orphanedFolderIcons
                [], // orphanedLanguageIcons
                [], // duplicateFileIcons
                duplicateFolderIcons,
                [], // duplicateLanguageIcons
                [], // duplicateFileAssignments
                [], // duplicateFolderAssignments
                [], // orphanedFileAssignments
                [], // orphanedFolderAssignments
                [], // orphanedLanguageAssignments
                [], // invalidLanguageIds
                'MODEL ERRORS'
            )
            
            expect(consoleSpy).toHaveBeenCalledWith('\n❌ MODEL ERRORS (2)')
            expect(consoleSpy).toHaveBeenCalledWith('└── FOLDER ICONS: DUPLICATE ASSIGNMENT (2) - Folder icon is used multiple times in model')
            expect(consoleSpy).toHaveBeenCalledWith('    ├── duplicate-folder1')
            expect(consoleSpy).toHaveBeenCalledWith('    └── duplicate-folder2')
        })

        it('should display duplicate language icons correctly', () => {
            const duplicateLanguageIcons = ['duplicate-lang1', 'duplicate-lang2']
            
            TreeFormatter.displayStructuredErrors(
                [], // themeErrors
                [], // orphanedFileIcons
                [], // orphanedFolderIcons
                [], // orphanedLanguageIcons
                [], // duplicateFileIcons
                [], // duplicateFolderIcons
                duplicateLanguageIcons,
                [], // duplicateFileAssignments
                [], // duplicateFolderAssignments
                [], // orphanedFileAssignments
                [], // orphanedFolderAssignments
                [], // orphanedLanguageAssignments
                [], // invalidLanguageIds
                'MODEL ERRORS'
            )
            
            expect(consoleSpy).toHaveBeenCalledWith('\n❌ MODEL ERRORS (2)')
            expect(consoleSpy).toHaveBeenCalledWith('└── LANGUAGE ICONS: DUPLICATE ID (2) - Language ID is used multiple times in model')
            expect(consoleSpy).toHaveBeenCalledWith('    ├── duplicate-lang1')
            expect(consoleSpy).toHaveBeenCalledWith('    └── duplicate-lang2')
        })

        it('should display duplicate file assignments correctly', () => {
            const duplicateFileAssignments = ['dup-assign1', 'dup-assign2']
            
            TreeFormatter.displayStructuredErrors(
                [], // themeErrors
                [], // orphanedFileIcons
                [], // orphanedFolderIcons
                [], // orphanedLanguageIcons
                [], // duplicateFileIcons
                [], // duplicateFolderIcons
                [], // duplicateLanguageIcons
                duplicateFileAssignments,
                [], // duplicateFolderAssignments
                [], // orphanedFileAssignments
                [], // orphanedFolderAssignments
                [], // orphanedLanguageAssignments
                [], // invalidLanguageIds
                'MODEL ERRORS'
            )
            
            expect(consoleSpy).toHaveBeenCalledWith('\n❌ MODEL ERRORS (2)')
            expect(consoleSpy).toHaveBeenCalledWith('└── FILE ICONS: DUPLICATE ASSIGNMENT (2) - File assignment is used multiple times in model')
            expect(consoleSpy).toHaveBeenCalledWith('    ├── dup-assign1')
            expect(consoleSpy).toHaveBeenCalledWith('    └── dup-assign2')
        })

        it('should display duplicate folder assignments correctly', () => {
            const duplicateFolderAssignments = ['dup-folder-assign1', 'dup-folder-assign2']
            
            TreeFormatter.displayStructuredErrors(
                [], // themeErrors
                [], // orphanedFileIcons
                [], // orphanedFolderIcons
                [], // orphanedLanguageIcons
                [], // duplicateFileIcons
                [], // duplicateFolderIcons
                [], // duplicateLanguageIcons
                [], // duplicateFileAssignments
                duplicateFolderAssignments,
                [], // orphanedFileAssignments
                [], // orphanedFolderAssignments
                [], // orphanedLanguageAssignments
                [], // invalidLanguageIds
                'MODEL ERRORS'
            )
            
            expect(consoleSpy).toHaveBeenCalledWith('\n❌ MODEL ERRORS (2)')
            expect(consoleSpy).toHaveBeenCalledWith('└── FOLDER ICONS: DUPLICATE ASSIGNMENT (2) - Folder assignment is used multiple times in model')
            expect(consoleSpy).toHaveBeenCalledWith('    ├── dup-folder-assign1')
            expect(consoleSpy).toHaveBeenCalledWith('    └── dup-folder-assign2')
        })

        it('should display orphaned file assignments correctly', () => {
            const orphanedFileAssignments = ['orphaned-assign1', 'orphaned-assign2']
            
            TreeFormatter.displayStructuredErrors(
                [], // themeErrors
                [], // orphanedFileIcons
                [], // orphanedFolderIcons
                [], // orphanedLanguageIcons
                [], // duplicateFileIcons
                [], // duplicateFolderIcons
                [], // duplicateLanguageIcons
                [], // duplicateFileAssignments
                [], // duplicateFolderAssignments
                orphanedFileAssignments,
                [], // orphanedFolderAssignments
                [], // orphanedLanguageAssignments
                [], // invalidLanguageIds
                'MODEL ERRORS'
            )
            
            expect(consoleSpy).toHaveBeenCalledWith('\n❌ MODEL ERRORS (2)')
            expect(consoleSpy).toHaveBeenCalledWith('└── FILE ICONS: NO ASSIGNMENT (2) - File icon in model but file does not exist')
            expect(consoleSpy).toHaveBeenCalledWith('    ├── orphaned-assign1')
            expect(consoleSpy).toHaveBeenCalledWith('    └── orphaned-assign2')
        })

        it('should display orphaned folder assignments correctly', () => {
            const orphanedFolderAssignments = ['orphaned-folder-assign1', 'orphaned-folder-assign2']
            
            TreeFormatter.displayStructuredErrors(
                [], // themeErrors
                [], // orphanedFileIcons
                [], // orphanedFolderIcons
                [], // orphanedLanguageIcons
                [], // duplicateFileIcons
                [], // duplicateFolderIcons
                [], // duplicateLanguageIcons
                [], // duplicateFileAssignments
                [], // duplicateFolderAssignments
                [], // orphanedFileAssignments
                orphanedFolderAssignments,
                [], // orphanedLanguageAssignments
                [], // invalidLanguageIds
                'MODEL ERRORS'
            )
            
            expect(consoleSpy).toHaveBeenCalledWith('\n❌ MODEL ERRORS (2)')
            expect(consoleSpy).toHaveBeenCalledWith('└── FOLDER ICONS: NO ASSIGNMENT (2) - Folder icon in model but file does not exist')
            expect(consoleSpy).toHaveBeenCalledWith('    ├── orphaned-folder-assign1')
            expect(consoleSpy).toHaveBeenCalledWith('    └── orphaned-folder-assign2')
        })

        it('should display orphaned language assignments correctly', () => {
            const orphanedLanguageAssignments = ['orphaned-lang-assign1', 'orphaned-lang-assign2']
            
            TreeFormatter.displayStructuredErrors(
                [], // themeErrors
                [], // orphanedFileIcons
                [], // orphanedFolderIcons
                [], // orphanedLanguageIcons
                [], // duplicateFileIcons
                [], // duplicateFolderIcons
                [], // duplicateLanguageIcons
                [], // duplicateFileAssignments
                [], // duplicateFolderAssignments
                [], // orphanedFileAssignments
                [], // orphanedFolderAssignments
                orphanedLanguageAssignments,
                [], // invalidLanguageIds
                'MODEL ERRORS'
            )
            
            expect(consoleSpy).toHaveBeenCalledWith('\n❌ MODEL ERRORS (2)')
            expect(consoleSpy).toHaveBeenCalledWith('└── LANGUAGE ICONS: NO ASSIGNMENT (2) - Language icon in model but file does not exist')
            expect(consoleSpy).toHaveBeenCalledWith('    ├── orphaned-lang-assign1')
            expect(consoleSpy).toHaveBeenCalledWith('    └── orphaned-lang-assign2')
        })

        it('should handle empty error arrays gracefully', () => {
            TreeFormatter.displayStructuredErrors(
                [], // themeErrors
                [], // orphanedFileIcons
                [], // orphanedFolderIcons
                [], // orphanedLanguageIcons
                [], // duplicateFileIcons
                [], // duplicateFolderIcons
                [], // duplicateLanguageIcons
                [], // duplicateFileAssignments
                [], // duplicateFolderAssignments
                [], // orphanedFileAssignments
                [], // orphanedFolderAssignments
                [], // orphanedLanguageAssignments
                [], // invalidLanguageIds
                'MODEL ERRORS'
            )
            
            // Should not display anything when all arrays are empty
            expect(consoleSpy).not.toHaveBeenCalled()
        })

        it('should display multiple error types correctly', () => {
            const themeErrors = ['theme-error']
            const orphanedFileIcons = ['orphaned-file']
            const duplicateFileIcons = ['duplicate-file']
            
            TreeFormatter.displayStructuredErrors(
                themeErrors,
                orphanedFileIcons,
                [], // orphanedFolderIcons
                [], // orphanedLanguageIcons
                duplicateFileIcons,
                [], // duplicateFolderIcons
                [], // duplicateLanguageIcons
                [], // duplicateFileAssignments
                [], // duplicateFolderAssignments
                [], // orphanedFileAssignments
                [], // orphanedFolderAssignments
                [], // orphanedLanguageAssignments
                [], // invalidLanguageIds
                'MODEL ERRORS'
            )
            
            expect(consoleSpy).toHaveBeenCalledWith('\n❌ THEME ERRORS (1):')
            expect(consoleSpy).toHaveBeenCalledWith('   └─ theme-error')
            expect(consoleSpy).toHaveBeenCalledWith('\n❌ MODEL ERRORS (2)')
            expect(consoleSpy).toHaveBeenCalledWith('├── FILE ICONS: UNUSED ICON (1) - File icon file with no assignment')
            expect(consoleSpy).toHaveBeenCalledWith('│   └── orphaned-file')
            expect(consoleSpy).toHaveBeenCalledWith('└── FILE ICONS: DUPLICATE ASSIGNMENT (1) - File icon is used multiple times in model')
            expect(consoleSpy).toHaveBeenCalledWith('    └── duplicate-file')
        })

        it('should handle single item arrays correctly', () => {
            const singleError = ['single-error']
            
            TreeFormatter.displayStructuredErrors(
                singleError,
                [], // orphanedFileIcons
                [], // orphanedFolderIcons
                [], // orphanedLanguageIcons
                [], // duplicateFileIcons
                [], // duplicateFolderIcons
                [], // duplicateLanguageIcons
                [], // duplicateFileAssignments
                [], // duplicateFolderAssignments
                [], // orphanedFileAssignments
                [], // orphanedFolderAssignments
                [], // orphanedLanguageAssignments
                [], // invalidLanguageIds
                'THEME ERRORS'
            )
            
            expect(consoleSpy).toHaveBeenCalledWith('\n❌ THEME ERRORS (1):')
            expect(consoleSpy).toHaveBeenCalledWith('   └─ single-error')
        })
    })
})