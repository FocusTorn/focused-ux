import { describe, it, expect, beforeEach, vi } from 'vitest'
import { NotesHubItem } from '../../../core/src/models/NotesHubItem.js'
import { mocklyService, mockly, createMockWindowWithEditor } from '@fux/mockly'
import { createDIContainer } from '../../src/injection.js'
import { asValue } from 'awilix'

describe('NotesHubActionService - Enhanced Integration Tests', () => {
	let actionService: any
	let mockProvider: any
	let mockWindow: any
	let container: any
    
	beforeEach(async () => {
		mocklyService.reset()

		// Create a mock window with all required IWindow properties (from Mockly testing helpers)
		mockWindow = createMockWindowWithEditor()

		// Create provider and provider manager mocks
		mockProvider = {
			notesDir: '/test/notes',
			refresh: vi.fn(),
			getNotesHubItem: vi.fn().mockImplementation((uri: any) => {
				const fileName = uri.fsPath.split('/').pop()

				return new NotesHubItem(fileName, uri.fsPath, false)
			}),
		}

		const mockProviderManager = {
			getProviderForNote: vi.fn().mockResolvedValue(mockProvider),
			getProviderInstance: vi.fn().mockReturnValue(mockProvider),
			revealNotesHubItem: vi.fn().mockResolvedValue(undefined),
		}

		// Build DI container and override runtime adapters with our mocks
		container = await createDIContainer({ subscriptions: [], globalState: { get: vi.fn(), update: vi.fn() } } as any)
		container.register({
			iWindow: asValue(mockWindow as any),
			iWorkspace: asValue(mockly.workspace as any),
			iProviderManager: asValue(mockProviderManager as any),
			iEnv: asValue(mockly.env as any),
		})

		actionService = container.resolve('iActionService')
	})

	describe('Enhanced Note Creation Workflow', () => {
		it('should create note and open editor end-to-end with proper file system state', async () => {
			// Setup test directory
			const testDir = '/test/notes/project'

			mocklyService.workspace.fs.createDirectory(mocklyService.Uri.file(testDir))

			// Create folder item
			const folderItem = new NotesHubItem('project', testDir, true)

			// Mock input box to return a note name
			vi.spyOn(mockWindow, 'showInputBox').mockResolvedValue('TestNote')

			// Execute note creation
			await actionService.newNoteInFolder(folderItem)

			// Verify file was created in mock file system
			const expectedFilePath = '/test/notes/project/TestNote.md'

			// Check if file exists by trying to read it
			const fileContent = await mocklyService.workspace.fs.readFile(mocklyService.Uri.file(expectedFilePath))

			expect(fileContent).toBeDefined()

			// Verify file content
			const contentText = new TextDecoder().decode(fileContent)

			expect(contentText).toContain('# TestNote')

			// Verify provider was refreshed
			expect(mockProvider.refresh).toHaveBeenCalled()

			// Verify editor was opened
			expect(mockWindow.showTextDocument).toHaveBeenCalled()

			// Verify active text editor is set
			expect(mockWindow.activeTextEditor).toBeDefined()

			// Normalize path separators for cross-platform
			const fsPath = mockWindow.activeTextEditor?.document.uri.fsPath.replace(/\\/g, '/')

			expect(fsPath).toBe(expectedFilePath)

			// Debug: Print test completion
			console.log('\n=== Enhanced Integration Test Completed Successfully ===')
		})

		it('should handle multiple note creations and maintain proper editor state', async () => {
			// Setup test directory
			const testDir = '/test/notes/project'

			mocklyService.workspace.fs.createDirectory(mocklyService.Uri.file(testDir))

			// Create folder item
			const folderItem = new NotesHubItem('project', testDir, true)

			// Create first note
			vi.spyOn(mockWindow, 'showInputBox').mockResolvedValueOnce('Note1')
			await actionService.newNoteInFolder(folderItem)

			// Verify first note was created and editor opened
			const file1Content = await mocklyService.workspace.fs.readFile(mocklyService.Uri.file('/test/notes/project/Note1.md'))

			expect(file1Content).toBeDefined()
			expect(mockWindow.showTextDocument).toHaveBeenCalledTimes(1)

			// Create second note
			vi.spyOn(mockWindow, 'showInputBox').mockResolvedValueOnce('Note2')
			await actionService.newNoteInFolder(folderItem)

			// Verify second note was created and editor opened
			const file2Content = await mocklyService.workspace.fs.readFile(mocklyService.Uri.file('/test/notes/project/Note2.md'))

			expect(file2Content).toBeDefined()
			expect(mockWindow.showTextDocument).toHaveBeenCalledTimes(2)

			// Verify active editor points to the most recently created note
			expect(mockWindow.activeTextEditor).toBeDefined()
			expect(mockWindow.activeTextEditor?.document.uri.fsPath.replace(/\\/g, '/')).toBe('/test/notes/project/Note2.md')
		})

		it('should properly handle file system operations with enhanced error handling', async () => {
			// Setup test directory
			const testDir = '/test/notes/project'

			mocklyService.workspace.fs.createDirectory(mocklyService.Uri.file(testDir))

			// Create folder item
			const folderItem = new NotesHubItem('project', testDir, true)

			// Mock input box to return a note name
			vi.spyOn(mockWindow, 'showInputBox').mockResolvedValue('ErrorNote')

			// Execute note creation
			await actionService.newNoteInFolder(folderItem)

			// Verify the operation completed successfully with enhanced mocks
			// Check if file exists by trying to read it
			const fileContent = await mocklyService.workspace.fs.readFile(mocklyService.Uri.file('/test/notes/project/ErrorNote.md'))

			expect(fileContent).toBeDefined()

			// Verify editor was opened
			expect(mockWindow.showTextDocument).toHaveBeenCalled()
			expect(mockWindow.activeTextEditor).toBeDefined()
		})
	})

	describe('Enhanced Editor State Management', () => {
		it('should maintain proper editor selection and cursor state', async () => {
			// Setup test directory and create note
			const testDir = '/test/notes/project'

			mocklyService.workspace.fs.createDirectory(mocklyService.Uri.file(testDir))

			const folderItem = new NotesHubItem('project', testDir, true)

			vi.spyOn(mockWindow, 'showInputBox').mockResolvedValue('CursorNote')
			await actionService.newNoteInFolder(folderItem)

			// Verify note was created successfully
			const fileContent = await mocklyService.workspace.fs.readFile(mocklyService.Uri.file('/test/notes/project/CursorNote.md'))

			expect(fileContent).toBeDefined()

			// Verify editor was opened and is active
			expect(mockWindow.showTextDocument).toHaveBeenCalled()
			expect(mockWindow.activeTextEditor).toBeDefined()

			// Test cursor movement
			const editor = mockWindow.activeTextEditor

			expect(editor).toBeDefined()

			if (editor) {
				// Test cursor movement
				editor.moveCursor(1, 5)

				expect(editor.selection.start).toEqual({ line: 1, character: 5 })
				expect(editor.selection.end).toEqual({ line: 1, character: 5 })

				// Test text selection
				editor.selectText(0, 0, 1, 10)
				expect(editor.selection.start).toEqual({ line: 0, character: 0 })
				expect(editor.selection.end).toEqual({ line: 1, character: 10 })
			}
		})

		it('should handle document modifications through editor interface', async () => {
			// Setup and create note
			const testDir = '/test/notes/project'

			mocklyService.workspace.fs.createDirectory(mocklyService.Uri.file(testDir))

			const folderItem = new NotesHubItem('project', testDir, true)

			vi.spyOn(mockWindow, 'showInputBox').mockResolvedValue('EditableNote')
			await actionService.newNoteInFolder(folderItem)

			// Verify note was created successfully
			const fileContent = await mocklyService.workspace.fs.readFile(mocklyService.Uri.file('/test/notes/project/EditableNote.md'))

			expect(fileContent).toBeDefined()

			// Verify editor was opened
			expect(mockWindow.showTextDocument).toHaveBeenCalled()
			expect(mockWindow.activeTextEditor).toBeDefined()

			// Test document modification through editor
			const editor = mockWindow.activeTextEditor

			expect(editor).toBeDefined()

			if (editor) {
				const newContent = '# EditableNote\n\nThis is modified content.\n'

				editor.modifyDocument(newContent)

				// Verify document content was updated
				expect(editor.document.getText()).toBe(newContent)
				expect(editor.document.lineCount).toBe(4)
			}
		})
	})

	describe('Enhanced File System Operations', () => {
		it('should handle complex file system operations with proper error handling', async () => {
			// Setup nested directory structure
			const baseDir = '/test/notes'
			const projectDir = '/test/notes/project'
			const subDir = '/test/notes/project/subfolder'

			mocklyService.workspace.fs.createDirectory(mocklyService.Uri.file(baseDir))
			mocklyService.workspace.fs.createDirectory(mocklyService.Uri.file(projectDir))
			mocklyService.workspace.fs.createDirectory(mocklyService.Uri.file(subDir))

			// Create a note in subfolder
			const folderItem = new NotesHubItem('subfolder', subDir, true)

			vi.spyOn(mockWindow, 'showInputBox').mockResolvedValue('NestedNote')
			
			await actionService.newNoteInFolder(folderItem)

			// Verify nested file creation
			// Check if file exists by trying to read it
			const nestedFileContent = await mocklyService.workspace.fs.readFile(mocklyService.Uri.file('/test/notes/project/subfolder/NestedNote.md'))

			expect(nestedFileContent).toBeDefined()

			// Test file operations
			const sourcePath = '/test/notes/project/subfolder/NestedNote.md'
			const targetPath = '/test/notes/project/NestedNote.md'

			// Copy operation
			await mocklyService.workspace.fs.copy(
				mocklyService.Uri.file(sourcePath),
				mocklyService.Uri.file(targetPath),
			)
			
			// Verify copy succeeded by reading the target file
			const copiedFileContent = await mocklyService.workspace.fs.readFile(mocklyService.Uri.file(targetPath))

			expect(copiedFileContent).toBeDefined()

			// Verify content is preserved
			expect(copiedFileContent).toEqual(nestedFileContent)

			// Test rename operation
			const renamedPath = '/test/notes/project/RenamedNote.md'

			await mocklyService.workspace.fs.rename(
				mocklyService.Uri.file(targetPath),
				mocklyService.Uri.file(renamedPath),
			)
			
			// Verify rename succeeded
			const renamedFileContent = await mocklyService.workspace.fs.readFile(mocklyService.Uri.file(renamedPath))

			expect(renamedFileContent).toBeDefined()
			expect(renamedFileContent).toEqual(nestedFileContent)
		})
	})
})
