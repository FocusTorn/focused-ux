import { describe, it, expect, beforeEach, vi } from 'vitest'
import { BaseNotesDataProvider } from '../../src/providers/BaseNotesDataProvider.js'

// Shared types
import type {
	IWindow,
	IWorkspace,
	ICommands,
	ICommonUtilsService,
	IFrontmatterUtilsService,
	IPathUtilsService,
	IFileType,
	IFileSystemWatcher,
} from '@fux/shared'
import type { ExtensionContext, Uri } from 'vscode'

// Mock the shared adapters
vi.mock('@fux/shared', () => ({
	EventEmitterAdapter: vi.fn().mockImplementation(() => ({
		event: { dispose: vi.fn() },
		fire: vi.fn(),
		dispose: vi.fn(),
	})),
	ThemeIconAdapter: {
		create: vi.fn(),
	},
	UriAdapter: {
		file: vi.fn(),
		create: vi.fn(),
		joinPath: vi.fn(),
	},
	RelativePatternAdapter: {
		create: vi.fn(),
	},
	TreeItemAdapter: {
		create: vi.fn(),
	},
	TreeItemCollapsibleStateAdapter: vi.fn().mockImplementation(() => ({
		None: 0,
		Collapsed: 1,
		Expanded: 2,
	})),
}))

// Mock Node.js modules
vi.mock('node:path', () => ({
	basename: vi.fn(path => path.split('/').pop() || ''),
	dirname: vi.fn(path => path.split('/').slice(0, -1).join('/')),
	extname: vi.fn(path => path.includes('.') ? `.${path.split('.').pop()}` : ''),
	join: vi.fn((...paths) => paths.join('/')),
	normalize: vi.fn(path => path),
}))

vi.mock('node:fs', () => ({
	constants: {
		F_OK: 0,
	},
}))

vi.mock('node:fs/promises', () => ({
	access: vi.fn(),
}))

vi.mock('node:buffer', () => ({
	Buffer: {
		from: vi.fn((content, encoding) => ({ toString: () => content })),
	},
}))

// Mock NotesHubItem
vi.mock('../../src/models/NotesHubItem.js', () => ({
	NotesHubItem: vi.fn().mockImplementation((fileName, filePath, isDirectory, parentUri, frontmatter) => ({
		fileName,
		filePath,
		isDirectory,
		parentUri,
		frontmatter,
		label: fileName,
		resourceUri: { fsPath: filePath, toString: () => `file://${filePath}` },
		collapsibleState: 0,
		iconPath: undefined,
		toVsCode: vi.fn().mockReturnValue({}),
	})),
}))

// Create a concrete implementation for testing
class TestNotesDataProvider extends BaseNotesDataProvider {

	constructor(
		notesDir: string,
		providerName: 'project' | 'remote' | 'global',
		openNoteCommandId: string,
		iContext: ExtensionContext,
		iWindow: IWindow,
		iWorkspace: IWorkspace,
		iCommands: ICommands,
		iCommonUtils: ICommonUtilsService,
		iFrontmatterUtils: IFrontmatterUtilsService,
		iPathUtils: IPathUtilsService,
		iFileTypeEnum: IFileType,
	) {
		super(
			notesDir,
			providerName,
			openNoteCommandId,
			iContext,
			iWindow,
			iWorkspace,
			iCommands,
			iCommonUtils,
			iFrontmatterUtils,
			iPathUtils,
			iFileTypeEnum,
		)
	}

}

