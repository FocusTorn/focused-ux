import { describe, it, expect, beforeEach, vi } from 'vitest'
import { NotesHubManagerService } from '../../src/services/NotesHubManager.service.js'
import type { INotesHubDependencies } from '../../src/_interfaces/INotesHubManagerService.js'
import type { INotesHubItem } from '../../src/_interfaces/INotesHubItem.js'
import type { INotesHubDataProvider } from '../../src/_interfaces/INotesHubDataProvider.js'
import type { NotesHubConfig } from '../../src/_interfaces/INotesHubConfigService.js'

describe('Notes Hub Manager Complex Orchestration', () => {
    let manager: NotesHubManagerService
    let mockDependencies: INotesHubDependencies

    beforeEach(() => {
        // Create comprehensive mock dependencies
        mockDependencies = {
            workspace: {
                onDidChangeConfiguration: vi.fn().mockReturnValue({ dispose: vi.fn() })
            },
            window: {
                showWarningMessage: vi.fn(),
                showInformationMessage: vi.fn(),
                showErrorMessage: vi.fn(),
                showInputBox: vi.fn().mockResolvedValue('test-note.md')
            },
            commands: {
                executeCommand: vi.fn().mockResolvedValue(undefined)
            },
            configService: {
                getNotesHubConfig: vi.fn().mockReturnValue({
                    projectNotesPath: '/test/project',
                    remoteNotesPath: '/test/remote',
                    globalNotesPath: '/test/global',
                    isProjectNotesEnabled: true,
                    isRemoteNotesEnabled: true,
                    isGlobalNotesEnabled: true
                } as NotesHubConfig),
                createDirectoryIfNeeded: vi.fn().mockResolvedValue(undefined)
            },
            actionService: {
                openNote: vi.fn().mockResolvedValue(undefined),
                renameItem: vi.fn().mockResolvedValue(undefined),
                addFrontmatter: vi.fn().mockResolvedValue(undefined),
                openNotePreview: vi.fn().mockResolvedValue(undefined),
                deleteItem: vi.fn().mockResolvedValue(undefined),
                copyItem: vi.fn().mockResolvedValue(undefined),
                cutItem: vi.fn().mockResolvedValue(undefined),
                pasteItem: vi.fn().mockResolvedValue(undefined),
                newNoteInFolder: vi.fn().mockResolvedValue(undefined),
                newFolderInFolder: vi.fn().mockResolvedValue(undefined),
                newNoteAtRoot: vi.fn().mockResolvedValue(undefined),
                newFolderAtRoot: vi.fn().mockResolvedValue(undefined)
            },
            providerManager: {
                initializeProviders: vi.fn().mockResolvedValue(undefined),
                dispose: vi.fn(),
                getProviderForNote: vi.fn().mockResolvedValue({
                    providerName: 'project',
                    notesDir: '/test/project'
                } as INotesHubDataProvider),
                refreshProviders: vi.fn(),
                revealNotesHubItem: vi.fn().mockResolvedValue(undefined)
            },
            context: {
                extensionPath: '/test/extension'
            },
            commonUtils: {
                errMsg: vi.fn()
            },
            frontmatterUtils: {
                parseFrontmatter: vi.fn(),
                stringifyFrontmatter: vi.fn()
            },
            pathUtils: {
                sanitizePath: vi.fn().mockReturnValue('/test/path'),
                join: vi.fn().mockReturnValue('/test/joined/path')
            },
            fileTypeEnum: {
                FILE: 'file',
                FOLDER: 'folder'
            },
            uriFactory: {
                file: vi.fn().mockReturnValue({ fsPath: '/test/path' })
            },
            treeItemAdapter: {},
            themeIconAdapter: {},
            themeColorAdapter: {},
            treeItemCollapsibleStateAdapter: {}
        }

        manager = new NotesHubManagerService(mockDependencies)
    })

    describe('openNoteWithValidation', () => {
        it('should execute complete workflow: validation + note opening', async () => {
            // Arrange
            const noteItem = { filePath: '/test/project/note.md', label: 'note.md' } as INotesHubItem

            // Act
            const result = await manager.openNoteWithValidation(noteItem)

            // Assert
            expect(result).toEqual({
                opened: true,
                notePath: '/test/project/note.md'
            })

            // Verify validation was called
            expect(mockDependencies.providerManager.getProviderForNote).toHaveBeenCalledWith(noteItem)

            // Verify note was opened
            expect(mockDependencies.actionService.openNote).toHaveBeenCalledWith(noteItem)

            // Verify success message
            expect(mockDependencies.window.showInformationMessage).toHaveBeenCalledWith('Note opened: /test/project/note.md')
        })

        it('should handle validation errors gracefully', async () => {
            // Arrange
            const noteItem = { filePath: '', label: 'invalid' } as INotesHubItem

            // Act & Assert
            await expect(manager.openNoteWithValidation(noteItem)).rejects.toThrow('Invalid note item provided')
        })

        it('should handle no note item gracefully', async () => {
            // Arrange
            const noteItem = undefined as any

            // Act & Assert
            await expect(manager.openNoteWithValidation(noteItem)).rejects.toThrow('No note item provided')
        })

        it('should handle provider not found gracefully', async () => {
            // Arrange
            const noteItem = { filePath: '/test/project/note.md', label: 'note.md' } as INotesHubItem
            mockDependencies.providerManager.getProviderForNote.mockResolvedValue(undefined)

            // Act
            const result = await manager.openNoteWithValidation(noteItem)

            // Assert
            expect(result).toEqual({ opened: false })
            expect(mockDependencies.window.showWarningMessage).toHaveBeenCalledWith('Could not determine provider for note: /test/project/note.md')
        })
    })

    describe('createNoteWithValidation', () => {
        it('should execute complete workflow: validation + note creation', async () => {
            // Arrange
            const providerName = 'project' as const
            const noteName = 'test-note.md'

            // Act
            const result = await manager.createNoteWithValidation(providerName, noteName)

            // Assert
            expect(result).toEqual({
                created: true,
                notePath: 'test-note.md',
                providerName: 'project'
            })

            // Verify note was created
            expect(mockDependencies.actionService.newNoteAtRoot).toHaveBeenCalledWith(providerName)

            // Verify success message
            expect(mockDependencies.window.showInformationMessage).toHaveBeenCalledWith('Note created in project provider: test-note.md')
        })

        it('should handle validation errors gracefully', async () => {
            // Arrange
            const providerName = 'invalid' as any

            // Act & Assert
            await expect(manager.createNoteWithValidation(providerName)).rejects.toThrow('Invalid provider name provided')
        })

        it('should handle no provider selected gracefully', async () => {
            // Arrange
            const providerName = undefined as any

            // Act & Assert
            await expect(manager.createNoteWithValidation(providerName)).rejects.toThrow('No provider selected')
        })

        it('should handle no note name gracefully', async () => {
            // Arrange
            const providerName = 'project' as const
            mockDependencies.window.showInputBox.mockResolvedValue(undefined)

            // Act
            const result = await manager.createNoteWithValidation(providerName)

            // Assert
            expect(result).toEqual({ created: false, providerName: 'project' })
        })
    })

    describe('completeNoteWorkflow', () => {
        it('should execute complete workflow: open operation', async () => {
            // Arrange
            const operation = 'open' as const
            const noteItem = { filePath: '/test/project/note.md', label: 'note.md' } as INotesHubItem

            // Act
            const result = await manager.completeNoteWorkflow(operation, noteItem)

            // Assert
            expect(result).toEqual({
                success: true,
                operation: 'open',
                notePath: '/test/project/note.md'
            })

            // Verify the open workflow was called
            expect(mockDependencies.providerManager.getProviderForNote).toHaveBeenCalled()
            expect(mockDependencies.actionService.openNote).toHaveBeenCalled()
        })

        it('should execute complete workflow: create operation', async () => {
            // Arrange
            const operation = 'create' as const
            const providerName = 'project' as const

            // Act
            const result = await manager.completeNoteWorkflow(operation, undefined, providerName)

            // Assert
            expect(result).toEqual({
                success: true,
                operation: 'create',
                notePath: 'test-note.md'
            })

            // Verify the create workflow was called
            expect(mockDependencies.actionService.newNoteAtRoot).toHaveBeenCalledWith(providerName)
        })

        it('should execute complete workflow: delete operation', async () => {
            // Arrange
            const operation = 'delete' as const
            const noteItem = { filePath: '/test/project/note.md', label: 'note.md' } as INotesHubItem

            // Act
            const result = await manager.completeNoteWorkflow(operation, noteItem)

            // Assert
            expect(result).toEqual({
                success: true,
                operation: 'delete',
                notePath: '/test/project/note.md'
            })

            // Verify the delete workflow was called
            expect(mockDependencies.actionService.deleteItem).toHaveBeenCalledWith(noteItem)
        })

        it('should handle no note item for open operation gracefully', async () => {
            // Arrange
            const operation = 'open' as const
            const noteItem = undefined

            // Act & Assert
            await expect(manager.completeNoteWorkflow(operation, noteItem)).rejects.toThrow('No note item provided')
        })

        it('should handle no provider for create operation gracefully', async () => {
            // Arrange
            const operation = 'create' as const
            const providerName = undefined

            // Act & Assert
            await expect(manager.completeNoteWorkflow(operation, undefined, providerName)).rejects.toThrow('No provider selected')
        })
    })

    describe('legacy methods', () => {
        it('should maintain backward compatibility with openNote', async () => {
            // Arrange
            const noteItem = { filePath: '/test/project/note.md', label: 'note.md' } as INotesHubItem

            // Act
            await manager.openNote(noteItem)

            // Assert
            expect(mockDependencies.actionService.openNote).toHaveBeenCalledWith(noteItem)
        })

        it('should maintain backward compatibility with deleteItem', async () => {
            // Arrange
            const noteItem = { filePath: '/test/project/note.md', label: 'note.md' } as INotesHubItem

            // Act
            await manager.deleteItem(noteItem)

            // Assert
            expect(mockDependencies.actionService.deleteItem).toHaveBeenCalledWith(noteItem)
        })

        it('should maintain backward compatibility with newNoteAtRoot', async () => {
            // Arrange
            const providerName = 'project' as const

            // Act
            await manager.newNoteAtRoot(providerName)

            // Assert
            expect(mockDependencies.actionService.newNoteAtRoot).toHaveBeenCalledWith(providerName)
        })
    })
})
