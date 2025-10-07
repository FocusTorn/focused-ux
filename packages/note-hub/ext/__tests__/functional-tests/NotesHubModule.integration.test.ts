import { describe, it, expect, vi, beforeEach } from 'vitest'
import { NotesHubModule } from '../../src/NotesHub.module.js'
import type { INotesHubService, INotesHubItem } from '@fux/note-hub-core'
import type { IWindow } from '../../src/_interfaces/IWindow.js'
import type { ICommands } from '../../src/_interfaces/ICommands.js'
import type { ExtensionContext } from 'vscode'

describe('NotesHubModule Integration', () => {
	let module: NotesHubModule
	let mockNotesHubService: INotesHubService
	let mockWindowAdapter: IWindow
	let mockCommandsAdapter: ICommands
	let mockExtensionContext: ExtensionContext

	beforeEach(() => {
		// Create comprehensive mocks
		mockNotesHubService = {
			initializeNotesHub: vi.fn().mockResolvedValue(undefined),
			dispose: vi.fn(),
			newFolderAtRoot: vi.fn(),
			newNoteAtRoot: vi.fn(),
			newNoteInFolder: vi.fn(),
			newFolderInFolder: vi.fn(),
			openNote: vi.fn(),
			openNotePreview: vi.fn(),
			addFrontmatter: vi.fn(),
			copyItem: vi.fn(),
			cutItem: vi.fn(),
			pasteItem: vi.fn(),
			renameItem: vi.fn(),
			deleteItem: vi.fn(),
			refreshProviders: vi.fn(),
			getProviderForNote: vi.fn(),
			revealNotesHubItem: vi.fn(),
			getNotesHubConfig: vi.fn(),
		}

		mockWindowAdapter = {
			showInformationMessage: vi.fn().mockResolvedValue(undefined),
			showWarningMessage: vi.fn().mockResolvedValue(undefined),
			showErrorMessage: vi.fn().mockResolvedValue(undefined),
			showInputBox: vi.fn().mockResolvedValue(undefined),
			showTextDocument: vi.fn().mockResolvedValue(undefined),
			withProgress: vi.fn().mockResolvedValue(undefined),
			registerTreeDataProvider: vi.fn().mockReturnValue({ dispose: vi.fn() }),
		}

		mockCommandsAdapter = {
			registerCommand: vi.fn().mockReturnValue({ dispose: vi.fn() }),
			executeCommand: vi.fn().mockResolvedValue(undefined),
		}

		mockExtensionContext = {
			subscriptions: [],
			workspaceState: {} as any,
			globalState: {} as any,
			extensionPath: '/test/path',
			storagePath: '/test/storage',
			globalStoragePath: '/test/global/storage',
			logPath: '/test/log',
			extensionUri: {} as any,
			environmentVariableCollection: {} as any,
			asAbsolutePath: vi.fn(),
			storageUri: {} as any,
			globalStorageUri: {} as any,
			logUri: {} as any,
			extensionMode: 1,
			extension: {} as any,
		}

		module = new NotesHubModule(mockNotesHubService, mockWindowAdapter, mockCommandsAdapter)
	})

	describe('constructor', () => {
		it('should create module with dependencies', () => {
			expect(module).toBeInstanceOf(NotesHubModule)
		})
	})

	describe('registerCommands', () => {
		it('should register all commands successfully', () => {
			const disposables = module.registerCommands(mockExtensionContext)

			expect(disposables).toBeDefined()
			expect(Array.isArray(disposables)).toBe(true)
			expect(disposables.length).toBeGreaterThan(0)
		})

		it('should register command for newProjectFolder', () => {
			module.registerCommands(mockExtensionContext)

			expect(mockCommandsAdapter.registerCommand).toHaveBeenCalledWith(
				expect.stringContaining('newProjectFolder'),
				expect.any(Function),
			)
		})

		it('should register command for newRemoteFolder', () => {
			module.registerCommands(mockExtensionContext)

			expect(mockCommandsAdapter.registerCommand).toHaveBeenCalledWith(
				expect.stringContaining('newRemoteFolder'),
				expect.any(Function),
			)
		})

		it('should register command for newGlobalFolder', () => {
			module.registerCommands(mockExtensionContext)

			expect(mockCommandsAdapter.registerCommand).toHaveBeenCalledWith(
				expect.stringContaining('newGlobalFolder'),
				expect.any(Function),
			)
		})

		it('should register command for newProjectNote', () => {
			module.registerCommands(mockExtensionContext)

			expect(mockCommandsAdapter.registerCommand).toHaveBeenCalledWith(
				expect.stringContaining('newProjectNote'),
				expect.any(Function),
			)
		})

		it('should register command for newRemoteNote', () => {
			module.registerCommands(mockExtensionContext)

			expect(mockCommandsAdapter.registerCommand).toHaveBeenCalledWith(
				expect.stringContaining('newRemoteNote'),
				expect.any(Function),
			)
		})

		it('should register command for newGlobalNote', () => {
			module.registerCommands(mockExtensionContext)

			expect(mockCommandsAdapter.registerCommand).toHaveBeenCalledWith(
				expect.stringContaining('newGlobalNote'),
				expect.any(Function),
			)
		})

		it('should register command for newNestedNote', () => {
			module.registerCommands(mockExtensionContext)

			expect(mockCommandsAdapter.registerCommand).toHaveBeenCalledWith(
				expect.stringContaining('newNestedNote'),
				expect.any(Function),
			)
		})

		it('should register command for newNestedFolder', () => {
			module.registerCommands(mockExtensionContext)

			expect(mockCommandsAdapter.registerCommand).toHaveBeenCalledWith(
				expect.stringContaining('newNestedFolder'),
				expect.any(Function),
			)
		})

		it('should register command for openNote', () => {
			module.registerCommands(mockExtensionContext)

			expect(mockCommandsAdapter.registerCommand).toHaveBeenCalledWith(
				expect.stringContaining('openNote'),
				expect.any(Function),
			)
		})

		it('should register command for openNotePreview', () => {
			module.registerCommands(mockExtensionContext)

			expect(mockCommandsAdapter.registerCommand).toHaveBeenCalledWith(
				expect.stringContaining('openNotePreview'),
				expect.any(Function),
			)
		})

		it('should register command for addFrontmatter', () => {
			module.registerCommands(mockExtensionContext)

			expect(mockCommandsAdapter.registerCommand).toHaveBeenCalledWith(
				expect.stringContaining('addFrontmatter'),
				expect.any(Function),
			)
		})

		it('should register command for copyItem', () => {
			module.registerCommands(mockExtensionContext)

			expect(mockCommandsAdapter.registerCommand).toHaveBeenCalledWith(
				expect.stringContaining('copyItem'),
				expect.any(Function),
			)
		})

		it('should register command for cutItem', () => {
			module.registerCommands(mockExtensionContext)

			expect(mockCommandsAdapter.registerCommand).toHaveBeenCalledWith(
				expect.stringContaining('cutItem'),
				expect.any(Function),
			)
		})

		it('should register command for pasteItem', () => {
			module.registerCommands(mockExtensionContext)

			expect(mockCommandsAdapter.registerCommand).toHaveBeenCalledWith(
				expect.stringContaining('pasteItem'),
				expect.any(Function),
			)
		})

		it('should register command for renameItem', () => {
			module.registerCommands(mockExtensionContext)

			expect(mockCommandsAdapter.registerCommand).toHaveBeenCalledWith(
				expect.stringContaining('renameItem'),
				expect.any(Function),
			)
		})

		it('should handle command registration errors gracefully', () => {
			mockCommandsAdapter.registerCommand = vi.fn().mockImplementation(() => {
				throw new Error('Command already registered')
			})

			const disposables = module.registerCommands(mockExtensionContext)

			expect(disposables).toBeDefined()
			expect(Array.isArray(disposables)).toBe(true)
			expect(disposables.length).toBeGreaterThan(0)
		})
	})

	describe('initializeModule', () => {
		it('should initialize the notes hub service', async () => {
			await module.initializeModule()

			expect(mockNotesHubService.initializeNotesHub).toHaveBeenCalledWith(
				expect.any(String),
				expect.any(String),
			)
		})

		it('should handle initialization errors', async () => {
			mockNotesHubService.initializeNotesHub = vi.fn().mockRejectedValue(new Error('Initialization failed'))

			await expect(module.initializeModule()).rejects.toThrow('Initialization failed')
		})
	})

	describe('dispose', () => {
		it('should dispose the notes hub service', () => {
			module.dispose()

			expect(mockNotesHubService.dispose).toHaveBeenCalled()
		})

		it('should handle dispose when service is undefined', () => {
			// Create module without service
			const moduleWithoutService = new NotesHubModule(
				undefined as any,
				mockWindowAdapter,
				mockCommandsAdapter,
			)

			expect(() => moduleWithoutService.dispose()).not.toThrow()
		})
	})

	describe('command handlers', () => {
		let commandHandlers: { [key: string]: (...args: unknown[]) => void }

		beforeEach(() => {
			// Capture command handlers during registration
			mockCommandsAdapter.registerCommand = vi.fn().mockImplementation((command, handler) => {
				if (!commandHandlers)
					commandHandlers = {}
				commandHandlers[command] = handler
				return { dispose: vi.fn() }
			})

			module.registerCommands(mockExtensionContext)
		})

		it('should handle newProjectFolder command', () => {
			const handler = commandHandlers['nh.newProjectFolder']

			expect(handler).toBeDefined()

			handler()
			expect(mockNotesHubService.newFolderAtRoot).toHaveBeenCalledWith('project')
		})

		it('should handle newRemoteFolder command', () => {
			const handler = commandHandlers['nh.newRemoteFolder']

			expect(handler).toBeDefined()

			handler()
			expect(mockNotesHubService.newFolderAtRoot).toHaveBeenCalledWith('remote')
		})

		it('should handle newGlobalFolder command', () => {
			const handler = commandHandlers['nh.newGlobalFolder']

			expect(handler).toBeDefined()

			handler()
			expect(mockNotesHubService.newFolderAtRoot).toHaveBeenCalledWith('global')
		})

		it('should handle newNestedNote command with item', () => {
			const handler = commandHandlers['nh.newNestedNote']

			expect(handler).toBeDefined()

			const mockItem = { label: 'Test Folder' } as INotesHubItem

			handler(mockItem)
			expect(mockNotesHubService.newNoteInFolder).toHaveBeenCalledWith(mockItem)
		})

		it('should handle newNestedNote command without item', () => {
			const handler = commandHandlers['nh.newNestedNote']

			expect(handler).toBeDefined()

			handler()
			expect(mockWindowAdapter.showWarningMessage).toHaveBeenCalledWith(
				'Select a folder to create a nested note.',
			)
		})

		it('should handle newNestedFolder command with item', () => {
			const handler = commandHandlers['nh.newNestedFolder']

			expect(handler).toBeDefined()

			const mockItem = { label: 'Test Folder' } as INotesHubItem

			handler(mockItem)
			expect(mockNotesHubService.newFolderInFolder).toHaveBeenCalledWith(mockItem)
		})

		it('should handle newNestedFolder command without item', () => {
			const handler = commandHandlers['nh.newNestedFolder']

			expect(handler).toBeDefined()

			handler()
			expect(mockWindowAdapter.showWarningMessage).toHaveBeenCalledWith(
				'Select a folder to create a nested folder.',
			)
		})

		it('should handle openNote command with item', () => {
			const handler = commandHandlers['nh.openNote']

			expect(handler).toBeDefined()

			const mockItem = { label: 'Test Note' } as INotesHubItem

			handler(mockItem)
			expect(mockNotesHubService.openNote).toHaveBeenCalledWith(mockItem)
		})

		it('should handle openNote command without item', () => {
			const handler = commandHandlers['nh.openNote']

			expect(handler).toBeDefined()

			handler()
			expect(mockNotesHubService.openNote).not.toHaveBeenCalled()
		})
	})
})
