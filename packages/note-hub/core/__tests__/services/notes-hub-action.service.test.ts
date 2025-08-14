import { describe, it, expect, beforeEach, vi } from 'vitest'
import { NotesHubActionService } from '../../src/services/NotesHubAction.service.js'

// Shared types
import type {
	IWindow,
	IWorkspace,
	ICommonUtilsService,
	IFrontmatterUtilsService,
	IPathUtilsService,
	IEnv,
	IFileType,
	ICommands,
} from '@fux/shared'
import type { ExtensionContext } from 'vscode'
import type { INotesHubItem } from '../../src/_interfaces/INotesHubItem.js'
import type { INotesHubProviderManager } from '../../src/_interfaces/INotesHubProviderManager.js'

// Node API types
import type * as nodePath from 'node:path'
import type { access as fspAccessType, rename as fspRenameType } from 'node:fs/promises'

describe('NotesHubActionService', () => {
	let iContext: ExtensionContext
	let iWindow: IWindow
	let iWorkspace: IWorkspace
	let iEnv: IEnv
	let iCommonUtils: ICommonUtilsService
	let iFrontmatterUtils: IFrontmatterUtilsService
	let iPathUtils: IPathUtilsService
	let iProviderManager: INotesHubProviderManager
	let iCommands: ICommands
	let iPathJoin: typeof nodePath.join
	let iPathDirname: typeof nodePath.dirname
	let iPathBasename: typeof nodePath.basename
	let iPathParse: typeof nodePath.parse
	let iPathExtname: typeof nodePath.extname
	let iFspAccess: typeof fspAccessType
	let iFspRename: typeof fspRenameType
	let iFileTypeEnum: IFileType

	let service: NotesHubActionService
	let mockNoteItem: INotesHubItem
	let mockFolderItem: INotesHubItem
	let mockProvider: INotesHubProviderManager

	beforeEach(() => {
		// Mock ExtensionContext
		iContext = {
			globalState: {
				get: vi.fn(),
				update: vi.fn(),
			},
		} as any

		// Mock IWindow
		iWindow = {
			showTextDocument: vi.fn(),
			showInputBox: vi.fn(),
			showInformationMessage: vi.fn(),
			showErrorMessage: vi.fn(),
			showWarningMessage: vi.fn(),
			withProgress: vi.fn(),
		} as any

		// Mock IWorkspace
		iWorkspace = {
			openTextDocument: vi.fn(),
			fs: {
				rename: vi.fn(),
				readFile: vi.fn(),
				writeFile: vi.fn(),
				delete: vi.fn(),
				copy: vi.fn(),
				createDirectory: vi.fn(),
				stat: vi.fn(),
			},
		} as any

		// Mock IEnv
		iEnv = {
			clipboard: {
				writeText: vi.fn(),
				readText: vi.fn(),
			},
		} as any

		// Mock ICommonUtilsService
		iCommonUtils = {
			errMsg: vi.fn(),
		} as any

		// Mock IFrontmatterUtilsService
		iFrontmatterUtils = {
			getFrontmatter_validateFrontmatter: vi.fn(),
		} as any

		// Mock IPathUtilsService
		iPathUtils = {
			sanitizePath: vi.fn(path => path),
		} as any

		// Mock INotesHubProviderManager
		iProviderManager = {
			getProviderForNote: vi.fn(),
			getProviderInstance: vi.fn(),
			revealNotesHubItem: vi.fn(),
		} as any

		// Mock ICommands
		iCommands = {
			executeCommand: vi.fn(),
		} as any

		// Mock Node.js path functions
		iPathJoin = vi.fn((...paths) => paths.join('/'))
		iPathDirname = vi.fn(path => path.split('/').slice(0, -1).join('/'))
		iPathBasename = vi.fn(path => path.split('/').pop() || '')
		iPathParse = vi.fn((path) => {
			const ext = path.includes('.') ? path.split('.').pop() : ''
			const name = ext ? path.slice(0, -(ext.length + 1)) : path

			return { name, ext: ext ? `.${ext}` : '' }
		})
		iPathExtname = vi.fn(path => path.includes('.') ? `.${path.split('.').pop()}` : '')
		iFspAccess = vi.fn()
		iFspRename = vi.fn()

		// Mock IFileType enum
		iFileTypeEnum = {
			Directory: 'directory',
			File: 'file',
		} as any

		// Mock provider
		mockProvider = {
			refresh: vi.fn(),
			getNotesHubItem: vi.fn(),
		} as any

		// Mock note item
		mockNoteItem = {
			label: 'test-note.md',
			fileName: 'test-note.md',
			filePath: '/test/path/test-note.md',
			isDirectory: false,
			resourceUri: { fsPath: '/test/path/test-note.md', toString: () => 'file:///test/path/test-note.md' } as any,
		} as any

		// Mock folder item
		mockFolderItem = {
			label: 'test-folder',
			fileName: 'test-folder',
			filePath: '/test/path/test-folder',
			isDirectory: true,
			resourceUri: { fsPath: '/test/path/test-folder', toString: () => 'file:///test/path/test-folder' } as any,
		} as any

		// Create service instance
		service = new NotesHubActionService(
			iContext,
			iWindow,
			iWorkspace,
			iEnv,
			iCommonUtils,
			iFrontmatterUtils,
			iPathUtils,
			iProviderManager,
			iCommands,
			iPathJoin,
			iPathDirname,
			iPathBasename,
			iPathParse,
			iPathExtname,
			iFspAccess,
			iFspRename,
			iFileTypeEnum,
		)
	})

	describe('openNote', () => {
		it('should open a note successfully', async () => {
			const mockDoc = { uri: mockNoteItem.resourceUri }

			vi.mocked(iWorkspace.openTextDocument).mockResolvedValue(mockDoc as any)
			vi.mocked(iWindow.showTextDocument).mockResolvedValue()

			await service.openNote(mockNoteItem)

			expect(iWorkspace.openTextDocument).toHaveBeenCalledWith(mockNoteItem.resourceUri)
			expect(iWindow.showTextDocument).toHaveBeenCalledWith(mockDoc)
		})

		it('should handle missing resourceUri', async () => {
			const invalidItem = { ...mockNoteItem, resourceUri: undefined }

			await service.openNote(invalidItem)

			expect(iCommonUtils.errMsg).toHaveBeenCalledWith('Could not open note: Invalid resource URI.')
		})

		it('should handle errors during note opening', async () => {
			const error = new Error('Failed to open')

			vi.mocked(iWorkspace.openTextDocument).mockRejectedValue(error)

			await service.openNote(mockNoteItem)

			expect(iCommonUtils.errMsg).toHaveBeenCalledWith('Failed to open note: test-note.md', error)
		})
	})

	describe('renameItem', () => {
		it('should rename an item successfully', async () => {
			const newName = 'new-name.md'

			vi.mocked(iWindow.showInputBox).mockResolvedValue(newName)
			vi.mocked(iPathBasename).mockReturnValue('test-note.md')
			vi.mocked(iPathExtname).mockReturnValue('.md')
			vi.mocked(iPathParse).mockReturnValue({ name: 'new-name', ext: '.md' })
			vi.mocked(iPathJoin).mockReturnValue('/test/path/new-name.md')
			vi.mocked(iWorkspace.fs.rename).mockResolvedValue()
			vi.mocked(iProviderManager.getProviderForNote).mockResolvedValue(mockProvider)

			await service.renameItem(mockNoteItem)

			expect(iWindow.showInputBox).toHaveBeenCalledWith({
				prompt: 'Enter the new name (extension will be preserved if not specified)',
				value: 'test-note.md',
			})
			expect(iWorkspace.fs.rename).toHaveBeenCalled()
			expect(mockProvider.refresh).toHaveBeenCalled()
		})

		it('should handle missing resourceUri', async () => {
			const invalidItem = { ...mockNoteItem, resourceUri: undefined }

			await service.renameItem(invalidItem)

			expect(iCommonUtils.errMsg).toHaveBeenCalledWith('Cannot rename item: Invalid URI.')
		})

		it('should handle no input for new name', async () => {
			vi.mocked(iWindow.showInputBox).mockResolvedValue(undefined)

			await service.renameItem(mockNoteItem)

			expect(iWorkspace.fs.rename).not.toHaveBeenCalled()
		})

		it('should preserve extension when not specified', async () => {
			const newName = 'new-name'

			vi.mocked(iWindow.showInputBox).mockResolvedValue(newName)
			vi.mocked(iPathBasename).mockReturnValue('test-note.md')
			vi.mocked(iPathExtname).mockReturnValue('.md')
			vi.mocked(iPathParse).mockReturnValue({ name: 'new-name', ext: '' })
			vi.mocked(iPathJoin).mockReturnValue('/test/path/new-name.md')
			vi.mocked(iWorkspace.fs.rename).mockResolvedValue()
			vi.mocked(iProviderManager.getProviderForNote).mockResolvedValue(mockProvider)

			await service.renameItem(mockNoteItem)

			expect(iPathJoin).toHaveBeenCalledWith('/test/path', 'new-name.md')
		})
	})

	describe('addFrontmatter', () => {
		it('should add frontmatter to a note successfully', async () => {
			const fileContent = 'Existing content'
			const fileBuffer = Buffer.from(fileContent)

			vi.mocked(iWorkspace.fs.readFile).mockResolvedValue(fileBuffer)
			vi.mocked(iFrontmatterUtils.getFrontmatter_validateFrontmatter).mockReturnValue(false)
			vi.mocked(iWorkspace.fs.writeFile).mockResolvedValue()
			vi.mocked(iProviderManager.getProviderForNote).mockResolvedValue(mockProvider)

			await service.addFrontmatter(mockNoteItem)

			expect(iWorkspace.fs.readFile).toHaveBeenCalledWith(mockNoteItem.resourceUri)
			expect(iWorkspace.fs.writeFile).toHaveBeenCalledWith(
				mockNoteItem.resourceUri,
				Buffer.from('---\nPriority: \nCodicon: \nDesc: \n---\n\nExisting content', 'utf-8'),
			)
			expect(iWindow.showInformationMessage).toHaveBeenCalledWith('Frontmatter added successfully.')
			expect(mockProvider.refresh).toHaveBeenCalled()
		})

		it('should handle existing frontmatter', async () => {
			vi.mocked(iFrontmatterUtils.getFrontmatter_validateFrontmatter).mockReturnValue(true)

			await service.addFrontmatter(mockNoteItem)

			expect(iWindow.showInformationMessage).toHaveBeenCalledWith('Frontmatter already exists in this note.')
			expect(iWorkspace.fs.writeFile).not.toHaveBeenCalled()
		})

		it('should handle directory items', async () => {
			const directoryItem = { ...mockNoteItem, isDirectory: true }

			await service.addFrontmatter(directoryItem)

			expect(iCommonUtils.errMsg).toHaveBeenCalledWith('Cannot add frontmatter: Invalid item or not a file.')
		})
	})

	describe('openNotePreview', () => {
		it('should open note preview successfully', async () => {
			vi.mocked(iCommands.executeCommand).mockResolvedValue()

			await service.openNotePreview(mockNoteItem)

			expect(iCommands.executeCommand).toHaveBeenCalledWith('markdown.showPreviewToSide', mockNoteItem.resourceUri)
		})

		it('should handle directory items', async () => {
			const directoryItem = { ...mockNoteItem, isDirectory: true }

			await service.openNotePreview(directoryItem)

			expect(iCommonUtils.errMsg).toHaveBeenCalledWith('Cannot open preview: Invalid item or not a file.')
		})
	})

	describe('deleteItem', () => {
		it('should delete an item successfully', async () => {
			vi.mocked(iWindow.showWarningMessage).mockResolvedValue('Delete' as any)
			vi.mocked(iWorkspace.fs.delete).mockResolvedValue()
			vi.mocked(iProviderManager.getProviderForNote).mockResolvedValue(mockProvider)

			await service.deleteItem(mockNoteItem)

			expect(iWindow.showWarningMessage).toHaveBeenCalledWith(
				'Are you sure you want to delete \'test-note.md\'?',
				{ modal: true },
				'Delete',
				'Cancel',
			)
			expect(iWorkspace.fs.delete).toHaveBeenCalledWith(mockNoteItem.resourceUri, { recursive: true, useTrash: true })
			expect(mockProvider.refresh).toHaveBeenCalled()
			expect(iWindow.showInformationMessage).toHaveBeenCalledWith('Item \'test-note.md\' moved to trash.')
		})

		it('should handle cancellation', async () => {
			vi.mocked(iWindow.showWarningMessage).mockResolvedValue('Cancel' as any)

			await service.deleteItem(mockNoteItem)

			expect(iWorkspace.fs.delete).not.toHaveBeenCalled()
		})
	})

	describe('copyItem', () => {
		it('should copy an item successfully', async () => {
			vi.mocked(iEnv.clipboard.writeText).mockResolvedValue()
			vi.mocked(iContext.globalState.update).mockResolvedValue()
			vi.mocked(iCommands.executeCommand).mockResolvedValue()

			await service.copyItem(mockNoteItem)

			expect(iEnv.clipboard.writeText).toHaveBeenCalledWith(mockNoteItem.resourceUri.toString())
			expect(iContext.globalState.update).toHaveBeenCalledWith('notesHub.openNote.operation', 'copy')
			expect(iCommands.executeCommand).toHaveBeenCalledWith('setContext', 'notesHub.openNote.canPaste', true)
			expect(iWindow.showInformationMessage).toHaveBeenCalledWith('\'test-note.md\' copied.')
		})
	})

	describe('cutItem', () => {
		it('should cut an item successfully', async () => {
			vi.mocked(iEnv.clipboard.writeText).mockResolvedValue()
			vi.mocked(iContext.globalState.update).mockResolvedValue()
			vi.mocked(iCommands.executeCommand).mockResolvedValue()

			await service.cutItem(mockNoteItem)

			expect(iEnv.clipboard.writeText).toHaveBeenCalledWith(mockNoteItem.resourceUri.toString())
			expect(iContext.globalState.update).toHaveBeenCalledWith('notesHub.openNote.operation', 'cut')
			expect(iCommands.executeCommand).toHaveBeenCalledWith('setContext', 'notesHub.openNote.canPaste', true)
			expect(iWindow.showInformationMessage).toHaveBeenCalledWith('\'test-note.md\' cut.')
		})
	})

	describe('pasteItem', () => {
		it('should paste an item successfully', async () => {
			const sourceUriString = '/source/path/source-file.md'

			vi.mocked(iEnv.clipboard.readText).mockResolvedValue(sourceUriString)
			vi.mocked(iPathBasename).mockReturnValue('source-file.md')
			vi.mocked(iPathJoin).mockReturnValue('/test/path/test-folder/source-file.md')
			vi.mocked(iWorkspace.fs.stat).mockResolvedValue({ type: 'file' } as any)
			vi.mocked(iProviderManager.getProviderForNote).mockResolvedValue(mockProvider)
			vi.mocked(iContext.globalState.get).mockReturnValue('copy')
			vi.mocked(iWorkspace.fs.copy).mockResolvedValue()
			vi.mocked(iWindow.withProgress).mockImplementation(async (options, task) => {
				await task()
			})

			await service.pasteItem(mockFolderItem)

			expect(iWorkspace.fs.copy).toHaveBeenCalled()
			expect(mockProvider.refresh).toHaveBeenCalled()
		})

		it('should handle invalid target folder', async () => {
			const invalidFolder = { ...mockFolderItem, isDirectory: false }

			await service.pasteItem(invalidFolder)

			expect(iCommonUtils.errMsg).toHaveBeenCalledWith('Cannot paste item: Target is not a valid folder.')
		})

		it('should handle empty clipboard', async () => {
			vi.mocked(iEnv.clipboard.readText).mockResolvedValue('')

			await service.pasteItem(mockFolderItem)

			expect(iCommonUtils.errMsg).toHaveBeenCalledWith('Clipboard is empty or contains invalid data for paste.')
		})
	})

	describe('newNoteInFolder', () => {
		it('should create a new note in folder successfully', async () => {
			vi.mocked(iProviderManager.getProviderForNote).mockResolvedValue(mockProvider)
			vi.mocked(iWindow.showInputBox).mockResolvedValue('NewNote')
			vi.mocked(iPathParse).mockReturnValue({ name: 'NewNote', ext: '' })
			vi.mocked(iPathJoin).mockReturnValue('/test/path/test-folder/NewNote.md')
			vi.mocked(iWorkspace.fs.writeFile).mockResolvedValue()
			vi.mocked(iWorkspace.openTextDocument).mockResolvedValue({} as any)
			vi.mocked(iWindow.showTextDocument).mockResolvedValue()
			vi.mocked(mockProvider.getNotesHubItem).mockResolvedValue(mockNoteItem)

			await service.newNoteInFolder(mockFolderItem)

			expect(iWorkspace.fs.writeFile).toHaveBeenCalled()
			expect(mockProvider.refresh).toHaveBeenCalled()
			expect(iWorkspace.openTextDocument).toHaveBeenCalled()
			expect(iWindow.showTextDocument).toHaveBeenCalled()
		})

		it('should handle invalid target folder', async () => {
			const invalidFolder = { ...mockFolderItem, isDirectory: false }

			await service.newNoteInFolder(invalidFolder)

			expect(iCommonUtils.errMsg).toHaveBeenCalledWith('This command can only be used on a valid folder.')
		})

		it('should handle missing provider', async () => {
			vi.mocked(iProviderManager.getProviderForNote).mockResolvedValue(undefined)

			await service.newNoteInFolder(mockFolderItem)

			expect(iCommonUtils.errMsg).toHaveBeenCalledWith('Could not determine provider for the target folder.')
		})
	})

	describe('newFolderInFolder', () => {
		it('should create a new folder successfully', async () => {
			const newFolderName = 'NewFolder'

			vi.mocked(iWindow.showInputBox).mockResolvedValue(newFolderName)
			vi.mocked(iPathJoin).mockReturnValue('/test/path/test-folder/NewFolder')
			vi.mocked(iFspAccess).mockResolvedValue()
			vi.mocked(iWorkspace.fs.createDirectory).mockResolvedValue()
			vi.mocked(iProviderManager.getProviderForNote).mockResolvedValue(mockProvider)
			vi.mocked(mockProvider.getNotesHubItem).mockResolvedValue(mockFolderItem)

			await service.newFolderInFolder(mockFolderItem)

			expect(iWorkspace.fs.createDirectory).toHaveBeenCalled()
			expect(mockProvider.refresh).toHaveBeenCalled()
		})

		it('should handle no folder name input', async () => {
			vi.mocked(iWindow.showInputBox).mockResolvedValue(undefined)

			await service.newFolderInFolder(mockFolderItem)

			expect(iWorkspace.fs.createDirectory).not.toHaveBeenCalled()
		})
	})

	describe('newNoteAtRoot', () => {
		it('should create a new note at root successfully', async () => {
			vi.mocked(iProviderManager.getProviderInstance).mockReturnValue(mockProvider)
			vi.mocked(iPathBasename).mockReturnValue('notes')
			vi.mocked(iWindow.showInputBox).mockResolvedValue('NewNote')
			vi.mocked(iPathParse).mockReturnValue({ name: 'NewNote', ext: '' })
			vi.mocked(iPathJoin).mockReturnValue('/notes/NewNote.md')
			vi.mocked(iWorkspace.fs.writeFile).mockResolvedValue()
			vi.mocked(iWorkspace.openTextDocument).mockResolvedValue({} as any)
			vi.mocked(iWindow.showTextDocument).mockResolvedValue()
			vi.mocked(mockProvider.getNotesHubItem).mockResolvedValue(mockNoteItem)

			await service.newNoteAtRoot('project')

			expect(iWorkspace.fs.writeFile).toHaveBeenCalled()
			expect(mockProvider.refresh).toHaveBeenCalled()
		})

		it('should handle missing provider', async () => {
			vi.mocked(iProviderManager.getProviderInstance).mockReturnValue(undefined)

			await service.newNoteAtRoot('project')

			expect(iCommonUtils.errMsg).toHaveBeenCalledWith('Notes Hub provider \'project\' is not enabled or available.')
		})
	})

	describe('newFolderAtRoot', () => {
		it('should create a new folder at root successfully', async () => {
			vi.mocked(iProviderManager.getProviderInstance).mockReturnValue(mockProvider)
			vi.mocked(iPathBasename).mockReturnValue('notes')
			vi.mocked(iWindow.showInputBox).mockResolvedValue('NewFolder')
			vi.mocked(iPathJoin).mockReturnValue('/notes/NewFolder')
			vi.mocked(iFspAccess).mockResolvedValue()
			vi.mocked(iWorkspace.fs.createDirectory).mockResolvedValue()
			vi.mocked(iProviderManager.getProviderForNote).mockResolvedValue(mockProvider)
			vi.mocked(mockProvider.getNotesHubItem).mockResolvedValue(mockFolderItem)

			await service.newFolderAtRoot('project')

			expect(iWorkspace.fs.createDirectory).toHaveBeenCalled()
			expect(mockProvider.refresh).toHaveBeenCalled()
		})
	})

	describe('getNewFileNameWithExtension', () => {
		it('should return valid filename with extension', async () => {
			vi.mocked(iWindow.showInputBox).mockResolvedValue('NewNote.md')

			const result = await (service as any).getNewFileNameWithExtension('NewNote')

			expect(result).toEqual({ newName: 'NewNote', newExtension: '.md' })
		})

		it('should add default extension when none provided', async () => {
			vi.mocked(iWindow.showInputBox).mockResolvedValue('NewNote')

			const result = await (service as any).getNewFileNameWithExtension('NewNote')

			expect(result).toEqual({ newName: 'NewNote', newExtension: '.md' })
		})

		it('should handle invalid extension', async () => {
			vi.mocked(iWindow.showInputBox)
				.mockResolvedValueOnce('NewNote.invalid')
				.mockResolvedValueOnce('NewNote.md')

			const result = await (service as any).getNewFileNameWithExtension('NewNote')

			expect(iWindow.showErrorMessage).toHaveBeenCalledWith(
				'Invalid extension: \'.invalid\'. Allowed: .md, .txt, .txte',
			)
			expect(result).toEqual({ newName: 'NewNote', newExtension: '.md' })
		})
	})

	describe('fileExists', () => {
		it('should return true for existing file', async () => {
			vi.mocked(iFspAccess).mockResolvedValue()

			const result = await (service as any).fileExists('/test/path/file.md')

			expect(result).toBe(true)
		})

		it('should return false for non-existing file', async () => {
			vi.mocked(iFspAccess).mockRejectedValue(new Error('File not found'))

			const result = await (service as any).fileExists('/test/path/file.md')

			expect(result).toBe(false)
		})

		it('should return false for empty path', async () => {
			const result = await (service as any).fileExists('')

			expect(result).toBe(false)
		})
	})
})
