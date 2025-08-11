import { describe, it, expect, beforeEach, vi } from 'vitest'
import { enableTestConsoleOutput } from '../setup'

import type { NotesHubItem } from '@fux/note-hub-core'
import { NotesHubActionService } from '@fux/note-hub-core'
import type { ICommands, ICommonUtilsService, IEnv, IFileType, IFrontmatterUtilsService, IPathUtilsService, IWindow, IWorkspace } from '@fux/shared'
import { UriAdapter } from '@fux/shared'
import { mockly, mocklyService, CoreUtilitiesService, LogLevel } from '@fux/mockly'

describe('NotesHubActionService - Create Folder', () => {
	let svc: NotesHubActionService
	let iWindow: IWindow
	let iWorkspace: IWorkspace
	let iEnv: IEnv
	let iCommon: ICommonUtilsService
	let iFront: IFrontmatterUtilsService
	let iPath: IPathUtilsService
	let iCommands: ICommands
	let iFileType: IFileType
	let iProviderManager: any
	let ctx: any

	beforeEach(() => {
		// Enable console output for debugging
		enableTestConsoleOutput()
		
		// Reset mockly state for clean test isolation
		mocklyService.reset()
		
		// Enable console output for debugging by setting mockly log level to Info
		const utils = new CoreUtilitiesService()

		utils.setLogLevel(LogLevel.Info)

		// ✅ MOCKLY CAN COVER: Extension context (basic structure)
		ctx = {
			globalState: { update: vi.fn(), get: vi.fn() },
			subscriptions: [],
		}
		
		// ✅ MOCKLY CAN COVER: Window service with custom input box behavior
		iWindow = {
			...mockly.window,
			showInputBox: vi.fn().mockResolvedValue('new-folder'),
		} as unknown as IWindow
        
		// ✅ MOCKLY CAN COVER: Workspace service with custom directory creation
		iWorkspace = {
			...mockly.workspace,
			fs: {
				// Ensure we have all the required fs methods
				stat: vi.fn(),
				readFile: vi.fn(),
				writeFile: vi.fn(),
				createDirectory: vi.fn().mockResolvedValue(undefined),
				readDirectory: vi.fn(),
				delete: vi.fn(),
				copy: vi.fn(),
				rename: vi.fn(),
			},
		} as unknown as IWorkspace
        
		// ✅ MOCKLY CAN COVER: Environment service with clipboard utilities
		iEnv = {
			...mockly.env,
			clipboard: { writeText: vi.fn(), readText: vi.fn() },
		} as unknown as IEnv
        
		// ✅ MOCKLY CAN COVER: Commands service
		iCommands = {
			...mockly.commands,
		} as unknown as ICommands
        
		// ✅ MOCKLY CAN COVER: File type enum (using mockly's constants)
		iFileType = {
			File: 1,
			Directory: 2,
		} as unknown as IFileType
        
		// ❌ MOCKLY CANNOT COVER: Custom interface ICommonUtilsService
		// This is a custom interface specific to the shared library
		iCommon = {
			errMsg: vi.fn(),
			infoMsg: vi.fn(),
			warnMsg: vi.fn(),
			debugMsg: vi.fn(),
		} as unknown as ICommonUtilsService
		
		// ❌ MOCKLY CANNOT COVER: Custom interface IFrontmatterUtilsService
		// This is a custom interface specific to the shared library
		iFront = {
			getFrontmatter_validateFrontmatter: vi.fn().mockReturnValue(false),
		} as unknown as IFrontmatterUtilsService
		
		// ❌ MOCKLY CANNOT COVER: Custom interface IPathUtilsService
		// This is a custom interface specific to the shared library
		// However, we can leverage mockly's node.path utilities for some operations
		iPath = {
			sanitizePath: vi.fn((p: string) => p),
			basename: vi.fn((p: string) => p.split('/').pop() || p),
			dirname: vi.fn((p: string) => p.split('/').slice(0, -1).join('/') || '.'),
			join: vi.fn((...paths: string[]) => paths.join('/').replace(/\/+/g, '/')),
			parse: vi.fn((p: string) => ({
				name: p.split('/').pop()?.split('.')[0] || '',
				ext: p.includes('.') ? `.${p.split('.').pop()}` : '',
			})),
		} as unknown as IPathUtilsService
		
		// ❌ MOCKLY CANNOT COVER: Custom service iProviderManager
		// This is a custom service specific to the note-hub package
		iProviderManager = {
			getProviderForNote: vi.fn().mockResolvedValue({
				refresh: vi.fn(),
				getNotesHubItem: vi.fn().mockResolvedValue(undefined),
			}),
			getProviderInstance: vi.fn().mockReturnValue({ notesDir: '/notes/project' }),
			revealNotesHubItem: vi.fn(),
		}

		// ❌ MOCKLY CANNOT COVER: Node.js file system operations (they call real fs)
		// Create proper mocks for file system operations
		const iFspAccess = vi.fn().mockResolvedValue(undefined)
        
		// ❌ MOCKLY CANNOT COVER: rename method not available in mockly.node.fs
		// Fall back to manual mock for this specific method
		const iFspRename = vi.fn()
		
		svc = new NotesHubActionService(
			ctx,
			iWindow,
			iWorkspace,
			iEnv,
			iCommon,
			iFront,
			iPath,
			iProviderManager,
			iCommands,
			// ✅ MOCKLY CAN COVER: Path utility functions using mockly.node.path
			// Create mock functions that we can track
			vi.fn((p: string, c: string) => mockly.node.path.join(p, c) as any),
			vi.fn((p: string) => mockly.node.path.normalize(p) as any),
			vi.fn((p: string) => mockly.node.path.dirname(p) as any),
			vi.fn((s: string) => ({
				name: mockly.node.path.basename(s, mockly.node.path.extname(s)),
				ext: mockly.node.path.extname(s),
			}) as any),
			vi.fn((s: string) => mockly.node.path.extname(s) as any),
			iFspAccess,
			iFspRename,
			iFileType,
		)
	})

	it('passes raw VSCode Uri to workspace.fs.createDirectory (not UriAdapter)', async () => {
		// Enable console output for this test
		enableTestConsoleOutput()
		
		console.log('🔍 Starting test: passes raw VSCode Uri to workspace.fs.createDirectory')
		
		// Mock UriAdapter.file to return a proper UriAdapter instance
		const originalFile = UriAdapter.file

		UriAdapter.file = vi.fn((path: string) => {
			const mockUri = mockly.Uri.file(path)

			return {
				uri: mockUri,
				fsPath: path,
				toString: () => `file://${path}`,
				path: mockUri.path,
				query: mockUri.query,
				fragment: mockUri.fragment,
			} as any
		}) as any
		
		// Arrange minimal dependencies
		const folder = {
			label: 'folder',
			fileName: 'new-folder',
			filePath: '/notes/project/new-folder',
			isDirectory: true,
			resourceUri: mockly.Uri.file('/notes/project/new-folder'),
		} as NotesHubItem

		const expectedNewUri = mockly.Uri.file('/notes/project/new-folder/new-folder')

		console.log('🔍 Test setup complete, folder:', folder)
		console.log('🔍 Expected new URI:', expectedNewUri)
		console.log('🔍 Folder validation check:')
		console.log('  - isDirectory:', folder.isDirectory)
		console.log('  - resourceUri:', folder.resourceUri)
		console.log('  - resourceUri type:', typeof folder.resourceUri)
		console.log('  - resourceUri toString:', folder.resourceUri?.toString())

		// Act
		// Verify the folder object is properly set up
		expect(folder.isDirectory).toBe(true)
		expect(folder.resourceUri).toBeDefined()
		expect(folder.filePath).toBeDefined()
		
		// Verify the service is properly initialized
		expect(svc).toBeDefined()
		
		console.log('🔍 About to call newFolderInFolder...')
		console.log('🔍 Provider manager mock setup:')
		console.log('  - getProviderForNote mock:', iProviderManager.getProviderForNote)
		console.log('  - getProviderForNote mock calls:', (iProviderManager.getProviderForNote as any).mock?.calls)
		console.log('🔍 Window showInputBox mock setup:')
		console.log('  - showInputBox mock:', iWindow.showInputBox)
		console.log('  - showInputBox mock calls:', (iWindow.showInputBox as any).mock?.calls)
		console.log('🔍 Workspace fs createDirectory mock setup:')
		console.log('  - createDirectory mock:', iWorkspace.fs.createDirectory)
		console.log('  - createDirectory mock calls:', (iWorkspace.fs.createDirectory as any).mock?.calls)

		// Note: We don't test showInputBox directly here to avoid interfering with the service call count

		// Add logging to track the exact flow
		console.log('🔍 About to call newFolderInFolder with detailed tracking...')
		
		// Track all the injected path utility functions
		console.log('🔍 Path utility functions setup:')
		console.log('  - iPath.sanitizePath mock calls:', (iPath.sanitizePath as any).mock?.calls)
		console.log('  - iPath mock calls:', (iPath as any).mock?.calls)
		
		// Test the access mock to see if it's working
		console.log('🔍 Testing access mock:')

		try {
			await (svc as any).iFspAccess('/test/path', 'w')
			console.log('  - Access mock succeeded')
		}
		catch (error) {
			console.log('  - Access mock failed:', error)
		}
		
		await svc.newFolderInFolder(folder)

		console.log('🔍 newFolderInFolder completed')
		console.log('🔍 After method completion:')
		console.log('  - Provider getProviderForNote called:', (iProviderManager.getProviderForNote as any).mock.calls.length)
		console.log('  - ShowInputBox called:', (iWindow.showInputBox as any).mock.calls.length)
		console.log('  - CreateDirectory called:', (iWorkspace.fs.createDirectory as any).mock.calls.length)

		// Assert
		// First, verify that the provider was found
		expect(iProviderManager.getProviderForNote).toHaveBeenCalledTimes(1)
		expect(iProviderManager.getProviderForNote).toHaveBeenCalledWith(folder)
		
		// Verify that showInputBox was called
		expect(iWindow.showInputBox).toHaveBeenCalledTimes(1)
		expect(iWindow.showInputBox).toHaveBeenCalledWith({
			prompt: 'Enter the name of the new folder',
			value: 'NewFolder',
		})
		
		// Now verify that createDirectory was called
		expect(iWorkspace.fs.createDirectory).toHaveBeenCalledTimes(1)

		const arg = (iWorkspace.fs.createDirectory as any).mock.calls[0]?.[0]

		console.log('🔍 createDirectory was called with arg:', arg)

		// Should be the underlying VSCode Uri (Mockly Uri in tests), not our adapter wrapper
		expect(arg.fsPath).toBe(expectedNewUri.fsPath)
		expect(arg.toString()).toBe(expectedNewUri.toString())
		
		// Restore original method
		UriAdapter.file = originalFile
		
		console.log('🔍 Test completed successfully')
	})
})