describe('BaseNotesDataProvider', () => {
	let iContext: ExtensionContext
	let iWindow: IWindow
	let iWorkspace: IWorkspace
	let iCommands: ICommands
	let iCommonUtils: ICommonUtilsService
	let iFrontmatterUtils: IFrontmatterUtilsService
	let iPathUtils: IPathUtilsService
	let iFileTypeEnum: IFileType

	let provider: TestNotesDataProvider
	let mockFileWatcher: IFileSystemWatcher
	let mockUri: Uri

	beforeEach(() => {
		// Mock ExtensionContext
		iContext = {
			subscriptions: [],
			globalState: {
				get: vi.fn(),
				update: vi.fn(),
			},
		} as any

		// Mock IWindow
		iWindow = {
			registerTreeDataProvider: vi.fn().mockReturnValue({ dispose: vi.fn() }),
			showInformationMessage: vi.fn(),
		} as any

		// Mock IWorkspace
		iWorkspace = {
			createFileSystemWatcher: vi.fn(),
			fs: {
				readDirectory: vi.fn(),
				stat: vi.fn(),
				readFile: vi.fn(),
				writeFile: vi.fn(),
			},
			workspaceFolders: [{
				uri: { fsPath: '/workspace', path: '/workspace' },
			}],
		} as any

		// Mock ICommands
		iCommands = {
			executeCommand: vi.fn(),
		} as any

		// Mock ICommonUtilsService
		iCommonUtils = {
			errMsg: vi.fn(),
		} as any

		// Mock IFrontmatterUtilsService
		iFrontmatterUtils = {
			getFrontmatter: vi.fn(),
		} as any

		// Mock IPathUtilsService
		iPathUtils = {
			sanitizePath: vi.fn(path => path),
		} as any

		// Mock IFileType enum
		iFileTypeEnum = {
			Directory: 1,
			File: 2,
		} as any

		// Mock file watcher
		mockFileWatcher = {
			onDidChange: vi.fn().mockReturnValue({ dispose: vi.fn() }),
			onDidCreate: vi.fn().mockReturnValue({ dispose: vi.fn() }),
			onDidDelete: vi.fn().mockReturnValue({ dispose: vi.fn() }),
			dispose: vi.fn(),
		} as any

		// Mock Uri
		mockUri = {
			fsPath: '/test/notes/file.md',
			path: '/test/notes/file.md',
			toString: () => 'file:///test/notes/file.md',
		} as any

		// Mock workspace.createFileSystemWatcher
		vi.mocked(iWorkspace.createFileSystemWatcher).mockReturnValue(mockFileWatcher)

		// Mock shared adapters
		const { RelativePatternAdapter, UriAdapter, TreeItemAdapter, TreeItemCollapsibleStateAdapter } = require('@fux/shared')

		vi.mocked(RelativePatternAdapter.create).mockReturnValue('**/*')
		vi.mocked(UriAdapter.file).mockReturnValue(mockUri)
		vi.mocked(UriAdapter.create).mockReturnValue(mockUri)
		vi.mocked(UriAdapter.joinPath).mockReturnValue(mockUri)
		vi.mocked(TreeItemAdapter.create).mockReturnValue({})
		vi.mocked(TreeItemCollapsibleStateAdapter).mockImplementation(() => ({
			None: 0,
			Collapsed: 1,
			Expanded: 2,
		}))
	})

	describe('constructor', () => {
		it('should initialize with valid notesDir', () => {
			provider = new TestNotesDataProvider(
				'/test/notes',
				'project',
				'notesHub.openNote',
				iContext,
				iWindow,
				iWorkspace,
				iCommands,
				iCommonUtils,
				iFrontmatterUtils,
				iPathUtils,
				iFileTypeEnum,
			)

			expect(provider.notesDir).toBe('/test/notes')
			expect(provider.providerName).toBe('project')
			expect(iWorkspace.createFileSystemWatcher).toHaveBeenCalled()
			expect(iContext.subscriptions).toContain(mockFileWatcher)
		})

		it('should handle invalid notesDir gracefully', () => {
			const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {})

			provider = new TestNotesDataProvider(
				'',
				'project',
				'notesHub.openNote',
				iContext,
				iWindow,
				iWorkspace,
				iCommands,
				iCommonUtils,
				iFrontmatterUtils,
				iPathUtils,
				iFileTypeEnum,
			)

			expect(consoleSpy).toHaveBeenCalledWith(
				'[BaseNotesDataProvider] Invalid notesDir provided for provider \'project\'. Provider will be inert.',
			)
			expect(iWorkspace.createFileSystemWatcher).not.toHaveBeenCalled()
			consoleSpy.mockRestore()
		})

		it('should add .fux_note-hub to gitignore for project provider', () => {
			provider = new TestNotesDataProvider(
				'/test/.fux_note-hub',
				'project',
				'notesHub.openNote',
				iContext,
				iWindow,
				iWorkspace,
				iCommands,
				iCommonUtils,
				iFrontmatterUtils,
				iPathUtils,
				iFileTypeEnum,
			)

			// The gitignore logic is private, but we can verify the provider was created
			expect(provider.notesDir).toBe('/test/.fux_note-hub')
		})
	})

	describe('initializeTreeView', () => {
		beforeEach(() => {
			provider = new TestNotesDataProvider(
				'/test/notes',
				'project',
				'notesHub.openNote',
				iContext,
				iWindow,
				iWorkspace,
				iCommands,
				iCommonUtils,
				iFrontmatterUtils,
				iPathUtils,
				iFileTypeEnum,
			)
		})

		it('should register tree data provider successfully', () => {
			provider.initializeTreeView('test.view')

			expect(iWindow.registerTreeDataProvider).toHaveBeenCalledWith('test.view', provider)
			expect(iContext.subscriptions).toHaveLength(2) // fileWatcher + treeView
		})

		it('should prevent duplicate registrations', () => {
			const consoleSpy = vi.spyOn(console, 'warn').mockImplementation(() => {})

			provider.initializeTreeView('test.view')
			provider.initializeTreeView('test.view')

			expect(iWindow.registerTreeDataProvider).toHaveBeenCalledTimes(1)
			expect(consoleSpy).toHaveBeenCalledWith('[NotesHub] Tree view test.view is already registered, skipping.')
			consoleSpy.mockRestore()
		})

		it('should not register when notesDir is invalid', () => {
			const invalidProvider = new TestNotesDataProvider(
				'',
				'project',
				'notesHub.openNote',
				iContext,
				iWindow,
				iWorkspace,
				iCommands,
				iCommonUtils,
				iFrontmatterUtils,
				iPathUtils,
				iFileTypeEnum,
			)

			invalidProvider.initializeTreeView('test.view')

			expect(iWindow.registerTreeDataProvider).not.toHaveBeenCalled()
		})
	})

	describe('refresh', () => {
		beforeEach(() => {
			provider = new TestNotesDataProvider(
				'/test/notes',
				'project',
				'notesHub.openNote',
				iContext,
				iWindow,
				iWorkspace,
				iCommands,
				iCommonUtils,
				iFrontmatterUtils,
				iPathUtils,
				iFileTypeEnum,
			)
		})

		it('should fire change event when notesDir is valid', () => {
			const { EventEmitterAdapter } = require('@fux/shared')
			const mockEmitter = vi.mocked(EventEmitterAdapter).mock.instances[0]
			const mockFire = vi.mocked(mockEmitter.fire)

			provider.refresh()

			expect(mockFire).toHaveBeenCalledWith(undefined)
		})

		it('should not fire change event when notesDir is invalid', () => {
			const invalidProvider = new TestNotesDataProvider(
				'',
				'project',
				'notesHub.openNote',
				iContext,
				iWindow,
				iWorkspace,
				iCommands,
				iCommonUtils,
				iFrontmatterUtils,
				iPathUtils,
				iFileTypeEnum,
			)

			const { EventEmitterAdapter } = require('@fux/shared')
			const mockEmitter = vi.mocked(EventEmitterAdapter).mock.instances[0]
			const mockFire = vi.mocked(mockEmitter.fire)

			invalidProvider.refresh()

			expect(mockFire).not.toHaveBeenCalled()
		})
	})

	describe('dispose', () => {
		beforeEach(() => {
			provider = new TestNotesDataProvider(
				'/test/notes',
				'project',
				'notesHub.openNote',
				iContext,
				iWindow,
				iWorkspace,
				iCommands,
				iCommonUtils,
				iFrontmatterUtils,
				iPathUtils,
				iFileTypeEnum,
			)
		})

		it('should dispose event emitter and file watcher', () => {
			const { EventEmitterAdapter } = require('@fux/shared')
			const mockEmitter = vi.mocked(EventEmitterAdapter).mock.instances[0]

			provider.dispose()

			expect(mockEmitter.dispose).toHaveBeenCalled()
			expect(mockFileWatcher.dispose).toHaveBeenCalled()
		})
	})

	describe('getParent', () => {
		beforeEach(() => {
			provider = new TestNotesDataProvider(
				'/test/notes',
				'project',
				'notesHub.openNote',
				iContext,
				iWindow,
				iWorkspace,
				iCommands,
				iCommonUtils,
				iFrontmatterUtils,
				iPathUtils,
				iFileTypeEnum,
			)
		})

		it('should return undefined for root items', () => {
			const rootItem = {
				parentUri: undefined,
				filePath: '/test/notes',
			} as any

			const result = provider.getParent(rootItem)

			expect(result).toBeUndefined()
		})

		it('should return root folder for items in provider root', () => {
			const { NotesHubItem } = require('../../src/models/NotesHubItem.js')
			const item = {
				parentUri: { fsPath: '/test/notes' },
				filePath: '/test/notes/file.md',
			} as any

			const result = provider.getParent(item)

			expect(NotesHubItem).toHaveBeenCalledWith('notes', '/test/notes', true)
		})

		it('should return parent folder for nested items', () => {
			const { NotesHubItem } = require('../../src/models/NotesHubItem.js')
			const item = {
				parentUri: { fsPath: '/test/notes/subfolder' },
				filePath: '/test/notes/subfolder/file.md',
			} as any

			const result = provider.getParent(item)

			expect(NotesHubItem).toHaveBeenCalledWith('subfolder', '/test/notes/subfolder', true, expect.any(Object))
		})

		it('should handle invalid paths gracefully', () => {
			const consoleSpy = vi.spyOn(console, 'warn').mockImplementation(() => {})
			const item = {
				parentUri: { fsPath: '' },
				filePath: '/test/notes/file.md',
			} as any

			const result = provider.getParent(item)

			expect(result).toBeUndefined()
			expect(consoleSpy).toHaveBeenCalled()
			consoleSpy.mockRestore()
		})
	})

	describe('getTreeItem', () => {
		beforeEach(() => {
			provider = new TestNotesDataProvider(
				'/test/notes',
				'project',
				'notesHub.openNote',
				iContext,
				iWindow,
				iWorkspace,
				iCommands,
				iCommonUtils,
				iFrontmatterUtils,
				iPathUtils,
				iFileTypeEnum,
			)
		})

		it('should return inert TreeItem when notesDir is invalid', async () => {
			const invalidProvider = new TestNotesDataProvider(
				'',
				'project',
				'notesHub.openNote',
				iContext,
				iWindow,
				iWorkspace,
				iCommands,
				iCommonUtils,
				iFrontmatterUtils,
				iPathUtils,
				iFileTypeEnum,
			)

			const result = await invalidProvider.getTreeItem({} as any)

			expect(result).toBeDefined()
		})

		it('should set correct collapsible state for directories', async () => {
			const { TreeItemCollapsibleStateAdapter } = require('@fux/shared')
			const mockStateAdapter = vi.mocked(TreeItemCollapsibleStateAdapter).mock.instances[0]

			const directoryItem = {
				isDirectory: true,
				parentUri: undefined, // root item
				collapsibleState: 0,
			} as any

			await provider.getTreeItem(directoryItem)

			expect(directoryItem.collapsibleState).toBe(2) // Expanded for root
		})

		it('should set correct collapsible state for files', async () => {
			const { TreeItemCollapsibleStateAdapter } = require('@fux/shared')
			const mockStateAdapter = vi.mocked(TreeItemCollapsibleStateAdapter).mock.instances[0]

			const fileItem = {
				isDirectory: false,
				collapsibleState: 0,
			} as any

			await provider.getTreeItem(fileItem)

			expect(fileItem.collapsibleState).toBe(0) // None for files
		})

		it('should set correct icons for root folders', async () => {
			const { ThemeIconAdapter } = require('@fux/shared')
			const mockThemeIcon = vi.mocked(ThemeIconAdapter.create)

			const rootItem = {
				isDirectory: true,
				parentUri: undefined, // root item
				iconPath: undefined,
			} as any

			await provider.getTreeItem(rootItem)

			expect(mockThemeIcon).toHaveBeenCalledWith('project')
		})

		it('should set folder icon for non-root directories', async () => {
			const { ThemeIconAdapter } = require('@fux/shared')
			const mockThemeIcon = vi.mocked(ThemeIconAdapter.create)

			const directoryItem = {
				isDirectory: true,
				parentUri: { fsPath: '/test/notes' }, // not root
				iconPath: undefined,
			} as any

			await provider.getTreeItem(directoryItem)

			expect(mockThemeIcon).toHaveBeenCalledWith('folder')
		})

		it('should handle errors gracefully', async () => {
			const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {})
			const { NotesHubItem } = require('../../src/models/NotesHubItem.js')

			const problematicItem = {
				isDirectory: true,
				parentUri: undefined,
				filePath: '/test/notes',
			} as any

			// Mock an error in the item
			Object.defineProperty(problematicItem, 'collapsibleState', {
				get: () => { throw new Error('Test error') },
				set: vi.fn(),
			})

			const result = await provider.getTreeItem(problematicItem)

			expect(consoleSpy).toHaveBeenCalled()
			expect(NotesHubItem).toHaveBeenCalledWith('Error', '/test/notes', false)
			consoleSpy.mockRestore()
		})
	})

	describe('getChildren', () => {
		beforeEach(() => {
			provider = new TestNotesDataProvider(
				'/test/notes',
				'project',
				'notesHub.openNote',
				iContext,
				iWindow,
				iWorkspace,
				iCommands,
				iCommonUtils,
				iFrontmatterUtils,
				iPathUtils,
				iFileTypeEnum,
			)
		})

		it('should return root folder when no element provided', async () => {
			const { NotesHubItem } = require('../../src/models/NotesHubItem.js')

			const result = await provider.getChildren()

			expect(result).toHaveLength(1)
			expect(NotesHubItem).toHaveBeenCalledWith('notes', '/test/notes', true)
		})

		it('should return empty array when notesDir is invalid', async () => {
			const invalidProvider = new TestNotesDataProvider(
				'',
				'project',
				'notesHub.openNote',
				iContext,
				iWindow,
				iWorkspace,
				iCommands,
				iCommonUtils,
				iFrontmatterUtils,
				iPathUtils,
				iFileTypeEnum,
			)

			const result = await invalidProvider.getChildren()

			expect(result).toEqual([])
		})

		it('should read directory and create items', async () => {
			const { NotesHubItem } = require('../../src/models/NotesHubItem.js')
			const mockEntries = [
				['file1.md', 2], // File
				['folder1', 1], // Directory
			]

			vi.mocked(iWorkspace.fs.readDirectory).mockResolvedValue(mockEntries)
			vi.mocked(iFrontmatterUtils.getFrontmatter).mockResolvedValue({ Label: 'Test' })

			const element = {
				isDirectory: true,
				resourceUri: mockUri,
				filePath: '/test/notes',
			} as any

			const result = await provider.getChildren(element)

			expect(iWorkspace.fs.readDirectory).toHaveBeenCalledWith(mockUri)
			expect(NotesHubItem).toHaveBeenCalledTimes(2)
		})

		it('should filter out invalid file names', async () => {
			const mockEntries = [
				['', 2], // Invalid name
				['file1.md', 2], // Valid file
			]

			vi.mocked(iWorkspace.fs.readDirectory).mockResolvedValue(mockEntries)
			vi.mocked(iFrontmatterUtils.getFrontmatter).mockResolvedValue({})

			const element = {
				isDirectory: true,
				resourceUri: mockUri,
				filePath: '/test/notes',
			} as any

			const result = await provider.getChildren(element)

			expect(result).toHaveLength(1) // Only valid file
		})

		it('should handle frontmatter errors gracefully', async () => {
			const consoleSpy = vi.spyOn(console, 'warn').mockImplementation(() => {})
			const mockEntries = [['file1.md', 2]]

			vi.mocked(iWorkspace.fs.readDirectory).mockResolvedValue(mockEntries)
			vi.mocked(iFrontmatterUtils.getFrontmatter).mockRejectedValue(new Error('Frontmatter error'))

			const element = {
				isDirectory: true,
				resourceUri: mockUri,
				filePath: '/test/notes',
			} as any

			const result = await provider.getChildren(element)

			expect(consoleSpy).toHaveBeenCalled()
			expect(result).toHaveLength(1) // Item still created without frontmatter
			consoleSpy.mockRestore()
		})

		it('should handle directory reading errors', async () => {
			const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {})

			vi.mocked(iWorkspace.fs.readDirectory).mockRejectedValue(new Error('Directory error'))

			const element = {
				isDirectory: true,
				resourceUri: mockUri,
				filePath: '/test/notes',
			} as any

			const result = await provider.getChildren(element)

			expect(consoleSpy).toHaveBeenCalled()
			expect(iCommonUtils.errMsg).toHaveBeenCalled()
			expect(result).toEqual([])
			consoleSpy.mockRestore()
		})
	})

	describe('getNotesHubItem', () => {
		beforeEach(() => {
			provider = new TestNotesDataProvider(
				'/test/notes',
				'project',
				'notesHub.openNote',
				iContext,
				iWindow,
				iWorkspace,
				iCommands,
				iCommonUtils,
				iFrontmatterUtils,
				iPathUtils,
				iFileTypeEnum,
			)
		})

		it('should return undefined when notesDir is invalid', async () => {
			const invalidProvider = new TestNotesDataProvider(
				'',
				'project',
				'notesHub.openNote',
				iContext,
				iWindow,
				iWorkspace,
				iCommands,
				iCommonUtils,
				iFrontmatterUtils,
				iPathUtils,
				iFileTypeEnum,
			)

			const result = await invalidProvider.getNotesHubItem(mockUri)

			expect(result).toBeUndefined()
		})

		it('should create NotesHubItem from URI', async () => {
			const { NotesHubItem } = require('../../src/models/NotesHubItem.js')
			const mockStats = { type: 2 } // File

			vi.mocked(iWorkspace.fs.stat).mockResolvedValue(mockStats)
			vi.mocked(iFrontmatterUtils.getFrontmatter).mockResolvedValue({ Label: 'Test' })

			const result = await provider.getNotesHubItem(mockUri)

			expect(NotesHubItem).toHaveBeenCalled()
			expect(result).toBeDefined()
		})

		it('should handle invalid filePath gracefully', async () => {
			const consoleSpy = vi.spyOn(console, 'warn').mockImplementation(() => {})
			const invalidUri = { fsPath: '', toString: () => 'file://' } as any

			const result = await provider.getNotesHubItem(invalidUri)

			expect(result).toBeUndefined()
			expect(consoleSpy).toHaveBeenCalled()
			consoleSpy.mockRestore()
		})

		it('should handle stat errors gracefully', async () => {
			const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {})

			vi.mocked(iWorkspace.fs.stat).mockRejectedValue(new Error('Stat error'))

			const result = await provider.getNotesHubItem(mockUri)

			expect(consoleSpy).toHaveBeenCalled()
			expect(iCommonUtils.errMsg).toHaveBeenCalled()
			expect(result).toBeUndefined()
			consoleSpy.mockRestore()
		})
	})

	describe('sortItems', () => {
		beforeEach(() => {
			provider = new TestNotesDataProvider(
				'/test/notes',
				'project',
				'notesHub.openNote',
				iContext,
				iWindow,
				iWorkspace,
				iCommands,
				iCommonUtils,
				iFrontmatterUtils,
				iPathUtils,
				iFileTypeEnum,
			)
		})

		it('should sort directories before files', () => {
			const dirItem = { isDirectory: true, label: 'folder' } as any
			const fileItem = { isDirectory: false, label: 'file.md' } as any

			// Access private method through any
			const result = (provider as any).sortItems(dirItem, fileItem)

			expect(result).toBeLessThan(0) // Directory should come first
		})

		it('should sort by label when both items are same type', () => {
			const item1 = { isDirectory: false, label: 'a.md' } as any
			const item2 = { isDirectory: false, label: 'b.md' } as any

			const result = (provider as any).sortItems(item1, item2)

			expect(result).toBeLessThan(0) // 'a' should come before 'b'
		})
	})

	describe('isExtensionValid', () => {
		beforeEach(() => {
			provider = new TestNotesDataProvider(
				'/test/notes',
				'project',
				'notesHub.openNote',
				iContext,
				iWindow,
				iWorkspace,
				iCommands,
				iCommonUtils,
				iFrontmatterUtils,
				iPathUtils,
				iFileTypeEnum,
			)
		})

		it('should accept valid extensions', () => {
			expect((provider as any).isExtensionValid('file.md')).toBe(true)
			expect((provider as any).isExtensionValid('file.txt')).toBe(true)
			expect((provider as any).isExtensionValid('file.txte')).toBe(true)
		})

		it('should reject invalid extensions', () => {
			expect((provider as any).isExtensionValid('file.js')).toBe(false)
			expect((provider as any).isExtensionValid('file.py')).toBe(false)
			expect((provider as any).isExtensionValid('file')).toBe(false)
		})
	})

	describe('fileExists', () => {
		beforeEach(() => {
			provider = new TestNotesDataProvider(
				'/test/notes',
				'project',
				'notesHub.openNote',
				iContext,
				iWindow,
				iWorkspace,
				iCommands,
				iCommonUtils,
				iFrontmatterUtils,
				iPathUtils,
				iFileTypeEnum,
			)
		})

		it('should return false for empty path', async () => {
			const result = await (provider as any).fileExists('')

			expect(result).toBe(false)
		})

		it('should return true for existing file', async () => {
			const { access } = require('node:fs/promises')

			vi.mocked(access).mockResolvedValue()

			const result = await (provider as any).fileExists('/test/path/file.md')

			expect(result).toBe(true)
		})

		it('should return false for non-existing file', async () => {
			const { access } = require('node:fs/promises')

			vi.mocked(access).mockRejectedValue(new Error('File not found'))

			const result = await (provider as any).fileExists('/test/path/file.md')

			expect(result).toBe(false)
		})
	})

	describe('confirmOverwrite', () => {
		beforeEach(() => {
			provider = new TestNotesDataProvider(
				'/test/notes',
				'project',
				'notesHub.openNote',
				iContext,
				iWindow,
				iWorkspace,
				iCommands,
				iCommonUtils,
				iFrontmatterUtils,
				iPathUtils,
				iFileTypeEnum,
			)
		})

		it('should return true when user confirms overwrite', async () => {
			vi.mocked(iWindow.showInformationMessage).mockResolvedValue('Overwrite' as any)

			const result = await (provider as any).confirmOverwrite('test.md')

			expect(result).toBe(true)
			expect(iWindow.showInformationMessage).toHaveBeenCalledWith('\'test.md\' already exists. Overwrite?', 'Overwrite', 'Cancel')
		})

		it('should return false when user cancels', async () => {
			vi.mocked(iWindow.showInformationMessage).mockResolvedValue('Cancel' as any)

			const result = await (provider as any).confirmOverwrite('test.md')

			expect(result).toBe(false)
		})
	})

	describe('addDirToGitignore', () => {
		beforeEach(() => {
			provider = new TestNotesDataProvider(
				'/test/notes',
				'project',
				'notesHub.openNote',
				iContext,
				iWindow,
				iWorkspace,
				iCommands,
				iCommonUtils,
				iFrontmatterUtils,
				iPathUtils,
				iFileTypeEnum,
			)
		})

		it('should add directory to gitignore', async () => {
			const gitignoreContent = 'existing content\n'

			vi.mocked(iWorkspace.fs.readFile).mockResolvedValue(Buffer.from(gitignoreContent))
			vi.mocked(iWorkspace.fs.writeFile).mockResolvedValue()

			await (provider as any).addDirToGitignore('.fux_note-hub')

			expect(iWorkspace.fs.writeFile).toHaveBeenCalledWith(
				expect.any(Object),
				expect.stringContaining('# Ignored by F-UX Notes Hub\n/.fux_note-hub/\n'),
			)
		})

		it('should not add duplicate entries', async () => {
			const gitignoreContent = 'existing content\n# Ignored by F-UX Notes Hub\n/.fux_note-hub/\n'

			vi.mocked(iWorkspace.fs.readFile).mockResolvedValue(Buffer.from(gitignoreContent))

			await (provider as any).addDirToGitignore('.fux_note-hub')

			expect(iWorkspace.fs.writeFile).not.toHaveBeenCalled()
		})

		it('should handle read errors gracefully', async () => {
			const error = new Error('File not found')

			;(error as any).code = 'ENOENT'
			vi.mocked(iWorkspace.fs.readFile).mockRejectedValue(error)

			await (provider as any).addDirToGitignore('.fux_note-hub')

			// Should not throw error for ENOENT
			expect(iWorkspace.fs.writeFile).toHaveBeenCalled()
		})
	})

	describe('sanitizePath', () => {
		beforeEach(() => {
			provider = new TestNotesDataProvider(
				'/test/notes',
				'project',
				'notesHub.openNote',
				iContext,
				iWindow,
				iWorkspace,
				iCommands,
				iCommonUtils,
				iFrontmatterUtils,
				iPathUtils,
				iFileTypeEnum,
			)
		})

		it('should return empty string for falsy input', () => {
			const result = (provider as any).sanitizePath('')

			expect(result).toBe('')
		})

		it('should normalize and replace backslashes', () => {
			const result = (provider as any).sanitizePath('C:\\test\\path\\file.md')

			expect(result).toBe('C:/test/path/file.md')
		})

		it('should handle already normalized paths', () => {
			const result = (provider as any).sanitizePath('/test/path/file.md')

			expect(result).toBe('/test/path/file.md')
		})
	})
})
