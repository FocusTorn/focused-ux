import { describe, it, expect, beforeEach, vi } from 'vitest'
import '../setup'
import type { ICommands, ICommonUtilsService, IFileType, IFrontmatterUtilsService, IPathUtilsService, IWindow, IWorkspace, IUri } from '@fux/shared'
import { ProjectNotesDataProvider } from '@fux/note-hub-core'
import { mocklyService } from '@fux/mockly'

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
		// Reset Mockly service to clean state
		mocklyService.reset()
		
		extensionContext = { subscriptions: [] }

		// Use Mockly's built-in window service instead of manual mocks
		iWindow = mocklyService.window as unknown as IWindow

		// Use Mockly's built-in workspace service instead of manual mocks
		iWorkspace = mocklyService.workspace as unknown as IWorkspace

		// Use Mockly's built-in commands service instead of manual mocks
		iCommands = mocklyService.commands as unknown as ICommands
		
		iCommonUtils = { errMsg: vi.fn(), infoMsg: vi.fn(), warnMsg: vi.fn(), debugMsg: vi.fn() } as unknown as ICommonUtilsService
		iFrontmatterUtils = { getFrontmatter: vi.fn().mockResolvedValue(undefined) } as unknown as IFrontmatterUtilsService
		iPathUtils = { sanitizePath: vi.fn((p: string) => p) } as unknown as IPathUtilsService
		
		// Use Mockly's built-in file type enum
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

	it.skip('getChildren: skips invalid names (empty/whitespace) without throwing', async () => {
		// Set up test files in Mockly's file system
		const testDir = '/notes/project'
		const goodName = 'note.md'
		
		// Add test files to Mockly's file system
		mocklyService.workspace.fs.createDirectory(mocklyService.Uri.file(testDir))
		mocklyService.workspace.fs.writeFile(mocklyService.Uri.file(`${testDir}/${goodName}`), new TextEncoder().encode('content'))

		const root = makeItem('project', testDir, true, mocklyService.Uri.file(testDir))
		const children = await provider.getChildren(root)

		// Should find at least one child with a valid name
		expect(children.length).toBeGreaterThan(0)
		expect(children.some(c => typeof c.label === 'string' && c.label === goodName)).toBe(true)
	})

	it.skip('NotesHubItem: tolerates non-string Desc in frontmatter without throwing', async () => {
		// Set up test file in Mockly's file system
		const testDir = '/notes/project'
		const testFile = 'note.md'
		
		// Add test file to Mockly's file system
		mocklyService.workspace.fs.createDirectory(mocklyService.Uri.file(testDir))
		mocklyService.workspace.fs.writeFile(mocklyService.Uri.file(`${testDir}/${testFile}`), new TextEncoder().encode('content'))

		// Make frontmatter return a non-string Desc value
		;(iFrontmatterUtils.getFrontmatter as any).mockResolvedValue({ Desc: 123 as any, Label: 'Note' })

		const root = makeItem('project', testDir, true, mocklyService.Uri.file(testDir))
		const children = await provider.getChildren(root)

		// Should produce at least one child without crashing
		expect(children.length).toBeGreaterThan(0)

		// The description should be undefined or not a string when Desc is non-string
		const firstChild = children[0] as any

		expect(typeof firstChild.description === 'string' ? firstChild.description : undefined).toBeUndefined()
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
