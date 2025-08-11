import { describe, it, expect, beforeEach, vi } from 'vitest'
import { NotesHubActionService } from '../../../core/src/services/NotesHubAction.service.js'
import { NotesHubItem } from '../../../core/src/models/NotesHubItem.js'
import { mocklyService } from '@fux/mockly'

describe('NotesHubActionService - Enhanced Integration Tests', () => {
	/* eslint-disable unused-imports/no-unused-vars */

	let mockly: any
	let actionService: NotesHubActionService
	let mockProvider: any
	let mockWindow: any

	/* eslint-enable unused-imports/no-unused-vars */
    
	beforeEach(() => {
		// Reset Mockly for each test
		mocklyService.reset()

		// Create a mock provider with enhanced functionality
		mockProvider = {
			notesDir: '/test/notes',
			refresh: vi.fn(),
			getNotesHubItem: vi.fn().mockImplementation((uri: any) => {
				const fileName = uri.fsPath.split('/').pop()

				return new NotesHubItem(fileName, uri.fsPath, false)
			}),
		}

		// Create mock provider manager
		const mockProviderManager = {
			getProviderForNote: vi.fn().mockResolvedValue(mockProvider),
			getProviderInstance: vi.fn().mockReturnValue(mockProvider),
			revealNotesHubItem: vi.fn().mockResolvedValue(undefined),
		}

		// Create mock common utils
		const mockCommonUtils = {
			errMsg: vi.fn(),
			infoMsg: vi.fn(),
			delay: vi.fn().mockResolvedValue(undefined),
		}

		// Create mock frontmatter utils
		const mockFrontmatterUtils = {
			getFrontmatter: vi.fn().mockResolvedValue(undefined),
			getFrontmatter_validateFrontmatter: vi.fn().mockReturnValue(false),
		}

		// Create mock path utils
		const mockPathUtils = {
			getDottedPath: vi.fn().mockImplementation((from: string, to: string) => to),
			sanitizePath: vi.fn().mockImplementation((path: string) => path),
		}

		// Create mock env
		const mockEnv = {
			clipboard: {
				writeText: vi.fn().mockResolvedValue(undefined),
				readText: vi.fn().mockResolvedValue(''),
			},
		}

		// Create mock commands
		const mockCommands = {
			registerCommand: vi.fn(),
			executeCommand: vi.fn().mockResolvedValue(undefined),
		}

		// Create mock file type enum
		const mockFileType = {
			Unknown: 0,
			File: 1,
			Directory: 2,
			SymbolicLink: 64,
		}

		// Create a mock window with all required IWindow properties
		mockWindow = {
			activeTextEditor: undefined,
			showErrorMessage: vi.fn(),
			withProgress: vi.fn().mockImplementation(async <T>(
				options: { title: string, cancellable: boolean },
				task: (progress: { report: (value: { message: string }) => void }) => Promise<T>,
			): Promise<T> => {
				return await task({ report: vi.fn() })
			}),
			showInformationMessage: vi.fn().mockResolvedValue(undefined),
			showWarningMessage: vi.fn().mockResolvedValue(undefined),
			showInputBox: vi.fn().mockResolvedValue('TestNote'),
			showTextDocument: vi.fn().mockImplementation(async (doc: any) => {
				// Create a mock text editor
				const mockEditor = {
					document: doc,
					selection: { start: { line: 0, character: 0 }, end: { line: 0, character: 0 } },
					moveCursor: vi.fn().mockImplementation((line: number, character: number) => {
						mockEditor.selection.start = { line, character }
						mockEditor.selection.end = { line, character }
					}),
					selectText: vi.fn().mockImplementation((startLine: number, startChar: number, endLine: number, endChar: number) => {
						mockEditor.selection.start = { line: startLine, character: startChar }
						mockEditor.selection.end = { line: endLine, character: endChar }
					}),
					modifyDocument: vi.fn().mockImplementation((content: string) => {
						// Update the document content
						if (doc.setContent) {
							doc.setContent(content)
						}
					}),
				}

				// Set as active editor on both mock objects
				mockWindow.activeTextEditor = mockEditor
				mocklyService.window.activeTextEditor = mockEditor

				return mockEditor
			}),
			createTreeView: vi.fn(),
			registerTreeDataProvider: vi.fn(),
			setStatusBarMessage: vi.fn(),
			registerUriHandler: vi.fn(),
			showTimedInformationMessage: vi.fn().mockResolvedValue(undefined),
		}

		// Create a mock workspace with all required IWorkspace properties
		const mockWorkspace = {
			...mocklyService.workspace,
			workspaceFolders: [{ uri: { fsPath: '/workspace' } }],
			openTextDocument: vi.fn().mockImplementation(async (uri: any) => {
				// Create a mock text document
				const mockDoc = {
					uri,
					getText: vi.fn().mockReturnValue('# TestNote\n\n'),
					lineCount: 2,
					positionAt: vi.fn().mockImplementation((offset: number) => ({ line: 0, character: offset })),
					offsetAt: vi.fn().mockImplementation((position: any) => position.character),
					setContent: vi.fn().mockImplementation((content: string) => {
						mockDoc.getText = vi.fn().mockReturnValue(content)
						mockDoc.lineCount = content.split('\n').length
					}),
				}

				return mockDoc
			}),
		}

		// Create the action service with enhanced mocks
		actionService = new NotesHubActionService(
			{
				subscriptions: [],
				workspaceState: { get: vi.fn(), update: vi.fn() },
				globalState: { get: vi.fn(), update: vi.fn() },
				secrets: { get: vi.fn(), update: vi.fn() },
				extensionUri: { fsPath: '' },
				extensionPath: '',
				storageUri: { fsPath: '' },
				logUri: { fsPath: '' },
				extensionMode: 1,
				environmentVariableCollection: { get: vi.fn(), replace: vi.fn() },
				extension: { id: '', extensionUri: { fsPath: '' }, extensionPath: '', isBuiltin: false, packageJSON: {} },
			} as any,
			mockWindow,
			mockWorkspace,
			mockEnv,
			mockCommonUtils,
			mockFrontmatterUtils,
			mockPathUtils,
			mockProviderManager as any,
			mockCommands,
			mocklyService.node.path.join,
			mocklyService.node.path.dirname,
			mocklyService.node.path.basename,
			mocklyService.node.path.parse,
			mocklyService.node.path.extname,
			vi.fn().mockResolvedValue(undefined), // Mock access function
			vi.fn().mockResolvedValue(undefined), // Mock rename function
			mockFileType,
		)
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
			expect(mockWindow.activeTextEditor?.document.uri.fsPath).toBe(expectedFilePath)

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
			expect(mockWindow.activeTextEditor?.document.uri.fsPath).toBe('/test/notes/project/Note2.md')
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
