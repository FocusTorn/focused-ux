import { describe, it, expect, beforeEach, vi } from 'vitest'
import '../setup'
import type { NotesHubItem } from '@fux/note-hub-core'
import { NotesHubActionService } from '@fux/note-hub-core'
import type { ICommands, ICommonUtilsService, IEnv, IFileType, IFrontmatterUtilsService, IPathUtilsService, IWindow, IWorkspace } from '@fux/shared'
import { UriAdapter } from '@fux/shared'
import { mockly } from '@fux/mockly'

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
	let iFspAccess: any
	let iFspRename: any

	beforeEach(() => {
		ctx = { globalState: { update: vi.fn(), get: vi.fn() }, subscriptions: [] }
		
		// Use Mockly's built-in window service instead of manual mocks
		iWindow = {
			...mockly.window,
			showInputBox: vi.fn().mockResolvedValue('new-folder'),
		} as unknown as IWindow

		// Use Mockly's built-in workspace service instead of manual mocks
		iWorkspace = {
			...mockly.workspace,
			fs: {
				...mockly.workspace.fs,
				createDirectory: vi.fn().mockResolvedValue(undefined),
			},
		} as unknown as IWorkspace

		// Use Mockly's built-in env service instead of manual mocks
		iEnv = {
			...mockly.env,
			clipboard: { writeText: vi.fn(), readText: vi.fn() },
		} as unknown as IEnv
		
		iCommon = { errMsg: vi.fn(), infoMsg: vi.fn(), warnMsg: vi.fn(), debugMsg: vi.fn() } as unknown as ICommonUtilsService
		iFront = { getFrontmatter_validateFrontmatter: vi.fn().mockReturnValue(false) } as unknown as IFrontmatterUtilsService
		iPath = {
			sanitizePath: vi.fn((p: string) => p),
			basename: vi.fn((p: string) => p.split('/').pop() || p),
			dirname: vi.fn((p: string) => p.split('/').slice(0, -1).join('/') || '.'),
			join: vi.fn((...paths: string[]) => paths.join('/').replace(/\/+/g, '/')),
			parse: vi.fn((p: string) => ({ name: p.split('/').pop()?.split('.')[0] || '', ext: p.includes('.') ? `.${p.split('.').pop()}` : '' })),
		} as unknown as IPathUtilsService
		
		// Use Mockly's built-in commands service instead of manual mocks
		iCommands = { ...mockly.commands } as unknown as ICommands
		
		// Use Mockly's built-in file type enum
		iFileType = { File: 1, Directory: 2 } as unknown as IFileType

		iProviderManager = {
			getProviderForNote: vi.fn().mockResolvedValue({ refresh: vi.fn(), getNotesHubItem: vi.fn().mockResolvedValue(undefined) }),
			getProviderInstance: vi.fn().mockReturnValue({ notesDir: '/notes/project' }),
			revealNotesHubItem: vi.fn(),
		}

		// Create mock node.fs functions with Vitest mocks
		iFspAccess = vi.fn().mockResolvedValue(undefined) // Mock successful access
		iFspRename = vi.fn()
		
		// The test expects iWorkspace.fs.createDirectory to be called, not mockly.node.fs.createDirectory
		// So we need to ensure the workspace mock has the createDirectory method

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
			(p: string, c: string) => `${p}/${c}` as any,
			(p: string) => p as any,
			(p: string) => p as any,
			(s: string) => ({ name: s.replace(/\..*$/, ''), ext: s.includes('.') ? `.${s.split('.').pop()}` : '' }) as any,
			(s: string) => (s.match(/\.[^\.]+$/)?.[0] || '') as any,
			iFspAccess,
			iFspRename,
			iFileType,
		)
	})

	it('passes raw VSCode Uri to workspace.fs.createDirectory (not UriAdapter)', async () => {
		// Mock UriAdapter.file to return a mock URI that works in tests
		const originalFile = UriAdapter.file

		UriAdapter.file = vi.fn((path: string) => ({
			uri: { fsPath: path, toString: () => `file://${path}` },
			fsPath: path,
			toString: () => `file://${path}`,
		})) as any
		
		// Arrange minimal dependencies
		const folder = {
			label: 'folder',
			filePath: '/notes/project/new-folder',
			isDirectory: true,
			resourceUri: mockly.Uri.file('/notes/project/new-folder'),
		} as NotesHubItem

		const expectedNewUri = mockly.Uri.file('/notes/project/new-folder/new-folder')

		// Act
		try {
			await svc.newFolderInFolder(folder)
		}
		catch (error) {
			console.error('[TEST] newFolderInFolder failed with error:', error)
		}

		// Assert
		expect(iWorkspace.fs.createDirectory).toHaveBeenCalledTimes(1)

		const arg = (iWorkspace.fs.createDirectory as any).mock.calls[0]?.[0]

		// Should be the underlying VSCode Uri (Mockly Uri in tests), not our adapter wrapper
		expect(arg.fsPath).toBe(expectedNewUri.fsPath)
		expect(arg.toString()).toBe(expectedNewUri.toString())
		
		// Restore original method
		UriAdapter.file = originalFile
	})
})
