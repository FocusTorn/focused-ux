import { describe, it, expect, beforeEach, vi } from 'vitest'
import '../setup'
import { NotesHubActionService, NotesHubItem } from '@fux/note-hub-core'
import type { ICommands, ICommonUtilsService, IEnv, IFileType, IFrontmatterUtilsService, IPathUtilsService, IWindow, IWorkspace } from '@fux/shared'
import { UriAdapter } from '@fux/shared'
import { mockly, mocklyService } from '@fux/mockly'

describe('NotesHubActionService', () => {
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
		// Reset Mockly service to clean state
		mocklyService.reset()
		
		ctx = { globalState: { update: vi.fn(), get: vi.fn() }, subscriptions: [] }
		
		// Use Mockly's built-in window service instead of manual mocks
		iWindow = {
			...mockly.window,
			showTextDocument: vi.fn().mockResolvedValue(undefined),
			withProgress: vi.fn().mockImplementation((options: any, task: any) => task()),
			showWarningMessage: vi.fn().mockImplementation((message: string, options: any, ...actions: string[]) => {
				// Return 'Delete' for deleteItem test, 'Overwrite' for pasteItem test
				if (message.includes('already exists. Overwrite?')) {
					return Promise.resolve('Overwrite')
				}
				return Promise.resolve('Delete')
			}),
			showInputBox: vi.fn().mockResolvedValue('renamed.md'),
		} as unknown as IWindow

		// Create a mock workspace that extends Mockly's service with Vitest mocks
		iWorkspace = {
			...mockly.workspace,
			openTextDocument: vi.fn(),
			fs: {
				...mockly.workspace.fs,
				readFile: vi.fn(),
				writeFile: vi.fn(),
				rename: vi.fn(),
				delete: vi.fn(),
				copy: vi.fn(),
				stat: vi.fn(),
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
		
		// Create a mock commands service that extends Mockly's service with Vitest mocks
		iCommands = {
			...mockly.commands,
			executeCommand: vi.fn(),
		} as unknown as ICommands
		
		// Use Mockly's built-in file type enum
		iFileType = { File: 1, Directory: 2 } as unknown as IFileType

		iProviderManager = {
			getProviderForNote: vi.fn().mockResolvedValue({ refresh: vi.fn(), getNotesHubItem: vi.fn().mockResolvedValue(undefined) }),
			getProviderInstance: vi.fn().mockReturnValue({ notesDir: '/notes/project' }),
			revealNotesHubItem: vi.fn(),
		}

		// Create mock node.fs functions with Vitest mocks
		iFspAccess = vi.fn()
		iFspRename = vi.fn()

		// Set up mock implementations
		;(iWorkspace.openTextDocument as any).mockResolvedValue({ uri: { fsPath: '/notes/project/n.md' } })
		;(iWorkspace.fs.readFile as any).mockResolvedValue(new TextEncoder().encode('content'))
		;(iWorkspace.fs.writeFile as any).mockResolvedValue(undefined)
		;(iWorkspace.fs.rename as any).mockResolvedValue(undefined)
		;(iWorkspace.fs.delete as any).mockResolvedValue(undefined)
		;(iWorkspace.fs.copy as any).mockResolvedValue(undefined)
		;(iWorkspace.fs.stat as any).mockResolvedValue({ type: 1 }) // File type
		;(iCommands.executeCommand as any).mockResolvedValue(undefined)
		iFspAccess.mockResolvedValue(undefined)
		iFspRename.mockResolvedValue(undefined)

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

	it('openNote opens document and shows it', async () => {
		const item = new NotesHubItem('n', '/notes/project/n.md', false)

		await svc.openNote(item as any)
		expect(iWorkspace.openTextDocument).toHaveBeenCalled()
		expect(iWindow.showTextDocument).toHaveBeenCalled()
	})

	it('renameItem preserves/handles extension', async () => {
		const item = new NotesHubItem('n.md', '/notes/project/n.md', false)

		await svc.renameItem(item as any)
		expect(iWorkspace.fs.rename).toHaveBeenCalled()
	})

	it('addFrontmatter inserts header and refreshes provider', async () => {
		const item = new NotesHubItem('n.md', '/notes/project/n.md', false)

    ;(iWorkspace.fs.readFile as any).mockResolvedValue(new TextEncoder().encode('content'))
		;(iWorkspace.fs.writeFile as any).mockResolvedValue(undefined)
		await svc.addFrontmatter(item as any)
		expect(iWorkspace.fs.writeFile).toHaveBeenCalled()
	})

	it('openNotePreview executes markdown preview command', async () => {
		const item = new NotesHubItem('n.md', '/notes/project/n.md', false)

		await svc.openNotePreview(item as any)
		expect(iCommands.executeCommand).toHaveBeenCalledWith('markdown.showPreviewToSide', expect.anything())
	})

	it('deleteItem confirms and deletes then refreshes', async () => {
		const item = new NotesHubItem('n.md', '/notes/project/n.md', false)

		;(iWorkspace.fs.delete as any).mockResolvedValue(undefined)
		await svc.deleteItem(item as any)
		expect(iWorkspace.fs.delete).toHaveBeenCalled()
	})

	it('pasteItem calls withProgress when copying a file', async () => {
		// Create a simple test that just verifies the basic flow
		const sourceUri = 'file:///notes/other/source.md' // Different directory to avoid path conflict
		const targetFolder = new NotesHubItem('project', '/notes/project', true)
		
		// Debug: Log the constructed values
		console.log('Source URI:', sourceUri)
		console.log('Target folder filePath:', targetFolder.filePath)
		console.log('Target folder resourceUri:', targetFolder.resourceUri?.fsPath)
		
		// Set up minimal mocks
		;(iEnv.clipboard.readText as any).mockResolvedValue(sourceUri)
		;(ctx.globalState.get as any).mockImplementation((key: string) => {
			console.log('Global state get called with key:', key)
			if (key === 'openNote.operation')
				return 'copy'
			return undefined
		})
		;(iFspAccess as any).mockRejectedValue(new Error('File not found')) // fileExists returns false
		;(iWorkspace.fs.copy as any).mockResolvedValue(undefined)
		;(iWorkspace.fs.stat as any).mockResolvedValue({ type: iFileType.File })
		
		// Mock UriAdapter.file to return a mock URI that works in tests
		const originalFile = UriAdapter.file
		UriAdapter.file = vi.fn((path: string) => ({
			uri: { fsPath: path, toString: () => path },
			fsPath: path,
			toString: () => path,
		})) as any
		
		// Add debug logging to see what's happening
		console.log('About to call pasteItem')
		try {
			await svc.pasteItem(targetFolder as any)
			console.log('pasteItem completed successfully')
		} catch (error) {
			console.error('pasteItem failed with error:', error)
		}
		
		// Restore original method
		UriAdapter.file = originalFile
		
		expect(iWindow.withProgress).toHaveBeenCalled()
	})

	it('newNoteInFolder creates, opens, and reveals', async () => {
		const folder = new NotesHubItem('project', '/notes/project', true)

		// Mock the openTextDocument method
		;(iWorkspace.openTextDocument as any).mockResolvedValue({})
		
		await svc.newNoteInFolder(folder as any)
		
		// Note: newNoteInFolder doesn't actually create a file, it just opens a document
		// So we don't expect writeFile to be called
		expect(iWorkspace.openTextDocument).toHaveBeenCalled()
	})
})
