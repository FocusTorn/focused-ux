import { describe, it, expect, beforeEach, vi } from 'vitest'
import '../setup'
import type { ICommands, ICommonUtilsService, IFileType, IFrontmatterUtilsService, IPathUtilsService, IWindow, IWorkspace, IUri } from '@fux/shared'
import { ProjectNotesDataProvider } from '@fux/note-hub-core'

function makeItem(label: string, filePath: string, isDirectory: boolean, parentUri?: IUri): any {
	// Construct a minimal NotesHubItem-like object for getChildren usage when needed
	return { label, filePath, isDirectory, parentUri, resourceUri: parentUri }
}

describe('BaseNotesDataProvider edge cases (guard undefined.replace)', () => {
	let provider: ProjectNotesDataProvider
	let iWindow: IWindow
	let iWorkspace: IWorkspace
	let iCommands: ICommands
	let iCommonUtils: ICommonUtilsService
	let iFrontmatterUtils: IFrontmatterUtilsService
	let iPathUtils: IPathUtilsService
	let iFileTypeEnum: IFileType
	let extensionContext: any

	beforeEach(() => {
		extensionContext = { subscriptions: [] }

		iWindow = {
			registerTreeDataProvider: vi.fn().mockReturnValue({ dispose: vi.fn() }),
			showInformationMessage: vi.fn().mockResolvedValue('Later'),
		} as unknown as IWindow

		iWorkspace = {
			fs: {
				readDirectory: vi.fn(),
				stat: vi.fn(),
			},
		} as unknown as IWorkspace

		iCommands = { executeCommand: vi.fn() } as unknown as ICommands
		iCommonUtils = { errMsg: vi.fn(), infoMsg: vi.fn(), warnMsg: vi.fn(), debugMsg: vi.fn() } as unknown as ICommonUtilsService
		iFrontmatterUtils = { getFrontmatter: vi.fn().mockResolvedValue(undefined) } as unknown as IFrontmatterUtilsService
		iPathUtils = { sanitizePath: vi.fn((p: string) => p) } as unknown as IPathUtilsService
		iFileTypeEnum = { File: 1, Directory: 2 } as unknown as IFileType

		provider = new ProjectNotesDataProvider(
			'/notes/project',
			extensionContext,
			iWindow,
			iWorkspace,
			iCommands,
			iCommonUtils,
			iFrontmatterUtils,
			iPathUtils,
			iFileTypeEnum,
			'nh.openNote',
		)
	})

	it('getChildren: returns root item when element undefined, no crash', async () => {
		const children = await provider.getChildren(undefined)

		expect(Array.isArray(children)).toBe(true)
		expect(children.length).toBe(1)
		expect(children[0].isDirectory).toBe(true)
	})

	it('getChildren: skips invalid names (empty/whitespace) without throwing', async () => {
		// Simulate a folder with bad entries
		const badName: any = ''
		const spaceName: any = '   '
		const goodName = 'note.md'

    ;(iWorkspace.fs.readDirectory as any).mockResolvedValue([
			[badName, iFileTypeEnum.File],
			[spaceName, iFileTypeEnum.File],
			[goodName, iFileTypeEnum.File],
		])

		const root = makeItem('project', '/notes/project', true, { fsPath: '/notes/project' } as any)
		const children = await provider.getChildren(root)

		expect(children.some(c => typeof c.label === 'string' && (c.label as string).trim() === goodName)).toBe(true)
	})

	it('NotesHubItem: tolerates non-string Desc in frontmatter without throwing', async () => {
		// Simulate a folder read with one valid file
		(iWorkspace.fs.readDirectory as any).mockResolvedValue([
			['note.md', iFileTypeEnum.File],
		])

		// Make frontmatter return a non-string Desc value
		;(iFrontmatterUtils.getFrontmatter as any).mockResolvedValue({ Desc: 123 as any, Label: 'Note' })

		const root = makeItem('project', '/notes/project', true, { fsPath: '/notes/project' } as any)
		const children = await provider.getChildren(root)

		// Should produce one child without crashing and with undefined description
		expect(children.length).toBe(1)
		expect(typeof (children[0] as any).description === 'string' ? (children[0] as any).description : undefined).toBeUndefined()
	})

	it('getParent: returns undefined when parent path resolves empty/invalid', async () => {
		// Construct an element whose parentUri.fsPath is empty
		const element = makeItem('x.md', '/notes/project/x.md', false, { fsPath: '' } as any)
		const parent = await provider.getParent(element)

		expect(parent).toBeUndefined()
	})

	it('getParent: returns undefined when parentUri is undefined', async () => {
		const element = makeItem('x.md', '/notes/project/x.md', false, undefined as any)
		const parent = await provider.getParent(element)

		expect(parent).toBeUndefined()
	})
})
