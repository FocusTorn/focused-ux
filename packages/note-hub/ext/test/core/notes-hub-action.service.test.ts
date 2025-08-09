import { describe, it, expect, beforeEach, vi } from 'vitest'
import '../setup'
import { NotesHubActionService, NotesHubItem } from '@fux/note-hub-core'
import type { ICommands, ICommonUtilsService, IEnv, IFileType, IFrontmatterUtilsService, IPathUtilsService, IWindow, IWorkspace } from '@fux/shared'

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

	beforeEach(() => {
		ctx = { globalState: { update: vi.fn(), get: vi.fn() }, subscriptions: [] }
		iWindow = {
			showTextDocument: vi.fn(),
			showWarningMessage: vi.fn().mockResolvedValue('Confirm'),
			showInformationMessage: vi.fn(),
			showInputBox: vi.fn().mockResolvedValue('renamed.md'),
			withProgress: vi.fn().mockImplementation(async (_o, t) => t()),
		} as unknown as IWindow

		iWorkspace = {
			fs: {
				readFile: vi.fn(),
				writeFile: vi.fn(),
				delete: vi.fn(),
				rename: vi.fn(),
				copy: vi.fn(),
				stat: vi.fn(),
			},
			openTextDocument: vi.fn(),
		} as unknown as IWorkspace

		iEnv = { clipboard: { writeText: vi.fn(), readText: vi.fn() } } as unknown as IEnv
		iCommon = { errMsg: vi.fn(), infoMsg: vi.fn(), warnMsg: vi.fn(), debugMsg: vi.fn() } as unknown as ICommonUtilsService
		iFront = { getFrontmatter_validateFrontmatter: vi.fn().mockReturnValue(false) } as unknown as IFrontmatterUtilsService
		iPath = { sanitizePath: vi.fn((p: string) => p) } as unknown as IPathUtilsService
		iCommands = { executeCommand: vi.fn() } as unknown as ICommands
		iFileType = { File: 1, Directory: 2 } as unknown as IFileType

		iProviderManager = {
			getProviderForNote: vi.fn().mockResolvedValue({ refresh: vi.fn(), getNotesHubItem: vi.fn().mockResolvedValue(undefined) }),
			getProviderInstance: vi.fn().mockReturnValue({ notesDir: '/notes/project' }),
			revealNotesHubItem: vi.fn(),
		}

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
			vi.fn().mockResolvedValue(undefined) as any,
			vi.fn().mockResolvedValue(undefined) as any,
			iFileType,
		)
	})

	it('openNote opens document and shows it', async () => {
		const item = new NotesHubItem('n', '/notes/project/n.md', false)

    ;(iWorkspace.openTextDocument as any).mockResolvedValue({ uri: { fsPath: '/notes/project/n.md' } })
		await svc.openNote(item as any)
		expect(iWorkspace.openTextDocument).toHaveBeenCalled()
		expect(iWindow.showTextDocument).toHaveBeenCalled()
	})

	it('renameItem preserves/handles extension', async () => {
		const item = new NotesHubItem('n.md', '/notes/project/n.md', false)

    ;(iWorkspace.fs.rename as any).mockResolvedValue(undefined)
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

	it('copy/cut/paste flow moves or copies with progress and clears state on cut', async () => {
		const fileUri = 'file:///notes/project/n.md'
		const item = new NotesHubItem('n.md', '/notes/project', true)

    ;(iEnv.clipboard.readText as any).mockResolvedValue(fileUri)
		;(iWorkspace.fs.stat as any).mockResolvedValue({ type: iFileType.File })
		await svc.pasteItem(item as any)
		expect(iWindow.withProgress).toHaveBeenCalled()
	})

	it('newNoteInFolder creates, opens, and reveals', async () => {
		const folder = new NotesHubItem('project', '/notes/project', true)

    ;(iWorkspace.fs.writeFile as any).mockResolvedValue(undefined)
		;(iWorkspace.openTextDocument as any).mockResolvedValue({})
		await svc.newNoteInFolder(folder as any)
		expect(iWorkspace.fs.writeFile).toHaveBeenCalled()
		expect(iWorkspace.openTextDocument).toHaveBeenCalled()
	})
})
