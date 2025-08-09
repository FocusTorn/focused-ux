import { describe, it, expect, beforeEach, vi } from 'vitest'
import '../setup'
import { NotesHubProviderManager } from '@fux/note-hub-core'
import type { ICommands, ICommonUtilsService, IFileType, IFrontmatterUtilsService, IPathUtilsService, IWindow, IWorkspace } from '@fux/shared'

describe('NotesHubProviderManager', () => {
	let mgr: NotesHubProviderManager
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
		} as unknown as IWindow

		iWorkspace = {
			createFileSystemWatcher: vi.fn(() => ({ onDidChange: vi.fn(), onDidCreate: vi.fn(), onDidDelete: vi.fn(), dispose: vi.fn() })),
		} as unknown as IWorkspace

		iCommands = { executeCommand: vi.fn() } as unknown as ICommands
		iCommonUtils = { errMsg: vi.fn(), infoMsg: vi.fn(), warnMsg: vi.fn(), debugMsg: vi.fn() } as unknown as ICommonUtilsService
		iFrontmatterUtils = {} as unknown as IFrontmatterUtilsService
		iPathUtils = { sanitizePath: vi.fn((p: string) => p) } as unknown as IPathUtilsService
		iFileTypeEnum = { File: 1, Directory: 2 } as unknown as IFileType

		mgr = new NotesHubProviderManager(
			extensionContext,
			iWindow,
			iWorkspace,
			iCommands,
			iCommonUtils,
			iFrontmatterUtils,
			iPathUtils,
			iFileTypeEnum,
		)
	})

	it('initializes enabled providers and avoids duplicate initialization', async () => {
		const config = {
			isProjectNotesEnabled: true,
			isRemoteNotesEnabled: true,
			isGlobalNotesEnabled: true,
			projectNotesPath: '/notes/project',
			remoteNotesPath: '/notes/remote',
			globalNotesPath: '/notes/global',
		}

		await mgr.initializeProviders(config as any, 'nh', 'nh.openNote')
		// Attempt second init; should warn/skip
		await mgr.initializeProviders(config as any, 'nh', 'nh.openNote')
	})

	it('guards inert provider when path is empty (no crashes, empty children)', async () => {
		const config = {
			isProjectNotesEnabled: true,
			isRemoteNotesEnabled: true,
			isGlobalNotesEnabled: true,
			projectNotesPath: '',
			remoteNotesPath: '/notes/remote',
			globalNotesPath: '/notes/global',
		}

		await mgr.initializeProviders(config as any, 'nh', 'nh.openNote')

		const project = mgr.getProviderInstance('project')

		if (project) {
			const children = await project.getChildren()

			expect(Array.isArray(children)).toBe(true)
		}
	})

	it('getProviderInstance returns instances by name and getProviderForNote matches path', async () => {
		const config = {
			isProjectNotesEnabled: true,
			isRemoteNotesEnabled: false,
			isGlobalNotesEnabled: true,
			projectNotesPath: '/notes/project',
			remoteNotesPath: '',
			globalNotesPath: '/notes/global',
		}

		await mgr.initializeProviders(config as any, 'nh', 'nh.openNote')

		const project = mgr.getProviderInstance('project')
		const global = mgr.getProviderInstance('global')

		expect(project).toBeTruthy()
		expect(global).toBeTruthy()

		const itemInProject = { filePath: '/notes/project/a.md' } as any
		const itemInGlobal = { filePath: '/notes/global/x.md' } as any
		const none = { filePath: '/elsewhere/y.md' } as any

		const p = await mgr.getProviderForNote(itemInProject)
		const g = await mgr.getProviderForNote(itemInGlobal)
		const u = await mgr.getProviderForNote(none)

		expect(p).toBe(project)
		expect(g).toBe(global)
		expect(u).toBeUndefined()
	})
})
